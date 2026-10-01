import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from apps.follows.selectors import blocked_ids, is_blocked_between
from apps.notifications.services import NotificationService, user_group

from .models import Conversation, ConversationMember, Message

User = get_user_model()
logger = logging.getLogger("outly.chat")
MAX_LENGTH = 2000


def message_payload(message, viewer_id=None):
    profile = message.sender.profile
    return {
        "id": message.pk,
        "conversation": message.conversation_id,
        "sender_id": message.sender_id,
        "sender_name": profile.display_name or profile.username,
        "sender_photo": profile.photo.url if profile.photo else None,
        "content": "" if message.is_deleted else message.content,
        "created_at": message.created_at.isoformat(),
        "edited_at": message.edited_at.isoformat() if message.edited_at else None,
        "is_deleted": message.is_deleted,
        "is_mine": viewer_id == message.sender_id if viewer_id is not None else None,
    }


def _broadcast(member_ids, event):
    layer = get_channel_layer()
    for uid in member_ids:
        try:
            async_to_sync(layer.group_send)(user_group(uid), {"type": "push", "payload": event})
        except Exception:
            logger.warning("chat broadcast failed", exc_info=True)


def membership_or_404(user, conversation_id):
    member = ConversationMember.objects.select_related("conversation").filter(
        conversation_id=conversation_id, user=user
    ).first()
    if member is None:  # not found == not yours: never reveal other people's conversations
        raise NotFound("Conversation not found.")
    return member


class ChatService:
    # ---- conversations ----
    @staticmethod
    @transaction.atomic
    def direct(user, other_id):
        if other_id == user.id:
            raise ValidationError({"user_id": ["You can't message yourself."]})
        other = User.objects.filter(pk=other_id, is_active=True).exclude(status__in=["SUSPENDED", "DELETED"]).first()
        if other is None:
            raise NotFound("User not found.")
        if is_blocked_between(user.id, other.id):
            raise PermissionDenied("You can't message this user.")
        key = ":".join(str(i) for i in sorted((user.id, other.id)))
        try:
            with transaction.atomic():
                conversation, created = Conversation.objects.get_or_create(
                    direct_key=key, defaults={"type": Conversation.Type.DIRECT}
                )
        except IntegrityError:
            conversation, created = Conversation.objects.get(direct_key=key), False
        if created:
            ConversationMember.objects.bulk_create(
                [ConversationMember(conversation=conversation, user=user), ConversationMember(conversation=conversation, user=other)]
            )
        return conversation, created

    @staticmethod
    def ensure_group_conversation(group):
        from apps.groups.models import GroupMember

        conversation, created = Conversation.objects.get_or_create(group=group, defaults={"type": Conversation.Type.GROUP})
        if created:
            ConversationMember.objects.bulk_create(
                [ConversationMember(conversation=conversation, user_id=uid)
                 for uid in GroupMember.objects.filter(group=group).values_list("user_id", flat=True)],
                ignore_conflicts=True,
            )
        return conversation

    @staticmethod
    def add_to_group_conversation(group, user):
        conversation = ChatService.ensure_group_conversation(group)
        ConversationMember.objects.get_or_create(conversation=conversation, user=user)

    @staticmethod
    def remove_from_group_conversation(group_id, user):
        ConversationMember.objects.filter(conversation__group_id=group_id, user=user).delete()

    # ---- messages ----
    @staticmethod
    @transaction.atomic
    def send(user, conversation_id, content):
        content = (content or "").strip()
        if not content:
            raise ValidationError({"content": ["Message can't be empty."]})
        if len(content) > MAX_LENGTH:
            raise ValidationError({"content": [f"Message is too long (max {MAX_LENGTH} characters)."]})
        member = membership_or_404(user, conversation_id)
        conversation = member.conversation
        others = list(
            ConversationMember.objects.filter(conversation=conversation).exclude(user=user).values_list("user_id", flat=True)
        )
        if conversation.type == "DIRECT":
            if others and is_blocked_between(user.id, others[0]):
                raise PermissionDenied("You can't message this user.")
        message = Message.objects.create(conversation=conversation, sender=user, content=content)
        Conversation.objects.filter(pk=conversation.pk).update(
            last_message_at=message.created_at, last_message_preview=content[:140], last_message_sender=user,
            updated_at=message.created_at,
        )
        ConversationMember.objects.filter(pk=member.pk).update(last_read_at=message.created_at)
        message = Message.objects.select_related("sender__profile").get(pk=message.pk)

        recipients = User.objects.filter(pk__in=others).select_related("profile")
        for recipient in recipients:
            NotificationService.notify(
                recipient=recipient, actor=user, type="MESSAGE", title="sent you a message", body=content[:100],
                target_type="conversation", target_id=conversation.pk,
            )
        everyone = [user.id, *others]
        transaction.on_commit(
            lambda: _broadcast(everyone, {"type": "message.created", "message": message_payload(message)})
        )
        return message

    @staticmethod
    def mark_read(user, conversation_id):
        from apps.notifications.models import Notification

        member = membership_or_404(user, conversation_id)
        now = timezone.now()
        ConversationMember.objects.filter(pk=member.pk).update(last_read_at=now)
        Notification.objects.filter(
            recipient=user, notification_type="MESSAGE", target_type="conversation", target_id=conversation_id, is_read=False
        ).update(is_read=True)
        return now

    @staticmethod
    @transaction.atomic
    def edit(user, message_id, content):
        message = Message.objects.select_for_update(of=("self",)).filter(pk=message_id, is_deleted=False).first()
        if message is None:
            raise NotFound("Message not found.")
        membership_or_404(user, message.conversation_id)
        if message.sender_id != user.id:
            raise PermissionDenied("You can only edit your own messages.")
        content = (content or "").strip()
        if not content or len(content) > MAX_LENGTH:
            raise ValidationError({"content": ["Message must be 1-2000 characters."]})
        message.content, message.edited_at = content, timezone.now()
        message.save(update_fields=["content", "edited_at"])
        message = Message.objects.select_related("sender__profile").get(pk=message.pk)
        ids = list(ConversationMember.objects.filter(conversation_id=message.conversation_id).values_list("user_id", flat=True))
        transaction.on_commit(lambda: _broadcast(ids, {"type": "message.updated", "message": message_payload(message)}))
        return message

    @staticmethod
    @transaction.atomic
    def delete(user, message_id):
        message = Message.objects.select_for_update(of=("self",)).filter(pk=message_id, is_deleted=False).first()
        if message is None:
            raise NotFound("Message not found.")
        membership_or_404(user, message.conversation_id)
        if message.sender_id != user.id:
            raise PermissionDenied("You can only delete your own messages.")
        message.is_deleted = True
        message.save(update_fields=["is_deleted"])
        message = Message.objects.select_related("sender__profile").get(pk=message.pk)
        ids = list(ConversationMember.objects.filter(conversation_id=message.conversation_id).values_list("user_id", flat=True))
        transaction.on_commit(lambda: _broadcast(ids, {"type": "message.deleted", "message": message_payload(message)}))

    @staticmethod
    def visible_messages(user, conversation_id):
        membership_or_404(user, conversation_id)
        return Message.objects.filter(conversation_id=conversation_id).exclude(
            sender_id__in=blocked_ids(user)
        ).select_related("sender__profile")
