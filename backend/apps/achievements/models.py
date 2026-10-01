from django.conf import settings
from django.db import models


class Badge(models.Model):
    class Metric(models.TextChoices):
        ACTIVITIES_COMPLETED = "ACTIVITIES_COMPLETED"
        HIKES_COMPLETED = "HIKES_COMPLETED"
        CAMPING_TRIPS = "CAMPING_TRIPS"
        DISTANCE_KM = "DISTANCE_KM"
        CYCLING_KM = "CYCLING_KM"
        STREAK_DAYS = "STREAK_DAYS"
        EVENTS_JOINED = "EVENTS_JOINED"
        POSTS = "POSTS"
        FOLLOWERS = "FOLLOWERS"
        GROUPS_JOINED = "GROUPS_JOINED"
        REVIEWS = "REVIEWS"

    code = models.SlugField(max_length=60, unique=True)
    name = models.CharField(max_length=80)
    description = models.CharField(max_length=300)
    icon = models.CharField(max_length=40, blank=True)
    metric = models.CharField(max_length=24, choices=Metric.choices)
    threshold = models.PositiveIntegerField()
    points = models.PositiveIntegerField(default=10)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.name


class UserBadge(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="user_badges")
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name="awards")
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "badge"], name="userbadge_unique")]
        indexes = [models.Index(fields=["user", "-awarded_at"])]
