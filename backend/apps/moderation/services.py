import logging

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import F
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from apps.common import permissions as roles
from apps.notifications.services import NotificationService

from .models import AuditLog, ModerationAction, Report

audit_log = logging.getLogger("outly.audit")
User = get_user_model()

HIGH_PRIORITY_REASONS = {"VIOLENCE", "UNSAFE", "HARASSMENT", "HATE"}


class AuditService:
    @staticmethod
    def log(actor, action, target_type="", target_id=None, metadata=None, request=None):
        ip = None
        if request is not None:
            ip = (request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip() or request.META.get("REMOTE_ADDR")) or None
        entry = AuditLog.objects.create(
            actor=actor, actor_label=getattr(actor, "email", "system") if actor else "system", action=action,
            target_type=target_type, target_id=target_id, metadata=metadata or {}, ip=ip,
        )
        audit_log.info("audit action=%s actor=%s target=%s:%s", action, entry.actor_label, target_type, target_id)
        return entry


# --- target registry: how to find a reportable object and who owns it ---
def _resolve(target_type, target_id):
    from apps.events.models import Event
    from apps.groups.models import Group
    from apps.messaging.models import Message
    from apps.places.models import Place
    from apps.posts.models import Comment, Post
    from apps.reviews.models import Review

    lookup = {
        "POST": (Post.objects.filter(pk=target_id).exclude(status="DELETED"), "author_id"),
        "COMMENT": (Comment.objects.filter(pk=target_id).exclude(status="DELETED"), "author_id"),
        "USER": (User.objects.filter(pk=target_id), "id"),
        "EVENT": (Event.objects.filter(pk=target_id), "organizer_id"),
        "GROUP": (Group.objects.filter(pk=target_id), "owner_id"),
        "PLACE": (Place.objects.filter(pk=target_id), "created_by_id"),
        "MESSAGE": (Message.objects.filter(pk=target_id, is_deleted=False), "sender_id"),
        "REVIEW": (Review.objects.filter(pk=target_id), "user_id"),
    }
    queryset, owner_attr = lookup[target_type]
    obj = queryset.first()
    return (obj, getattr(obj, owner_attr)) if obj else (None, None)


def target_preview(target_type, obj):
    if obj is None:
        return None
    text = (
        getattr(obj, "caption", None) or getattr(obj, "content", None) or getattr(obj, "title", None)
        or getattr(obj, "name", None) or getattr(obj, "text", None) or getattr(obj, "email", None) or ""
    )
    return {"type": target_type, "id": obj.pk, "text": str(text)[:300], "status": getattr(obj, "status", None)}


def target_labels(reports):
    """{report_id: short text about what was reported}, one query per target type."""
    from apps.events.models import Event
    from apps.groups.models import Group
    from apps.messaging.models import Message
    from apps.places.models import Place
    from apps.posts.models import Comment, Post
    from apps.reviews.models import Review

    sources = {
        "POST": (Post, "caption"), "COMMENT": (Comment, "content"), "EVENT": (Event, "title"),
        "GROUP": (Group, "name"), "PLACE": (Place, "name"), "MESSAGE": (Message, "content"), "REVIEW": (Review, "text"),
    }
    by_type = {}
    for report in reports:
        by_type.setdefault(report.target_type, []).append(report)
    labels = {}
    for target_type, items in by_type.items():
        ids = {r.target_id for r in items}
        if target_type == "USER":
            rows = User.objects.filter(pk__in=ids).values_list("pk", "profile__display_name", "profile__username")
            names = {pk: display or username for pk, display, username in rows}
        else:
            model, field = sources[target_type]
            names = {pk: str(text) for pk, text in model.objects.filter(pk__in=ids).values_list("pk", field)}
        for report in items:
            text = names.get(report.target_id)
            labels[report.pk] = (text[:80] + "…" if text and len(text) > 80 else text) or "(removed)"
    return labels


