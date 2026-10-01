from django.conf import settings
from django.db import models
from django.db.models import F, Q


class Follow(models.Model):
    class Status(models.TextChoices):
        ACCEPTED = "ACCEPTED"
        PENDING = "PENDING"  # awaiting approval when the target requires it

    follower = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="following_set")
    following = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="follower_set")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACCEPTED)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["follower", "following"], name="follow_pair_unique"),
            models.CheckConstraint(condition=~Q(follower=F("following")), name="follow_not_self"),
        ]
        indexes = [
            models.Index(fields=["following", "status", "-created_at"]),
            models.Index(fields=["follower", "status", "-created_at"]),
        ]


class Block(models.Model):
    blocker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blocks_made")
    blocked = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blocks_received")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["blocker", "blocked"], name="block_pair_unique"),
            models.CheckConstraint(condition=~Q(blocker=F("blocked")), name="block_not_self"),
        ]
        indexes = [models.Index(fields=["blocked"])]
