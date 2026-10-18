"""Media storage modes: local filesystem (default) and Cloudinary (env-driven).

The Cloudinary SDK upload/destroy calls are replaced by fakes: these tests never reach the network.
"""
import io

import pytest
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from PIL import Image
from rest_framework.test import APIRequestFactory

from apps.activities.models import Activity, ActivityParticipant
from apps.common.uploads import absolute_url, absolutize
from apps.groups.models import Group
from apps.messaging.models import Conversation, Message
from apps.messaging.services import message_payload
from tests.conftest import data, future

pytestmark = pytest.mark.django_db

CLOUD = "test-cloud"
CLOUD_PREFIX = f"https://res.cloudinary.com/{CLOUD}/image/upload/v1/"  # the SDK adds a version segment


def image_upload(name="pic.png"):
    buf = io.BytesIO()
    Image.new("RGB", (40, 24), (30, 120, 200)).save(buf, format="PNG")
    return SimpleUploadedFile(name, buf.getvalue(), content_type="image/png")


def event_form(**extra):
    return {"title": "Media test hike", "category": "HIKE", "location": "Lonavala", "start_at": future(3), "capacity": 4, **extra}


@pytest.fixture(autouse=True)
def _isolated_cache():
    """The leaderboard is cached for 60 s; leave no entry behind for other test modules."""
    cache.clear()
    yield
    cache.clear()


def complete(user):
    a = Activity.objects.create(created_by=user, title="Done", status="COMPLETED", completed_at=timezone.now(), distance=5)
    ActivityParticipant.objects.create(activity=a, user=user)


@pytest.fixture
def cloud_calls(settings, monkeypatch):
    """Cloudinary mode with the SDK upload/destroy faked. Returns the recorded calls."""
    settings.USE_CLOUDINARY = True
    settings.CLOUDINARY_CLOUD_NAME = CLOUD
    settings.CLOUDINARY_API_KEY = "test-key"
    settings.CLOUDINARY_API_SECRET = "test-secret"
    settings.STORAGES = {**settings.STORAGES, "default": {"BACKEND": "apps.common.storage.CloudinaryMediaStorage"}}
    calls = {"upload": [], "destroy": []}

    def fake_upload(file, **options):
        assert file.read(4)  # a real file-like object was handed to the SDK
        calls["upload"].append(options)
        return {"public_id": options["public_id"]}

    def fake_destroy(public_id, **options):
        calls["destroy"].append(public_id)
        return {"result": "ok"}

    monkeypatch.setattr("cloudinary.uploader.upload", fake_upload)
    monkeypatch.setattr("cloudinary.uploader.destroy", fake_destroy)
    return calls


# ---------------- absolutize / absolute_url ----------------
def test_absolutize_rules(settings):
    request = APIRequestFactory().get("/", HTTP_HOST="testserver")
    assert absolutize(request, "/media/a.png") == "http://testserver/media/a.png"
    assert absolutize(request, "https://res.cloudinary.com/x/a.png") == "https://res.cloudinary.com/x/a.png"
    assert absolutize(None, None) is None
    settings.PUBLIC_API_URL = ""
    assert absolutize(None, "/media/a.png") == "/media/a.png"  # unset: behaviour unchanged
    settings.PUBLIC_API_URL = "https://api.example.com"
    assert absolutize(None, "/media/a.png") == "https://api.example.com/media/a.png"
    assert absolutize(None, "https://res.cloudinary.com/x/a.png") == "https://res.cloudinary.com/x/a.png"


# ---------------- local mode (unchanged behaviour) ----------------
def test_local_mode_event_cover_avatar_and_post_media_are_absolute(alice, client_for, settings):
    assert settings.USE_CLOUDINARY is False
    c = client_for(alice)
    cover = data(c.post("/api/v1/events/", event_form(cover=image_upload()), format="multipart"))["cover_image"]
    assert cover.startswith("http://testserver/media/events/")
    avatar = data(c.post("/api/v1/users/me/photo/", {"photo": image_upload("me.png")}, format="multipart"))["photo"]
    assert avatar.startswith("http://testserver/media/avatars/")
    media = data(c.post("/api/v1/media/", {"file": image_upload()}, format="multipart"))["url"]
    assert media.startswith("http://testserver/media/posts/")


