from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Q, Sum
from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, serializers, status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common import permissions as roles
from apps.events.models import Event, EventParticipant
from apps.moderation.services import AuditService
from apps.notifications.services import NotificationService

from .models import OrganizerProfile

User = get_user_model()


class OrganizerSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(source="user.profile.username", read_only=True)

    class Meta:
        model = OrganizerProfile
        fields = [
            "id", "user_id", "username", "organization_name", "bio", "website", "contact_email", "status",
            "review_notes", "created_at", "updated_at",
        ]
        read_only_fields = ["status", "review_notes", "created_at", "updated_at"]


class ReviewInputSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=["APPROVED", "REJECTED"])
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")


class AnnounceSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=500)


class ApplyView(APIView):
    @extend_schema(request=OrganizerSerializer, responses={201: OrganizerSerializer})
    def post(self, request):
        if OrganizerProfile.objects.filter(user=request.user).exists():
            raise ValidationError({"detail": ["You already have an organizer application."]})
        serializer = OrganizerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save(user=request.user)
        return Response(OrganizerSerializer(profile).data, status=status.HTTP_201_CREATED)


class MyOrganizerView(APIView):
    @extend_schema(responses={200: OrganizerSerializer})
    def get(self, request):
        profile = OrganizerProfile.objects.select_related("user__profile").filter(user=request.user).first()
        if profile is None:
            raise NotFound("You haven't applied to be an organizer.")
        return Response(OrganizerSerializer(profile).data)

    @extend_schema(request=OrganizerSerializer, responses={200: OrganizerSerializer})
    def patch(self, request):
        profile = OrganizerProfile.objects.select_related("user__profile").filter(user=request.user).first()
        if profile is None:
            raise NotFound("You haven't applied to be an organizer.")
        serializer = OrganizerSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PublicOrganizerView(APIView):
    @extend_schema(responses={200: OrganizerSerializer})
    def get(self, request, user_id):
        profile = OrganizerProfile.objects.select_related("user__profile").filter(user_id=user_id, status="APPROVED").first()
        if profile is None:
            raise NotFound("Organizer not found.")
        data = OrganizerSerializer(profile).data
        data.pop("contact_email", None)
        data.pop("review_notes", None)
        data["events_hosted"] = Event.objects.filter(organizer_id=user_id, approval_status="APPROVED").count()
        return Response(data)


class OrganizerAnalyticsView(APIView):
    """Basic analytics for approved organizers' own events."""

    @extend_schema(responses={200: None})
    def get(self, request):
        if request.user.role not in (roles.ORGANIZER, roles.ADMINISTRATOR):
            raise PermissionDenied("Organizer access required.")
        events = Event.objects.filter(organizer=request.user)
        approved = EventParticipant.objects.filter(event__organizer=request.user, status="APPROVED")
        top = (
            events.annotate(joined=Count("participants", filter=Q(participants__status="APPROVED")))
            .order_by("-joined").values("id", "title", "start_at", "capacity", "joined")[:5]
        )
        return Response(
            {
                "events_total": events.count(),
                "events_upcoming": events.filter(start_at__gte=timezone.now(), status="ACTIVE").count(),
                "participants_total": approved.count(),
                "pending_requests": EventParticipant.objects.filter(event__organizer=request.user, status="PENDING").count(),
                "capacity_total": events.aggregate(c=Sum("capacity"))["c"] or 0,
                "top_events": list(top),
            }
        )


class AnnounceView(APIView):
    """Organizer announcement: notifies everyone confirmed for the event."""

    @extend_schema(request=AnnounceSerializer, responses={200: None})
    def post(self, request, event_id):
        serializer = AnnounceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = Event.objects.filter(pk=event_id).first()
        if event is None or event.organizer_id != request.user.id:
            raise NotFound("Event not found.")
        with transaction.atomic():
            ids = list(
                EventParticipant.objects.filter(event=event, status="APPROVED").values_list("user_id", flat=True)
            )
            NotificationService.notify_bulk(
                recipient_ids=ids, type="EVENT_REMINDER", title=f"posted an update for “{event.title}”", actor=request.user,
                body=serializer.validated_data["message"], target_type="event", target_id=event.pk,
            )
        return Response({"notified": len(ids)})


# ---------------- admin ----------------
class AdminOrganizerListView(generics.ListAPIView):
    permission_classes = [roles.IsAdministrator]
    serializer_class = OrganizerSerializer

    @extend_schema(parameters=[OpenApiParameter("status", str)])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        queryset = OrganizerProfile.objects.select_related("user__profile")
        if self.request.query_params.get("status"):
            queryset = queryset.filter(status=self.request.query_params["status"].upper())
        return queryset


class AdminOrganizerReviewView(APIView):
    permission_classes = [roles.IsAdministrator]

    @extend_schema(request=ReviewInputSerializer, responses={200: OrganizerSerializer})
    @transaction.atomic
    def post(self, request, organizer_id):
        serializer = ReviewInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = OrganizerProfile.objects.select_for_update(of=("self",)).select_related("user__profile").filter(pk=organizer_id).first()
        if profile is None:
            raise NotFound("Organizer application not found.")
        decision = serializer.validated_data["decision"]
        profile.status, profile.review_notes = decision, serializer.validated_data["notes"]
        profile.reviewed_by, profile.reviewed_at = request.user, timezone.now()
        profile.save()
        user = profile.user
        if decision == "APPROVED" and user.role == roles.USER:
            user.role = roles.ORGANIZER
            user.save(update_fields=["role", "updated_at"])
        elif decision == "REJECTED" and user.role == roles.ORGANIZER:
            user.role = roles.USER
            user.save(update_fields=["role", "updated_at"])
        AuditService.log(request.user, f"organizer.{decision.lower()}", "user", user.pk, {"organizer_id": profile.pk}, request)
        NotificationService.notify(
            recipient=user, actor=None, type="SYSTEM",
            title="Your organizer application was approved - you can now host events." if decision == "APPROVED"
            else "Your organizer application wasn't approved.",
            body=serializer.validated_data["notes"],
        )
        return Response(OrganizerSerializer(profile).data)
