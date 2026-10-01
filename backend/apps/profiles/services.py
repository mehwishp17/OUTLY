import re
import secrets

from django.utils.text import slugify

from .models import UserProfile, default_privacy

USERNAME_RE = re.compile(r"^[a-z0-9_.]{3,30}$")


class ProfileService:
    @staticmethod
    def _unique_username(seed):
        base = re.sub(r"[^a-z0-9_.]", "", slugify(seed).replace("-", "_").lower())[:24] or "outlyer"
        if len(base) < 3:
            base = f"{base}_out"
        candidate = base
        while UserProfile.objects.filter(username__iexact=candidate).exists():
            candidate = f"{base}{secrets.randbelow(9000) + 1000}"
        return candidate

    @staticmethod
    def create_for_user(user, *, full_name):
        return UserProfile.objects.create(
            user=user,
            username=ProfileService._unique_username(full_name or user.email.split("@")[0]),
            display_name=full_name[:100],
            privacy_settings=default_privacy(),
        )

    @staticmethod
    def stats_for(user_ids):
        """{user_id: {...counts}} for many users using one query per metric."""
        from django.db.models import Count

        from apps.achievements.models import UserBadge
        from apps.activities.models import Activity
        from apps.follows.models import Follow
        from apps.posts.models import Post

        ids = list(user_ids)
        stats = {i: {"posts": 0, "followers": 0, "following": 0, "activities_completed": 0, "badges": 0} for i in ids}
        for row in Post.objects.filter(author_id__in=ids, status="ACTIVE").values("author_id").annotate(c=Count("id")):
            stats[row["author_id"]]["posts"] = row["c"]
        accepted = Follow.objects.filter(status="ACCEPTED")
        for row in accepted.filter(following_id__in=ids).values("following_id").annotate(c=Count("id")):
            stats[row["following_id"]]["followers"] = row["c"]
        for row in accepted.filter(follower_id__in=ids).values("follower_id").annotate(c=Count("id")):
            stats[row["follower_id"]]["following"] = row["c"]
        for row in (
            Activity.objects.filter(created_by_id__in=ids, status="COMPLETED").values("created_by_id").annotate(c=Count("id"))
        ):
            stats[row["created_by_id"]]["activities_completed"] = row["c"]
        for row in UserBadge.objects.filter(user_id__in=ids).values("user_id").annotate(c=Count("id")):
            stats[row["user_id"]]["badges"] = row["c"]
        return stats
