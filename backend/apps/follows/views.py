from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import is_staff_user
from apps.common.uploads import absolute_url

from . import serializers as s
from .models import Block, Follow
from .selectors import blocked_ids
from .services import BlockService, FollowService

User = get_user_model()


def _person(user, request, follow_id=None):
    data = {
        "user_id": user.id,
        "username": user.profile.username,
        "display_name": user.profile.display_name,
        "photo": absolute_url(request, user.profile.photo),
    }
    if follow_id is not None:
        data["follow_id"] = follow_id
    return data


class FollowView(APIView):
    @extend_schema(request=None, responses={201: s.FollowSerializer})
    def post(self, request, user_id):
        follow, created = FollowService.follow(request.user, user_id)
        response = Response(s.FollowSerializer(follow).data, status=201 if created else 200)
        response.message = "Following." if follow.status == "ACCEPTED" else "Follow request sent."
        return response

    @extend_schema(responses={204: None})
    def delete(self, request, user_id):
        FollowService.unfollow(request.user, user_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class BlockView(APIView):
    @extend_schema(request=None, responses={201: s.BlockSerializer})
    def post(self, request, user_id):
        block = BlockService.block(request.user, user_id)
        return Response(s.BlockSerializer(block).data, status=status.HTTP_201_CREATED)

    @extend_schema(responses={204: None})
    def delete(self, request, user_id):
        BlockService.unblock(request.user, user_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class _PeopleList(generics.ListAPIView):
    cursor_ordering = ("-created_at", "-id")

    def _visible_target(self):
        """The user whose list is requested; honours blocks and privacy."""
        user_id = self.kwargs["user_id"]
        viewer = self.request.user
        target = User.objects.select_related("profile").filter(pk=user_id, is_active=True).first()
        if target is None or (user_id != viewer.id and user_id in blocked_ids(viewer)):
            raise NotFound("User not found.")
        visibility = target.profile.privacy_settings.get("profileVisibility", "public")
        if user_id != viewer.id and not is_staff_user(viewer) and visibility != "public":
            is_follower = Follow.objects.filter(follower=viewer, following=target, status="ACCEPTED").exists()
            if visibility == "private" or not is_follower:
                raise NotFound("User not found.")
        return target

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        return self.get_paginated_response(self.rows(page))


class FollowersView(_PeopleList):
    serializer_class = s.PersonSerializer

    def get_queryset(self):
        target = self._visible_target()
        return (
            Follow.objects.filter(following=target, status="ACCEPTED")
            .exclude(follower_id__in=blocked_ids(self.request.user))
            .select_related("follower__profile")
        )

    def rows(self, page):
        return [_person(f.follower, self.request, f.id) for f in page]


class FollowingView(_PeopleList):
    serializer_class = s.PersonSerializer

    def get_queryset(self):
        target = self._visible_target()
        return (
            Follow.objects.filter(follower=target, status="ACCEPTED")
            .exclude(following_id__in=blocked_ids(self.request.user))
            .select_related("following__profile")
        )

    def rows(self, page):
        return [_person(f.following, self.request, f.id) for f in page]


class FollowRequestsView(_PeopleList):
    serializer_class = s.PersonSerializer

    def get_queryset(self):
        return Follow.objects.filter(following=self.request.user, status="PENDING").select_related("follower__profile")

    def rows(self, page):
        return [_person(f.follower, self.request, f.id) for f in page]


class FollowRequestReviewView(APIView):
    @extend_schema(request=s.ReviewFollowSerializer, responses={200: s.FollowSerializer})
    def post(self, request, follow_id):
        serializer = s.ReviewFollowSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        follow = FollowService.review_request(request.user, follow_id, serializer.validated_data["decision"])
        return Response({"id": follow_id, "decision": serializer.validated_data["decision"]})


class BlockedUsersView(_PeopleList):
    serializer_class = s.PersonSerializer

    def get_queryset(self):
        return Block.objects.filter(blocker=self.request.user).select_related("blocked__profile")

    def rows(self, page):
        return [_person(b.blocked, self.request) for b in page]
