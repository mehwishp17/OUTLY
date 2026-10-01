from rest_framework import serializers

from apps.common.uploads import absolute_url, validate_image

from .models import Comment, Post, PostMedia


def _author_name(profile):
    return profile.display_name or profile.username


class MediaSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = PostMedia
        fields = ["id", "url", "width", "height", "created_at"]

    def get_url(self, obj) -> str:
        return absolute_url(self.context.get("request"), obj.image)


class MediaUploadSerializer(serializers.Serializer):
    file = serializers.ImageField()

    def validate_file(self, value):
        return validate_image(value)


class PostSerializer(serializers.ModelSerializer):
    """Read shape. Viewer-specific `is_liked` / `is_saved` come from queryset
    annotations (see selectors.annotate_for_viewer)."""

    author_id = serializers.IntegerField(read_only=True)
    author_name = serializers.SerializerMethodField()
    author_username = serializers.CharField(source="author.profile.username", read_only=True)
    author_photo = serializers.SerializerMethodField()
    activity_id = serializers.IntegerField(read_only=True)
    place_id = serializers.IntegerField(read_only=True)
    group_id = serializers.IntegerField(read_only=True)
    media = serializers.SerializerMethodField()
    photos = serializers.SerializerMethodField()
    is_liked = serializers.BooleanField(read_only=True, default=False)
    is_saved = serializers.BooleanField(read_only=True, default=False)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id", "author_id", "author_name", "author_username", "author_photo", "caption", "location", "visibility",
            "activity_id", "place_id", "group_id", "status", "media", "photos", "likes_count", "comments_count",
            "shares_count", "saves_count", "is_liked", "is_saved", "is_mine", "created_at", "updated_at",
        ]

    def get_author_name(self, obj) -> str:
        return _author_name(obj.author.profile)

    def get_author_photo(self, obj) -> str | None:
        return absolute_url(self.context.get("request"), obj.author.profile.photo)

    def _media(self, obj):
        return list(obj.media.all())

    def get_media(self, obj) -> list:
        return MediaSerializer(self._media(obj), many=True, context=self.context).data

    def get_photos(self, obj) -> list:
        return [absolute_url(self.context.get("request"), m.image) for m in self._media(obj)]

    def get_is_mine(self, obj) -> bool:
        request = self.context.get("request")
        return bool(request and obj.author_id == request.user.id)


class PostWriteSerializer(serializers.Serializer):
    caption = serializers.CharField(max_length=2000, required=False, allow_blank=True)
    location = serializers.CharField(max_length=200, required=False, allow_blank=True)
    visibility = serializers.ChoiceField(choices=[c for c in Post.Visibility.values if c != "GROUP"], required=False)
    activity_id = serializers.IntegerField(required=False, allow_null=True)
    place_id = serializers.IntegerField(required=False, allow_null=True)
    group_id = serializers.IntegerField(required=False, allow_null=True)
    media_ids = serializers.ListField(child=serializers.IntegerField(), required=False, max_length=10)

    def validate_caption(self, value):
        return value.strip()

    def validate(self, attrs):
        creating = self.context.get("creating", False)
        if creating and not attrs.get("caption") and not attrs.get("media_ids"):
            raise serializers.ValidationError({"caption": ["Write something or attach a photo."]})
        if attrs.get("group_id") and attrs.get("visibility"):
            raise serializers.ValidationError({"visibility": ["Group posts are visible to the group only."]})
        return attrs


class CommentSerializer(serializers.ModelSerializer):
    post = serializers.IntegerField(source="post_id", read_only=True)
    author_id = serializers.IntegerField(read_only=True)
    author_name = serializers.SerializerMethodField()
    author_username = serializers.CharField(source="author.profile.username", read_only=True)
    author_photo = serializers.SerializerMethodField()
    parent_id = serializers.IntegerField(read_only=True)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id", "post", "author_id", "author_name", "author_username", "author_photo", "parent_id", "content",
            "edited", "is_mine", "created_at", "updated_at",
        ]

    def get_author_name(self, obj) -> str:
        return _author_name(obj.author.profile)

    def get_author_photo(self, obj) -> str | None:
        return absolute_url(self.context.get("request"), obj.author.profile.photo)

    def get_is_mine(self, obj) -> bool:
        request = self.context.get("request")
        return bool(request and obj.author_id == request.user.id)


class CommentWriteSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=1000)
    parent_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_content(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Comment can't be empty.")
        return value
