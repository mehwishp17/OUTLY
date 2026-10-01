from rest_framework import serializers

from .models import Block, Follow


class FollowSerializer(serializers.ModelSerializer):
    follower_id = serializers.IntegerField(read_only=True)
    following_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Follow
        fields = ["id", "follower_id", "following_id", "status", "created_at"]


class BlockSerializer(serializers.ModelSerializer):
    blocker_id = serializers.IntegerField(read_only=True)
    blocked_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Block
        fields = ["id", "blocker_id", "blocked_id", "created_at"]


class PersonSerializer(serializers.Serializer):
    """Compact user row used in follower/following/request/blocked lists."""

    user_id = serializers.IntegerField()
    username = serializers.CharField()
    display_name = serializers.CharField()
    photo = serializers.CharField(allow_null=True)
    follow_id = serializers.IntegerField(required=False)


class ReviewFollowSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=["ACCEPTED", "REJECTED"])
