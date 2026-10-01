from django.contrib.auth import get_user_model
from django.db.models import Q
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common import permissions as roles
from apps.common.throttling import WriteThrottleMixin
from apps.posts.models import Post

from . import serializers as s
from .models import AuditLog, ModerationAction, Report
from .services import AuditService, ReportService, _resolve, target_preview

User = get_user_model()


# ---------------- user-facing reporting ----------------
class ReportCreateView(WriteThrottleMixin, APIView):
    write_throttle_scope = "report_write"

    @extend_schema(request=s.ReportCreateSerializer, responses={201: s.MyReportSerializer})
    def post(self, request):
        serializer = s.ReportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        report = ReportService.create(
            request.user, data["target_type"], data["target_id"], data["reason"], data.get("description", "")
        )
        response = Response(s.MyReportSerializer(report).data, status=status.HTTP_201_CREATED)
        response.message = "Thanks - our moderators will take a look."
        return response


class MyReportsView(generics.ListAPIView):
    serializer_class = s.MyReportSerializer

    def get_queryset(self):
        return Report.objects.filter(reporter=self.request.user)


# ---------------- moderator queue ----------------
class ReportQueueView(generics.ListAPIView):
    permission_classes = [roles.IsModeratorOrAdmin]
    serializer_class = s.ReportSerializer
    cursor_ordering = ("-created_at", "-id")

    @extend_schema(
        parameters=[OpenApiParameter(n, str) for n in ("status", "priority", "target_type", "reason")]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        params = self.request.query_params
        queryset = Report.objects.select_related("reporter__profile")
        for param in ("status", "priority", "target_type", "reason"):
            if params.get(param):
                queryset = queryset.filter(**{param: params[param].upper()})
        return queryset


class ReportDetailView(APIView):
    permission_classes = [roles.IsModeratorOrAdmin]

    @extend_schema(responses={200: None})
    def get(self, request, report_id):
        report = Report.objects.select_related("reporter__profile").filter(pk=report_id).first()
        if report is None:
            raise NotFound("Report not found.")
        obj, _ = _resolve(report.target_type, report.target_id)
        history = ModerationAction.objects.filter(target_type=report.target_type, target_id=report.target_id)
        owner_reports = Report.objects.filter(target_owner_id=report.target_owner_id).exclude(pk=report.pk).count()
        owner_actions = ModerationAction.objects.filter(
            report__target_owner_id=report.target_owner_id
        ).count() if report.target_owner_id else 0
        return Response(
            {
                "report": s.ReportSerializer(report).data,
                "target": target_preview(report.target_type, obj),
                "other_reports_on_target": Report.objects.filter(
                    target_type=report.target_type, target_id=report.target_id
                ).exclude(pk=report.pk).count(),
                "owner_history": {"other_reports": owner_reports, "prior_actions": owner_actions},
                "actions": s.ModerationActionSerializer(history, many=True).data,
            }
        )

    @extend_schema(request=s.ReportUpdateSerializer, responses={200: s.ReportSerializer})
    def patch(self, request, report_id):
        serializer = s.ReportUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = Report.objects.filter(pk=report_id).exclude(status__in=["RESOLVED", "DISMISSED"]).first()
        if report is None:
            raise NotFound("Open report not found.")
        data = serializer.validated_data
        for field in ("status", "priority"):
            if field in data:
                setattr(report, field, data[field])
        if data.get("assign_to_me"):
            report.assigned_to = request.user
            if report.status == "OPEN":
                report.status = "IN_REVIEW"
        report.save()
        return Response(s.ReportSerializer(report).data)


class ReportActionView(APIView):
    permission_classes = [roles.IsModeratorOrAdmin]

    @extend_schema(request=s.ActionInputSerializer, responses={200: s.ReportSerializer})
    def post(self, request, report_id):
        serializer = s.ActionInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = ReportService.act(
            request.user, report_id, serializer.validated_data["action"], serializer.validated_data["notes"], request
        )
        return Response(s.ReportSerializer(report).data)


# ---------------- administrator tools ----------------
class AdminUserListView(generics.ListAPIView):
    permission_classes = [roles.IsAdministrator]
    serializer_class = s.AdminUserSerializer
    cursor_ordering = ("-created_at", "-id")

    @extend_schema(parameters=[OpenApiParameter("search", str), OpenApiParameter("role", str), OpenApiParameter("status", str)])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        params = self.request.query_params
        queryset = User.objects.select_related("profile")
        if params.get("role"):
            queryset = queryset.filter(role=params["role"].upper())
        if params.get("status"):
            queryset = queryset.filter(status=params["status"].upper())
        if params.get("search"):
            term = params["search"].strip()
            queryset = queryset.filter(
                Q(email__icontains=term) | Q(profile__username__icontains=term) | Q(profile__display_name__icontains=term)
            )
        return queryset


class AdminUserDetailView(APIView):
    permission_classes = [roles.IsAdministrator]

    @extend_schema(request=s.AdminUserSerializer, responses={200: s.AdminUserSerializer})
    def patch(self, request, user_id):
        user = User.objects.select_related("profile").filter(pk=user_id).first()
        if user is None:
            raise NotFound("User not found.")
        serializer = s.AdminUserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if user.id == request.user.id and any(k in serializer.validated_data for k in ("role", "status")):
            raise PermissionDenied("You can't change your own role or status.")
        before = {"role": user.role, "status": user.status}
        serializer.save()
        if user.status == "SUSPENDED":
            from apps.accounts.services import AuthService

            AuthService.revoke_all_sessions(user)
        AuditService.log(request.user, "admin.user.update", "user", user.pk, {"before": before, "after": serializer.validated_data}, request)
        return Response(s.AdminUserSerializer(user).data)


class AdminPostListView(generics.ListAPIView):
    permission_classes = [roles.IsModeratorOrAdmin]
    serializer_class = s.AdminPostSerializer

    @extend_schema(parameters=[OpenApiParameter("search", str), OpenApiParameter("status", str), OpenApiParameter("author", int)])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        params = self.request.query_params
        queryset = Post.objects.select_related("author__profile")
        if params.get("status"):
            queryset = queryset.filter(status=params["status"].upper())
        if params.get("author", "").isdigit():
            queryset = queryset.filter(author_id=int(params["author"]))
        if params.get("search"):
            queryset = queryset.filter(caption__icontains=params["search"].strip())
        return queryset


class AdminPostDetailView(APIView):
    permission_classes = [roles.IsModeratorOrAdmin]

    @extend_schema(request=s.AdminPostSerializer, responses={200: s.AdminPostSerializer})
    def patch(self, request, post_id):
        post = Post.objects.select_related("author__profile").filter(pk=post_id).first()
        if post is None:
            raise NotFound("Post not found.")
        serializer = s.AdminPostSerializer(post, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        before = post.status
        serializer.save()
        AuditService.log(request.user, "admin.post.status", "post", post.pk, {"from": before, "to": post.status}, request)
        return Response(s.AdminPostSerializer(post).data)


class AuditLogListView(generics.ListAPIView):
    permission_classes = [roles.IsAdministrator]
    serializer_class = s.AuditLogSerializer
    cursor_ordering = ("-created_at", "-id")

    @extend_schema(parameters=[OpenApiParameter("action", str), OpenApiParameter("actor", int), OpenApiParameter("target_type", str)])
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        params = self.request.query_params
        queryset = AuditLog.objects.all()
        if params.get("action"):
            queryset = queryset.filter(action__startswith=params["action"])
        if params.get("actor", "").isdigit():
            queryset = queryset.filter(actor_id=int(params["actor"]))
        if params.get("target_type"):
            queryset = queryset.filter(target_type=params["target_type"].lower())
        return queryset


class AdminPlaceVerifyView(APIView):
    """PATCH /admin/places/{id}/ or /admin/trails/{id}/ - verify or deactivate."""

    permission_classes = [roles.IsAdministrator]
    kind = "place"

    @extend_schema(request=None, responses={200: None})
    def patch(self, request, object_id):
        from apps.places.models import Place, Trail

        model = Place if self.kind == "place" else Trail
        obj = model.objects.filter(pk=object_id).first()
        if obj is None:
            raise NotFound(f"{self.kind.title()} not found.")
        changed = {}
        for field in ("is_verified", "is_active"):
            if field in request.data:
                if not isinstance(request.data[field], bool):
                    raise ValidationError({field: ["Must be true or false."]})
                setattr(obj, field, request.data[field])
                changed[field] = request.data[field]
        obj.save()
        AuditService.log(request.user, f"admin.{self.kind}.update", self.kind, obj.pk, changed, request)
        return Response({"id": obj.pk, **changed})


class AdminTrailVerifyView(AdminPlaceVerifyView):
    kind = "trail"
