from django.conf import settings
from django.contrib.postgres.indexes import GinIndex
from django.db import models
from django.db.models import Q

from apps.common.models import TimeStamped


class Group(TimeStamped):
    class Visibility(models.TextChoices):
        PUBLIC = "PUBLIC"
        PRIVATE = "PRIVATE"

    name = models.CharField(max_length=120)
    category = models.CharField(max_length=60)
    description = models.TextField(max_length=2000)
    visibility = models.CharField(max_length=8, choices=Visibility.choices, default=Visibility.PUBLIC)
    rules = models.TextField(max_length=2000, blank=True)
    image = models.ImageField(upload_to="groups/%Y/%m/", null=True, blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="groups_owned")

    class Meta:
        indexes = [
            models.Index(fields=["visibility", "-created_at"]),
            models.Index(fields=["category"]),
            GinIndex(fields=["name"], name="group_name_trgm", opclasses=["gin_trgm_ops"]),
        ]


class GroupMember(models.Model):
    class Role(models.TextChoices):
        OWNER = "OWNER"
        MODERATOR = "MODERATOR"
        MEMBER = "MEMBER"

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="group_memberships")
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["group", "user"], name="group_member_unique")]
        indexes = [models.Index(fields=["user", "-joined_at"]), models.Index(fields=["group", "role"])]


class GroupJoinRequest(TimeStamped):
    class Status(models.TextChoices):
        PENDING = "PENDING"
        ACCEPTED = "ACCEPTED"
        REJECTED = "REJECTED"

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="join_requests")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="group_join_requests")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    message = models.CharField(max_length=300, blank=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["group", "user"], condition=Q(status="PENDING"), name="group_one_pending_request"
            )
        ]
        indexes = [models.Index(fields=["group", "status", "-created_at"])]
