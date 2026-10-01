from django.conf import settings
from django.db import models
from django.db.models import Q


class Conversation(models.Model):
    class Type(models.TextChoices):
        DIRECT = "DIRECT"
        GROUP = "GROUP"

    type = models.CharField(max_length=8, choices=Type.choices)
    group = models.OneToOneField("groups.Group", on_delete=models.CASCADE, null=True, blank=True, related_name="conversation")
    # "<smaller user id>:<larger user id>" - guarantees one direct chat per pair.
    direct_key = models.CharField(max_length=40, null=True, blank=True, unique=True)
    last_message_at = models.DateTimeField(null=True, blank=True)
    last_message_preview = models.CharField(max_length=140, blank=True)
    last_message_sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=(Q(type="DIRECT", direct_key__isnull=False, group__isnull=True))
                | (Q(type="GROUP", group__isnull=False, direct_key__isnull=True)),
                name="conversation_type_consistent",
            )
        ]
        indexes = [models.Index(fields=["-last_message_at"])]


class ConversationMember(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="conversation_memberships")
    last_read_at = models.DateTimeField(null=True, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["conversation", "user"], name="conversation_member_unique")]
        indexes = [models.Index(fields=["user", "conversation"])]


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    content = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        indexes = [models.Index(fields=["conversation", "-created_at", "-id"])]
