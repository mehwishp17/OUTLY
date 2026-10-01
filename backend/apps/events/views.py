from django.db.models import Q
from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsModeratorOrAdmin, is_staff_user
from apps.follows.selectors import blocked_ids

from . import serializers as s
from .models import EventParticipant
from .services import EventService, get_visible_event, visible_events


def _event_data(request, event_id):
    return s.EventSerializer(get_visible_event(request.user, event_id), context={"request": request}).data


class EventListCreateView(generics.ListCreateAPIView):
    serializer_class = s.EventSerializer
    cursor_ordering = ("start_at", "id")

    @extend_schema(
        parameters=[
            OpenApiParameter("category", str), OpenApiParameter("difficulty", str), OpenApiParameter("search", str),
            OpenApiParameter("past", bool), OpenApiParameter("mine", bool), OpenApiParameter("joined", bool),
            OpenApiParameter("place", int), OpenApiParameter("open_only", bool),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        params = self.request.query_params
        queryset = visible_events(self.request.user)
        if params.get("mine") in ("true", "1"):
            queryset = queryset.filter(organizer=self.request.user)
        else:
            queryset = queryset.exclude(Q(status="CANCELLED") & ~Q(organizer=self.request.user))
        if params.get("joined") in ("true", "1"):
            queryset = queryset.filter(my_status="APPROVED")
        if params.get("past") in ("true", "1"):
            queryset = queryset.filter(start_at__lt=timezone.now())
        else:
            queryset = queryset.filter(Q(end_at__gte=timezone.now()) | Q(end_at__isnull=True, start_at__gte=timezone.now()))
        if params.get("category"):
            queryset = queryset.filter(category=params["category"].upper())
        if params.get("difficulty"):
            queryset = queryset.filter(difficulty=params["difficulty"].upper())
        if params.get("place", "").isdigit():
            queryset = queryset.filter(place_id=int(params["place"]))
        if params.get("search"):
            term = params["search"].strip()
            queryset = queryset.filter(Q(title__icontains=term) | Q(location__icontains=term) | Q(description__icontains=term))
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = EventService.create(request.user, serializer)
        return Response(_event_data(request, event.pk), status=status.HTTP_201_CREATED)


class EventDetailView(APIView):
    @extend_schema(responses={200: s.EventSerializer})
    def get(self, request, event_id):
        return Response(_event_data(request, event_id))

    @extend_schema(request=s.EventSerializer, responses={200: s.EventSerializer})
    def patch(self, request, event_id):
        get_visible_event(request.user, event_id)  # 404 for events the user can't see
        EventService.update(
            request.user, event_id,
            lambda event: s.EventSerializer(event, data=request.data, partial=True, context={"request": request}),
        )
        return Response(_event_data(request, event_id))

    @extend_schema(responses={204: None}, description="Cancels the event (kept for history) and notifies participants.")
    def delete(self, request, event_id):
        EventService.cancel(request.user, event_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class EventJoinView(APIView):
    @extend_schema(request=None, responses={201: s.EventParticipantSerializer})
    def post(self, request, event_id):
        participant = EventService.join(request.user, event_id)
        response = Response(s.EventParticipantSerializer(participant).data, status=status.HTTP_201_CREATED)
        response.message = "Request sent to the organizer." if participant.status == "PENDING" else "You're in!"
        return response

    @extend_schema(responses={204: None})
    def delete(self, request, event_id):
        EventService.leave(request.user, event_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class EventParticipantsView(generics.ListAPIView):
    serializer_class = s.EventParticipantSerializer
    cursor_ordering = ("joined_at", "id")

    def get_queryset(self):
        event = get_visible_event(self.request.user, self.kwargs["event_id"])
        queryset = EventParticipant.objects.filter(event=event).select_related("user__profile")
        if event.organizer_id == self.request.user.id or is_staff_user(self.request.user):
            wanted = self.request.query_params.get("status")
            return queryset.filter(status=wanted.upper()) if wanted else queryset
        return queryset.filter(status="APPROVED").exclude(user_id__in=blocked_ids(self.request.user))


class EventParticipantDecisionView(APIView):
    @extend_schema(request=s.ParticipantDecisionSerializer, responses={200: s.EventParticipantSerializer})
    def patch(self, request, event_id, user_id):
        serializer = s.ParticipantDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        participant = EventService.decide(request.user, event_id, user_id, serializer.validated_data["status"])
        return Response(s.EventParticipantSerializer(participant).data)


class EventInviteView(APIView):
    @extend_schema(request=s.InviteSerializer, responses={201: s.EventParticipantSerializer(many=True)})
    def post(self, request, event_id):
        serializer = s.InviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        created = EventService.invite(request.user, event_id, serializer.validated_data["ids"])
        return Response(s.EventParticipantSerializer(created, many=True).data, status=status.HTTP_201_CREATED)


class EventModerateView(APIView):
    permission_classes = [IsModeratorOrAdmin]

    @extend_schema(request=s.ModerateSerializer, responses={200: s.EventSerializer})
    def patch(self, request, event_id):
        serializer = s.ModerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        EventService.moderate(request.user, event_id, serializer.validated_data["approval_status"])
        return Response(_event_data(request, event_id))
