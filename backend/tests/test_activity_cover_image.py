import io
from urllib.parse import urlparse

import pytest
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework.test import APIClient

from apps.activities.models import Activity
from tests.conftest import body, data, future

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def _isolated_cache():
    """Throttle and rate-limit counters live in a shared in-memory cache; keep these tests from leaking into others."""
    cache.clear()
    yield
    cache.clear()


def image_upload(fmt="PNG", name="cover.png", size=(40, 24)):
    buf = io.BytesIO()
    Image.new("RGB", size, (30, 120, 200)).save(buf, format=fmt)
    return SimpleUploadedFile(name, buf.getvalue(), content_type=f"image/{fmt.lower()}")


def form(**extra):
    return {"title": "Cover test hike", "activity_type": "HIKE", "location": "Pune", "start_at": future(2), **extra}


def create(c, **extra):
    return c.post("/api/v1/activities/", form(**extra), format="multipart")


def test_create_with_cover_returns_absolute_url_and_persists(alice, client_for):
    r = create(client_for(alice), cover=image_upload())
    assert r.status_code == 201, r.content
    url = data(r)["cover_image"]
    assert url.startswith("http") and "/media/activities/" in url
    assert Activity.objects.get(pk=data(r)["id"]).cover_image
    # the detail and list endpoints return the same URL
    assert data(client_for(alice).get(f"/api/v1/activities/{data(r)['id']}/"))["cover_image"] == url
    assert any(a["cover_image"] == url for a in data(client_for(alice).get("/api/v1/activities/")))


def test_other_users_see_the_cover_of_a_public_activity(alice, bob, client_for):
    url = data(create(client_for(alice), cover=image_upload()))["cover_image"]
    aid = Activity.objects.get(cover_image__isnull=False).pk
    assert data(client_for(bob).get(f"/api/v1/activities/{aid}/"))["cover_image"] == url
    assert any(a["cover_image"] == url for a in data(client_for(bob).get("/api/v1/activities/")))


def test_private_activity_cover_is_not_exposed_to_others(alice, bob, client_for):
    created = data(create(client_for(alice), privacy="PRIVATE", cover=image_upload()))
    assert client_for(bob).get(f"/api/v1/activities/{created['id']}/").status_code == 404
    assert all(a["id"] != created["id"] for a in data(client_for(bob).get("/api/v1/activities/")))


def test_uploaded_cover_is_served_when_debug_is_off(alice, client_for):
    url = data(create(client_for(alice), cover=image_upload()))["cover_image"]
    served = APIClient().get(urlparse(url).path)  # anonymous, like a browser <img>
    assert served.status_code == 200 and served["Content-Type"] == "image/png"


def test_multipart_exactly_as_the_frontend_sends_it(alice, client_for):
    """The web app sends multipart with '' for null fields and the duration in seconds."""
    r = client_for(alice).post(
        "/api/v1/activities/",
        form(distance="8.5", duration="5400", difficulty="", notes="", privacy="PUBLIC", status="PLANNED", place_id="", trail_id="", cover=image_upload()),
        format="multipart",
    )
    assert r.status_code == 201, r.content
    d = data(r)
    assert d["cover_image"] and d["place_id"] is None and d["trail_id"] is None
    assert d["distance"] == "8.50" and d["duration"].startswith("01:30")


def test_create_without_cover_still_works(alice, client_for):
    json_r = client_for(alice).post("/api/v1/activities/", form(), format="json")
    assert json_r.status_code == 201 and data(json_r)["cover_image"] is None
    multipart_r = create(client_for(alice))
    assert multipart_r.status_code == 201 and data(multipart_r)["cover_image"] is None
    assert all(a["cover_image"] is None for a in data(client_for(alice).get("/api/v1/activities/")))


def test_invalid_file_type_is_rejected(alice, client_for):
    fake = SimpleUploadedFile("cover.png", b"this is not an image", content_type="image/png")
    r = create(client_for(alice), cover=fake)
    assert r.status_code == 400 and "cover" in body(r)["errors"]
    assert create(client_for(alice), cover=image_upload(fmt="GIF", name="cover.gif")).status_code == 400  # JPEG, PNG, WebP only
    assert not Activity.objects.filter(title="Cover test hike").exists()


def test_oversized_file_is_rejected(alice, client_for, settings):
    settings.MEDIA_MAX_UPLOAD_BYTES = 100
    r = create(client_for(alice), cover=image_upload(size=(300, 300)))
    assert r.status_code == 400 and "too large" in str(body(r)["errors"]["cover"])
    assert not Activity.objects.exists()


def test_unauthenticated_cannot_upload(alice):
    r = APIClient().post("/api/v1/activities/", form(cover=image_upload()), format="multipart")
    assert r.status_code == 401
    assert not Activity.objects.exists()


def test_only_the_creator_can_change_the_cover(alice, bob, client_for):
    created = data(create(client_for(alice), cover=image_upload()))
    aid, original = created["id"], created["cover_image"]
    assert client_for(bob).patch(f"/api/v1/activities/{aid}/", {"cover": image_upload()}, format="multipart").status_code == 403
    assert client_for(bob).patch(f"/api/v1/activities/{aid}/", {"remove_cover": "true"}, format="multipart").status_code == 403
    assert data(client_for(alice).get(f"/api/v1/activities/{aid}/"))["cover_image"] == original


def test_replace_keep_and_remove_cover(alice, client_for):
    c = client_for(alice)
    created = data(create(c, cover=image_upload()))
    aid, first = created["id"], created["cover_image"]

    replaced = c.patch(f"/api/v1/activities/{aid}/", {"cover": image_upload(fmt="JPEG", name="new.jpg")}, format="multipart")
    assert replaced.status_code == 200, replaced.content
    second = data(replaced)["cover_image"]
    assert second and second != first

    # editing other fields without a file keeps the cover (multipart and JSON)
    kept = c.patch(f"/api/v1/activities/{aid}/", {"title": "Renamed hike"}, format="multipart")
    assert data(kept)["cover_image"] == second and data(kept)["title"] == "Renamed hike"
    kept_json = c.patch(f"/api/v1/activities/{aid}/", {"notes": "bring water"}, format="json")
    assert data(kept_json)["cover_image"] == second

    removed = c.patch(f"/api/v1/activities/{aid}/", {"remove_cover": "true"}, format="multipart")
    assert removed.status_code == 200 and data(removed)["cover_image"] is None
    assert not Activity.objects.get(pk=aid).cover_image

    # JSON edits can also remove one
    c.patch(f"/api/v1/activities/{aid}/", {"cover": image_upload()}, format="multipart")
    via_json = c.patch(f"/api/v1/activities/{aid}/", {"remove_cover": True}, format="json")
    assert via_json.status_code == 200 and data(via_json)["cover_image"] is None


def test_bad_replacement_keeps_the_existing_cover(alice, client_for):
    c = client_for(alice)
    created = data(create(c, cover=image_upload()))
    bad = c.patch(f"/api/v1/activities/{created['id']}/", {"cover": SimpleUploadedFile("x.png", b"nope", content_type="image/png")}, format="multipart")
    assert bad.status_code == 400
    assert data(c.get(f"/api/v1/activities/{created['id']}/"))["cover_image"] == created["cover_image"]


def test_history_and_user_activity_lists_include_the_cover_field(alice, client_for):
    c = client_for(alice)
    created = data(create(c, status="COMPLETED", cover=image_upload()))
    history = data(c.get("/api/v1/activities/history/"))
    assert any(a["id"] == created["id"] and a["cover_image"] for a in history)
