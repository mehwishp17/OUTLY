from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer
from .services import NotificationService


class NotificationListView(generics.ListAPIView):
    """GET /notifications/?is_read=false&type=LIKE - newest first, cursor paginated."""

    serializer_class = NotificationSerializer

    def get_queryset(self):
        queryset = Notification.objects.filter(recipient=self.request.user).select_related("actor__profile")
        flag = self.request.query_params.get("is_read")
        if flag in ("true", "false"):
            queryset = queryset.filter(is_read=(flag == "true"))
        kind = self.request.query_params.get("type")
        if kind:
            queryset = queryset.filter(notification_type=kind.upper())
        return queryset

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.meta = {**getattr(response, "meta", {}), "unread_count": NotificationService.unread_count(request.user)}
        return response


class UnreadCountView(APIView):
    @extend_schema(responses={200: {"type": "object", "properties": {"unread_count": {"type": "integer"}}}})
    def get(self, request):
        return Response({"unread_count": NotificationService.unread_count(request.user)})


class MarkReadView(APIView):
    @extend_schema(request=None, responses={200: NotificationSerializer})
    def post(self, request, notification_id):
        updated = Notification.objects.filter(pk=notification_id, recipient=request.user).update(is_read=True)
        if not updated:
            raise NotFound("Notification not found.")
        notification = Notification.objects.select_related("actor__profile").get(pk=notification_id)
        return Response(NotificationSerializer(notification).data)


class MarkAllReadView(APIView):
    @extend_schema(request=None, responses={200: {"type": "object", "properties": {"updated": {"type": "integer"}}}})
    def post(self, request):
        updated = Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"updated": updated})


class NotificationDeleteView(APIView):
    @extend_schema(responses={204: None})
    def delete(self, request, notification_id):
        deleted, _ = Notification.objects.filter(pk=notification_id, recipient=request.user).delete()
        if not deleted:
            raise NotFound("Notification not found.")
        return Response(status=status.HTTP_204_NO_CONTENT)
