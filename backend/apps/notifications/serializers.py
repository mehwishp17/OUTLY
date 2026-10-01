from rest_framework import serializers

from .models import Notification

HREF = {
    "post": "/feed/{id}",
    "event": "/events/{id}",
    "group": "/groups/{id}",
    "user": "/people/{id}",
    "conversation": "/chat/{id}",
    "partner_request": "/partner/{id}",
    "activity": "/activities/{id}",
    "place": "/explore/places/{id}",
    "trail": "/explore/trails/{id}",
    "badge": "/badges",
}


def href_for(target_type, target_id):
    template = HREF.get(target_type)
    return template.format(id=target_id) if template and target_id else "/notifications"


class NotificationSerializer(serializers.ModelSerializer):
    actor_id = serializers.IntegerField(read_only=True)
    actor_name = serializers.SerializerMethodField()
    href = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id", "actor_id", "actor_name", "notification_type", "title", "body",
            "target_type", "target_id", "href", "is_read", "created_at",
        ]

    def get_actor_name(self, obj) -> str:
        if obj.actor_id is None:
            return "OUTLY"
        profile = obj.actor.profile
        return profile.display_name or profile.username

    def get_href(self, obj) -> str:
        return href_for(obj.target_type, obj.target_id)
