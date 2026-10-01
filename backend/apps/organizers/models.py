from django.conf import settings
from django.db import models

from apps.common.models import TimeStamped


class OrganizerProfile(TimeStamped):
    class Status(models.TextChoices):
        PENDING = "PENDING"
        APPROVED = "APPROVED"
        REJECTED = "REJECTED"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="organizer_profile")
    organization_name = models.CharField(max_length=120)
    bio = models.TextField(max_length=1500, blank=True)
    website = models.URLField(max_length=300, blank=True)
    contact_email = models.EmailField(blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING, db_index=True)
    review_notes = models.CharField(max_length=500, blank=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    reviewed_at = models.DateTimeField(null=True, blank=True)
