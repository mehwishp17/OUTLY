from django.conf import settings
from django.contrib.postgres.indexes import GinIndex
from django.db import models
from django.db.models.functions import Lower

from apps.common.models import TimeStamped

DEFAULT_PRIVACY = {
    "profileVisibility": "public",  # public | communityOnly | private
    "showActivityHistory": True,
    "showSavedPlaces": True,
    "requireFollowApproval": False,
}


def default_privacy():
    return dict(DEFAULT_PRIVACY)


class UserProfile(TimeStamped):
    class SkillLevel(models.TextChoices):
        BEGINNER = "beginner"
        INTERMEDIATE = "intermediate"
        ADVANCED = "advanced"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    username = models.CharField(max_length=50)
    display_name = models.CharField(max_length=100, blank=True)
    photo = models.ImageField(upload_to="avatars/%Y/%m/", null=True, blank=True)
    cover_photo = models.ImageField(upload_to="covers/%Y/%m/", null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    interests = models.JSONField(default=list, blank=True)
    location = models.CharField(max_length=120, blank=True)
    skill_level = models.CharField(max_length=14, choices=SkillLevel.choices, default=SkillLevel.BEGINNER)
    privacy_settings = models.JSONField(default=default_privacy, blank=True)
    onboarding_completed = models.BooleanField(default=False)

    class Meta:
        constraints = [models.UniqueConstraint(Lower("username"), name="profile_username_ci_unique")]
        indexes = [
            GinIndex(fields=["username"], name="profile_username_trgm", opclasses=["gin_trgm_ops"]),
            GinIndex(fields=["display_name"], name="profile_display_trgm", opclasses=["gin_trgm_ops"]),
        ]

    def __str__(self):
        return self.username
