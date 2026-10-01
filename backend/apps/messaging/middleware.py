from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.core import signing
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()
WS_SALT = "outly.ws-ticket"


@database_sync_to_async
def _user_for_ticket(ticket):
    try:
        payload = signing.loads(ticket, salt=WS_SALT, max_age=60)
    except signing.BadSignature:
        return AnonymousUser()
    return _active_user(payload["uid"])


@database_sync_to_async
def _user_for_jwt(token):
    try:
        uid = AccessToken(token)["user_id"]
    except TokenError:
        return AnonymousUser()
    return _active_user(uid)


def _active_user(user_id):
    user = User.objects.select_related("profile").filter(pk=user_id, is_active=True).first()
    if user is None or user.status in ("SUSPENDED", "DELETED"):
        return AnonymousUser()
    return user


class JWTQueryAuthMiddleware(BaseMiddleware):
    """Authenticates the socket from `?ticket=` (preferred, 60 s, from
    POST /chats/ws-ticket/) or `?token=` (a normal access JWT)."""

    async def __call__(self, scope, receive, send):
        query = parse_qs(scope.get("query_string", b"").decode())
        user = AnonymousUser()
        if query.get("ticket"):
            user = await _user_for_ticket(query["ticket"][0])
        elif query.get("token"):
            user = await _user_for_jwt(query["token"][0])
        scope["user"] = user
        return await super().__call__(scope, receive, send)
