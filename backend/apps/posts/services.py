from django.db import IntegrityError, transaction
from django.db.models import F
from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from apps.common.permissions import is_staff_user
from apps.notifications.services import NotificationService

from .models import Comment, Like, Post, PostMedia, SavedPost
from .selectors import get_visible_post


def _bump(model, pk, field, delta):
    """Atomic counter change; never goes below zero."""
    qs = model.objects.filter(pk=pk)
    if delta < 0:
        qs = qs.filter(**{f"{field}__gte": -delta})
    qs.update(**{field: F(field) + delta})


class PostService:
    @staticmethod
    def _resolve_links(user, data):
        from apps.activities.models import Activity
        from apps.groups.models import GroupMember
        from apps.places.models import Place

        links = {}
        if data.get("place_id"):
            if not Place.objects.filter(pk=data["place_id"], is_active=True).exists():
                raise ValidationError({"place_id": ["Place not found."]})
            links["place_id"] = data["place_id"]
        if data.get("activity_id"):
            from django.db.models import Q

            if not Activity.objects.filter(Q(created_by=user) | Q(privacy="PUBLIC"), pk=data["activity_id"]).exists():
                raise ValidationError({"activity_id": ["Activity not found."]})
            links["activity_id"] = data["activity_id"]
        if data.get("group_id"):
            if not GroupMember.objects.filter(group_id=data["group_id"], user=user).exists():
                raise PermissionDenied("Join this group before posting in it.")
            links["group_id"] = data["group_id"]
            links["visibility"] = Post.Visibility.GROUP
        return links

    @staticmethod
    def _attach_media(user, post, media_ids):
        if media_ids is None:
            return
        ids = list(dict.fromkeys(media_ids))
        owned = PostMedia.objects.filter(pk__in=ids, uploader=user).filter(post__isnull=True) | PostMedia.objects.filter(
            pk__in=ids, uploader=user, post=post
        )
        if owned.count() != len(ids):
            raise ValidationError({"media_ids": ["One or more images are invalid or already used."]})
        PostMedia.objects.filter(post=post).exclude(pk__in=ids).delete()
        PostMedia.objects.filter(pk__in=ids).update(post=post)

    @staticmethod
    @transaction.atomic
    def create(user, data):
        post = Post(author=user, caption=data.get("caption", ""), location=data.get("location", ""))
        if data.get("visibility"):
            post.visibility = data["visibility"]
        for key, value in PostService._resolve_links(user, data).items():
            setattr(post, key, value)
        post.save()
        PostService._attach_media(user, post, data.get("media_ids"))
        if post.group_id:
            from apps.groups.models import GroupMember

            NotificationService.notify_bulk(
                recipient_ids=list(GroupMember.objects.filter(group_id=post.group_id).values_list("user_id", flat=True)),
                type="GROUP_POST", title="posted in your group", actor=user, body=post.caption[:120],
                target_type="group", target_id=post.group_id,
            )
        from apps.achievements.services import AchievementService

        AchievementService.evaluate_later(user)
        return post

    @staticmethod
    @transaction.atomic
    def update(user, post_id, data):
        post = Post.objects.select_for_update(of=("self",)).filter(pk=post_id, status="ACTIVE").first()
        if post is None or (post.author_id != user.id and not is_staff_user(user)):
            raise NotFound("Post not found.")
        if post.author_id != user.id:
            raise PermissionDenied("Only the author can edit this post.")
        for field in ("caption", "location"):
            if field in data:
                setattr(post, field, data[field])
        if "visibility" in data and not post.group_id:
            post.visibility = data["visibility"]
        links = PostService._resolve_links(user, {k: v for k, v in data.items() if k in ("place_id", "activity_id")})
        for key, value in links.items():
            setattr(post, key, value)
        for key in ("place_id", "activity_id"):
            if key in data and data[key] is None:
                setattr(post, key, None)
        post.save()
        PostService._attach_media(user, post, data.get("media_ids"))
        return post

    @staticmethod
    def delete(user, post_id):
        post = Post.objects.filter(pk=post_id, status="ACTIVE").select_related("group").first()
        if post is None:
            raise NotFound("Post not found.")
        allowed = post.author_id == user.id or is_staff_user(user)
        if not allowed and post.group_id:
            from apps.groups.services import GroupService

            allowed = GroupService.can_moderate(user, post.group)
        if not allowed:
            raise PermissionDenied("You can't delete this post.")
        post.status = Post.Status.DELETED
        post.save(update_fields=["status", "updated_at"])

    # ---- engagement ----
    @staticmethod
    @transaction.atomic
    def like(user, post_id):
        post = get_visible_post(user, post_id, annotated=False)
        try:
            with transaction.atomic():
                _, created = Like.objects.get_or_create(user=user, post=post)
        except IntegrityError:
            created = False
        if created:
            _bump(Post, post.pk, "likes_count", 1)
            NotificationService.notify(
                recipient=post.author, actor=user, type="LIKE", title="liked your post", body=post.caption[:100],
                target_type="post", target_id=post.pk,
            )
        post.refresh_from_db(fields=["likes_count"])
        return post.likes_count

    @staticmethod
    @transaction.atomic
    def unlike(user, post_id):
        post = get_visible_post(user, post_id, annotated=False)
        deleted, _ = Like.objects.filter(user=user, post=post).delete()
        if deleted:
            _bump(Post, post.pk, "likes_count", -1)
        post.refresh_from_db(fields=["likes_count"])
        return post.likes_count

    @staticmethod
    @transaction.atomic
    def save(user, post_id):
        post = get_visible_post(user, post_id, annotated=False)
        _, created = SavedPost.objects.get_or_create(user=user, post=post)
        if created:
            _bump(Post, post.pk, "saves_count", 1)
        post.refresh_from_db(fields=["saves_count"])
        return post.saves_count

    @staticmethod
    @transaction.atomic
    def unsave(user, post_id):
        post = get_visible_post(user, post_id, annotated=False)
        deleted, _ = SavedPost.objects.filter(user=user, post=post).delete()
        if deleted:
            _bump(Post, post.pk, "saves_count", -1)
        post.refresh_from_db(fields=["saves_count"])
        return post.saves_count

    @staticmethod
    def share(user, post_id):
        post = get_visible_post(user, post_id, annotated=False)
        if post.visibility != "PUBLIC":
            raise PermissionDenied("Only public posts can be shared.")
        _bump(Post, post.pk, "shares_count", 1)
        post.refresh_from_db(fields=["shares_count"])
        return post


