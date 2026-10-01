from django.core import signing
from django.db.models import Case, Count, F, IntegerField, OuterRef, Q, Subquery, When
from django.db.models.functions import Coalesce
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.throttling import WriteThrottleMixin
from apps.common.uploads import absolute_url
from apps.follows.selectors import blocked_ids

from . import serializers as s
from .models import Conversation, ConversationMember, Message
from .services import ChatService, membership_or_404

WS_SALT = "outly.ws-ticket"


def _conversation_rows(request, memberships):
    """Builds list items for the given memberships with one extra query for people."""
    conversation_ids = [m.conversation_id for m in memberships]
    people = {}
    for row in ConversationMember.objects.filter(conversation_id__in=conversation_ids).select_related("user__profile"):
        people.setdefault(row.conversation_id, []).append(row.user)
    rows = []
    for member in memberships:
        conversation = member.conversation
        users = [u for u in people.get(conversation.pk, []) if u.id != request.user.id]
        shown = users[:1] if conversation.type == "DIRECT" else users[:5]
        rows.append(
            {
                "id": conversation.pk,
                "type": conversation.type,
                "group_id": conversation.group_id,
                "group_name": conversation.group.name if conversation.group_id else None,
                "participants": [
                    {
                        "user_id": u.id,
                        "username": u.profile.username,
                        "display_name": u.profile.display_name,
                        "photo": absolute_url(request, u.profile.photo),
                    }
                    for u in shown
                ],
                "participants_count": len(people.get(conversation.pk, [])),
                "last_message": conversation.last_message_preview,
                "last_message_at": conversation.last_message_at,
                "unread_count": member.unread,
                "created_at": conversation.created_at,
                "updated_at": conversation.updated_at,
            }
        )
    return rows


def _unread_annotation(user):
    base = Message.objects.filter(conversation=OuterRef("conversation_id"), is_deleted=False).exclude(sender=user)
    never_read = base.filter(Q(created_at__gt=OuterRef("last_read_at"))).order_by().values("conversation").annotate(c=Count("id")).values("c")[:1]
    all_unread = base.order_by().values("conversation").annotate(c=Count("id")).values("c")[:1]
    return Case(
        When(last_read_at__isnull=True, then=Coalesce(Subquery(all_unread, output_field=IntegerField()), 0)),
        default=Coalesce(Subquery(never_read, output_field=IntegerField()), 0),
        output_field=IntegerField(),
    )


class ConversationListView(generics.ListAPIView):
    serializer_class = s.ConversationSerializer
    cursor_ordering = ("-conv_updated", "-id")

    def get_queryset(self):
        user = self.request.user
        queryset = (
            ConversationMember.objects.filter(user=user)
            .select_related("conversation__group")
            .annotate(unread=_unread_annotation(user), conv_updated=F("conversation__updated_at"))
            .exclude(conversation__type="DIRECT", conversation__members__user_id__in=blocked_ids(user))
        )
        if self.request.query_params.get("type"):
            queryset = queryset.filter(conversation__type=self.request.query_params["type"].upper())
        return queryset

    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        response = self.get_paginated_response(_conversation_rows(request, page))
        return response


class DirectConversationView(APIView):
    @extend_schema(request=s.DirectConversationInputSerializer, responses={201: s.ConversationSerializer})
    def post(self, request):
        serializer = s.DirectConversationInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        conversation, created = ChatService.direct(request.user, serializer.validated_data["user_id"])
        member = (
            ConversationMember.objects.filter(conversation=conversation, user=request.user)
            .select_related("conversation__group").annotate(unread=_unread_annotation(request.user)).get()
        )
        data = _conversation_rows(request, [member])[0]
        return Response(data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class MessageListCreateView(WriteThrottleMixin, generics.ListCreateAPIView):
    """GET: newest first, cursor paginated (use next_cursor to load older)."""

    serializer_class = s.MessageSerializer
    cursor_ordering = ("-created_at", "-id")
    write_throttle_scope = "message_write"

    def get_queryset(self):
        return ChatService.visible_messages(self.request.user, self.kwargs["conversation_id"])

    @extend_schema(request=s.SendMessageInputSerializer, responses={201: s.MessageSerializer})
    def post(self, request, conversation_id):
        serializer = s.SendMessageInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = ChatService.send(request.user, conversation_id, serializer.validated_data["content"])
        return Response(s.MessageSerializer(message, context={"request": request}).data, status=status.HTTP_201_CREATED)


class MessageDetailView(APIView):
    @extend_schema(request=s.SendMessageInputSerializer, responses={200: s.MessageSerializer})
    def patch(self, request, message_id):
        serializer = s.SendMessageInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = ChatService.edit(request.user, message_id, serializer.validated_data["content"])
        return Response(s.MessageSerializer(message, context={"request": request}).data)

    @extend_schema(responses={204: None})
    def delete(self, request, message_id):
        ChatService.delete(request.user, message_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MarkReadView(APIView):
    @extend_schema(request=None, responses={200: None})
    def post(self, request, conversation_id):
        read_at = ChatService.mark_read(request.user, conversation_id)
        return Response({"conversation": conversation_id, "read_at": read_at})


class WebSocketTicketView(APIView):
    """Short-lived (60 s) single-purpose ticket for opening the chat WebSocket
    without putting the long-lived JWT in a URL."""

    @extend_schema(request=None, responses={200: None})
    def post(self, request):
        ticket = signing.dumps({"uid": request.user.pk}, salt=WS_SALT)
        return Response({"ticket": ticket, "expires_in": 60, "path": "/ws/chat/"})
