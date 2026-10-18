"""Validated image upload helper shared by avatars, covers, post media and places."""
from django.conf import settings
from PIL import Image, UnidentifiedImageError
from rest_framework import serializers

ALLOWED_FORMATS = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}


def validate_image(upload):
    """Checks size, then the real file content (not just the extension/MIME)."""
    if upload.size > settings.MEDIA_MAX_UPLOAD_BYTES:
        limit = settings.MEDIA_MAX_UPLOAD_BYTES // (1024 * 1024)
        raise serializers.ValidationError(f"Image is too large (max {limit} MB).")
    try:
        image = Image.open(upload)
        image.verify()
        fmt = image.format
    except (UnidentifiedImageError, OSError, SyntaxError):
        raise serializers.ValidationError("Upload a valid JPEG, PNG or WebP image.") from None
    finally:
        upload.seek(0)
    if fmt not in ALLOWED_FORMATS:
        raise serializers.ValidationError("Only JPEG, PNG and WebP images are allowed.")
    return upload


def absolutize(request, url):
    """Full URL for a media URL. Cloudinary already returns https URLs; local storage returns
    a path, which is made absolute from the request (or, without one, PUBLIC_API_URL if set)."""
    if not url or url.startswith(("http://", "https://")):
        return url
    if request:
        return request.build_absolute_uri(url)
    base = getattr(settings, "PUBLIC_API_URL", "")
    return f"{base}{url}" if base else url


def absolute_url(request, file_field):
    if not file_field:
        return None
    return absolutize(request, file_field.url)
