from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import Q
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from apps.notifications.services import NotificationService

from .models import Block, Follow
from .selectors import is_blocked_between

User = get_user_model()


def _target(user_id):
    target = User.objects.select_related("profile").filter(pk=user_id, is_active=True).first()
    if target is None:
        raise NotFound("User not found.")
    return target


class FollowService:
    @staticmethod
    @transaction.atomic
    def follow(actor, target_id):
        if actor.id == target_id:
            raise ValidationError({"detail": ["You can't follow yourself."]})
        target = _target(target_id)
        if is_blocked_between(actor.id, target.id):
            raise PermissionDenied("You can't follow this user.")
        needs_approval = bool(target.profile.privacy_settings.get("requireFollowApproval"))
        status = Follow.Status.PENDING if needs_approval else Follow.Status.ACCEPTED
        try:
            follow, created = Follow.objects.get_or_create(follower=actor, following=target, defaults={"status": status})
        except IntegrityError:
            follow, created = Follow.objects.get(follower=actor, following=target), False
        if created:
            NotificationService.notify(
                recipient=target,
                actor=actor,
                type="FOLLOW" if status == Follow.Status.ACCEPTED else "FOLLOW_REQUEST",
                title="started following you" if status == Follow.Status.ACCEPTED else "requested to follow you",
                target_type="user",
                target_id=actor.id,
            )
            if status == Follow.Status.ACCEPTED:
                from apps.achievements.services import AchievementService

                AchievementService.evaluate_later(target)
        return follow, created

    @staticmethod
    def unfollow(actor, target_id):
        Follow.objects.filter(follower=actor, following_id=target_id).delete()

    @staticmethod
    @transaction.atomic
    def review_request(owner, follow_id, decision):
        follow = Follow.objects.select_for_update(of=("self",)).filter(
            pk=follow_id, following=owner, status=Follow.Status.PENDING
        ).first()
        if follow is None:
            raise NotFound("Follow request not found.")
        if decision == "ACCEPTED":
            follow.status = Follow.Status.ACCEPTED
            follow.save(update_fields=["status"])
            NotificationService.notify(
                recipient=follow.follower, actor=owner, type="FOLLOW", title="accepted your follow request",
                target_type="user", target_id=owner.id,
            )
        else:
            follow.delete()
        return follow


class BlockService:
    @staticmethod
    @transaction.atomic
    def block(actor, target_id):
        if actor.id == target_id:
            raise ValidationError({"detail": ["You can't block yourself."]})
        target = _target(target_id)
        block, _ = Block.objects.get_or_create(blocker=actor, blocked=target)
        Follow.objects.filter(
            Q(follower=actor, following=target) | Q(follower=target, following=actor)
        ).delete()
        actor._blocked_ids = None
        return block

    @staticmethod
    def unblock(actor, target_id):
        Block.objects.filter(blocker=actor, blocked_id=target_id).delete()
