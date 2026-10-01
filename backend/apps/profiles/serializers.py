import re

from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.common.uploads import absolute_url, validate_image

from .models import DEFAULT_PRIVACY, UserProfile
from .services import USERNAME_RE

User = get_user_model()
VISIBILITY = ("public", "communityOnly", "private")


def _photo(profile, request, field="photo"):
    return absolute_url(request, getattr(profile, field))


class MyProfileSerializer(serializers.Serializer):
    """Read shape of GET /users/me/ (instance: User with `profile`)."""

    user_id = serializers.IntegerField(source="id")
    email = serializers.EmailField()
    role = serializers.CharField()
    status = serializers.CharField()
    email_verified = serializers.BooleanField()
    username = serializers.CharField(source="profile.username")
    display_name = serializers.CharField(source="profile.display_name")
    photo = serializers.SerializerMethodField()
    cover_photo = serializers.SerializerMethodField()
    bio = serializers.CharField(source="profile.bio")
    interests = serializers.ListField(source="profile.interests", child=serializers.CharField())
    location = serializers.CharField(source="profile.location")
    skill_level = serializers.CharField(source="profile.skill_level")
    privacy_settings = serializers.DictField(source="profile.privacy_settings")
    onboarding_completed = serializers.BooleanField(source="profile.onboarding_completed")
    stats = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def get_photo(self, user) -> str | None:
        return _photo(user.profile, self.context.get("request"))

    def get_cover_photo(self, user) -> str | None:
        return _photo(user.profile, self.context.get("request"), "cover_photo")

    def get_stats(self, user) -> dict:
        stats = self.context.get("stats")
        return (stats or {}).get(user.id, {})


class ProfileUpdateSerializer(serializers.Serializer):
    display_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    username = serializers.CharField(max_length=50, required=False)
    bio = serializers.CharField(max_length=500, required=False, allow_blank=True)
    interests = serializers.ListField(
        child=serializers.CharField(max_length=40), required=False, max_length=20
    )
    location = serializers.CharField(max_length=120, required=False, allow_blank=True)
    skill_level = serializers.ChoiceField(choices=UserProfile.SkillLevel.choices, required=False)
    privacy_settings = serializers.DictField(required=False)
    onboarding_completed = serializers.BooleanField(required=False)

    def validate_username(self, value):
        value = value.strip().lower()
        if not USERNAME_RE.match(value):
            raise serializers.ValidationError(
                "Username must be 3-30 characters: lowercase letters, numbers, dots and underscores."
            )
        clash = UserProfile.objects.filter(username__iexact=value).exclude(user=self.context["request"].user)
        if clash.exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_display_name(self, value):
        return value.strip()

    def validate_interests(self, value):
        return list(dict.fromkeys(i.strip() for i in value if i.strip()))

    def validate_privacy_settings(self, value):
        unknown = set(value) - set(DEFAULT_PRIVACY)
        if unknown:
            raise serializers.ValidationError(f"Unknown settings: {', '.join(sorted(unknown))}.")
        if "profileVisibility" in value and value["profileVisibility"] not in VISIBILITY:
            raise serializers.ValidationError("profileVisibility must be public, communityOnly or private.")
        for key in ("showActivityHistory", "showSavedPlaces", "requireFollowApproval"):
            if key in value and not isinstance(value[key], bool):
                raise serializers.ValidationError(f"{key} must be true or false.")
        return value


class PhotoUploadSerializer(serializers.Serializer):
    photo = serializers.ImageField(required=False)
    cover_photo = serializers.ImageField(required=False)

    def validate_photo(self, value):
        return validate_image(value)

    def validate_cover_photo(self, value):
        return validate_image(value)


class PublicProfileSerializer(serializers.Serializer):
    """Privacy-aware view of another user. Hidden fields are omitted, not nulled."""

    def to_representation(self, user):
        request = self.context["request"]
        profile = user.profile
        full = self.context["full_visibility"](user)
        data = {
            "user_id": user.id,
            "username": profile.username,
            "display_name": profile.display_name,
            "photo": _photo(profile, request),
            "follow_status": self.context["follow_status"](user),
            "is_restricted": not full,
        }
        if full:
            stats = (self.context.get("stats") or {}).get(user.id, {})
            data.update(
                bio=profile.bio,
                interests=profile.interests,
                location=profile.location,
                skill_level=profile.skill_level,
                cover_photo=_photo(profile, request, "cover_photo"),
                stats=stats,
                joined_at=user.created_at,
            )
        return data


class UserSearchSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(source="id")
    username = serializers.CharField(source="profile.username")
    display_name = serializers.CharField(source="profile.display_name")
    photo = serializers.SerializerMethodField()
    location = serializers.CharField(source="profile.location")
    skill_level = serializers.CharField(source="profile.skill_level")

    def get_photo(self, user) -> str | None:
        return _photo(user.profile, self.context.get("request"))
