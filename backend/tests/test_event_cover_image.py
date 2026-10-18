import io
from urllib.parse import urlparse

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework.test import APIClient

from apps.events.models import Event
from tests.conftest import body, data, future

pytestmark = pytest.mark.django_db


def image_upload(fmt="PNG", name="cover.png", size=(40, 24)):
    buf = io.BytesIO()
    Image.new("RGB", size, (30, 120, 200)).save(buf, format=fmt)
    return SimpleUploadedFile(name, buf.getvalue(), content_type=f"image/{fmt.lower()}")


def form(**extra):
    return {"title": "Cover test hike", "category": "HIKE", "location": "Lonavala", "start_at": future(3), "capacity": 4, **extra}


def create(c, **extra):
    return c.post("/api/v1/events/", form(**extra), format="multipart")


def test_create_with_cover_returns_absolute_url_and_persists(alice, client_for):
    r = create(client_for(alice), cover=image_upload())
    assert r.status_code == 201, r.content
    url = data(r)["cover_image"]
    assert url.startswith("http") and "/media/events/" in url
    assert Event.objects.get(pk=data(r)["id"]).cover_image
    # the detail and list endpoints return the same URL
    assert data(client_for(alice).get(f"/api/v1/events/{data(r)['id']}/"))["cover_image"] == url
    listed = data(client_for(alice).get("/api/v1/events/"))
    assert any(e["cover_image"] == url for e in listed)


def test_uploaded_cover_is_served_when_debug_is_off(alice, client_for):
    url = data(create(client_for(alice), cover=image_upload()))["cover_image"]
    served = APIClient().get(urlparse(url).path)  # anonymous, like a browser <img>
    assert served.status_code == 200
    assert served["Content-Type"] == "image/png"


def test_create_without_cover_still_works(alice, client_for):
    json_r = client_for(alice).post("/api/v1/events/", form(), format="json")
    assert json_r.status_code == 201 and data(json_r)["cover_image"] is None
    multipart_r = create(client_for(alice))
    assert multipart_r.status_code == 201 and data(multipart_r)["cover_image"] is None


def test_invalid_file_type_is_rejected(alice, client_for):
    fake = SimpleUploadedFile("cover.png", b"this is not an image", content_type="image/png")
    r = create(client_for(alice), cover=fake)
    assert r.status_code == 400 and "cover" in body(r)["errors"]
    gif = image_upload(fmt="GIF", name="cover.gif")
    assert create(client_for(alice), cover=gif).status_code == 400  # only JPEG, PNG and WebP
    assert not Event.objects.filter(title="Cover test hike").exists()


def test_oversized_file_is_rejected(alice, client_for, settings):
    settings.MEDIA_MAX_UPLOAD_BYTES = 100
    r = create(client_for(alice), cover=image_upload(size=(300, 300)))
    assert r.status_code == 400 and "too large" in str(body(r)["errors"]["cover"])


def test_unauthenticated_cannot_upload(alice):
    r = APIClient().post("/api/v1/events/", form(cover=image_upload()), format="multipart")
    assert r.status_code == 401
    assert not Event.objects.exists()


def test_only_organizer_can_change_the_cover(alice, bob, client_for):
    created = data(create(client_for(alice), cover=image_upload()))
    eid, original = created["id"], created["cover_image"]
    r = client_for(bob).patch(f"/api/v1/events/{eid}/", {"cover": image_upload()}, format="multipart")
    assert r.status_code == 403
    r = client_for(bob).patch(f"/api/v1/events/{eid}/", {"remove_cover": "true"}, format="multipart")
    assert r.status_code == 403
    assert data(client_for(alice).get(f"/api/v1/events/{eid}/"))["cover_image"] == original


def test_replace_and_remove_cover(alice, client_for):
    c = client_for(alice)
    created = data(create(c, cover=image_upload()))
    eid, first = created["id"], created["cover_image"]

    replaced = c.patch(f"/api/v1/events/{eid}/", {"cover": image_upload(fmt="JPEG", name="new.jpg")}, format="multipart")
    assert replaced.status_code == 200, replaced.content
    second = data(replaced)["cover_image"]
    assert second and second != first

    # editing other fields without a file keeps the cover
    kept = c.patch(f"/api/v1/events/{eid}/", {"title": "Renamed hike"}, format="multipart")
    assert data(kept)["cover_image"] == second and data(kept)["title"] == "Renamed hike"

    removed = c.patch(f"/api/v1/events/{eid}/", {"remove_cover": "true"}, format="multipart")
    assert removed.status_code == 200 and data(removed)["cover_image"] is None
    assert not Event.objects.get(pk=eid).cover_image

    # JSON edits (no file) keep working and can also remove
    c.patch(f"/api/v1/events/{eid}/", {"cover": image_upload()}, format="multipart")
    via_json = c.patch(f"/api/v1/events/{eid}/", {"remove_cover": True}, format="json")
    assert via_json.status_code == 200 and data(via_json)["cover_image"] is None
