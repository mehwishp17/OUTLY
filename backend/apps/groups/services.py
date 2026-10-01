from django.db import IntegrityError, transaction
from django.db.models import CharField, Count, IntegerField, OuterRef, Subquery
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from apps.common.permissions import is_staff_user
from apps.follows.selectors import blocked_ids
from apps.notifications.services import NotificationService

from .models import Group, GroupJoinRequest, GroupMember


def groups_for(user):
    members = (
        GroupMember.objects.filter(group=OuterRef("pk")).order_by().values("group").annotate(c=Count("id")).values("c")[:1]
    )
    mine = GroupMember.objects.filter(group=OuterRef("pk"), user=user).values("role")[:1]
    request_status = GroupJoinRequest.objects.filter(group=OuterRef("pk"), user=user, status="PENDING").values("status")[:1]
    return (
        Group.objects.exclude(owner_id__in=blocked_ids(user))
        .select_related("owner__profile")
        .annotate(
            members_count=Subquery(members, output_field=IntegerField()),
            my_role=Subquery(mine, output_field=CharField()),
            my_request_status=Subquery(request_status, output_field=CharField()),
        )
    )


def get_group(user, group_id):
    group = groups_for(user).filter(pk=group_id).first()
    if group is None:
        raise NotFound("Group not found.")
    return group


def membership(user, group_id):
    return GroupMember.objects.filter(group_id=group_id, user=user).first()


class GroupService:
    @staticmethod
    def can_moderate(user, group):
        if is_staff_user(user):
            return True
        return GroupMember.objects.filter(group=group, user=user, role__in=["OWNER", "MODERATOR"]).exists()

    @staticmethod
    def require_member_or_public(user, group):
        if group.visibility == "PUBLIC" or group.my_role or is_staff_user(user):
            return
        raise PermissionDenied("This is a private group. Request to join to see its content.")

    @staticmethod
    @transaction.atomic
    def create(user, serializer):
        group = serializer.save(owner=user)
        GroupMember.objects.create(group=group, user=user, role="OWNER")
        from apps.messaging.services import ChatService

        ChatService.ensure_group_conversation(group)
        return group

    @staticmethod
    @transaction.atomic
    def join(user, group_id, message=""):
        group = get_group(user, group_id)
        if group.my_role:
            raise ValidationError({"detail": ["You're already a member of this group."]})
        if group.visibility == "PUBLIC":
            GroupService._add_member(group, user)
            NotificationService.notify(
                recipient=group.owner, actor=user, type="GROUP_JOIN", title=f"joined {group.name}",
                target_type="group", target_id=group.pk,
            )
            return "JOINED", None
        try:
            with transaction.atomic():
                request = GroupJoinRequest.objects.create(group=group, user=user, message=message[:300])
        except IntegrityError:
            raise ValidationError({"detail": ["You already have a pending request for this group."]}) from None
        staff_ids = list(
            GroupMember.objects.filter(group=group, role__in=["OWNER", "MODERATOR"]).values_list("user_id", flat=True)
        )
        NotificationService.notify_bulk(
            recipient_ids=staff_ids, type="GROUP_REQUEST", title=f"asked to join {group.name}", actor=user,
            target_type="group", target_id=group.pk,
        )
        return "REQUESTED", request

    @staticmethod
    def _add_member(group, user, role="MEMBER"):
        member, created = GroupMember.objects.get_or_create(group=group, user=user, defaults={"role": role})
        if created:
            from apps.messaging.services import ChatService

            ChatService.add_to_group_conversation(group, user)
            from apps.achievements.services import AchievementService

            AchievementService.evaluate_later(user)
        return member

    @staticmethod
    @transaction.atomic
    def leave(user, group_id):
        member = membership(user, group_id)
        if member is None:
            raise ValidationError({"detail": ["You're not a member of this group."]})
        if member.role == "OWNER":
            raise ValidationError({"detail": ["The owner can't leave. Transfer ownership or delete the group."]})
        member.delete()
        from apps.messaging.services import ChatService

        ChatService.remove_from_group_conversation(group_id, user)

    @staticmethod
    @transaction.atomic
    def review_request(reviewer, group_id, request_id, decision):
        group = get_group(reviewer, group_id)
        if not GroupService.can_moderate(reviewer, group):
            raise PermissionDenied("Only group moderators can review requests.")
        request = GroupJoinRequest.objects.select_for_update(of=("self",)).filter(pk=request_id, group=group, status="PENDING").first()
        if request is None:
            raise NotFound("Join request not found.")
        request.status = decision
        request.reviewed_by = reviewer
        request.save(update_fields=["status", "reviewed_by", "updated_at"])
        if decision == "ACCEPTED":
            GroupService._add_member(group, request.user)
        NotificationService.notify(
            recipient=request.user, actor=reviewer, type="GROUP_JOIN",
            title=f"{'accepted' if decision == 'ACCEPTED' else 'declined'} your request to join {group.name}",
            target_type="group", target_id=group.pk,
        )
        return request

    @staticmethod
    @transaction.atomic
    def remove_member(actor, group_id, user_id):
        group = get_group(actor, group_id)
        target = GroupMember.objects.filter(group=group, user_id=user_id).first()
        if target is None:
            raise NotFound("Member not found.")
        if target.role == "OWNER":
            raise PermissionDenied("The owner can't be removed.")
        if actor.id == user_id:
            return GroupService.leave(actor, group_id)
        owner_or_staff = group.my_role == "OWNER" or is_staff_user(actor)
        if not (owner_or_staff or (group.my_role == "MODERATOR" and target.role == "MEMBER")):
            raise PermissionDenied("You can't remove this member.")
        target.delete()
        from apps.messaging.services import ChatService

        ChatService.remove_from_group_conversation(group_id, target.user)

    @staticmethod
    @transaction.atomic
    def set_role(actor, group_id, user_id, role):
        group = get_group(actor, group_id)
        if group.my_role != "OWNER" and not is_staff_user(actor):
            raise PermissionDenied("Only the group owner can change roles.")
        target = GroupMember.objects.filter(group=group, user_id=user_id).first()
        if target is None:
            raise NotFound("Member not found.")
        if target.role == "OWNER":
            raise ValidationError({"role": ["The owner's role can't be changed."]})
        target.role = role
        target.save(update_fields=["role"])
        return target
