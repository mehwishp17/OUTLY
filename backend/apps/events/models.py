from django.conf import settings
from django.db import models
from django.db.models import F, Q

from apps.common.models import Difficulty, TimeStamped


class Event(TimeStamped):
    class Category(models.TextChoices):
        HIKE = "HIKE"
        TRAIL_RUN = "TRAIL_RUN"
        CYCLING = "CYCLING"
        CAMPING = "CAMPING"
        MEETUP = "MEETUP"
        CLEANUP_DRIVE = "CLEANUP_DRIVE"

    class Visibility(models.TextChoices):
        PUBLIC = "PUBLIC"
        FOLLOWERS = "FOLLOWERS"
        INVITED = "INVITED"

    class ApprovalStatus(models.TextChoices):
        PENDING = "PENDING"
        APPROVED = "APPROVED"
        REJECTED = "REJECTED"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE"
        CANCELLED = "CANCELLED"

    organizer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="events_organized")
    title = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=Category.choices)
    place = models.ForeignKey("places.Place", on_delete=models.SET_NULL, null=True, blank=True, related_name="events")
    trail = models.ForeignKey("places.Trail", on_delete=models.SET_NULL, null=True, blank=True, related_name="events")
    location = models.CharField(max_length=200)
    meeting_point = models.CharField(max_length=200, blank=True)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField(null=True, blank=True)
    capacity = models.PositiveIntegerField()
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices, blank=True)
    requires_approval = models.BooleanField(default=False)
    visibility = models.CharField(max_length=10, choices=Visibility.choices, default=Visibility.PUBLIC)
    approval_status = models.CharField(max_length=10, choices=ApprovalStatus.choices, default=ApprovalStatus.APPROVED)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    cover_image = models.ImageField(upload_to="events/%Y/%m/", null=True, blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=Q(capacity__gte=1), name="event_capacity_positive"),
            models.CheckConstraint(
                condition=Q(end_at__isnull=True) | Q(end_at__gte=F("start_at")), name="event_end_after_start"
            ),
        ]
        indexes = [
            models.Index(fields=["approval_status", "status", "start_at"]),
            models.Index(fields=["organizer", "-start_at"]),
            models.Index(fields=["category", "start_at"]),
        ]


class EventParticipant(models.Model):
    class Status(models.TextChoices):
        INVITED = "INVITED"
        PENDING = "PENDING"
        APPROVED = "APPROVED"
        REJECTED = "REJECTED"

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="participants")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="event_participations")
    status = models.CharField(max_length=10, choices=Status.choices)
    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["event", "user"], name="event_participant_unique")]
        indexes = [models.Index(fields=["event", "status"]), models.Index(fields=["user", "-joined_at"])]
