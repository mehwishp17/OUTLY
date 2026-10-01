import io

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image

from tests.conftest import data, body

pytestmark = pytest.mark.django_db


def png(size=(20, 20)):
    buf = io.BytesIO()
    Image.new("RGB", size, "green").save(buf, "PNG")
    return buf.getvalue()


def test_me_shape_matches_frontend_contract(alice, client_for):
    d = data(client_for(alice).get("/api/v1/users/me/"))
    for key in ("user_id", "email", "username", "display_name", "photo", "bio", "interests", "privacy_settings", "role", "status"):
        assert key in d
    assert d["user_id"] == alice.id and d["role"] == "USER" and d["photo"] is None


def test_patch_profile_validates_and_persists(alice, bob, client_for):
    c = client_for(alice)
    r = c.patch("/api/v1/users/me/", {"display_name": " Alice B ", "bio": "hi", "interests": ["hiking", "hiking", "camping"], "location": "Pune", "skill_level": "advanced"}, format="json")
    assert r.status_code == 200
    d = data(r)
    assert d["display_name"] == "Alice B" and d["interests"] == ["hiking", "camping"] and d["skill_level"] == "advanced"
    assert c.patch("/api/v1/users/me/", {"username": bob.profile.username}, format="json").status_code == 400  # taken
    assert c.patch("/api/v1/users/me/", {"username": "BAD NAME!"}, format="json").status_code == 400
    assert c.patch("/api/v1/users/me/", {"skill_level": "god"}, format="json").status_code == 400
    assert c.patch("/api/v1/users/me/", {"username": "new_name.1"}, format="json").status_code == 200


def test_patch_cannot_change_role_status_or_email(alice, client_for):
    r = client_for(alice).patch("/api/v1/users/me/", {"role": "ADMINISTRATOR", "status": "ACTIVE", "email": "x@y.com"}, format="json")
    assert r.status_code == 200
    alice.refresh_from_db()
    assert alice.role == "USER" and alice.email == "alice@example.com"


def test_privacy_settings_validated(alice, client_for):
    c = client_for(alice)
    assert c.patch("/api/v1/users/me/", {"privacy_settings": {"profileVisibility": "weird"}}, format="json").status_code == 400
    assert c.patch("/api/v1/users/me/", {"privacy_settings": {"hack": True}}, format="json").status_code == 400
    ok = c.patch("/api/v1/users/me/", {"privacy_settings": {"profileVisibility": "private"}}, format="json")
    assert data(ok)["privacy_settings"]["profileVisibility"] == "private"
    assert data(ok)["privacy_settings"]["showSavedPlaces"] is True  # merged, not replaced


def test_public_profile_hides_private_details(alice, bob, client_for):
    client_for(bob).patch("/api/v1/users/me/", {"bio": "secret bio", "privacy_settings": {"profileVisibility": "private"}}, format="json")
    d = data(client_for(alice).get(f"/api/v1/users/{bob.id}/"))
    assert d["is_restricted"] is True and "bio" not in d and "email" not in d
    assert d["username"] == bob.profile.username  # identity still visible so feeds/search work


def test_public_profile_open_and_never_leaks_email(alice, bob, client_for):
    d = data(client_for(alice).get(f"/api/v1/users/{bob.id}/"))
    assert d["is_restricted"] is False and "email" not in d and d["follow_status"] == "NONE"
    assert "stats" in d


def test_community_only_visible_to_followers(alice, bob, client_for):
    client_for(bob).patch("/api/v1/users/me/", {"bio": "friends only", "privacy_settings": {"profileVisibility": "communityOnly"}}, format="json")
    assert "bio" not in data(client_for(alice).get(f"/api/v1/users/{bob.id}/"))
    client_for(alice).post(f"/api/v1/users/{bob.id}/follow/")
    assert data(client_for(alice).get(f"/api/v1/users/{bob.id}/"))["bio"] == "friends only"


def test_unknown_user_404(alice, client_for):
    assert client_for(alice).get("/api/v1/users/999999/").status_code == 404


def test_avatar_upload_validates_content_not_extension(alice, client_for):
    c = client_for(alice)
    good = c.post("/api/v1/users/me/photo/", {"photo": SimpleUploadedFile("a.png", png(), "image/png")}, format="multipart")
    assert good.status_code == 200 and data(good)["photo"].startswith("http")
    fake = c.post("/api/v1/users/me/photo/", {"photo": SimpleUploadedFile("evil.png", b"<script>alert(1)</script>", "image/png")}, format="multipart")
    assert fake.status_code == 400
    assert c.delete("/api/v1/users/me/photo/").status_code == 200


