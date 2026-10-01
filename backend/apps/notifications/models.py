from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Type(models.TextChoices):
        FOLLOW = "FOLLOW"
        FOLLOW_REQUEST = "FOLLOW_REQUEST"
        LIKE = "LIKE"
        COMMENT = "COMMENT"
        MESSAGE = "MESSAGE"
        GROUP_JOIN = "GROUP_JOIN"
        GROUP_POST = "GROUP_POST"
        GROUP_REQUEST = "GROUP_REQUEST"
        PARTNER_REQUEST = "PARTNER_REQUEST"
        PARTNER_JOIN = "PARTNER_JOIN"
        EVENT_JOIN = "EVENT_JOIN"
        EVENT_APPROVAL = "EVENT_APPROVAL"
        EVENT_REMINDER = "EVENT_REMINDER"
        REVIEW = "REVIEW"
        BADGE = "BADGE"
        MODERATION = "MODERATION"
        SYSTEM = "SYSTEM"

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    notification_type = models.CharField(max_length=20, choices=Type.choices, db_index=True)
    title = models.CharField(max_length=200)
    body = models.CharField(max_length=500, blank=True)
    target_type = models.CharField(max_length=30, blank=True)
    target_id = models.BigIntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["recipient", "is_read", "-created_at"]),
            models.Index(fields=["recipient", "-created_at"]),
        ]
