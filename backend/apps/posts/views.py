from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.throttling import WriteThrottleMixin

from . import serializers as s
from .models import PostMedia
from .selectors import annotate_for_viewer, feed_for, get_visible_post, visible_comments, visible_posts
from .services import CommentService, PostService


def _post_response(request, post_id, code=status.HTTP_200_OK):
    post = get_visible_post(request.user, post_id)
    return Response(s.PostSerializer(post, context={"request": request}).data, status=code)


class PostListCreateView(WriteThrottleMixin, generics.ListCreateAPIView):
    """GET = the feed (own + followed + group + public posts you may see, newest first)."""

    serializer_class = s.PostSerializer
    write_throttle_scope = "post_write"

    @extend_schema(
        parameters=[
            OpenApiParameter("scope", str, description="all (default) | following | mine"),
            OpenApiParameter("author", int), OpenApiParameter("group", int),
            OpenApiParameter("place", int), OpenApiParameter("activity", int),
            OpenApiParameter("cursor", str), OpenApiParameter("limit", int),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        return feed_for(self.request.user, self.request.query_params)

    @extend_schema(request=s.PostWriteSerializer, responses={201: s.PostSerializer})
    def post(self, request, *args, **kwargs):
        serializer = s.PostWriteSerializer(data=request.data, context={"creating": True})
        serializer.is_valid(raise_exception=True)
        post = PostService.create(request.user, serializer.validated_data)
        return _post_response(request, post.pk, status.HTTP_201_CREATED)


class FeedAliasView(PostListCreateView):
    """GET /feed/ - same data as GET /posts/ (the documented feed endpoint)."""

    write_throttle_scope = None

    def post(self, request, *args, **kwargs):
        from rest_framework.exceptions import MethodNotAllowed

        raise MethodNotAllowed("POST")


class PostDetailView(APIView):
    @extend_schema(responses={200: s.PostSerializer})
    def get(self, request, post_id):
        return _post_response(request, post_id)

    @extend_schema(request=s.PostWriteSerializer, responses={200: s.PostSerializer})
    def patch(self, request, post_id):
        serializer = s.PostWriteSerializer(data=request.data, partial=True, context={"creating": False})
        serializer.is_valid(raise_exception=True)
        PostService.update(request.user, post_id, serializer.validated_data)
        return _post_response(request, post_id)

    @extend_schema(responses={204: None})
    def delete(self, request, post_id):
        PostService.delete(request.user, post_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SavedPostsView(generics.ListAPIView):
    serializer_class = s.PostSerializer
    cursor_ordering = ("-saved_at", "-id")

    def get_queryset(self):
        from django.db.models import F

        queryset = annotate_for_viewer(visible_posts(self.request.user), self.request.user)
        return queryset.filter(saves__user=self.request.user).annotate(saved_at=F("saves__created_at"))


class _EngagementView(APIView):
    def _counts(self, post_id, key, value):
        return Response({key: value}, status=status.HTTP_200_OK)


class LikeView(_EngagementView):
    @extend_schema(request=None, responses={200: None})
    def post(self, request, post_id):
        count = PostService.like(request.user, post_id)
        return Response({"liked": True, "likes_count": count}, status=status.HTTP_201_CREATED)

    @extend_schema(responses={200: None})
    def delete(self, request, post_id):
        count = PostService.unlike(request.user, post_id)
        return Response({"liked": False, "likes_count": count})


class SaveView(_EngagementView):
    @extend_schema(request=None, responses={200: None})
    def post(self, request, post_id):
        count = PostService.save(request.user, post_id)
        return Response({"saved": True, "saves_count": count}, status=status.HTTP_201_CREATED)

    @extend_schema(responses={200: None})
    def delete(self, request, post_id):
        count = PostService.unsave(request.user, post_id)
        return Response({"saved": False, "saves_count": count})


class ShareView(_EngagementView):
    @extend_schema(request=None, responses={200: None})
    def post(self, request, post_id):
        from django.conf import settings

        post = PostService.share(request.user, post_id)
        return Response({"shares_count": post.shares_count, "url": f"{settings.FRONTEND_URL}/feed/{post.pk}"})


class CommentListCreateView(WriteThrottleMixin, generics.ListCreateAPIView):
    serializer_class = s.CommentSerializer
    cursor_ordering = ("created_at", "id")  # conversation order: oldest first
    write_throttle_scope = "comment_write"

    @extend_schema(parameters=[OpenApiParameter("parent", int), OpenApiParameter("top_level", bool)])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        get_visible_post(self.request.user, self.kwargs["post_id"], annotated=False)  # 404 if hidden/blocked
        queryset = visible_comments(self.request.user, self.kwargs["post_id"])
        if self.request.query_params.get("parent", "").isdigit():
            queryset = queryset.filter(parent_id=int(self.request.query_params["parent"]))
        elif self.request.query_params.get("top_level") in ("true", "1"):
            queryset = queryset.filter(parent__isnull=True)
        return queryset

    @extend_schema(request=s.CommentWriteSerializer, responses={201: s.CommentSerializer})
    def post(self, request, post_id):
        serializer = s.CommentWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = CommentService.create(
            request.user, post_id, serializer.validated_data["content"], serializer.validated_data.get("parent_id")
        )
        comment = visible_comments(request.user, post_id).get(pk=comment.pk)
        return Response(s.CommentSerializer(comment, context={"request": request}).data, status=status.HTTP_201_CREATED)


class CommentDetailView(APIView):
    @extend_schema(request=s.CommentWriteSerializer, responses={200: s.CommentSerializer})
    def patch(self, request, comment_id):
        serializer = s.CommentWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = CommentService.update(request.user, comment_id, serializer.validated_data["content"])
        return Response(s.CommentSerializer(comment, context={"request": request}).data)

    @extend_schema(responses={204: None})
    def delete(self, request, comment_id):
        CommentService.delete(request.user, comment_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MediaUploadView(WriteThrottleMixin, APIView):
    parser_classes = [MultiPartParser, FormParser]
    write_throttle_scope = "upload"

    @extend_schema(request={"multipart/form-data": s.MediaUploadSerializer}, responses={201: s.MediaSerializer})
    def post(self, request):
        from PIL import Image

        serializer = s.MediaUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        upload = serializer.validated_data["file"]
        with Image.open(upload) as image:
            width, height = image.size
        upload.seek(0)
        media = PostMedia.objects.create(uploader=request.user, image=upload, width=width, height=height)
        return Response(s.MediaSerializer(media, context={"request": request}).data, status=status.HTTP_201_CREATED)
