from rest_framework import serializers

from apps.common.uploads import absolute_url

from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    conversation = serializers.IntegerField(source="conversation_id", read_only=True)
    sender_id = serializers.IntegerField(read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender_photo = serializers.SerializerMethodField()
    content = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id", "conversation", "sender_id", "sender_name", "sender_photo", "content", "created_at", "edited_at",
            "is_deleted", "is_mine",
        ]

    def get_sender_name(self, obj) -> str:
        return obj.sender.profile.display_name or obj.sender.profile.username

    def get_sender_photo(self, obj) -> str | None:
        return absolute_url(self.context.get("request"), obj.sender.profile.photo)

    def get_content(self, obj) -> str:
        return "" if obj.is_deleted else obj.content

    def get_is_mine(self, obj) -> bool:
        request = self.context.get("request")
        return bool(request and obj.sender_id == request.user.id)


class SendMessageInputSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=2000)


class DirectConversationInputSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()


class ConversationSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    type = serializers.CharField()
    group_id = serializers.IntegerField(allow_null=True)
    group_name = serializers.CharField(allow_null=True)
    participants = serializers.ListField(child=serializers.DictField())
    last_message = serializers.CharField()
    last_message_at = serializers.DateTimeField(allow_null=True)
    unread_count = serializers.IntegerField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
