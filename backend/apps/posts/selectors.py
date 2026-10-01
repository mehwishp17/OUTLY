"""FeedService read side: who may see which posts. One place, used by the feed,
post detail, comments, likes, saves and search - so visibility can't drift."""
from django.db.models import Exists, OuterRef, Q
from rest_framework.exceptions import NotFound

from apps.follows.models import Follow
from apps.follows.selectors import blocked_ids

from .models import Comment, Like, Post, PostMedia, SavedPost

CLOSED_PROFILE = ["private", "communityOnly"]


def visible_posts(user):
    """Active posts `user` is allowed to see (blocks, follower-only, group-only
    and private-profile rules applied in SQL)."""
    from apps.groups.models import GroupMember

    following = Follow.objects.filter(follower=user, status="ACCEPTED").values("following_id")
    my_groups = GroupMember.objects.filter(user=user).values("group_id")
    public_ok = Q(visibility="PUBLIC", group__isnull=True) & (
        ~Q(author__profile__privacy_settings__profileVisibility__in=CLOSED_PROFILE) | Q(author_id__in=following)
    )
    return (
        Post.objects.filter(status="ACTIVE")
        .exclude(author_id__in=blocked_ids(user))
        .filter(
            Q(author=user)
            | public_ok
            | Q(visibility="FOLLOWERS", author_id__in=following)
            | Q(visibility="GROUP", group_id__in=my_groups)
        )
    )


def annotate_for_viewer(queryset, user):
    return (
        queryset.select_related("author__profile", "group")
        .prefetch_related(_media_prefetch())
        .annotate(
            is_liked=Exists(Like.objects.filter(post=OuterRef("pk"), user=user)),
            is_saved=Exists(SavedPost.objects.filter(post=OuterRef("pk"), user=user)),
        )
    )


def _media_prefetch():
    from django.db.models import Prefetch

    return Prefetch("media", queryset=PostMedia.objects.order_by("id"))


def feed_for(user, params):
    queryset = annotate_for_viewer(visible_posts(user), user)
    scope = params.get("scope", "all")
    if scope == "mine":
        queryset = queryset.filter(author=user)
    elif scope == "following":
        following = Follow.objects.filter(follower=user, status="ACCEPTED").values("following_id")
        from apps.groups.models import GroupMember

        queryset = queryset.filter(
            Q(author=user) | Q(author_id__in=following) | Q(group_id__in=GroupMember.objects.filter(user=user).values("group_id"))
        )
    for param, field in (("author", "author_id"), ("group", "group_id"), ("place", "place_id"), ("activity", "activity_id")):
        if params.get(param, "").isdigit():
            queryset = queryset.filter(**{field: int(params[param])})
    return queryset


def get_visible_post(user, post_id, *, annotated=True):
    queryset = visible_posts(user).filter(pk=post_id)
    if annotated:
        queryset = annotate_for_viewer(queryset, user)
    post = queryset.first()
    if post is None:
        raise NotFound("Post not found.")
    return post


def visible_comments(user, post_id):
    return (
        Comment.objects.filter(post_id=post_id, status="ACTIVE")
        .exclude(author_id__in=blocked_ids(user))
        .select_related("author__profile")
    )
