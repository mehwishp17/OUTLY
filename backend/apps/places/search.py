from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.activities.services import visible_activities
from apps.events.services import visible_events
from apps.follows.selectors import blocked_ids
from apps.groups.services import groups_for
from apps.posts.selectors import visible_posts

from .models import Place, Trail

User = get_user_model()
ALL_TYPES = ("users", "places", "trails", "activities", "events", "groups", "posts")


class SearchView(APIView):
    """GET /search/?q=cedar&type=places,trails&limit=5 - one box, every module.

    Each type applies the same visibility rules as its own list endpoint
    (blocked users, private groups, follower-only content...)."""

    @extend_schema(
        parameters=[OpenApiParameter("q", str, required=True), OpenApiParameter("type", str), OpenApiParameter("limit", int)],
        responses={200: None},
    )
    def get(self, request):
        term = request.query_params.get("q", "").strip()
        if len(term) < 2:
            raise ValidationError({"q": ["Type at least 2 characters to search."]})
        wanted = [t for t in request.query_params.get("type", ",".join(ALL_TYPES)).split(",") if t in ALL_TYPES]
        raw_limit = request.query_params.get("limit", "5")
        limit = min(int(raw_limit), 20) if raw_limit.isdigit() and int(raw_limit) > 0 else 5
        me = request.user
        out = {}

        if "users" in wanted:
            rows = (
                User.objects.filter(is_active=True, status__in=["ACTIVE", "RESTRICTED"])
                .exclude(pk__in=blocked_ids(me)).exclude(pk=me.pk)
                .filter(Q(profile__username__icontains=term) | Q(profile__display_name__icontains=term))
                .values("id", "profile__username", "profile__display_name")[:limit]
            )
            out["users"] = [{"id": r["id"], "title": r["profile__display_name"] or r["profile__username"],
                             "subtitle": f"@{r['profile__username']}"} for r in rows]
        if "places" in wanted:
            rows = Place.objects.filter(is_active=True).filter(
                Q(name__icontains=term) | Q(location__icontains=term) | Q(description__icontains=term)
            ).values("id", "name", "location", "category", "rating")[:limit]
            out["places"] = [{"id": r["id"], "title": r["name"], "subtitle": r["location"], "category": r["category"], "rating": float(r["rating"])} for r in rows]
        if "trails" in wanted:
            rows = Trail.objects.filter(is_active=True).filter(
                Q(name__icontains=term) | Q(location__icontains=term) | Q(description__icontains=term)
            ).values("id", "name", "location", "difficulty", "rating")[:limit]
            out["trails"] = [{"id": r["id"], "title": r["name"], "subtitle": r["location"], "difficulty": r["difficulty"], "rating": float(r["rating"])} for r in rows]
        if "activities" in wanted:
            rows = visible_activities(me).filter(Q(title__icontains=term) | Q(location__icontains=term)).values(
                "id", "title", "location", "activity_type"
            )[:limit]
            out["activities"] = [{"id": r["id"], "title": r["title"], "subtitle": r["location"], "activity_type": r["activity_type"]} for r in rows]
        if "events" in wanted:
            rows = visible_events(me).filter(status="ACTIVE", start_at__gte=timezone.now()).filter(
                Q(title__icontains=term) | Q(location__icontains=term)
            ).order_by("start_at").values("id", "title", "location", "start_at")[:limit]
            out["events"] = [{"id": r["id"], "title": r["title"], "subtitle": r["location"], "start_at": r["start_at"]} for r in rows]
        if "groups" in wanted:
            rows = groups_for(me).filter(Q(name__icontains=term) | Q(description__icontains=term)).values(
                "id", "name", "category", "visibility"
            )[:limit]
            out["groups"] = [{"id": r["id"], "title": r["name"], "subtitle": r["category"], "visibility": r["visibility"]} for r in rows]
        if "posts" in wanted:
            rows = visible_posts(me).filter(caption__icontains=term).order_by("-created_at").values(
                "id", "caption", "author__profile__username"
            )[:limit]
            out["posts"] = [{"id": r["id"], "title": r["caption"][:120], "subtitle": f"@{r['author__profile__username']}"} for r in rows]
        return Response(out)
