from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models import Count, Sum
from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.uploads import absolute_url, absolutize
from apps.follows.selectors import blocked_ids

from .models import UserBadge
from .services import AchievementService

User = get_user_model()
PERIODS = {"week": 7, "month": 30, "year": 365}


class BadgeListView(APIView):
    @extend_schema(responses={200: None})
    def get(self, request):
        _, rows = AchievementService.progress(request.user)
        return Response(rows)


class MyAchievementsView(APIView):
    @extend_schema(responses={200: None})
    def get(self, request):
        metrics, rows = AchievementService.progress(request.user)
        earned = [r for r in rows if r["earned"]]
        return Response(
            {
                "points": sum(r["points"] for r in earned),
                "earned_count": len(earned),
                "total_count": len(rows),
                "metrics": metrics,
                "earned": earned,
                "in_progress": sorted((r for r in rows if not r["earned"]), key=lambda r: -r["percent"]),
            }
        )


class UserBadgesView(APIView):
    @extend_schema(responses={200: None})
    def get(self, request, user_id):
        if user_id != request.user.id and user_id in blocked_ids(request.user):
            raise NotFound("User not found.")
        rows = UserBadge.objects.filter(user_id=user_id).select_related("badge").order_by("-awarded_at")
        return Response(
            [{"id": r.badge_id, "code": r.badge.code, "name": r.badge.name, "icon": r.badge.icon, "awarded_at": r.awarded_at} for r in rows]
        )


class LeaderboardView(APIView):
    """GET /leaderboard/?metric=points|distance|activities&period=all|week|month|year&limit=20"""

    @extend_schema(parameters=[OpenApiParameter("metric", str), OpenApiParameter("period", str), OpenApiParameter("limit", int)])
    def get(self, request):
        metric = request.query_params.get("metric", "points")
        period = request.query_params.get("period", "all")
        limit = min(int(request.query_params.get("limit", 20)) if request.query_params.get("limit", "20").isdigit() else 20, 100)
        if metric not in ("points", "distance", "activities"):
            metric = "points"
        key = f"leaderboard:{metric}:{period}"
        board = cache.get(key)
        if board is None:
            board = self._compute(metric, period)
            cache.set(key, board, 60)  # public aggregate, shared by all viewers
        hidden = blocked_ids(request.user)
        rows = [dict(r, photo=absolutize(request, r["photo"])) for r in board if r["user_id"] not in hidden][:limit]
        for rank, row in enumerate(rows, start=1):
            row["rank"] = rank
        mine = next(
            (dict(r, rank=i, photo=absolutize(request, r["photo"])) for i, r in enumerate(board, start=1) if r["user_id"] == request.user.id),
            None,
        )
        response = Response(rows)
        response.meta = {"metric": metric, "period": period, "me": mine}
        return response

    def _compute(self, metric, period):
        from apps.activities.models import ActivityParticipant

        since = timezone.now() - timedelta(days=PERIODS[period]) if period in PERIODS else None
        if metric == "points":
            qs = UserBadge.objects.all()
            if since:
                qs = qs.filter(awarded_at__gte=since)
            grouped = qs.values("user_id").annotate(score=Sum("badge__points"))
        else:
            qs = ActivityParticipant.objects.filter(activity__status="COMPLETED")
            if since:
                qs = qs.filter(activity__completed_at__gte=since)
            agg = Sum("activity__distance") if metric == "distance" else Count("id")
            grouped = qs.values("user_id").annotate(score=agg)
        rows = list(grouped.filter(score__gt=0).order_by("-score", "user_id")[:150])
        users = {
            u.pk: u
            for u in User.objects.filter(pk__in=[r["user_id"] for r in rows], is_active=True)
            .select_related("profile")
            .exclude(profile__privacy_settings__profileVisibility="private")
        }
        return [
            {
                "user_id": r["user_id"],
                "username": users[r["user_id"]].profile.username,
                "display_name": users[r["user_id"]].profile.display_name,
                "photo": users[r["user_id"]].profile.photo.url if users[r["user_id"]].profile.photo else None,
                "score": float(r["score"]) if metric == "distance" else int(r["score"]),
            }
            for r in rows
            if r["user_id"] in users
        ]
