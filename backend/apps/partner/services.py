from django.db import transaction
from django.db.models import CharField, OuterRef, Q, Subquery
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from apps.common.permissions import is_staff_user
from apps.follows.models import Follow
from apps.follows.selectors import blocked_ids, is_blocked_between
from apps.notifications.services import NotificationService

from .models import PartnerRequest, PartnerRequestJoin


class SpotsFull(ValidationError):
    status_code = 409
    default_code = "no_spots_left"


def visible_requests(user):
    following = Follow.objects.filter(follower=user, status="ACCEPTED").values("following_id")
    mine = PartnerRequestJoin.objects.filter(request=OuterRef("pk"), user=user).values("status")[:1]
    return (
        PartnerRequest.objects.exclude(owner_id__in=blocked_ids(user))
        .filter(Q(owner=user) | Q(visibility="PUBLIC") | Q(visibility="PRIVATE", owner_id__in=following))
        .select_related("owner__profile")
        .annotate(my_join_status=Subquery(mine, output_field=CharField()))
    )


def get_visible_request(user, request_id):
    obj = visible_requests(user).filter(pk=request_id).first()
    if obj is None:
        raise NotFound("Partner request not found.")
    return obj


class PartnerService:
    @staticmethod
    def update(user, request_id, serializer_factory):
        with transaction.atomic():
            obj = PartnerRequest.objects.select_for_update(of=("self",)).filter(pk=request_id).first()
            if obj is None or obj.owner_id != user.id:
                raise NotFound("Partner request not found.")
            serializer = serializer_factory(obj)
            serializer.is_valid(raise_exception=True)
            return serializer.save()

    @staticmethod
    def delete(user, request_id):
        obj = get_visible_request(user, request_id)
        if obj.owner_id != user.id and not is_staff_user(user):
            raise PermissionDenied("Only the owner can delete this request.")
        obj.delete()

    @staticmethod
    def close(user, request_id):
        obj = get_visible_request(user, request_id)
        if obj.owner_id != user.id:
            raise PermissionDenied("Only the owner can close this request.")
        obj.status, obj.auto_closed = "CLOSED", False
        obj.save(update_fields=["status", "auto_closed", "updated_at"])
        return obj

    @staticmethod
    @transaction.atomic
    def request_to_join(user, request_id, message=""):
        obj = PartnerRequest.objects.select_for_update(of=("self",)).select_related("owner__profile").filter(pk=request_id).first()
        if obj is None or obj.owner_id in blocked_ids(user):
            raise NotFound("Partner request not found.")
        if obj.visibility == "PRIVATE" and obj.owner_id != user.id and not Follow.objects.filter(
            follower=user, following_id=obj.owner_id, status="ACCEPTED"
        ).exists():
            raise NotFound("Partner request not found.")
        if obj.owner_id == user.id:
            raise ValidationError({"detail": ["You can't join your own request."]})
        if obj.status != "OPEN":
            raise ValidationError({"detail": ["This request is closed."]})
        if obj.spots_filled >= obj.spots_total:
            raise SpotsFull({"detail": ["All spots are filled."]})
        if PartnerRequestJoin.objects.filter(request=obj, user=user).exists():
            raise ValidationError({"detail": ["You've already asked to join this request."]})
        join = PartnerRequestJoin.objects.create(request=obj, user=user, message=message.strip())
        NotificationService.notify(
            recipient=obj.owner, actor=user, type="PARTNER_JOIN", title=f"wants to join your trip to {obj.destination}",
            body=message[:120], target_type="partner_request", target_id=obj.pk,
        )
        return join

    @staticmethod
    @transaction.atomic
    def cancel_join(user, request_id):
        obj = PartnerRequest.objects.select_for_update(of=("self",)).filter(pk=request_id).first()
        join = PartnerRequestJoin.objects.filter(request_id=request_id, user=user).first()
        if obj is None or join is None:
            raise NotFound("You have no request to cancel.")
        if join.status == "ACCEPTED":
            obj.spots_filled = max(obj.spots_filled - 1, 0)
            if obj.status == "CLOSED" and obj.auto_closed:
                obj.status, obj.auto_closed = "OPEN", False
            obj.save(update_fields=["spots_filled", "status", "auto_closed", "updated_at"])
        join.delete()

    @staticmethod
    @transaction.atomic
    def review(owner, request_id, join_id, decision):
        obj = PartnerRequest.objects.select_for_update(of=("self",)).filter(pk=request_id).first()
        if obj is None or obj.owner_id != owner.id:
            raise NotFound("Partner request not found.")
        join = PartnerRequestJoin.objects.select_for_update(of=("self",)).select_related("user__profile").filter(
            pk=join_id, request=obj
        ).first()
        if join is None:
            raise NotFound("Join request not found.")
        if join.status != "PENDING":
            raise ValidationError({"detail": [f"This request was already {join.status.lower()}."]})
        if decision == "ACCEPTED":
            if obj.spots_filled >= obj.spots_total:
                raise SpotsFull({"detail": ["All spots are filled."]})
            if is_blocked_between(owner.id, join.user_id):
                raise PermissionDenied("You can't accept this user.")
            obj.spots_filled += 1
            if obj.spots_filled >= obj.spots_total:
                obj.status, obj.auto_closed = "CLOSED", True
            obj.save(update_fields=["spots_filled", "status", "auto_closed", "updated_at"])
        join.status = decision
        join.save(update_fields=["status", "updated_at"])
        NotificationService.notify(
            recipient=join.user, actor=owner, type="PARTNER_REQUEST",
            title=f"{'accepted' if decision == 'ACCEPTED' else 'declined'} your request for {obj.destination}",
            target_type="partner_request", target_id=obj.pk,
        )
        return join
