"""Cloudinary-backed media storage (used only when all three CLOUDINARY_* variables are set).

Only what OUTLY needs: upload on save, a public https URL, delete. Files are never read
back through the storage (uploads are validated before they are saved), so `open()` and
`size()` are not supported.
"""
import logging
import os
import uuid
from pathlib import Path
from urllib.parse import urljoin

from django.conf import settings
from django.core.files.storage import Storage
from django.utils.encoding import filepath_to_uri

logger = logging.getLogger("outly.media")


class CloudinaryMediaStorage(Storage):
    def _configure(self):
        import cloudinary

        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )

    @staticmethod
    def _split(name):
        root, ext = os.path.splitext(name.replace("\\", "/"))
        return root, ext.lstrip(".")

    def get_available_name(self, name, max_length=None):
        # A random suffix makes names unique without asking Cloudinary whether they exist.
        root, ext = os.path.splitext(name.replace("\\", "/"))
        suffix = f"_{uuid.uuid4().hex[:8]}"
        if max_length:
            root = root[: max(max_length - len(ext) - len(suffix), 1)]
        return f"{root}{suffix}{ext}"

    def _save(self, name, content):
        import cloudinary.uploader

        self._configure()
        public_id, _ = self._split(name)
        if hasattr(content, "seek"):
            content.seek(0)
        cloudinary.uploader.upload(
            content,
            public_id=public_id,
            resource_type="image",
            overwrite=False,
            unique_filename=False,
            use_filename=False,
        )
        return name.replace("\\", "/")

    def _legacy_local_url(self, name):
        """URL of a file that was stored on local disk before Cloudinary was enabled, else None."""
        root = Path(settings.MEDIA_ROOT).resolve()
        path = (root / name).resolve()
        if path.is_relative_to(root) and path.is_file():
            return urljoin(settings.MEDIA_URL, filepath_to_uri(name))
        return None

    def url(self, name):
        import cloudinary.utils

        legacy = self._legacy_local_url(name)
        if legacy:
            return legacy
        self._configure()
        # No file extension: Cloudinary serves the format it stored (it normalises e.g. .jfif to
        # jpg, and answers 404 for a URL that carries the original, unsupported extension).
        public_id, _ = self._split(name)
        url, _ = cloudinary.utils.cloudinary_url(public_id, secure=True, resource_type="image", type="upload")
        return url

    def exists(self, name):
        return False

    def delete(self, name):
        import cloudinary.uploader

        if not name:
            return
        self._configure()
        public_id, _ = self._split(name)
        try:
            cloudinary.uploader.destroy(public_id, resource_type="image", invalidate=True)
        except Exception:  # a failed remote delete must not break the user's request
            logger.warning("cloudinary delete failed public_id=%s", public_id, exc_info=True)
