from datetime import timedelta

from rest_framework import serializers

from apps.common.models import Difficulty

from .models import CATEGORIES, Place, Trail, TrailPoint


def duration_label(value):
    if not value:
        return ""
    minutes = int(value.total_seconds() // 60)
    hours, mins = divmod(minutes, 60)
    return f"{hours} h {mins} min" if hours and mins else (f"{hours} h" if hours else f"{mins} min")


class _ImageList(serializers.ListField):
    child = serializers.URLField(max_length=500)


class _Base(serializers.ModelSerializer):
    distance = serializers.DecimalField(source="distance_km", max_digits=7, decimal_places=2, required=False, allow_null=True)
    estimated_duration_minutes = serializers.IntegerField(min_value=1, max_value=60 * 24 * 14, required=False, write_only=True)
    duration_label = serializers.SerializerMethodField()
    images = _ImageList(required=False, max_length=12)
    facilities = serializers.ListField(child=serializers.CharField(max_length=60), required=False, max_length=30)
    distance_from_km = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()

    def get_duration_label(self, obj) -> str:
        return duration_label(obj.estimated_duration)

    def get_distance_from_km(self, obj) -> float | None:
        value = getattr(obj, "distance_from_km", None)
        return round(value, 2) if value is not None else None

    def get_is_saved(self, obj) -> bool:
        return obj.id in self.context.get("saved_ids", ())

    def _apply_minutes(self, validated):
        minutes = validated.pop("estimated_duration_minutes", None)
        if minutes is not None:
            validated["estimated_duration"] = timedelta(minutes=minutes)
        return validated

    def create(self, validated_data):
        return super().create(self._apply_minutes(validated_data))

    def update(self, instance, validated_data):
        return super().update(instance, self._apply_minutes(validated_data))

    def validate_category(self, value):
        if value not in CATEGORIES:
            raise serializers.ValidationError(f"Category must be one of: {', '.join(CATEGORIES)}.")
        return value


class PlaceSerializer(_Base):
    coordinates = serializers.SerializerMethodField()
    latitude = serializers.FloatField(write_only=True, min_value=-90, max_value=90)
    longitude = serializers.FloatField(write_only=True, min_value=-180, max_value=180)
    trails_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Place
        fields = [
            "id", "name", "description", "location", "coordinates", "latitude", "longitude", "category", "difficulty",
            "distance", "estimated_duration_minutes", "estimated_duration", "duration_label", "facilities",
            "safety_notes", "images", "rating", "reviews_count", "is_verified", "distance_from_km", "is_saved",
            "trails_count", "created_at", "updated_at",
        ]
        read_only_fields = ["estimated_duration", "rating", "reviews_count", "is_verified", "created_at", "updated_at"]

    def get_coordinates(self, obj) -> dict:
        return {"latitude": obj.latitude, "longitude": obj.longitude}


class TrailPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrailPoint
        fields = ["id", "latitude", "longitude", "elevation_m", "sequence"]


class TrailSerializer(_Base):
    start = serializers.SerializerMethodField()
    start_latitude = serializers.FloatField(write_only=True, required=False, allow_null=True, min_value=-90, max_value=90)
    start_longitude = serializers.FloatField(write_only=True, required=False, allow_null=True, min_value=-180, max_value=180)
    place_id = serializers.PrimaryKeyRelatedField(
        source="place", queryset=Place.objects.filter(is_active=True), required=False, allow_null=True
    )
    points = TrailPointSerializer(many=True, read_only=True)
    points_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Trail
        fields = [
            "id", "name", "description", "location", "place_id", "start", "start_latitude", "start_longitude",
            "difficulty", "distance", "elevation_gain_m", "estimated_duration_minutes", "estimated_duration",
            "duration_label", "facilities", "safety_notes", "images", "rating", "reviews_count", "is_verified",
            "distance_from_km", "is_saved", "points_count", "points", "created_at", "updated_at",
        ]
        read_only_fields = ["estimated_duration", "rating", "reviews_count", "is_verified", "created_at", "updated_at"]

    def get_start(self, obj) -> dict | None:
        if obj.start_latitude is None or obj.start_longitude is None:
            return None
        return {"latitude": obj.start_latitude, "longitude": obj.start_longitude}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.context.get("compact"):  # list responses skip the heavy geometry
            self.fields.pop("points", None)


class TrailPointInputSerializer(serializers.Serializer):
    points = serializers.ListField(
        child=serializers.DictField(), min_length=1, max_length=5000, write_only=True
    )

    def validate_points(self, value):
        cleaned = []
        for index, raw in enumerate(value):
            raw = {
                key: round(val, 6) if key in ("latitude", "longitude") and isinstance(val, float) else val
                for key, val in raw.items()
            }
            item = TrailPointSerializer(data={**raw, "sequence": raw.get("sequence", index)})
            item.is_valid(raise_exception=True)
            cleaned.append(item.validated_data)
        sequences = [p["sequence"] for p in cleaned]
        if len(set(sequences)) != len(sequences):
            raise serializers.ValidationError("Point sequences must be unique.")
        return cleaned