def test_local_mode_leaderboard_photo_is_absolute(alice, bob, client_for):
    client_for(alice).post("/api/v1/users/me/photo/", {"photo": image_upload()}, format="multipart")
    complete(alice)
    cache.clear()
    rows = data(client_for(bob).get("/api/v1/leaderboard/?metric=distance"))
    assert rows[0]["photo"].startswith("http://testserver/media/avatars/")


def test_local_mode_websocket_sender_photo_uses_public_api_url_only_when_set(alice, bob, client_for, settings):
    client_for(alice).post("/api/v1/users/me/photo/", {"photo": image_upload()}, format="multipart")
    conversation = Conversation.objects.create(type="DIRECT", direct_key=f"{alice.id}:{bob.id}")
    message = Message.objects.create(conversation=conversation, sender=alice, content="hi")
    message = Message.objects.select_related("sender__profile").get(pk=message.pk)
    settings.PUBLIC_API_URL = ""
    assert message_payload(message)["sender_photo"].startswith("/media/avatars/")  # unchanged default
    settings.PUBLIC_API_URL = "https://api.example.com"
    assert message_payload(message)["sender_photo"].startswith("https://api.example.com/media/avatars/")


def test_local_mode_group_image_is_absolute(alice):
    group = Group.objects.create(name="Trekkers", category="hiking", description="d", owner=alice)
    group.image.save("g.png", image_upload(), save=True)
    request = APIRequestFactory().get("/", HTTP_HOST="testserver")
    assert absolute_url(request, group.image).startswith("http://testserver/media/groups/")


# ---------------- Cloudinary mode (SDK faked) ----------------
def test_cloudinary_mode_uploads_return_https_urls_and_nothing_is_written_locally(alice, client_for, cloud_calls, settings):
    c = client_for(alice)
    created = data(c.post("/api/v1/events/", event_form(cover=image_upload()), format="multipart"))
    cover = created["cover_image"]
    assert cover.startswith(CLOUD_PREFIX + "events/") and cover.endswith(".png")
    avatar = data(c.post("/api/v1/users/me/photo/", {"photo": image_upload("me.png")}, format="multipart"))["photo"]
    assert avatar.startswith(CLOUD_PREFIX + "avatars/")
    media = data(c.post("/api/v1/media/", {"file": image_upload()}, format="multipart"))["url"]
    assert media.startswith(CLOUD_PREFIX + "posts/")

    assert [o["public_id"].split("/")[0] for o in cloud_calls["upload"]] == ["events", "avatars", "posts"]
    assert all(o["resource_type"] == "image" and o["overwrite"] is False for o in cloud_calls["upload"])
    # the stored name round-trips: detail endpoint returns the same https URL
    assert data(c.get(f"/api/v1/events/{created['id']}/"))["cover_image"] == cover
    # nothing was written under MEDIA_ROOT for these uploads
    assert not (settings.MEDIA_ROOT / created["cover_image"].split(CLOUD_PREFIX)[1]).exists()


def test_cloudinary_mode_group_image_and_post_photos_are_https(alice, client_for, cloud_calls):
    group = Group.objects.create(name="Trekkers", category="hiking", description="d", owner=alice)
    group.image.save("g.png", image_upload(), save=True)
    request = APIRequestFactory().get("/", HTTP_HOST="testserver")
    assert absolute_url(request, group.image).startswith(CLOUD_PREFIX + "groups/")
    assert absolute_url(None, group.image).startswith("https://")  # no request needed


