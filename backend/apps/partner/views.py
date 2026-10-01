from django.db.models import Q
from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from . import serializers as s
from .models import PartnerRequestJoin
from .services import PartnerService, get_visible_request, visible_requests


def _data(request, request_id):
    return s.PartnerRequestSerializer(get_visible_request(request.user, request_id), context={"request": request}).data


def _join(request, request_id):
    serializer = s.JoinInputSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    join = PartnerService.request_to_join(request.user, request_id, serializer.validated_data.get("message", ""))
    return Response(s.JoinSerializer(join).data, status=status.HTTP_201_CREATED)


class PartnerListCreateView(generics.ListCreateAPIView):
    serializer_class = s.PartnerRequestSerializer
    cursor_ordering = ("preferred_datetime", "id")

    @extend_schema(
        parameters=[
            OpenApiParameter("activity", str), OpenApiParameter("experience_level", str), OpenApiParameter("status", str),
            OpenApiParameter("mine", bool), OpenApiParameter("joined", bool), OpenApiParameter("search", str),
            OpenApiParameter("include_past", bool),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        params = self.request.query_params
        queryset = visible_requests(self.request.user)
        if params.get("mine") in ("true", "1"):
            queryset = queryset.filter(owner=self.request.user)
        if params.get("joined") in ("true", "1"):
            queryset = queryset.filter(my_join_status__isnull=False)
        if params.get("include_past") not in ("true", "1"):
            queryset = queryset.filter(preferred_datetime__gte=timezone.now())
        for param, field in (("activity", "activity"), ("experience_level", "experience_level"), ("status", "status")):
            if params.get(param):
                queryset = queryset.filter(**{field: params[param].upper()})
        if params.get("search"):
            term = params["search"].strip()
            queryset = queryset.filter(Q(destination__icontains=term) | Q(description__icontains=term))
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(owner=request.user)
        return Response(_data(request, obj.pk), status=status.HTTP_201_CREATED)


class PartnerDetailView(APIView):
    @extend_schema(responses={200: s.PartnerRequestSerializer})
    def get(self, request, request_id):
        return Response(_data(request, request_id))

    @extend_schema(request=s.PartnerRequestSerializer, responses={200: s.PartnerRequestSerializer})
    def patch(self, request, request_id):
        PartnerService.update(
            request.user, request_id,
            lambda obj: s.PartnerRequestSerializer(obj, data=request.data, partial=True, context={"request": request}),
        )
        return Response(_data(request, request_id))

    @extend_schema(responses={204: None})
    def delete(self, request, request_id):
        PartnerService.delete(request.user, request_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PartnerCloseView(APIView):
    @extend_schema(request=None, responses={200: s.PartnerRequestSerializer})
    def post(self, request, request_id):
        PartnerService.close(request.user, request_id)
        return Response(_data(request, request_id))


class PartnerJoinView(APIView):
    @extend_schema(request=s.JoinInputSerializer, responses={201: s.JoinSerializer})
    def post(self, request, request_id):
        return _join(request, request_id)

    @extend_schema(responses={204: None}, description="Cancels your own join request (frees the spot if it was accepted).")
    def delete(self, request, request_id):
        PartnerService.cancel_join(request.user, request_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PartnerJoinRequestsView(generics.ListCreateAPIView):
    serializer_class = s.JoinSerializer
    cursor_ordering = ("-created_at", "-id")

    def get_queryset(self):
        obj = get_visible_request(self.request.user, self.kwargs["request_id"])
        if obj.owner_id != self.request.user.id:
            raise PermissionDenied("Only the owner can see join requests.")
        queryset = PartnerRequestJoin.objects.filter(request=obj).select_related("user__profile")
        if self.request.query_params.get("status"):
            queryset = queryset.filter(status=self.request.query_params["status"].upper())
        return queryset

    @extend_schema(request=s.JoinInputSerializer, responses={201: s.JoinSerializer})
    def post(self, request, request_id):
        return _join(request, request_id)


class PartnerJoinReviewView(APIView):
    @extend_schema(responses={200: s.JoinSerializer})
    def get(self, request, request_id, join_id):
        obj = get_visible_request(request.user, request_id)
        if obj.owner_id != request.user.id:
            raise PermissionDenied("Only the owner can see join requests.")
        join = generics.get_object_or_404(PartnerRequestJoin.objects.select_related("user__profile"), pk=join_id, request=obj)
        return Response(s.JoinSerializer(join).data)

    @extend_schema(request=s.DecisionSerializer, responses={200: s.JoinSerializer})
    def post(self, request, request_id, join_id):
        serializer = s.DecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        join = PartnerService.review(request.user, request_id, join_id, serializer.validated_data["decision"])
        return Response(s.JoinSerializer(join).data)
