from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsAdministrator

User = get_user_model()
CACHE_SECONDS = 60


def _per_day(queryset, field, days=30):
    since = timezone.now() - timedelta(days=days)
    rows = (
        queryset.filter(**{f"{field}__gte": since})
        .annotate(day=TruncDate(field)).values("day").annotate(n=Count("id")).order_by("day")
    )
    return [{"date": r["day"].isoformat(), "count": r["n"]} for r in rows]


def compute_overview():
    from apps.activities.models import Activity
    from apps.events.models import Event, EventParticipant
    from apps.groups.models import Group, GroupMember
    from apps.messaging.models import Message
    from apps.moderation.models import ModerationAction, Report
    from apps.partner.models import PartnerRequest
    from apps.posts.models import Comment, Like, Post

    now = timezone.now()
    d7, d30 = now - timedelta(days=7), now - timedelta(days=30)
    users = User.objects.aggregate(
        total=Count("id"), new_7d=Count("id", filter=Q(created_at__gte=d7)), new_30d=Count("id", filter=Q(created_at__gte=d30)),
        active_30d=Count("id", filter=Q(last_login__gte=d30)), suspended=Count("id", filter=Q(status="SUSPENDED")),
    )
    posts = Post.objects.aggregate(
        total=Count("id", filter=Q(status="ACTIVE")), new_7d=Count("id", filter=Q(status="ACTIVE", created_at__gte=d7)),
        hidden=Count("id", filter=Q(status="HIDDEN")),
    )
    events = Event.objects.aggregate(
        total=Count("id"), upcoming=Count("id", filter=Q(status="ACTIVE", start_at__gte=now)),
        pending_approval=Count("id", filter=Q(approval_status="PENDING")), capacity=Sum("capacity"),
    )
    joined = EventParticipant.objects.filter(status="APPROVED").count()
    return {
        "generated_at": now,
        "users": {**users, "by_role": dict(User.objects.values_list("role").annotate(n=Count("id")).order_by()),
                  "signups_per_day": _per_day(User.objects, "created_at")},
        "posts": {**posts, "per_day": _per_day(Post.objects.filter(status="ACTIVE"), "created_at")},
        "engagement_7d": {
            "likes": Like.objects.filter(created_at__gte=d7).count(),
            "comments": Comment.objects.filter(created_at__gte=d7, status="ACTIVE").count(),
            "messages": Message.objects.filter(created_at__gte=d7).count(),
        },
        "activities": {
            "total": Activity.objects.count(), "completed": Activity.objects.filter(status="COMPLETED").count(),
            "by_type": dict(Activity.objects.values_list("activity_type").annotate(n=Count("id")).order_by()),
        },
        "events": {**events, "participants_joined": joined,
                   "fill_rate": round(joined / events["capacity"], 3) if events["capacity"] else 0},
        "groups": {"total": Group.objects.count(), "memberships": GroupMember.objects.count()},
        "partner_requests": {"open": PartnerRequest.objects.filter(status="OPEN").count(),
                             "total": PartnerRequest.objects.count()},
        "moderation": {
            "reports_by_status": dict(Report.objects.values_list("status").annotate(n=Count("id")).order_by()),
            "open_high_priority": Report.objects.filter(status__in=["OPEN", "IN_REVIEW"], priority__in=["HIGH", "URGENT"]).count(),
            "actions_30d": ModerationAction.objects.filter(created_at__gte=d30).count(),
        },
    }


class OverviewView(APIView):
    """Admin dashboard numbers. Aggregates are cached for 60 s, so the dashboard
    never runs these queries on every request."""

    permission_classes = [IsAdministrator]

    @extend_schema(responses={200: None})
    def get(self, request):
        data = cache.get("analytics:overview")
        if data is None:
            data = compute_overview()
            cache.set("analytics:overview", data, CACHE_SECONDS)
        return Response(data)
