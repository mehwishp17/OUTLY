from django.db import transaction
from django.db.models import Count, Exists, IntegerField, OuterRef, Q, Subquery
from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from apps.common.permissions import is_staff_user
from apps.follows.models import Follow
from apps.follows.selectors import blocked_ids
from apps.notifications.services import NotificationService

from .models import Activity, ActivityParticipant


def visible_activities(user):
    following = Follow.objects.filter(follower=user, status="ACCEPTED").values("following_id")
    joined = ActivityParticipant.objects.filter(user=user).values("activity_id")
    queryset = Activity.objects.exclude(created_by_id__in=blocked_ids(user)).filter(
        Q(created_by=user)
        | Q(privacy="PUBLIC")
        | Q(privacy="FOLLOWERS", created_by_id__in=following)
        | Q(pk__in=joined)
    )
    return queryset.select_related("created_by__profile").annotate(
        participants_count=Subquery(
            ActivityParticipant.objects.filter(activity=OuterRef("pk"))
            .order_by().values("activity").annotate(c=Count("id")).values("c")[:1],
            output_field=IntegerField(),
        ),
        is_joined=Exists(ActivityParticipant.objects.filter(activity=OuterRef("pk"), user=user)),
    )


def get_visible_activity(user, activity_id):
    activity = visible_activities(user).filter(pk=activity_id).first()
    if activity is None:
        raise NotFound("Activity not found.")
    return activity


class ActivityService:
    @staticmethod
    @transaction.atomic
    def create(user, serializer):
        activity = serializer.save(created_by=user)
        ActivityParticipant.objects.create(activity=activity, user=user)
        if activity.status == Activity.Status.COMPLETED:
            ActivityService._on_completed(activity)
        return activity

    @staticmethod
    @transaction.atomic
    def update(user, activity, serializer):
        if activity.created_by_id != user.id and not is_staff_user(user):
            raise PermissionDenied("Only the creator can edit this activity.")
        was_completed = activity.status == Activity.Status.COMPLETED
        updated = serializer.save()
        if updated.status == Activity.Status.COMPLETED and not was_completed:
            ActivityService._on_completed(updated)
        return updated

    @staticmethod
    def _on_completed(activity):
        Activity.objects.filter(pk=activity.pk).update(completed_at=timezone.now())
        from apps.achievements.services import AchievementService

        for user_id in activity.participants.values_list("user_id", flat=True):
            AchievementService.evaluate_later_for_id(user_id)

    @staticmethod
    def delete(user, activity):
        if activity.created_by_id != user.id and not is_staff_user(user):
            raise PermissionDenied("Only the creator can delete this activity.")
        activity.delete()

    @staticmethod
    @transaction.atomic
    def join(user, activity_id):
        activity = get_visible_activity(user, activity_id)
        if activity.privacy == "PRIVATE" and activity.created_by_id != user.id:
            raise PermissionDenied("This activity is private.")
        if activity.status == Activity.Status.COMPLETED:
            raise ValidationError({"detail": ["This activity is already completed."]})
        participant, created = ActivityParticipant.objects.get_or_create(activity=activity, user=user)
        if created:
            NotificationService.notify(
                recipient=activity.created_by, actor=user, type="PARTNER_JOIN", title=f"joined your activity “{activity.title}”",
                target_type="activity", target_id=activity.pk,
            )
        return participant, created

    @staticmethod
    def leave(user, activity_id):
        activity = get_visible_activity(user, activity_id)
        if activity.created_by_id == user.id:
            raise ValidationError({"detail": ["The creator can't leave their own activity. Delete it instead."]})
        ActivityParticipant.objects.filter(activity=activity, user=user).delete()
