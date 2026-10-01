import logging
from datetime import timedelta

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from django.utils import timezone

from .models import Notification

logger = logging.getLogger("outly.notifications")
DEDUPE_TYPES = {"LIKE", "FOLLOW", "COMMENT", "MESSAGE"}  # collapse repeats while the earlier one is unread


def user_group(user_id):
    return f"user_{user_id}"


def _push(notification_id, recipient_id):
    """Real-time delivery to the recipient's open sockets. Never raises."""
    try:
        from .serializers import NotificationSerializer

        notification = Notification.objects.select_related("actor__profile").get(pk=notification_id)
        unread = Notification.objects.filter(recipient_id=recipient_id, is_read=False).count()
        payload = {
            "type": "notification.created",
            "notification": dict(NotificationSerializer(notification).data),
            "unread_count": unread,
        }
        async_to_sync(get_channel_layer().group_send)(user_group(recipient_id), {"type": "push", "payload": payload})
    except Exception:
        logger.warning("notification push failed", exc_info=True)


class NotificationService:
    @staticmethod
    def notify(*, recipient, type, title, actor=None, body="", target_type="", target_id=None):
        """Stores a notification (inside the caller's transaction) and pushes it
        after commit. Self-notifications and blocked pairs are skipped."""
        if actor is not None and actor.id == recipient.id:
            return None
        if actor is not None:
            from apps.follows.selectors import is_blocked_between

            if is_blocked_between(actor.id, recipient.id):
                return None
        if type in DEDUPE_TYPES and actor is not None:
            recent = Notification.objects.filter(
                recipient=recipient, actor=actor, notification_type=type, target_type=target_type, target_id=target_id,
                is_read=False, created_at__gte=timezone.now() - timedelta(hours=24),
            )
            if recent.exists():
                return None
        if actor is not None:
            profile = actor.profile
            title = f"{profile.display_name or profile.username} {title}"
        notification = Notification.objects.create(
            recipient=recipient, actor=actor, notification_type=type, title=title[:200], body=body[:500],
            target_type=target_type, target_id=target_id,
        )
        transaction.on_commit(lambda: _push(notification.pk, recipient.pk))
        return notification

    @staticmethod
    def notify_many(*, recipients, **kwargs):
        for recipient in recipients:
            NotificationService.notify(recipient=recipient, **kwargs)

    @staticmethod
    def notify_bulk(*, recipient_ids, type, title, actor, body="", target_type="", target_id=None, cap=500):
        """One INSERT for many recipients (group announcements). Blocked pairs
        are skipped; the live push happens after commit."""
        from apps.follows.selectors import blocked_ids

        skip = blocked_ids(actor) | {actor.id}
        ids = [i for i in recipient_ids if i not in skip][:cap]
        if not ids:
            return
        profile = actor.profile
        full_title = f"{profile.display_name or profile.username} {title}"[:200]
        created = Notification.objects.bulk_create(
            [
                Notification(
                    recipient_id=i, actor=actor, notification_type=type, title=full_title, body=body[:500],
                    target_type=target_type, target_id=target_id,
                )
                for i in ids
            ]
        )

        def push_all():
            for row in created:
                if row.pk:
                    _push(row.pk, row.recipient_id)

        transaction.on_commit(push_all)

    @staticmethod
    def unread_count(user):
        return Notification.objects.filter(recipient=user, is_read=False).count()
