from django.conf import settings
from django.db import models
from django.db.models import Q

from apps.common.models import TimeStamped

TARGET_TYPES = ["POST", "COMMENT", "USER", "EVENT", "GROUP", "PLACE", "MESSAGE", "REVIEW"]


class Report(TimeStamped):
    class Reason(models.TextChoices):
        SPAM = "SPAM"
        HARASSMENT = "HARASSMENT"
        HATE = "HATE"
        VIOLENCE = "VIOLENCE"
        NUDITY = "NUDITY"
        MISINFORMATION = "MISINFORMATION"
        UNSAFE = "UNSAFE"
        OTHER = "OTHER"

    class Status(models.TextChoices):
        OPEN = "OPEN"
        IN_REVIEW = "IN_REVIEW"
        RESOLVED = "RESOLVED"
        DISMISSED = "DISMISSED"

    class Priority(models.TextChoices):
        LOW = "LOW"
        NORMAL = "NORMAL"
        HIGH = "HIGH"
        URGENT = "URGENT"

    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports_made")
    target_type = models.CharField(max_length=10, choices=[(t, t) for t in TARGET_TYPES])
    target_id = models.BigIntegerField()
    target_owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="reports_received"
    )
    reason = models.CharField(max_length=16, choices=Reason.choices)
    description = models.TextField(max_length=1000, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)
    priority = models.CharField(max_length=8, choices=Priority.choices, default=Priority.NORMAL)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["reporter", "target_type", "target_id"],
                condition=Q(status__in=["OPEN", "IN_REVIEW"]),
                name="report_one_active_per_reporter_target",
            )
        ]
        indexes = [
            models.Index(fields=["status", "-priority", "-created_at"]),
            models.Index(fields=["target_type", "target_id"]),
        ]


class ModerationAction(models.Model):
    class Action(models.TextChoices):
        NO_ACTION = "NO_ACTION"
        WARNING = "WARNING"
        HIDE = "HIDE"
        DELETE = "DELETE"
        RESTRICT = "RESTRICT"
        SUSPEND = "SUSPEND"

    report = models.ForeignKey(Report, on_delete=models.SET_NULL, null=True, blank=True, related_name="actions")
    moderator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+")
    action = models.CharField(max_length=10, choices=Action.choices)
    target_type = models.CharField(max_length=10)
    target_id = models.BigIntegerField()
    notes = models.TextField(max_length=1000, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["target_type", "target_id"])]


class AuditLog(models.Model):
    """Append-only history of privileged operations."""

    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+")
    actor_label = models.CharField(max_length=254, blank=True)
    action = models.CharField(max_length=60, db_index=True)
    target_type = models.CharField(max_length=20, blank=True)
    target_id = models.BigIntegerField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at", "-id"]
