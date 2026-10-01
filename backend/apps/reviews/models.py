from django.conf import settings
from django.db import models
from django.db.models import Q

from apps.common.models import TimeStamped


class Review(TimeStamped):
    class Status(models.TextChoices):
        VISIBLE = "VISIBLE"
        HIDDEN = "HIDDEN"  # removed by moderation

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews")
    place = models.ForeignKey("places.Place", on_delete=models.CASCADE, null=True, blank=True, related_name="reviews")
    trail = models.ForeignKey("places.Trail", on_delete=models.CASCADE, null=True, blank=True, related_name="reviews")
    event = models.ForeignKey("events.Event", on_delete=models.CASCADE, null=True, blank=True, related_name="reviews")
    rating = models.PositiveSmallIntegerField()
    text = models.TextField(max_length=2000, blank=True)
    status = models.CharField(max_length=8, choices=Status.choices, default=Status.VISIBLE)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=Q(rating__gte=1, rating__lte=5), name="review_rating_1_5"),
            models.CheckConstraint(
                condition=(
                    Q(place__isnull=False, trail__isnull=True, event__isnull=True)
                    | Q(place__isnull=True, trail__isnull=False, event__isnull=True)
                    | Q(place__isnull=True, trail__isnull=True, event__isnull=False)
                ),
                name="review_exactly_one_target",
            ),
            models.UniqueConstraint(fields=["user", "place"], condition=Q(place__isnull=False), name="review_unique_place"),
            models.UniqueConstraint(fields=["user", "trail"], condition=Q(trail__isnull=False), name="review_unique_trail"),
            models.UniqueConstraint(fields=["user", "event"], condition=Q(event__isnull=False), name="review_unique_event"),
        ]
        indexes = [
            models.Index(fields=["place", "status", "-created_at"]),
            models.Index(fields=["trail", "status", "-created_at"]),
            models.Index(fields=["event", "status", "-created_at"]),
        ]
