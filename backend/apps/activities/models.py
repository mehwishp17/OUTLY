from django.conf import settings
from django.db import models
from django.db.models import F, Q

from apps.common.models import ActivityType, Difficulty, TimeStamped


class Activity(TimeStamped):
    class Privacy(models.TextChoices):
        PUBLIC = "PUBLIC"
        FOLLOWERS = "FOLLOWERS"
        PRIVATE = "PRIVATE"

    class Status(models.TextChoices):
        PLANNED = "PLANNED"
        COMPLETED = "COMPLETED"

    title = models.CharField(max_length=160)
    activity_type = models.CharField(max_length=12, choices=ActivityType.choices, default=ActivityType.HIKE)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="activities_created")
    place = models.ForeignKey("places.Place", on_delete=models.SET_NULL, null=True, blank=True, related_name="activities")
    trail = models.ForeignKey("places.Trail", on_delete=models.SET_NULL, null=True, blank=True, related_name="activities")
    location = models.CharField(max_length=200, blank=True)
    start_at = models.DateTimeField(null=True, blank=True)
    end_at = models.DateTimeField(null=True, blank=True)
    distance = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)  # km
    duration = models.DurationField(null=True, blank=True)
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices, blank=True)
    notes = models.TextField(blank=True)
    privacy = models.CharField(max_length=10, choices=Privacy.choices, default=Privacy.PUBLIC)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PLANNED)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(end_at__isnull=True) | Q(start_at__isnull=True) | Q(end_at__gte=F("start_at")),
                name="activity_end_after_start",
            ),
            models.CheckConstraint(condition=Q(distance__isnull=True) | Q(distance__gte=0), name="activity_distance_nonneg"),
        ]
        indexes = [
            models.Index(fields=["created_by", "status", "-start_at"]),
            models.Index(fields=["privacy", "start_at"]),
            models.Index(fields=["activity_type", "start_at"]),
        ]


class ActivityParticipant(models.Model):
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name="participants")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="activity_participations")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["activity", "user"], name="activity_participant_unique")]
        indexes = [models.Index(fields=["user", "-joined_at"])]
