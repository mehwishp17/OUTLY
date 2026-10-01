from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.follows.selectors import blocked_ids

from . import serializers as s
from .models import Review
from .services import ReviewService


class ReviewListCreateView(generics.ListCreateAPIView):
    """GET /reviews/?target_type=place&target_id=3 (also nested under places/trails/events)."""

    serializer_class = s.ReviewSerializer

    def _target(self):
        kwargs = self.kwargs
        for kind in s.TARGETS:
            if f"{kind}_id" in kwargs:
                return kind, kwargs[f"{kind}_id"]
        params = self.request.query_params
        kind, tid = params.get("target_type"), params.get("target_id", "")
        if kind in s.TARGETS and tid.isdigit():
            return kind, int(tid)
        return None, None

    @extend_schema(parameters=[OpenApiParameter("target_type", str), OpenApiParameter("target_id", int), OpenApiParameter("mine", bool)])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        queryset = Review.objects.filter(status="VISIBLE").exclude(user_id__in=blocked_ids(self.request.user)).select_related("user__profile")
        if self.request.query_params.get("mine") in ("true", "1"):
            return queryset.filter(user=self.request.user)
        kind, target_id = self._target()
        if kind is None:
            raise ValidationError({"target_type": ["Provide target_type (place|trail|event) and target_id."]})
        return queryset.filter(**{f"{kind}_id": target_id})

    @extend_schema(request=s.ReviewWriteSerializer, responses={201: s.ReviewSerializer})
    def post(self, request, *args, **kwargs):
        serializer = s.ReviewWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        kind, target_id = self._target()
        data = serializer.validated_data
        kind, target_id = kind or data.get("target_type"), target_id or data.get("target_id")
        if not kind or not target_id:
            raise ValidationError({"target_type": ["Provide target_type and target_id."]})
        review = ReviewService.create(request.user, kind, target_id, data["rating"], data.get("text", ""))
        review = Review.objects.select_related("user__profile").get(pk=review.pk)
        return Response(s.ReviewSerializer(review, context={"request": request}).data, status=status.HTTP_201_CREATED)


class ReviewDetailView(APIView):
    @extend_schema(responses={200: s.ReviewSerializer})
    def get(self, request, review_id):
        review = Review.objects.filter(pk=review_id, status="VISIBLE").exclude(
            user_id__in=blocked_ids(request.user)
        ).select_related("user__profile").first()
        if review is None:
            raise NotFound("Review not found.")
        return Response(s.ReviewSerializer(review, context={"request": request}).data)

    @extend_schema(request=s.ReviewUpdateSerializer, responses={200: s.ReviewSerializer})
    def patch(self, request, review_id):
        serializer = s.ReviewUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = ReviewService.update(request.user, review_id, serializer.validated_data)
        review = Review.objects.select_related("user__profile").get(pk=review.pk)
        return Response(s.ReviewSerializer(review, context={"request": request}).data)

    @extend_schema(responses={204: None})
    def delete(self, request, review_id):
        ReviewService.delete(request.user, review_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
