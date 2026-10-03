from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, OuterRef, Q, Subquery
from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from apps.common import permissions as roles
from apps.common.permissions import is_staff_user
from apps.follows.models import Follow
from apps.follows.selectors import blocked_ids, is_blocked_between
from apps.notifications.services import NotificationService

from .models import Event, EventParticipant

User = get_user_model()


class EventFull(ValidationError):
    status_code = 409
    default_code = "event_full"


def visible_events(user):
    following = Follow.objects.filter(follower=user, status="ACCEPTED").values("following_id")
    mine = EventParticipant.objects.filter(user=user).values("event_id")
    queryset = Event.objects.exclude(organizer_id__in=blocked_ids(user))
    if not is_staff_user(user):
        queryset = queryset.filter(
            Q(organizer=user)
            | Q(pk__in=mine)
            | (
                Q(approval_status="APPROVED", status="ACTIVE")
                & (Q(visibility="PUBLIC") | Q(visibility="FOLLOWERS", organizer_id__in=following))
            )
        )
    approved = (
        EventParticipant.objects.filter(event=OuterRef("pk"), status="APPROVED")
        .order_by().values("event").annotate(c=Count("id")).values("c")[:1]
    )
    mine_status = EventParticipant.objects.filter(event=OuterRef("pk"), user=user).values("status")[:1]
    from django.db.models import CharField, IntegerField
    from django.db.models.functions import Coalesce

    return queryset.select_related("organizer__profile").annotate(
        approved_count=Coalesce(Subquery(approved, output_field=IntegerField()), 0),
        my_status=Subquery(mine_status, output_field=CharField()),
    )


def get_visible_event(user, event_id):
    event = visible_events(user).filter(pk=event_id).first()
    if event is None:
        raise NotFound("Event not found.")
    return event


def _can_manage(user, event):
    return event.organizer_id == user.id or user.role == roles.ADMINISTRATOR


