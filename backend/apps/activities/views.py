from django.contrib.auth import get_user_model
from django.db.models import Q
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.pagination import CursorPage
from apps.common.permissions import is_staff_user

from . import serializers as s
from .models import Activity, ActivityParticipant
from .services import ActivityService, get_visible_activity, visible_activities

User = get_user_model()


class ActivityListCreateView(generics.ListCreateAPIView):
    serializer_class = s.ActivitySerializer
    cursor_ordering = ("-created_at", "-id")

    @extend_schema(
        parameters=[
            OpenApiParameter("type", str), OpenApiParameter("status", str), OpenApiParameter("difficulty", str),
            OpenApiParameter("mine", bool), OpenApiParameter("joined", bool), OpenApiParameter("search", str),
            OpenApiParameter("place", int), OpenApiParameter("start_after", str), OpenApiParameter("start_before", str),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        params = self.request.query_params
        queryset = visible_activities(self.request.user)
        if params.get("type"):
            queryset = queryset.filter(activity_type=params["type"].upper())
        if params.get("status"):
            queryset = queryset.filter(status=params["status"].upper())
        if params.get("difficulty"):
            queryset = queryset.filter(difficulty=params["difficulty"].upper())
        if params.get("mine") in ("true", "1"):
            queryset = queryset.filter(created_by=self.request.user)
        if params.get("joined") in ("true", "1"):
            queryset = queryset.filter(participants__user=self.request.user)
        if params.get("place", "").isdigit():
            queryset = queryset.filter(place_id=int(params["place"]))
        if params.get("search"):
            term = params["search"].strip()
            queryset = queryset.filter(Q(title__icontains=term) | Q(location__icontains=term))
        if params.get("start_after"):
            queryset = queryset.filter(start_at__gte=params["start_after"])
        if params.get("start_before"):
            queryset = queryset.filter(start_at__lte=params["start_before"])
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        activity = ActivityService.create(request.user, serializer)
        activity = get_visible_activity(request.user, activity.pk)
        return Response(self.get_serializer(activity).data, status=status.HTTP_201_CREATED)


class ActivityDetailView(APIView):
    @extend_schema(responses={200: s.ActivitySerializer})
    def get(self, request, activity_id):
        activity = get_visible_activity(request.user, activity_id)
        return Response(s.ActivitySerializer(activity, context={"request": request}).data)

    @extend_schema(request=s.ActivitySerializer, responses={200: s.ActivitySerializer})
    def patch(self, request, activity_id):
        activity = get_visible_activity(request.user, activity_id)
        serializer = s.ActivitySerializer(activity, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        ActivityService.update(request.user, activity, serializer)
        activity = get_visible_activity(request.user, activity_id)
        return Response(s.ActivitySerializer(activity, context={"request": request}).data)

    @extend_schema(responses={204: None})
    def delete(self, request, activity_id):
        ActivityService.delete(request.user, get_visible_activity(request.user, activity_id))
        return Response(status=status.HTTP_204_NO_CONTENT)


class ActivityJoinView(APIView):
    @extend_schema(request=None, responses={201: s.ParticipantSerializer})
    def post(self, request, activity_id):
        participant, created = ActivityService.join(request.user, activity_id)
        return Response(
            s.ParticipantSerializer(participant).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    @extend_schema(responses={204: None})
    def delete(self, request, activity_id):
        ActivityService.leave(request.user, activity_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ActivityParticipantsView(generics.ListAPIView):
    serializer_class = s.ParticipantSerializer
    cursor_ordering = ("joined_at", "id")

    def get_queryset(self):
        from apps.follows.selectors import blocked_ids

        activity = get_visible_activity(self.request.user, self.kwargs["activity_id"])
        return (
            ActivityParticipant.objects.filter(activity=activity)
            .exclude(user_id__in=blocked_ids(self.request.user))
            .select_related("user__profile")
        )


class ActivityHistoryView(generics.ListAPIView):
    """Completed activities of the signed-in user (created or joined)."""

    serializer_class = s.ActivitySerializer

    def get_queryset(self):
        return visible_activities(self.request.user).filter(
            status="COMPLETED", participants__user=self.request.user
        ).distinct()


class UserActivitiesView(generics.ListAPIView):
    """Completed activities shown on someone's profile; honours their privacy settings."""

    serializer_class = s.ActivitySerializer

    def get_queryset(self):
        from apps.follows.selectors import blocked_ids

        target = User.objects.select_related("profile").filter(pk=self.kwargs["user_id"], is_active=True).first()
        viewer = self.request.user
        if target is None or (target.id != viewer.id and target.id in blocked_ids(viewer)):
            raise NotFound("User not found.")
        if target.id != viewer.id and not is_staff_user(viewer):
            if not target.profile.privacy_settings.get("showActivityHistory", True):
                raise PermissionDenied("This user keeps their activity history private.")
        return visible_activities(viewer).filter(status="COMPLETED", participants__user=target).distinct()
