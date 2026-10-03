from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.accounts.models import User as UserModel
from apps.posts.models import Post

from .models import TARGET_TYPES, AuditLog, ModerationAction, Report

User = get_user_model()


class ReportCreateSerializer(serializers.Serializer):
    target_type = serializers.ChoiceField(choices=TARGET_TYPES)
    target_id = serializers.IntegerField(min_value=1)
    reason = serializers.ChoiceField(choices=Report.Reason.choices)
    description = serializers.CharField(max_length=1000, required=False, allow_blank=True)

    def validate_target_type(self, value):
        return value.upper()


class ReportSerializer(serializers.ModelSerializer):
    reporter_id = serializers.IntegerField(read_only=True)
    reporter_name = serializers.SerializerMethodField()
    target_owner_id = serializers.IntegerField(read_only=True)
    assigned_to_id = serializers.IntegerField(read_only=True)
    target_label = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            "id", "reporter_id", "reporter_name", "target_type", "target_id", "target_label", "target_owner_id",
            "reason", "description", "status", "priority", "assigned_to_id", "created_at", "updated_at",
        ]

    def get_target_label(self, obj) -> str | None:
        return (self.context.get("labels") or {}).get(obj.pk)

    def get_reporter_name(self, obj) -> str:
        return obj.reporter.profile.display_name or obj.reporter.profile.username


class MyReportSerializer(serializers.ModelSerializer):
    """What a reporter may see about their own report (no internal assignment)."""

    class Meta:
        model = Report
        fields = ["id", "target_type", "target_id", "reason", "status", "created_at"]


class ModerationActionSerializer(serializers.ModelSerializer):
    moderator_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = ModerationAction
        fields = ["id", "report_id", "moderator_id", "action", "target_type", "target_id", "notes", "created_at"]


class ActionInputSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=ModerationAction.Action.choices)
    notes = serializers.CharField(max_length=1000, required=False, allow_blank=True, default="")


class ReportUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["OPEN", "IN_REVIEW"], required=False)
    priority = serializers.ChoiceField(choices=Report.Priority.choices, required=False)
    assign_to_me = serializers.BooleanField(required=False)


class AuditLogSerializer(serializers.ModelSerializer):
    actor_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = AuditLog
        fields = ["id", "actor_id", "actor_label", "action", "target_type", "target_id", "metadata", "ip", "created_at"]


class AdminUserSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="id", read_only=True)
    username = serializers.CharField(source="profile.username", read_only=True)
    display_name = serializers.CharField(source="profile.display_name", read_only=True)

    class Meta:
        model = UserModel
        fields = [
            "user_id", "email", "username", "display_name", "role", "status", "email_verified", "last_login", "created_at",
        ]
        read_only_fields = ["email", "email_verified", "last_login", "created_at"]


class AdminPostSerializer(serializers.ModelSerializer):
    author_id = serializers.IntegerField(read_only=True)
    author_username = serializers.CharField(source="author.profile.username", read_only=True)

    class Meta:
        model = Post
        fields = [
            "id", "author_id", "author_username", "caption", "visibility", "group_id", "status", "likes_count",
            "comments_count", "created_at", "updated_at",
        ]
        read_only_fields = [f for f in fields if f != "status"]
