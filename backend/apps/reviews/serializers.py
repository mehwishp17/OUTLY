from rest_framework import serializers

from apps.common.uploads import absolute_url

from .models import Review

TARGETS = ("place", "trail", "event")


class ReviewSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(read_only=True)
    author_name = serializers.SerializerMethodField()
    author_photo = serializers.SerializerMethodField()
    target_type = serializers.SerializerMethodField()
    target_id = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id", "user_id", "author_name", "author_photo", "target_type", "target_id", "rating", "text", "status",
            "is_mine", "created_at", "updated_at",
        ]

    def get_author_name(self, obj) -> str:
        return obj.user.profile.display_name or obj.user.profile.username

    def get_author_photo(self, obj) -> str | None:
        return absolute_url(self.context.get("request"), obj.user.profile.photo)

    def get_target_type(self, obj) -> str:
        return next(t for t in TARGETS if getattr(obj, f"{t}_id") is not None)

    def get_target_id(self, obj) -> int:
        return getattr(obj, f"{self.get_target_type(obj)}_id")

    def get_is_mine(self, obj) -> bool:
        request = self.context.get("request")
        return bool(request and obj.user_id == request.user.id)


class ReviewWriteSerializer(serializers.Serializer):
    target_type = serializers.ChoiceField(choices=TARGETS, required=False)
    target_id = serializers.IntegerField(required=False)
    rating = serializers.IntegerField(min_value=1, max_value=5)
    text = serializers.CharField(max_length=2000, required=False, allow_blank=True)

    def validate_text(self, value):
        return value.strip()


class ReviewUpdateSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5, required=False)
    text = serializers.CharField(max_length=2000, required=False, allow_blank=True)
