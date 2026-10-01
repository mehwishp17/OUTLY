import logging
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import Count, Sum

from apps.notifications.services import NotificationService

from .models import Badge, UserBadge

logger = logging.getLogger("outly.achievements")
User = get_user_model()


def longest_streak(dates):
    """Longest run of consecutive calendar days in a set of dates."""
    days = sorted(set(dates))
    best = run = 0
    previous = None
    for day in days:
        run = run + 1 if previous is not None and day - previous == timedelta(days=1) else 1
        best = max(best, run)
        previous = day
    return best


class AchievementService:
    @staticmethod
    def metrics(user):
        from apps.activities.models import ActivityParticipant
        from apps.events.models import EventParticipant
        from apps.follows.models import Follow
        from apps.groups.models import GroupMember
        from apps.posts.models import Post
        from apps.reviews.models import Review

        done = ActivityParticipant.objects.filter(user=user, activity__status="COMPLETED")
        by_type = {
            row["activity__activity_type"]: row
            for row in done.values("activity__activity_type").annotate(n=Count("id"), km=Sum("activity__distance"))
        }
        total_km = sum(float(r["km"] or 0) for r in by_type.values())
        dates = [
            (d or None) for d in done.exclude(activity__completed_at__isnull=True).values_list("activity__completed_at__date", flat=True)
        ]
        return {
            "ACTIVITIES_COMPLETED": sum(r["n"] for r in by_type.values()),
            "HIKES_COMPLETED": by_type.get("HIKE", {}).get("n", 0),
            "CAMPING_TRIPS": by_type.get("CAMPING", {}).get("n", 0),
            "DISTANCE_KM": int(total_km),
            "CYCLING_KM": int(float(by_type.get("CYCLING", {}).get("km") or 0)),
            "STREAK_DAYS": longest_streak(d for d in dates if d),
            "EVENTS_JOINED": EventParticipant.objects.filter(user=user, status="APPROVED").count(),
            "POSTS": Post.objects.filter(author=user, status="ACTIVE").count(),
            "FOLLOWERS": Follow.objects.filter(following=user, status="ACCEPTED").count(),
            "GROUPS_JOINED": GroupMember.objects.filter(user=user).count(),
            "REVIEWS": Review.objects.filter(user=user, status="VISIBLE").count(),
        }

    @staticmethod
    def evaluate(user):
        """Awards every badge whose threshold is met. Idempotent (unique constraint)."""
        metrics = AchievementService.metrics(user)
        earned = set(UserBadge.objects.filter(user=user).values_list("badge_id", flat=True))
        awarded = []
        for badge in Badge.objects.filter(is_active=True).exclude(pk__in=earned):
            if metrics.get(badge.metric, 0) >= badge.threshold:
                try:
                    with transaction.atomic():
                        UserBadge.objects.create(user=user, badge=badge)
                except IntegrityError:
                    continue
                awarded.append(badge)
                NotificationService.notify(
                    recipient=user, actor=None, type="BADGE", title=f"You earned the “{badge.name}” badge!",
                    body=badge.description, target_type="badge", target_id=badge.pk,
                )
        return awarded

    @staticmethod
    def evaluate_later(user):
        """Runs after the surrounding transaction commits; never breaks the request."""

        def run():
            try:
                AchievementService.evaluate(user)
            except Exception:
                logger.warning("achievement evaluation failed user=%s", user.pk, exc_info=True)

        transaction.on_commit(run)

    @staticmethod
    def evaluate_later_for_id(user_id):
        user = User.objects.filter(pk=user_id).select_related("profile").first()
        if user:
            AchievementService.evaluate_later(user)

    @staticmethod
    def progress(user):
        metrics = AchievementService.metrics(user)
        earned = {ub.badge_id: ub.awarded_at for ub in UserBadge.objects.filter(user=user)}
        rows = []
        for badge in Badge.objects.filter(is_active=True):
            current = metrics.get(badge.metric, 0)
            rows.append(
                {
                    "id": badge.pk, "code": badge.code, "name": badge.name, "description": badge.description,
                    "icon": badge.icon, "points": badge.points, "metric": badge.metric, "threshold": badge.threshold,
                    "current": min(current, badge.threshold), "percent": min(int(current * 100 / badge.threshold), 100),
                    "earned": badge.pk in earned, "awarded_at": earned.get(badge.pk),
                }
            )
        return metrics, rows
