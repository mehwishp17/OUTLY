"""Cheap, reusable relationship lookups used by every module that must respect
blocks and followers (feed, comments, chat, events, profiles...)."""
from django.db.models import Q

from .models import Block, Follow


def blocked_ids(user):
    """Ids of users that `user` blocked OR that blocked `user` (either
    direction hides content). Cached on the user object for the request."""
    cached = getattr(user, "_blocked_ids", None)
    if cached is not None:
        return cached
    rows = Block.objects.filter(Q(blocker_id=user.id) | Q(blocked_id=user.id)).values_list("blocker_id", "blocked_id")
    ids = set()
    for blocker, blocked in rows:
        ids.add(blocked if blocker == user.id else blocker)
    user._blocked_ids = ids
    return ids


def is_blocked_between(user_a_id, user_b_id):
    return Block.objects.filter(
        Q(blocker_id=user_a_id, blocked_id=user_b_id) | Q(blocker_id=user_b_id, blocked_id=user_a_id)
    ).exists()


def following_ids(user):
    cached = getattr(user, "_following_ids", None)
    if cached is None:
        cached = set(
            Follow.objects.filter(follower_id=user.id, status=Follow.Status.ACCEPTED).values_list("following_id", flat=True)
        )
        user._following_ids = cached
    return cached


def is_follower_of(viewer_id, target_id):
    return Follow.objects.filter(follower_id=viewer_id, following_id=target_id, status="ACCEPTED").exists()