class ReportService:
    @staticmethod
    def create(reporter, target_type, target_id, reason, description):
        obj, owner_id = _resolve(target_type, target_id)
        if obj is None:
            raise NotFound("The content you're reporting no longer exists.")
        if owner_id == reporter.id:
            raise ValidationError({"detail": ["You can't report your own content."]})
        try:
            with transaction.atomic():
                report = Report.objects.create(
                    reporter=reporter, target_type=target_type, target_id=target_id, target_owner_id=owner_id,
                    reason=reason, description=description,
                    priority="HIGH" if reason in HIGH_PRIORITY_REASONS else "NORMAL",
                )
        except IntegrityError:
            raise ValidationError({"detail": ["You've already reported this. Our team is reviewing it."]}) from None
        # Escalate when several different people report the same thing.
        active = Report.objects.filter(target_type=target_type, target_id=target_id, status__in=["OPEN", "IN_REVIEW"]).count()
        if active >= 3 and report.priority != "URGENT":
            Report.objects.filter(target_type=target_type, target_id=target_id, status__in=["OPEN", "IN_REVIEW"]).update(
                priority="URGENT"
            )
        return report

    @staticmethod
    @transaction.atomic
    def act(moderator, report_id, action, notes, request=None):
        report = Report.objects.select_for_update(of=("self",)).filter(pk=report_id).first()
        if report is None:
            raise NotFound("Report not found.")
        if report.status in ("RESOLVED", "DISMISSED"):
            raise ValidationError({"detail": ["This report was already handled."]})
        obj, owner_id = _resolve(report.target_type, report.target_id)
        if obj is None and action != "NO_ACTION":
            raise ValidationError({"detail": ["The reported content no longer exists."]})
        if action != "NO_ACTION":
            ReportService._apply(moderator, report.target_type, obj, owner_id, action)
        ModerationAction.objects.create(
            report=report, moderator=moderator, action=action, target_type=report.target_type,
            target_id=report.target_id, notes=notes,
        )
        outcome = "DISMISSED" if action == "NO_ACTION" else "RESOLVED"
        Report.objects.filter(
            target_type=report.target_type, target_id=report.target_id, status__in=["OPEN", "IN_REVIEW"]
        ).update(status=outcome)
        report.refresh_from_db()
        AuditService.log(
            moderator, f"moderation.{action.lower()}", report.target_type, report.target_id,
            {"report_id": report.pk, "reason": report.reason, "notes": notes[:200]}, request,
        )
        if owner_id and action != "NO_ACTION":
            owner = User.objects.filter(pk=owner_id).select_related("profile").first()
            if owner:
                NotificationService.notify(
                    recipient=owner, actor=None, type="MODERATION",
                    title=_owner_message(action, report.target_type), body=notes[:200],
                    target_type=report.target_type.lower(), target_id=report.target_id,
                )
        NotificationService.notify(
            recipient=report.reporter, actor=None, type="MODERATION",
            title="Thanks for your report - we reviewed it." if action != "NO_ACTION" else "We reviewed your report and took no action.",
            target_type=report.target_type.lower(), target_id=report.target_id,
        )
        return report

    @staticmethod
    def _apply(moderator, target_type, obj, owner_id, action):
        from apps.posts.models import Comment, Post

        if action == "WARNING":
            return
        if target_type == "USER":
            if obj.id == moderator.id:
                raise PermissionDenied("You can't take action against yourself.")
            if obj.role in roles.STAFF_ROLES and moderator.role != roles.ADMINISTRATOR:
                raise PermissionDenied("Only an administrator can act against staff accounts.")
            if action not in ("RESTRICT", "SUSPEND"):
                raise ValidationError({"action": ["Accounts can be warned, restricted or suspended."]})
            obj.status = "RESTRICTED" if action == "RESTRICT" else "SUSPENDED"
            obj.save(update_fields=["status", "updated_at"])
            if action == "SUSPEND":
                from apps.accounts.services import AuthService

                AuthService.revoke_all_sessions(obj)
            return
        if action in ("RESTRICT", "SUSPEND"):
            raise ValidationError({"action": ["Restrict/suspend apply to user accounts only."]})
        hide, delete = action == "HIDE", action == "DELETE"
        if target_type == "POST":
            obj.status = "HIDDEN" if hide else "DELETED"
            obj.save(update_fields=["status", "updated_at"])
        elif target_type == "COMMENT":
            obj.status = "HIDDEN" if hide else "DELETED"
            obj.save(update_fields=["status", "updated_at"])
            Post.objects.filter(pk=obj.post_id, comments_count__gt=0).update(comments_count=F("comments_count") - 1)
        elif target_type == "REVIEW":
            if hide:
                obj.status = "HIDDEN"
                obj.save(update_fields=["status", "updated_at"])
            else:
                obj.delete()
            from apps.reviews.services import recompute_rating

            recompute_rating(obj)
        elif target_type == "EVENT":
            if hide:
                obj.approval_status = "REJECTED"
            else:
                obj.status = "CANCELLED"
            obj.save()
        elif target_type == "GROUP":
            if delete:
                obj.delete()
            else:
                raise ValidationError({"action": ["Groups can be warned about or deleted."]})
        elif target_type == "PLACE":
            obj.is_active = False
            obj.save(update_fields=["is_active", "updated_at"])
        elif target_type == "MESSAGE":
            obj.is_deleted = True
            obj.save(update_fields=["is_deleted"])


def _owner_message(action, target_type):
    noun = target_type.lower()
    return {
        "WARNING": f"Moderators sent you a warning about your {noun}.",
        "HIDE": f"Your {noun} was hidden by moderators.",
        "DELETE": f"Your {noun} was removed by moderators.",
        "RESTRICT": "Your account has been restricted by moderators.",
        "SUSPEND": "Your account has been suspended.",
    }[action]