def test_upload_size_limit(alice, client_for, settings):
    settings.MEDIA_MAX_UPLOAD_BYTES = 100
    r = client_for(alice).post("/api/v1/users/me/photo/", {"photo": SimpleUploadedFile("a.png", png((200, 200)), "image/png")}, format="multipart")
    assert r.status_code == 400


def test_user_search_excludes_self_and_blocked(alice, bob, carol, client_for):
    c = client_for(alice)
    names = [u["username"] for u in data(c.get("/api/v1/users/?search=o"))]
    assert alice.profile.username not in names and bob.profile.username in names
    c.post(f"/api/v1/users/{bob.id}/block/")
    names = [u["username"] for u in data(c.get("/api/v1/users/?search=bob"))]
    assert names == []


# ---------------- follows ----------------
def test_follow_unfollow_and_lists(alice, bob, client_for):
    ca = client_for(alice)
    r = ca.post(f"/api/v1/users/{bob.id}/follow/")
    assert r.status_code == 201 and data(r)["follower_id"] == alice.id and data(r)["following_id"] == bob.id
    assert ca.post(f"/api/v1/users/{bob.id}/follow/").status_code == 200  # idempotent, no duplicate row
    assert [p["user_id"] for p in data(ca.get(f"/api/v1/users/{bob.id}/followers/"))] == [alice.id]
    assert [p["user_id"] for p in data(ca.get(f"/api/v1/users/{alice.id}/following/"))] == [bob.id]
    assert data(ca.get(f"/api/v1/users/{bob.id}/"))["stats"]["followers"] == 1
    assert ca.delete(f"/api/v1/users/{bob.id}/follow/").status_code == 204
    assert data(ca.get(f"/api/v1/users/{bob.id}/followers/")) == []


def test_cannot_follow_self_or_missing(alice, client_for):
    c = client_for(alice)
    assert c.post(f"/api/v1/users/{alice.id}/follow/").status_code == 400
    assert c.post("/api/v1/users/999999/follow/").status_code == 404


def test_follow_request_flow_for_private_accounts(alice, bob, client_for):
    client_for(bob).patch("/api/v1/users/me/", {"privacy_settings": {"requireFollowApproval": True}}, format="json")
    r = client_for(alice).post(f"/api/v1/users/{bob.id}/follow/")
    assert data(r)["status"] == "PENDING"
    assert data(client_for(alice).get(f"/api/v1/users/{bob.id}/followers/")) == []  # pending isn't a follower
    pending = data(client_for(bob).get("/api/v1/users/me/follow-requests/"))
    assert [p["user_id"] for p in pending] == [alice.id]
    # only the target can decide
    assert client_for(alice).post(f"/api/v1/users/me/follow-requests/{pending[0]['follow_id']}/", {"decision": "ACCEPTED"}, format="json").status_code == 404
    assert client_for(bob).post(f"/api/v1/users/me/follow-requests/{pending[0]['follow_id']}/", {"decision": "ACCEPTED"}, format="json").status_code == 200
    assert [p["user_id"] for p in data(client_for(alice).get(f"/api/v1/users/{bob.id}/followers/"))] == [alice.id]


def test_block_removes_follows_and_hides_users(alice, bob, client_for):
    ca, cb = client_for(alice), client_for(bob)
    cb.post(f"/api/v1/users/{alice.id}/follow/")
    assert ca.post(f"/api/v1/users/{bob.id}/block/").status_code == 201
    assert ca.get(f"/api/v1/users/{bob.id}/").status_code == 404
    assert cb.get(f"/api/v1/users/{alice.id}/").status_code == 404  # blocked in either direction
    assert cb.post(f"/api/v1/users/{alice.id}/follow/").status_code == 403
    assert [b["user_id"] for b in data(ca.get("/api/v1/users/me/blocks/"))] == [bob.id]
    assert ca.delete(f"/api/v1/users/{bob.id}/block/").status_code == 204
    assert ca.get(f"/api/v1/users/{bob.id}/").status_code == 200
    assert ca.post(f"/api/v1/users/{alice.id}/block/").status_code == 400  # not self
