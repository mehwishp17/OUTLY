from django.contrib.auth import get_user_model
from django.db.models import Q
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.exceptions import NotFound
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.pagination import OffsetPage
from apps.common.permissions import is_staff_user
from apps.follows.models import Follow
from apps.follows.selectors import blocked_ids

from . import serializers as s
from .services import ProfileService

User = get_user_model()


def _me(user_id):
    return User.objects.select_related("profile").get(pk=user_id)


class MyProfileView(APIView):
    @extend_schema(responses={200: s.MyProfileSerializer})
    def get(self, request):
        user = _me(request.user.id)
        stats = ProfileService.stats_for([user.id])
        return Response(s.MyProfileSerializer(user, context={"request": request, "stats": stats}).data)

    @extend_schema(request=s.ProfileUpdateSerializer, responses={200: s.MyProfileSerializer})
    def patch(self, request):
        serializer = s.ProfileUpdateSerializer(data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = _me(request.user.id)
        profile = user.profile
        data = serializer.validated_data
        for field in ("display_name", "username", "bio", "interests", "location", "skill_level", "onboarding_completed"):
            if field in data:
                setattr(profile, field, data[field])
        if "privacy_settings" in data:
            profile.privacy_settings = {**profile.privacy_settings, **data["privacy_settings"]}
        profile.save()
        stats = ProfileService.stats_for([user.id])
        return Response(s.MyProfileSerializer(user, context={"request": request, "stats": stats}).data)


class MyPhotoView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    throttle_scope = "upload"

    @extend_schema(request={"multipart/form-data": s.PhotoUploadSerializer}, responses={200: s.MyProfileSerializer})
    def post(self, request):
        serializer = s.PhotoUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = _me(request.user.id)
        for field in ("photo", "cover_photo"):
            if field in serializer.validated_data:
                setattr(user.profile, field, serializer.validated_data[field])
        user.profile.save()
        return Response(s.MyProfileSerializer(user, context={"request": request}).data)

    @extend_schema(responses={200: s.MyProfileSerializer})
    def delete(self, request):
        user = _me(request.user.id)
        field = "cover_photo" if request.query_params.get("field") == "cover_photo" else "photo"
        getattr(user.profile, field).delete(save=False)
        setattr(user.profile, field, None)
        user.profile.save()
        return Response(s.MyProfileSerializer(user, context={"request": request}).data)


class PublicProfileView(APIView):
    @extend_schema(responses={200: s.PublicProfileSerializer})
    def get(self, request, user_id):
        if user_id == request.user.id:
            user = _me(user_id)
        else:
            if user_id in blocked_ids(request.user):
                raise NotFound("User not found.")  # blocked either way: indistinguishable from missing
            user = User.objects.select_related("profile").filter(pk=user_id, is_active=True).first()
            if user is None or user.status == "DELETED":
                raise NotFound("User not found.")
        viewer = request.user
        follow = Follow.objects.filter(follower=viewer, following=user).values_list("status", flat=True).first()
        follower_ok = follow == "ACCEPTED"

        def full_visibility(target):
            if target.id == viewer.id or is_staff_user(viewer):
                return True
            visibility = target.profile.privacy_settings.get("profileVisibility", "public")
            if visibility == "public":
                return True
            if visibility == "communityOnly":
                return follower_ok
            return False

        def follow_status(target):
            return "SELF" if target.id == viewer.id else (follow or "NONE")

        stats = ProfileService.stats_for([user.id]) if full_visibility(user) else None
        serializer = s.PublicProfileSerializer(
            user,
            context={"request": request, "full_visibility": full_visibility, "follow_status": follow_status, "stats": stats},
        )
        return Response(serializer.data)


class UserSearchView(generics.ListAPIView):
    """GET /users/?search=ann - find people by name/username (blocks excluded)."""

    serializer_class = s.UserSearchSerializer
    pagination_class = OffsetPage

    @extend_schema(parameters=[{"name": "search", "in": "query", "schema": {"type": "string"}}])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        term = self.request.query_params.get("search", "").strip()
        queryset = (
            User.objects.filter(is_active=True, status__in=["ACTIVE", "RESTRICTED"])
            .select_related("profile")
            .exclude(pk__in=blocked_ids(self.request.user))
            .exclude(pk=self.request.user.id)
            .order_by("profile__username")
        )
        if term:
            queryset = queryset.filter(
                Q(profile__username__icontains=term) | Q(profile__display_name__icontains=term)
            )
        return queryset

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "request": self.request}
