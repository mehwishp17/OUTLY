from django.db import models


class TimeStamped(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Difficulty(models.TextChoices):
    EASY = "EASY"
    MODERATE = "MODERATE"
    HARD = "HARD"


class ActivityType(models.TextChoices):
    HIKE = "HIKE"
    TRAIL_RUN = "TRAIL_RUN"
    CYCLING = "CYCLING"
    CAMPING = "CAMPING"
    MEETUP = "MEETUP"
