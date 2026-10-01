from django.conf import settings
from django.db import models
from django.db.models import F, Q

from apps.common.models import ActivityType, TimeStamped


class PartnerRequest(TimeStamped):
    class Experience(models.TextChoices):
        BEGINNER = "BEGINNER"
        INTERMEDIATE = "INTERMEDIATE"
        ADVANCED = "ADVANCED"

    class Visibility(models.TextChoices):
        PUBLIC = "PUBLIC"
        PRIVATE = "PRIVATE"  # visible to the owner and the owner's followers

    class Status(models.TextChoices):
        OPEN = "OPEN"
        CLOSED = "CLOSED"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="partner_requests")
    activity = models.CharField(max_length=12, choices=ActivityType.choices)
    destination = models.CharField(max_length=200)
    preferred_datetime = models.DateTimeField()
    spots_total = models.PositiveIntegerField(default=1)
    spots_filled = models.PositiveIntegerField(default=0)
    experience_level = models.CharField(max_length=14, choices=Experience.choices, default=Experience.BEGINNER)
    description = models.TextField(max_length=2000)
    visibility = models.CharField(max_length=8, choices=Visibility.choices, default=Visibility.PUBLIC)
    status = models.CharField(max_length=8, choices=Status.choices, default=Status.OPEN)
    auto_closed = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=Q(spots_total__gte=1), name="partner_spots_total_positive"),
            models.CheckConstraint(condition=Q(spots_filled__lte=F("spots_total")), name="partner_spots_not_overfilled"),
        ]
        indexes = [
            models.Index(fields=["status", "preferred_datetime"]),
            models.Index(fields=["owner", "-created_at"]),
            models.Index(fields=["activity", "status"]),
        ]


class PartnerRequestJoin(TimeStamped):
    class Status(models.TextChoices):
        PENDING = "PENDING"
        ACCEPTED = "ACCEPTED"
        REJECTED = "REJECTED"

    request = models.ForeignKey(PartnerRequest, on_delete=models.CASCADE, related_name="joins")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="partner_joins")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    message = models.CharField(max_length=500, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["request", "user"], name="partner_join_unique")]
        indexes = [models.Index(fields=["request", "status"]), models.Index(fields=["user", "-created_at"])]
