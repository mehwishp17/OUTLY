import time

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.core.cache import cache
from rest_framework.exceptions import APIException

from apps.notifications.services import user_group

from .services import ChatService, message_payload

SEND_LIMIT_PER_MINUTE = 60


def _error_text(exc):
    detail = getattr(exc, "detail", None)
    if isinstance(detail, dict):
        first = next(iter(detail.values()))
        return str(first[0] if isinstance(first, (list, tuple)) else first)
    return str(detail or exc)


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """One socket per browser tab, subscribed to the user's private group.
    Messages, notifications and read events are pushed to that group; every
    client action is authorised by the same service layer as the REST API."""

    async def connect(self):
        user = self.scope.get("user")
        if user is None or not user.is_authenticated:
            await self.close(code=4401)
            return
        self.user = user
        self.group = user_group(user.id)
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()
        await self.send_json({"type": "ready", "user_id": user.id})

    async def disconnect(self, code):
        if hasattr(self, "group"):
            await self.channel_layer.group_discard(self.group, self.channel_name)

    async def push(self, event):
        await self.send_json(event["payload"])

    def _rate_ok(self):
        key = f"ws-send:{self.user.id}:{int(time.time() // 60)}"
        count = cache.get(key, 0) + 1
        cache.set(key, count, 70)
        return count <= SEND_LIMIT_PER_MINUTE

    async def receive_json(self, content, **kwargs):
        action = content.get("action") if isinstance(content, dict) else None
        try:
            if action == "send":
                if not self._rate_ok():
                    await self.send_json({"type": "error", "message": "You're sending messages too fast."})
                    return
                message = await database_sync_to_async(self._send)(content.get("conversation_id"), content.get("content"))
                await self.send_json({"type": "ack", "client_id": content.get("client_id"), "message": message})
            elif action == "read":
                await database_sync_to_async(ChatService.mark_read)(self.user, content.get("conversation_id"))
                await self.send_json({"type": "read", "conversation_id": content.get("conversation_id")})
            elif action == "ping":
                await self.send_json({"type": "pong"})
            else:
                await self.send_json({"type": "error", "message": "Unknown action."})
        except APIException as exc:  # validation / permission failures from the service layer
            await self.send_json({"type": "error", "message": _error_text(exc), "client_id": content.get("client_id")})

    def _send(self, conversation_id, text):
        if not isinstance(conversation_id, int):
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"conversation_id": ["conversation_id must be a number."]})
        message = ChatService.send(self.user, conversation_id, text)
        return message_payload(message, self.user.id)
