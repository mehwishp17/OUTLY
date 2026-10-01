from django.db.models import Q
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import is_staff_user
from apps.follows.selectors import blocked_ids
from apps.posts.models import Post
from apps.posts.selectors import annotate_for_viewer
from apps.posts.serializers import PostWriteSerializer
from apps.posts.services import PostService

from . import serializers as s
from .models import GroupJoinRequest, GroupMember
from .services import GroupService, get_group, groups_for


def _group_data(request, group_id):
    return s.GroupSerializer(get_group(request.user, group_id), context={"request": request}).data


class GroupListCreateView(generics.ListCreateAPIView):
    serializer_class = s.GroupSerializer
    cursor_ordering = ("-created_at", "-id")

    @extend_schema(
        parameters=[
            OpenApiParameter("search", str), OpenApiParameter("category", str),
            OpenApiParameter("mine", bool, description="only groups I belong to"),
            OpenApiParameter("visibility", str),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        params = self.request.query_params
        queryset = groups_for(self.request.user)
        if params.get("mine") in ("true", "1"):
            queryset = queryset.filter(my_role__isnull=False)
        if params.get("category"):
            queryset = queryset.filter(category__iexact=params["category"])
        if params.get("visibility"):
            queryset = queryset.filter(visibility=params["visibility"].upper())
        if params.get("search"):
            term = params["search"].strip()
            queryset = queryset.filter(Q(name__icontains=term) | Q(description__icontains=term))
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        group = GroupService.create(request.user, serializer)
        return Response(_group_data(request, group.pk), status=status.HTTP_201_CREATED)


class GroupDetailView(APIView):
    @extend_schema(responses={200: s.GroupSerializer})
    def get(self, request, group_id):
        return Response(_group_data(request, group_id))

    @extend_schema(request=s.GroupSerializer, responses={200: s.GroupSerializer})
    def patch(self, request, group_id):
        group = get_group(request.user, group_id)
        if group.my_role != "OWNER" and not is_staff_user(request.user):
            raise PermissionDenied("Only the group owner can edit the group.")
        serializer = s.GroupSerializer(group, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(_group_data(request, group_id))

    @extend_schema(responses={204: None})
    def delete(self, request, group_id):
        group = get_group(request.user, group_id)
        if group.my_role != "OWNER" and not is_staff_user(request.user):
            raise PermissionDenied("Only the group owner can delete the group.")
        group.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


def _join(request, group_id):
    serializer = s.JoinInputSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    outcome, join_request = GroupService.join(request.user, group_id, serializer.validated_data.get("message", ""))
    response = Response(
        {"status": outcome, "request": s.JoinRequestSerializer(join_request).data if join_request else None},
        status=status.HTTP_201_CREATED if outcome == "JOINED" else status.HTTP_202_ACCEPTED,
    )
    response.message = "You joined the group." if outcome == "JOINED" else "Your request was sent to the group's moderators."
    return response


class GroupJoinView(APIView):
    @extend_schema(request=s.JoinInputSerializer, responses={200: None})
    def post(self, request, group_id):
        return _join(request, group_id)

    @extend_schema(responses={204: None})
    def delete(self, request, group_id):
        GroupService.leave(request.user, group_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class GroupMembersView(generics.ListAPIView):
    serializer_class = s.GroupMemberSerializer
    cursor_ordering = ("joined_at", "id")

    def get_queryset(self):
        group = get_group(self.request.user, self.kwargs["group_id"])
        GroupService.require_member_or_public(self.request.user, group)
        return (
            GroupMember.objects.filter(group=group)
            .exclude(user_id__in=blocked_ids(self.request.user))
            .select_related("user__profile")
        )


class GroupMemberDetailView(APIView):
    @extend_schema(request=s.RoleSerializer, responses={200: s.GroupMemberSerializer})
    def patch(self, request, group_id, user_id):
        serializer = s.RoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member = GroupService.set_role(request.user, group_id, user_id, serializer.validated_data["role"])
        return Response(s.GroupMemberSerializer(member, context={"request": request}).data)

    @extend_schema(responses={204: None}, description="Removes a member (moderators may remove members; the owner may remove anyone).")
    def delete(self, request, group_id, user_id):
        GroupService.remove_member(request.user, group_id, user_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class GroupMemberRoleView(APIView):
    @extend_schema(request=s.RoleSerializer, responses={200: s.GroupMemberSerializer})
    def patch(self, request, group_id, user_id):
        serializer = s.RoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member = GroupService.set_role(request.user, group_id, user_id, serializer.validated_data["role"])
        return Response(s.GroupMemberSerializer(member, context={"request": request}).data)

    @extend_schema(responses={204: None}, description="Demotes a moderator back to member.")
    def delete(self, request, group_id, user_id):
        GroupService.set_role(request.user, group_id, user_id, "MEMBER")
        return Response(status=status.HTTP_204_NO_CONTENT)


class GroupJoinRequestsView(generics.ListCreateAPIView):
    serializer_class = s.JoinRequestSerializer
    cursor_ordering = ("-created_at", "-id")

    def get_queryset(self):
        group = get_group(self.request.user, self.kwargs["group_id"])
        if not GroupService.can_moderate(self.request.user, group):
            raise PermissionDenied("Only group moderators can see join requests.")
        return GroupJoinRequest.objects.filter(group=group, status="PENDING").select_related("user__profile")

    @extend_schema(request=s.JoinInputSerializer, responses={202: s.JoinRequestSerializer})
    def post(self, request, group_id):
        return _join(request, group_id)


class GroupJoinRequestReviewView(APIView):
    @extend_schema(responses={200: s.JoinRequestSerializer})
    def get(self, request, group_id, request_id):
        group = get_group(request.user, group_id)
        if not GroupService.can_moderate(request.user, group):
            raise PermissionDenied("Only group moderators can see join requests.")
        join_request = generics.get_object_or_404(
            GroupJoinRequest.objects.select_related("user__profile"), pk=request_id, group=group
        )
        return Response(s.JoinRequestSerializer(join_request).data)

    @extend_schema(request=s.ReviewSerializer, responses={200: s.JoinRequestSerializer})
    def post(self, request, group_id, request_id):
        serializer = s.ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        join_request = GroupService.review_request(
            request.user, group_id, request_id, serializer.validated_data["decision"]
        )
        return Response(s.JoinRequestSerializer(join_request).data)


class GroupFeedView(generics.ListCreateAPIView):
    serializer_class = s.GroupPostSerializer

    def get_queryset(self):
        group = get_group(self.request.user, self.kwargs["group_id"])
        GroupService.require_member_or_public(self.request.user, group)
        queryset = Post.objects.filter(group=group, status="ACTIVE").exclude(author_id__in=blocked_ids(self.request.user))
        return annotate_for_viewer(queryset, self.request.user)

    @extend_schema(request=PostWriteSerializer, responses={201: s.GroupPostSerializer})
    def post(self, request, group_id):
        serializer = PostWriteSerializer(data={**request.data, "group_id": group_id}, context={"creating": True})
        serializer.is_valid(raise_exception=True)
        post = PostService.create(request.user, serializer.validated_data)
        item = annotate_for_viewer(Post.objects.filter(pk=post.pk), request.user).first()
        return Response(s.GroupPostSerializer(item, context={"request": request}).data, status=status.HTTP_201_CREATED)


class GroupChatView(APIView):
    @extend_schema(responses={200: None})
    def get(self, request, group_id):
        from apps.messaging.services import ChatService

        group = get_group(request.user, group_id)
        if not group.my_role:
            raise PermissionDenied("Join this group to use its chat.")
        conversation = ChatService.ensure_group_conversation(group)
        return Response({"conversation_id": conversation.pk, "group_id": group.pk})