class CommentService:
    @staticmethod
    @transaction.atomic
    def create(user, post_id, content, parent_id=None):
        post = get_visible_post(user, post_id, annotated=False)
        parent = None
        if parent_id:
            parent = Comment.objects.filter(pk=parent_id, post=post, status="ACTIVE", parent__isnull=True).first()
            if parent is None:
                raise ValidationError({"parent_id": ["You can only reply to a top-level comment on this post."]})
        comment = Comment.objects.create(post=post, author=user, content=content, parent=parent)
        _bump(Post, post.pk, "comments_count", 1)
        NotificationService.notify(
            recipient=post.author, actor=user, type="COMMENT", title="commented on your post", body=content[:100],
            target_type="post", target_id=post.pk,
        )
        if parent and parent.author_id != post.author_id:
            NotificationService.notify(
                recipient=parent.author, actor=user, type="COMMENT", title="replied to your comment", body=content[:100],
                target_type="post", target_id=post.pk,
            )
        return comment

    @staticmethod
    def update(user, comment_id, content):
        comment = Comment.objects.filter(pk=comment_id, status="ACTIVE").select_related("author__profile").first()
        if comment is None:
            raise NotFound("Comment not found.")
        if comment.author_id != user.id:
            raise PermissionDenied("Only the author can edit this comment.")
        comment.content, comment.edited = content, True
        comment.save(update_fields=["content", "edited", "updated_at"])
        return comment

    @staticmethod
    @transaction.atomic
    def delete(user, comment_id):
        comment = Comment.objects.filter(pk=comment_id, status="ACTIVE").select_related("post").first()
        if comment is None:
            raise NotFound("Comment not found.")
        allowed = comment.author_id == user.id or comment.post.author_id == user.id or is_staff_user(user)
        if not allowed and comment.post.group_id:
            from apps.groups.services import GroupService

            allowed = GroupService.can_moderate(user, comment.post.group)
        if not allowed:
            raise PermissionDenied("You can't delete this comment.")
        removed = Comment.objects.filter(pk=comment.pk).update(status="DELETED", updated_at=timezone.now())
        removed += Comment.objects.filter(parent=comment, status="ACTIVE").update(status="DELETED", updated_at=timezone.now())
        _bump(Post, comment.post_id, "comments_count", -removed)
