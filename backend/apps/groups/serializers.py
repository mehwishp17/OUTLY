from rest_framework import serializers

from apps.common.uploads import absolute_url
from apps.posts.serializers import PostSerializer

from .models import Group, GroupJoinRequest, GroupMember


class GroupSerializer(serializers.ModelSerializer):
    owner = serializers.IntegerField(source="owner_id", read_only=True)
    owner_name = serializers.SerializerMethodField()
    members_count = serializers.IntegerField(read_only=True, default=0)
    my_role = serializers.CharField(read_only=True, default=None)
    my_request_status = serializers.CharField(read_only=True, default=None)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = [
            "id", "name", "category", "description", "visibility", "rules", "owner", "owner_name", "members_count",
            "my_role", "my_request_status", "image", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_owner_name(self, obj) -> str:
        profile = obj.owner.profile
        return profile.display_name or profile.username

    def get_image(self, obj) -> str | None:
        return absolute_url(self.context.get("request"), obj.image)

    def validate_name(self, value):
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError("Group name must be at least 3 characters.")
        return value


class GroupMemberSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(source="user.profile.username", read_only=True)
    display_name = serializers.CharField(source="user.profile.display_name", read_only=True)
    photo = serializers.SerializerMethodField()

    class Meta:
        model = GroupMember
        fields = ["user_id", "username", "display_name", "photo", "role", "joined_at"]

    def get_photo(self, obj) -> str | None:
        return absolute_url(self.context.get("request"), obj.user.profile.photo)


class RoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=["MODERATOR", "MEMBER"])


class JoinRequestSerializer(serializers.ModelSerializer):
    group = serializers.IntegerField(source="group_id", read_only=True)
    user_id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(source="user.profile.username", read_only=True)
    display_name = serializers.CharField(source="user.profile.display_name", read_only=True)

    class Meta:
        model = GroupJoinRequest
        fields = ["id", "group", "user_id", "username", "display_name", "status", "message", "created_at", "updated_at"]


class JoinInputSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=300, required=False, allow_blank=True)


class ReviewSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=["ACCEPTED", "REJECTED"])


class GroupPostSerializer(PostSerializer):
    """Group feed item: the standard post plus the field names the Groups UI uses."""

    group = serializers.IntegerField(source="group_id", read_only=True)
    content = serializers.CharField(source="caption", read_only=True)

    class Meta(PostSerializer.Meta):
        fields = PostSerializer.Meta.fields + ["group", "content"]