class EventService:
    @staticmethod
    @transaction.atomic
    def create(user, serializer):
        auto_approve = (
            not settings.EVENTS_REQUIRE_MODERATION
            or user.role in (roles.ORGANIZER, roles.CONTENT_MODERATOR, roles.ADMINISTRATOR)
        )
        return serializer.save(
            organizer=user, approval_status="APPROVED" if auto_approve else "PENDING", status="ACTIVE"
        )

    @staticmethod
    @transaction.atomic
    def update(user, event_id, serializer_factory):
        event = Event.objects.select_for_update(of=("self",)).filter(pk=event_id).first()
        if event is None:
            raise NotFound("Event not found.")
        if not _can_manage(user, event):
            raise PermissionDenied("Only the organizer can edit this event.")
        serializer = serializer_factory(event)
        serializer.is_valid(raise_exception=True)
        new_capacity = serializer.validated_data.get("capacity")
        if new_capacity is not None:
            approved = EventParticipant.objects.filter(event=event, status="APPROVED").count()
            if new_capacity < approved:
                raise ValidationError({"capacity": [f"{approved} people are already confirmed; capacity can't be lower."]})
        updated = serializer.save()
        return updated

    @staticmethod
    @transaction.atomic
    def cancel(user, event_id):
        event = Event.objects.select_for_update(of=("self",)).filter(pk=event_id).first()
        if event is None:
            raise NotFound("Event not found.")
        if not _can_manage(user, event):
            raise PermissionDenied("Only the organizer can cancel this event.")
        event.status = Event.Status.CANCELLED
        event.save(update_fields=["status", "updated_at"])
        for member in User.objects.filter(
            event_participations__event=event, event_participations__status__in=["APPROVED", "PENDING", "INVITED"]
        ).select_related("profile"):
            NotificationService.notify(
                recipient=member, actor=user, type="EVENT_APPROVAL", title=f"cancelled “{event.title}”",
                target_type="event", target_id=event.pk,
            )

    @staticmethod
    @transaction.atomic
    def delete_permanently(user, event_id):
        """Hard delete. Only for events nobody depends on: already cancelled
        (everyone was told) or without any confirmed/pending participant."""
        event = Event.objects.select_for_update(of=("self",)).filter(pk=event_id).first()
        if event is None:
            raise NotFound("Event not found.")
        if not _can_manage(user, event):
            raise PermissionDenied("Only the organizer can delete this event.")
        in_use = EventParticipant.objects.filter(event=event, status__in=["APPROVED", "PENDING"]).exists()
        if event.status != Event.Status.CANCELLED and in_use:
            raise ValidationError({"detail": ["People have joined this event. Cancel it first so they are told."]})
        event.delete()

    # ---- participation (capacity-safe) ----
    @staticmethod
    def _approved_count(event):
        return EventParticipant.objects.filter(event=event, status="APPROVED").count()

    @staticmethod
    @transaction.atomic
    def join(user, event_id):
        # The row lock serialises concurrent joins for this event, so the
        # capacity count below can never be stale when we insert.
        event = Event.objects.select_for_update(of=("self",)).select_related("organizer__profile").filter(pk=event_id).first()
        if event is None or event.organizer_id in blocked_ids(user):
            raise NotFound("Event not found.")
        existing = EventParticipant.objects.filter(event=event, user=user).first()
        invited = existing is not None and existing.status == "INVITED"
        if not invited:
            # Visibility only gates people who were not explicitly invited.
            if event.organizer_id != user.id and not is_staff_user(user):
                if event.visibility == "INVITED":
                    raise NotFound("Event not found.")
                if event.visibility == "FOLLOWERS" and not Follow.objects.filter(
                    follower=user, following_id=event.organizer_id, status="ACCEPTED"
                ).exists():
                    raise NotFound("Event not found.")
        if event.approval_status != "APPROVED" or event.status != "ACTIVE":
            raise ValidationError({"detail": ["This event isn't open for joining."]})
        if (event.end_at or event.start_at) < timezone.now():
            raise ValidationError({"detail": ["This event has already finished."]})
        if existing and existing.status in ("APPROVED", "PENDING"):
            raise ValidationError({"detail": ["You've already joined this event." if existing.status == "APPROVED" else "Your request is awaiting approval."]})
        if existing and existing.status == "REJECTED":
            raise PermissionDenied("The organizer declined your request.")

        needs_approval = event.requires_approval and not invited and event.organizer_id != user.id
        if not needs_approval and EventService._approved_count(event) >= event.capacity:
            raise EventFull({"detail": ["This event is full."]})

        status = "PENDING" if needs_approval else "APPROVED"
        if existing:
            existing.status = status
            existing.save(update_fields=["status", "updated_at"])
            participant = existing
        else:
            participant = EventParticipant.objects.create(event=event, user=user, status=status)
        NotificationService.notify(
            recipient=event.organizer, actor=user, type="EVENT_JOIN",
            title=f"asked to join “{event.title}”" if needs_approval else f"joined “{event.title}”",
            target_type="event", target_id=event.pk,
        )
        if status == "APPROVED":
            from apps.achievements.services import AchievementService

            AchievementService.evaluate_later(user)
        return participant

    @staticmethod
    @transaction.atomic
    def leave(user, event_id):
        event = Event.objects.select_for_update(of=("self",)).filter(pk=event_id).first()
        if event is None:
            raise NotFound("Event not found.")
        deleted, _ = EventParticipant.objects.filter(event=event, user=user).exclude(status="REJECTED").delete()
        if not deleted:
            raise ValidationError({"detail": ["You're not part of this event."]})

    @staticmethod
    @transaction.atomic
    def decide(user, event_id, target_user_id, decision):
        event = Event.objects.select_for_update(of=("self",)).filter(pk=event_id).first()
        if event is None:
            raise NotFound("Event not found.")
        if not _can_manage(user, event):
            raise PermissionDenied("Only the organizer can manage participants.")
        participant = EventParticipant.objects.filter(event=event, user_id=target_user_id, status="PENDING").first()
        if participant is None:
            raise NotFound("No pending request from this user.")
        if decision == "APPROVED" and EventService._approved_count(event) >= event.capacity:
            raise EventFull({"detail": ["This event is full."]})
        participant.status = decision
        participant.save(update_fields=["status", "updated_at"])
        NotificationService.notify(
            recipient=participant.user, actor=user, type="EVENT_APPROVAL",
            title=f"{'approved' if decision == 'APPROVED' else 'declined'} your request for “{event.title}”",
            target_type="event", target_id=event.pk,
        )
        return participant

    @staticmethod
    @transaction.atomic
    def invite(user, event_id, user_ids):
        event = Event.objects.select_for_update(of=("self",)).filter(pk=event_id).first()
        if event is None:
            raise NotFound("Event not found.")
        if not _can_manage(user, event):
            raise PermissionDenied("Only the organizer can invite people.")
        created = []
        for target in User.objects.filter(pk__in=user_ids, is_active=True).select_related("profile"):
            if target.id == user.id or is_blocked_between(user.id, target.id):
                continue
            participant, was_created = EventParticipant.objects.get_or_create(
                event=event, user=target, defaults={"status": "INVITED"}
            )
            if was_created:
                created.append(participant)
                NotificationService.notify(
                    recipient=target, actor=user, type="EVENT_JOIN", title=f"invited you to “{event.title}”",
                    target_type="event", target_id=event.pk,
                )
        if not created and user_ids:
            raise ValidationError({"user_id": ["No new valid users to invite."]})
        return created

    @staticmethod
    @transaction.atomic
    def moderate(moderator, event_id, approval_status):
        event = Event.objects.select_for_update(of=("self",)).filter(pk=event_id).select_related("organizer__profile").first()
        if event is None:
            raise NotFound("Event not found.")
        event.approval_status = approval_status
        event.save(update_fields=["approval_status", "updated_at"])
        NotificationService.notify(
            recipient=event.organizer, actor=None, type="EVENT_APPROVAL",
            title=f"Your event “{event.title}” was {approval_status.lower()}", target_type="event", target_id=event.pk,
        )
        from apps.moderation.services import AuditService

        AuditService.log(moderator, f"event.{approval_status.lower()}", "event", event.pk)
        return event
