from django.conf import settings
from django.db import models

from apps.common.models import TimeStamped


class Post(TimeStamped):
    class Visibility(models.TextChoices):
        PUBLIC = "PUBLIC"
        FOLLOWERS = "FOLLOWERS"
        GROUP = "GROUP"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE"
        HIDDEN = "HIDDEN"  # removed by moderation
        DELETED = "DELETED"  # removed by the author

    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="posts")
    caption = models.TextField(max_length=2000, blank=True)
    location = models.CharField(max_length=200, blank=True)
    visibility = models.CharField(max_length=10, choices=Visibility.choices, default=Visibility.PUBLIC)
    activity = models.ForeignKey("activities.Activity", on_delete=models.SET_NULL, null=True, blank=True, related_name="posts")
    place = models.ForeignKey("places.Place", on_delete=models.SET_NULL, null=True, blank=True, related_name="posts")
    group = models.ForeignKey("groups.Group", on_delete=models.CASCADE, null=True, blank=True, related_name="posts")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    # Denormalised counters - updated atomically in PostService, so feeds never aggregate.
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    saves_count = models.PositiveIntegerField(default=0)
    shares_count = models.PositiveIntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=["status", "-created_at", "-id"]),
            models.Index(fields=["author", "status", "-created_at"]),
            models.Index(fields=["group", "status", "-created_at"]),
        ]


class PostMedia(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True, related_name="media")
    uploader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    image = models.ImageField(upload_to="posts/%Y/%m/")
    width = models.PositiveIntegerField(default=0)
    height = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]
        indexes = [models.Index(fields=["post"]), models.Index(fields=["uploader", "post"])]


class Like(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "post"], name="like_unique")]
        indexes = [models.Index(fields=["post", "-created_at"])]


class SavedPost(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="saves")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "post"], name="savedpost_unique")]
        indexes = [models.Index(fields=["user", "-created_at"])]


class Comment(TimeStamped):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE"
        HIDDEN = "HIDDEN"
        DELETED = "DELETED"

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="+")
    parent = models.ForeignKey("self", on_delete=models.CASCADE, null=True, blank=True, related_name="replies")
    content = models.TextField(max_length=1000)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    edited = models.BooleanField(default=False)

    class Meta:
        indexes = [models.Index(fields=["post", "status", "created_at", "id"])]
