from django.utils import timezone
from rest_framework import serializers

from apps.common.uploads import absolute_url, validate_image
from apps.places.models import Place, Trail

from .models import Event, EventParticipant


class EventSerializer(serializers.ModelSerializer):
    organizer_id = serializers.IntegerField(read_only=True)
    organizer_name = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()
    # Write-only inputs (JSON or multipart): `cover` uploads/replaces, `remove_cover` clears.
    cover = serializers.ImageField(write_only=True, required=False)
    remove_cover = serializers.BooleanField(write_only=True, required=False, default=False)
    place_id = serializers.PrimaryKeyRelatedField(
        source="place", queryset=Place.objects.filter(is_active=True), required=False, allow_null=True
    )
    trail_id = serializers.PrimaryKeyRelatedField(
        source="trail", queryset=Trail.objects.filter(is_active=True), required=False, allow_null=True
    )
    approved_count = serializers.IntegerField(read_only=True, default=0)
    spots_left = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    my_status = serializers.CharField(read_only=True, default=None)
    is_organizer = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id", "organizer_id", "organizer_name", "title", "description", "category", "place_id", "trail_id",
            "location", "meeting_point", "start_at", "end_at", "capacity", "difficulty", "requires_approval",
            "visibility", "approval_status", "status", "approved_count", "spots_left", "is_full", "my_status",
            "is_organizer", "cover_image", "cover", "remove_cover", "created_at", "updated_at",
        ]
        read_only_fields = ["approval_status", "status", "created_at", "updated_at"]

    def get_organizer_name(self, obj) -> str:
        profile = obj.organizer.profile
        return profile.display_name or profile.username

    def get_cover_image(self, obj) -> str | None:
        return absolute_url(self.context.get("request"), obj.cover_image)

    def validate_cover(self, value):
        return validate_image(value)

    def get_spots_left(self, obj) -> int:
        return max(obj.capacity - (getattr(obj, "approved_count", 0) or 0), 0)

    def get_is_full(self, obj) -> bool:
        return (getattr(obj, "approved_count", 0) or 0) >= obj.capacity

    def get_is_organizer(self, obj) -> bool:
        request = self.context.get("request")
        return bool(request and obj.organizer_id == request.user.id)

    def validate_title(self, value):
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError("Title must be at least 3 characters.")
        return value

    def validate_capacity(self, value):
        if value < 1 or value > 100000:
            raise serializers.ValidationError("Capacity must be between 1 and 100000.")
        return value

    def validate(self, attrs):
        cover = attrs.pop("cover", None)
        if attrs.pop("remove_cover", False):
            attrs["cover_image"] = None
        elif cover is not None:
            attrs["cover_image"] = cover
        start = attrs.get("start_at", getattr(self.instance, "start_at", None))
        end = attrs.get("end_at", getattr(self.instance, "end_at", None))
        if self.instance is None and start and start < timezone.now():
            raise serializers.ValidationError({"start_at": ["Start time must be in the future."]})
        if start and end and end < start:
            raise serializers.ValidationError({"end_at": ["End time must be after the start time."]})
        return attrs


class EventParticipantSerializer(serializers.ModelSerializer):
    event_id = serializers.IntegerField(read_only=True)
    user_id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(source="user.profile.username", read_only=True)
    display_name = serializers.CharField(source="user.profile.display_name", read_only=True)

    class Meta:
        model = EventParticipant
        fields = ["id", "event_id", "user_id", "username", "display_name", "status", "joined_at", "updated_at"]


class InviteSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=False)
    user_ids = serializers.ListField(child=serializers.IntegerField(), required=False, max_length=100)

    def validate(self, attrs):
        ids = list(attrs.get("user_ids", []))
        if attrs.get("user_id"):
            ids.append(attrs["user_id"])
        if not ids:
            raise serializers.ValidationError({"user_id": ["Provide user_id or user_ids."]})
        attrs["ids"] = list(dict.fromkeys(ids))
        return attrs


class ParticipantDecisionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["APPROVED", "REJECTED"])


class ModerateSerializer(serializers.Serializer):
    approval_status = serializers.ChoiceField(choices=["APPROVED", "REJECTED"])