def test_cloudinary_mode_leaderboard_and_websocket_urls_are_https(alice, bob, client_for, cloud_calls, settings):
    client_for(alice).post("/api/v1/users/me/photo/", {"photo": image_upload()}, format="multipart")
    complete(alice)
    cache.clear()
    rows = data(client_for(bob).get("/api/v1/leaderboard/?metric=distance"))
    assert rows[0]["photo"].startswith(CLOUD_PREFIX + "avatars/")
    conversation = Conversation.objects.create(type="DIRECT", direct_key=f"{alice.id}:{bob.id}")
    message = Message.objects.create(conversation=conversation, sender=alice, content="hi")
    message = Message.objects.select_related("sender__profile").get(pk=message.pk)
    settings.PUBLIC_API_URL = "https://api.example.com"  # must not be prepended to an https URL
    assert message_payload(message)["sender_photo"].startswith(CLOUD_PREFIX + "avatars/")


def test_cloudinary_mode_removing_an_avatar_deletes_the_remote_image(alice, client_for, cloud_calls):
    c = client_for(alice)
    c.post("/api/v1/users/me/photo/", {"photo": image_upload()}, format="multipart")
    uploaded = cloud_calls["upload"][0]["public_id"]
    r = c.delete("/api/v1/users/me/photo/")
    assert r.status_code == 200 and data(r)["photo"] is None
    assert cloud_calls["destroy"] == [uploaded]


def test_cloudinary_mode_keeps_the_upload_validation(alice, client_for, cloud_calls, settings):
    settings.MEDIA_MAX_UPLOAD_BYTES = 100
    r = client_for(alice).post("/api/v1/events/", event_form(cover=image_upload()), format="multipart")
    assert r.status_code == 400 and "too large" in str(r.json()["errors"]["cover"])
    fake = SimpleUploadedFile("cover.png", b"this is not an image", content_type="image/png")
    settings.MEDIA_MAX_UPLOAD_BYTES = 5 * 1024 * 1024
    assert client_for(alice).post("/api/v1/events/", event_form(cover=fake), format="multipart").status_code == 400
    assert cloud_calls["upload"] == []  # rejected before anything is sent to Cloudinary


@pytest.mark.parametrize(
    "env, expected_backend",
    [
        ({"CLOUDINARY_CLOUD_NAME": "c", "CLOUDINARY_API_KEY": "k", "CLOUDINARY_API_SECRET": "s"}, "apps.common.storage.CloudinaryMediaStorage"),
        ({"CLOUDINARY_CLOUD_NAME": "c", "CLOUDINARY_API_KEY": "k", "CLOUDINARY_API_SECRET": ""}, "django.core.files.storage.FileSystemStorage"),
        ({"CLOUDINARY_CLOUD_NAME": "", "CLOUDINARY_API_KEY": "k", "CLOUDINARY_API_SECRET": "s"}, "django.core.files.storage.FileSystemStorage"),
        ({"CLOUDINARY_CLOUD_NAME": "", "CLOUDINARY_API_KEY": "", "CLOUDINARY_API_SECRET": ""}, "django.core.files.storage.FileSystemStorage"),
    ],
)
def test_production_settings_pick_cloudinary_only_when_all_three_variables_are_set(env, expected_backend):
    """Imports config.settings in a clean subprocess (empty strings win over any local .env)."""
    import os
    import subprocess
    import sys
    from pathlib import Path

    backend_dir = Path(__file__).resolve().parent.parent
    code = "import config.settings as s; print(s.STORAGES['default']['BACKEND'])"
    result = subprocess.run(
        [sys.executable, "-B", "-c", code],
        cwd=backend_dir,
        env={**os.environ, "DJANGO_DEBUG": "true", "DJANGO_SECRET_KEY": "x" * 50, "PUBLIC_API_URL": "", **env},
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert result.returncode == 0, result.stderr[-500:]
    assert result.stdout.strip() == expected_backend
