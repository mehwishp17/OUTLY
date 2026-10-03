from django.db import transaction
from django.db.models import Count
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.pagination import OffsetPage
from apps.common.permissions import is_staff_user

from . import serializers as s
from .models import Place, SavedPlace, Trail, TrailPoint
from .selectors import filter_explorable

EXPLORE_PARAMS = [
    OpenApiParameter("search", str), OpenApiParameter("category", str), OpenApiParameter("difficulty", str),
    OpenApiParameter("min_rating", float), OpenApiParameter("max_distance", float),
    OpenApiParameter("near", str, description="latitude,longitude"), OpenApiParameter("radius_km", float),
    OpenApiParameter("verified", bool),
    OpenApiParameter("ordering", str, description="name, -name, rating, -rating, newest, distance, nearest"),
]


def _saved_ids(user):
    return set(SavedPlace.objects.filter(user=user, place__isnull=False).values_list("place_id", flat=True))


def _saved_trail_ids(user):
    return set(SavedPlace.objects.filter(user=user, trail__isnull=False).values_list("trail_id", flat=True))


class PlaceListCreateView(generics.ListCreateAPIView):
    pagination_class = OffsetPage
    serializer_class = s.PlaceSerializer
    throttle_scope = None

    @extend_schema(parameters=EXPLORE_PARAMS)
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        queryset = Place.objects.filter(is_active=True).annotate(trails_count=Count("trails")).order_by("name", "id")
        return filter_explorable(
            queryset, self.request.query_params, lat_field="latitude", lng_field="longitude",
            text_fields=("name", "description", "location"),
        )

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "saved_ids": _saved_ids(self.request.user)}

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, is_verified=False)


class PlaceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = s.PlaceSerializer
    lookup_url_kwarg = "place_id"

    def get_queryset(self):
        return Place.objects.filter(is_active=True).annotate(trails_count=Count("trails"))

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "saved_ids": _saved_ids(self.request.user)}

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method not in ("GET", "HEAD", "OPTIONS") and not (
            is_staff_user(request.user) or obj.created_by_id == request.user.id
        ):
            raise PermissionDenied("You can only edit places you added.")

    def perform_destroy(self, instance):
        instance.is_active = False  # soft delete keeps reviews and references intact
        instance.save(update_fields=["is_active", "updated_at"])


class TrailListCreateView(generics.ListCreateAPIView):
    pagination_class = OffsetPage
    serializer_class = s.TrailSerializer

    @extend_schema(parameters=EXPLORE_PARAMS)
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        queryset = Trail.objects.filter(is_active=True).annotate(points_count=Count("points")).order_by("name", "id")
        return filter_explorable(
            queryset, self.request.query_params, lat_field="start_latitude", lng_field="start_longitude",
            text_fields=("name", "description", "location"),
        )

    def get_serializer_context(self):
        return {
            **super().get_serializer_context(),
            "compact": self.request.method == "GET",
            "saved_ids": _saved_trail_ids(self.request.user),
        }

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, is_verified=False)


class TrailDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = s.TrailSerializer
    lookup_url_kwarg = "trail_id"

    def get_queryset(self):
        return Trail.objects.filter(is_active=True).annotate(points_count=Count("points")).prefetch_related("points")

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "saved_ids": _saved_trail_ids(self.request.user)}

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method not in ("GET", "HEAD", "OPTIONS") and not (
            is_staff_user(request.user) or obj.created_by_id == request.user.id
        ):
            raise PermissionDenied("You can only edit trails you added.")

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])


class TrailPointsView(APIView):
    """GET route geometry; POST replaces/extends it (creator or staff)."""

    @extend_schema(responses={200: s.TrailPointSerializer(many=True)})
    def get(self, request, trail_id):
        if not Trail.objects.filter(pk=trail_id, is_active=True).exists():
            raise NotFound("Trail not found.")
        points = TrailPoint.objects.filter(trail_id=trail_id).order_by("sequence")
        return Response(s.TrailPointSerializer(points, many=True).data)

    @extend_schema(request=s.TrailPointInputSerializer, responses={201: s.TrailPointSerializer(many=True)})
    @transaction.atomic
    def post(self, request, trail_id):
        trail = Trail.objects.filter(pk=trail_id, is_active=True).first()
        if trail is None:
            raise NotFound("Trail not found.")
        if not (is_staff_user(request.user) or trail.created_by_id == request.user.id):
            raise PermissionDenied("You can only edit trails you added.")
        serializer = s.TrailPointInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        points = serializer.validated_data["points"]
        TrailPoint.objects.filter(trail=trail, sequence__in=[p["sequence"] for p in points]).delete()
        created = TrailPoint.objects.bulk_create([TrailPoint(trail=trail, **p) for p in points])
        return Response(s.TrailPointSerializer(created, many=True).data, status=status.HTTP_201_CREATED)


class PlaceSaveView(APIView):
    @extend_schema(request=None, responses={201: None})
    def post(self, request, place_id):
        if not Place.objects.filter(pk=place_id, is_active=True).exists():
            raise NotFound("Place not found.")
        SavedPlace.objects.get_or_create(user=request.user, place_id=place_id)
        return Response({"saved": True}, status=status.HTTP_201_CREATED)

    @extend_schema(responses={204: None})
    def delete(self, request, place_id):
        SavedPlace.objects.filter(user=request.user, place_id=place_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TrailSaveView(APIView):
    @extend_schema(request=None, responses={201: None})
    def post(self, request, trail_id):
        if not Trail.objects.filter(pk=trail_id, is_active=True).exists():
            raise NotFound("Trail not found.")
        SavedPlace.objects.get_or_create(user=request.user, trail_id=trail_id)
        return Response({"saved": True}, status=status.HTTP_201_CREATED)

    @extend_schema(responses={204: None})
    def delete(self, request, trail_id):
        SavedPlace.objects.filter(user=request.user, trail_id=trail_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SavedPlacesView(generics.ListAPIView):
    serializer_class = s.PlaceSerializer
    pagination_class = OffsetPage

    def get_queryset(self):
        return Place.objects.filter(is_active=True, saves__user=self.request.user).order_by("-saves__created_at")

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "saved_ids": _saved_ids(self.request.user)}


class SavedTrailsView(generics.ListAPIView):
    serializer_class = s.TrailSerializer
    pagination_class = OffsetPage

    def get_queryset(self):
        return Trail.objects.filter(is_active=True, saves__user=self.request.user).order_by("-saves__created_at")

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "compact": True, "saved_ids": _saved_trail_ids(self.request.user)}


class MapView(APIView):
    """GET /map/?bbox=minLat,minLng,maxLat,maxLng - lightweight markers for the map."""

    @extend_schema(parameters=[OpenApiParameter("bbox", str), OpenApiParameter("category", str)])
    def get(self, request):
        queryset = Place.objects.filter(is_active=True)
        bbox = request.query_params.get("bbox")
        if bbox:
            try:
                min_lat, min_lng, max_lat, max_lng = (float(p) for p in bbox.split(","))
            except ValueError:
                from rest_framework.exceptions import ValidationError

                raise ValidationError({"bbox": ["Use bbox=minLat,minLng,maxLat,maxLng."]}) from None
            queryset = queryset.filter(latitude__range=(min_lat, max_lat), longitude__range=(min_lng, max_lng))
        if request.query_params.get("category"):
            queryset = queryset.filter(category=request.query_params["category"])
        markers = queryset.values("id", "name", "category", "difficulty", "rating", "latitude", "longitude", "is_verified")[:500]
        return Response(list(markers))
