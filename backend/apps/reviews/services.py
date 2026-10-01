from django.db import IntegrityError, transaction
from django.db.models import Avg, Count
from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from apps.common.permissions import is_staff_user
from apps.notifications.services import NotificationService

from .models import Review


def _target(target_type, target_id):
    from apps.events.models import Event, EventParticipant
    from apps.places.models import Place, Trail

    model = {"place": Place, "trail": Trail, "event": Event}[target_type]
    obj = model.objects.filter(pk=target_id).first()
    if obj is None or (target_type != "event" and not obj.is_active):
        raise NotFound(f"{target_type.title()} not found.")
    return obj


def recompute_rating(review):
    """Keeps the denormalised average on places/trails exact (events have none)."""
    target = review.place or review.trail
    if target is None:
        return
    stats = Review.objects.filter(
        **{("place" if review.place_id else "trail"): target}, status="VISIBLE"
    ).aggregate(avg=Avg("rating"), n=Count("id"))
    type(target).objects.filter(pk=target.pk).update(rating=round(stats["avg"] or 0, 2), reviews_count=stats["n"])


class ReviewService:
    @staticmethod
    @transaction.atomic
    def create(user, target_type, target_id, rating, text):
        from apps.events.models import EventParticipant

        target = _target(target_type, target_id)
        if target_type == "event":
            if not EventParticipant.objects.filter(event=target, user=user, status="APPROVED").exists():
                raise PermissionDenied("Only people who joined an event can review it.")
            if (target.end_at or target.start_at) > timezone.now():
                raise ValidationError({"detail": ["You can review an event after it has finished."]})
            if target.organizer_id == user.id:
                raise PermissionDenied("You can't review your own event.")
        try:
            with transaction.atomic():
                review = Review.objects.create(user=user, rating=rating, text=text, **{target_type: target})
        except IntegrityError:
            raise ValidationError({"detail": ["You've already reviewed this. Edit your review instead."]}) from None
        recompute_rating(review)
        owner = target.organizer if target_type == "event" else target.created_by
        if owner is not None:
            NotificationService.notify(
                recipient=owner, actor=user, type="REVIEW", title=f"reviewed “{getattr(target, 'title', None) or target.name}”",
                body=text[:100], target_type=target_type, target_id=target.pk,
            )
        from apps.achievements.services import AchievementService

        AchievementService.evaluate_later(user)
        return review

    @staticmethod
    @transaction.atomic
    def update(user, review_id, data):
        review = Review.objects.select_for_update(of=("self",)).filter(pk=review_id).exclude(status="HIDDEN").first()
        if review is None:
            raise NotFound("Review not found.")
        if review.user_id != user.id:
            raise PermissionDenied("You can only edit your own review.")
        for field in ("rating", "text"):
            if field in data:
                setattr(review, field, data[field])
        review.save()
        recompute_rating(review)
        return review

    @staticmethod
    @transaction.atomic
    def delete(user, review_id):
        review = Review.objects.filter(pk=review_id).first()
        if review is None:
            raise NotFound("Review not found.")
        if review.user_id != user.id and not is_staff_user(user):
            raise PermissionDenied("You can only delete your own review.")
        review.delete()
        recompute_rating(review)
