from rest_framework import serializers

from apps.places.models import Place, Trail

from .models import Activity, ActivityParticipant


class ActivitySerializer(serializers.ModelSerializer):
    created_by_id = serializers.IntegerField(read_only=True)
    creator_name = serializers.SerializerMethodField()
    place_id = serializers.PrimaryKeyRelatedField(
        source="place", queryset=Place.objects.filter(is_active=True),
        required=False, allow_null=True,
    )
    trail_id = serializers.PrimaryKeyRelatedField(
        source="trail", queryset=Trail.objects.filter(is_active=True),
        required=False, allow_null=True,
    )
    participants_count = serializers.IntegerField(read_only=True, default=0)
    is_joined = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = Activity
        fields = [
            "id", "title", "activity_type", "description", "created_by_id", "creator_name", "place_id", "trail_id",
            "location", "start_at", "end_at", "distance", "duration", "difficulty", "notes", "privacy", "status",
            "completed_at", "participants_count", "is_joined", "created_at", "updated_at",
        ]
        read_only_fields = ["completed_at", "created_at", "updated_at"]

    def get_creator_name(self, obj) -> str:
        profile = obj.created_by.profile
        return profile.display_name or profile.username

    def validate_title(self, value):
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError("Title must be at least 3 characters.")
        return value

    def validate(self, attrs):
        start = attrs.get("start_at", getattr(self.instance, "start_at", None))
        end = attrs.get("end_at", getattr(self.instance, "end_at", None))
        if start and end and end < start:
            raise serializers.ValidationError({"end_at": ["End time must be after the start time."]})
        if (attrs.get("distance") or 0) < 0:
            raise serializers.ValidationError({"distance": ["Distance can't be negative."]})
        return attrs


class ParticipantSerializer(serializers.ModelSerializer):
    activity_id = serializers.IntegerField(read_only=True)
    user_id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(source="user.profile.username", read_only=True)
    display_name = serializers.CharField(source="user.profile.display_name", read_only=True)

    class Meta:
        model = ActivityParticipant
        fields = ["id", "activity_id", "user_id", "username", "display_name", "joined_at"]
