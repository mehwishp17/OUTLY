from django.utils import timezone
from rest_framework import serializers

from .models import PartnerRequest, PartnerRequestJoin


class PartnerRequestSerializer(serializers.ModelSerializer):
    owner_id = serializers.IntegerField(read_only=True)
    owner_name = serializers.SerializerMethodField()
    spots_left = serializers.SerializerMethodField()
    my_join_status = serializers.CharField(read_only=True, default=None)

    class Meta:
        model = PartnerRequest
        fields = [
            "id", "owner_id", "owner_name", "activity", "destination", "preferred_datetime", "spots_total",
            "spots_filled", "spots_left", "experience_level", "description", "visibility", "status", "my_join_status",
            "created_at", "updated_at",
        ]
        read_only_fields = ["spots_filled", "status", "created_at", "updated_at"]

    def get_owner_name(self, obj) -> str:
        profile = obj.owner.profile
        return profile.display_name or profile.username

    def get_spots_left(self, obj) -> int:
        return max(obj.spots_total - obj.spots_filled, 0)

    def validate_destination(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Destination is required.")
        return value

    def validate_preferred_datetime(self, value):
        if self.instance is None and value < timezone.now():
            raise serializers.ValidationError("Preferred date and time must be in the future.")
        return value

    def validate_spots_total(self, value):
        if value < 1 or value > 100:
            raise serializers.ValidationError("Spots must be between 1 and 100.")
        if self.instance and value < self.instance.spots_filled:
            raise serializers.ValidationError(f"{self.instance.spots_filled} spots are already filled.")
        return value


class JoinSerializer(serializers.ModelSerializer):
    request = serializers.IntegerField(source="request_id", read_only=True)
    user_id = serializers.IntegerField(read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = PartnerRequestJoin
        fields = ["id", "request", "user_id", "user_name", "status", "message", "created_at", "updated_at"]

    def get_user_name(self, obj) -> str:
        profile = obj.user.profile
        return profile.display_name or profile.username


class JoinInputSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=500, required=False, allow_blank=True)


class DecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=["ACCEPTED", "REJECTED"])
