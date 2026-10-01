import io

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image

from tests.conftest import data, body

pytestmark = pytest.mark.django_db


def png():
    buf = io.BytesIO()
    Image.new("RGB", (30, 20), "blue").save(buf, "PNG")
    return buf.getvalue()


def test_post_crud_ownership(alice, bob, client_for, make_post):
    post = make_post(alice, "First summit")
    assert post["author_id"] == alice.id and post["status"] == "ACTIVE" and post["is_mine"] is True
    pid = post["id"]
    # edit: owner only
    assert client_for(bob).patch(f"/api/v1/posts/{pid}/", {"caption": "hacked"}, format="json").status_code in (403, 404)
    r = client_for(alice).patch(f"/api/v1/posts/{pid}/", {"caption": "Edited"}, format="json")
    assert data(r)["caption"] == "Edited"
    # delete: owner only
    assert client_for(bob).delete(f"/api/v1/posts/{pid}/").status_code == 403
    assert client_for(alice).delete(f"/api/v1/posts/{pid}/").status_code == 204
    assert client_for(alice).get(f"/api/v1/posts/{pid}/").status_code == 404
    assert pid not in [p["id"] for p in data(client_for(alice).get("/api/v1/posts/"))]


def test_post_validation(alice, client_for):
    c = client_for(alice)
    assert c.post("/api/v1/posts/", {"caption": "   "}, format="json").status_code == 400
    assert c.post("/api/v1/posts/", {"caption": "x" * 2001}, format="json").status_code == 400
    assert c.post("/api/v1/posts/", {"caption": "ok", "place_id": 99999}, format="json").status_code == 400
    assert c.post("/api/v1/posts/", {"caption": "ok", "visibility": "GROUP"}, format="json").status_code == 400


def test_client_cannot_forge_author(alice, bob, client_for):
    r = client_for(alice).post("/api/v1/posts/", {"caption": "mine", "author_id": bob.id, "likes_count": 99, "status": "HIDDEN"}, format="json")
    d = data(r)
    assert d["author_id"] == alice.id and d["likes_count"] == 0 and d["status"] == "ACTIVE"


def test_feed_is_cursor_paginated_newest_first(alice, client_for, make_post):
    for i in range(5):
        make_post(alice, f"post {i}")
    c = client_for(alice)
    page1 = c.get("/api/v1/posts/?limit=2")
    b1 = body(page1)
    assert [p["caption"] for p in b1["data"]] == ["post 4", "post 3"]
    cursor = b1["meta"]["next_cursor"]
    assert cursor
    b2 = body(c.get(f"/api/v1/posts/?limit=2&cursor={cursor}"))
    assert [p["caption"] for p in b2["data"]] == ["post 2", "post 1"]
    b3 = body(c.get(f"/api/v1/posts/?limit=2&cursor={b2['meta']['next_cursor']}"))
    assert [p["caption"] for p in b3["data"]] == ["post 0"] and b3["meta"]["next_cursor"] is None


def test_feed_respects_follower_only_visibility(alice, bob, client_for, make_post):
    make_post(bob, "public", visibility="PUBLIC")
    make_post(bob, "followers", visibility="FOLLOWERS")
    seen = lambda: [p["caption"] for p in data(client_for(alice).get("/api/v1/posts/"))]
    assert seen() == ["public"]
    client_for(alice).post(f"/api/v1/users/{bob.id}/follow/")
    assert sorted(seen()) == ["followers", "public"]
    # detail view applies the same rule (no IDOR via direct id)
    private_id = [p for p in data(client_for(bob).get("/api/v1/posts/?scope=mine")) if p["caption"] == "followers"][0]["id"]
    client_for(alice).delete(f"/api/v1/users/{bob.id}/follow/")
    assert client_for(alice).get(f"/api/v1/posts/{private_id}/").status_code == 404
    assert client_for(alice).post(f"/api/v1/posts/{private_id}/like/").status_code == 404
    assert client_for(alice).get(f"/api/v1/posts/{private_id}/comments/").status_code == 404


def test_feed_hides_blocked_users_both_ways(alice, bob, client_for, make_post):
    make_post(bob, "from bob")
    make_post(alice, "from alice")
    client_for(alice).post(f"/api/v1/users/{bob.id}/block/")
    assert [p["caption"] for p in data(client_for(alice).get("/api/v1/posts/"))] == ["from alice"]
    assert [p["caption"] for p in data(client_for(bob).get("/api/v1/posts/"))] == ["from bob"]


def test_private_profile_public_posts_not_in_stranger_feed(alice, bob, client_for, make_post):
    client_for(bob).patch("/api/v1/users/me/", {"privacy_settings": {"profileVisibility": "private"}}, format="json")
    make_post(bob, "hidden by profile privacy")
    assert data(client_for(alice).get("/api/v1/posts/")) == []


def test_scope_filters(alice, bob, client_for, make_post):
    make_post(alice, "a")
    make_post(bob, "b")
    client_for(alice).post(f"/api/v1/users/{bob.id}/follow/")
    assert [p["caption"] for p in data(client_for(alice).get("/api/v1/posts/?scope=mine"))] == ["a"]
    assert [p["caption"] for p in data(client_for(alice).get(f"/api/v1/posts/?author={bob.id}"))] == ["b"]


def test_like_unlike_idempotent_with_exact_counts(alice, bob, client_for, make_post):
    pid = make_post(alice)["id"]
    cb = client_for(bob)
    assert data(cb.post(f"/api/v1/posts/{pid}/like/"))["likes_count"] == 1
    assert data(cb.post(f"/api/v1/posts/{pid}/like/"))["likes_count"] == 1  # no duplicate like
    post = data(cb.get(f"/api/v1/posts/{pid}/"))
    assert post["is_liked"] is True and post["likes_count"] == 1
    assert data(cb.delete(f"/api/v1/posts/{pid}/like/"))["likes_count"] == 0
    assert data(cb.delete(f"/api/v1/posts/{pid}/like/"))["likes_count"] == 0  # no negative counts


def test_save_unsave_and_saved_list(alice, bob, client_for, make_post):
    p1, p2 = make_post(alice, "one")["id"], make_post(alice, "two")["id"]
    cb = client_for(bob)
    cb.post(f"/api/v1/posts/{p1}/save/")
    cb.post(f"/api/v1/posts/{p2}/save/")
    cb.post(f"/api/v1/posts/{p2}/save/")
    assert [p["id"] for p in data(cb.get("/api/v1/posts/saved/"))] == [p2, p1]
    assert data(cb.get(f"/api/v1/posts/{p1}/"))["is_saved"] is True
    assert data(cb.delete(f"/api/v1/posts/{p1}/save/"))["saves_count"] == 0
    assert [p["id"] for p in data(cb.get("/api/v1/posts/saved/"))] == [p2]


def test_share_counts_public_posts_only(alice, bob, client_for, make_post):
    pid = make_post(alice)["id"]
    r = client_for(bob).post(f"/api/v1/posts/{pid}/share/")
    assert data(r)["shares_count"] == 1 and f"/feed/{pid}" in data(r)["url"]
    fid = make_post(alice, "f", visibility="FOLLOWERS")["id"]
    client_for(bob).post(f"/api/v1/users/{alice.id}/follow/")
    assert client_for(bob).post(f"/api/v1/posts/{fid}/share/").status_code == 403


def test_comments_crud_threads_and_permissions(alice, bob, carol, client_for, make_post):
    pid = make_post(alice)["id"]
    cb, ca = client_for(bob), client_for(alice)
    c = cb.post(f"/api/v1/posts/{pid}/comments/", {"content": "Nice!"}, format="json")
    assert c.status_code == 201
    cid = data(c)["id"]
    assert data(c)["post"] == pid and data(c)["author_id"] == bob.id and data(c)["author_name"]
    reply = ca.post(f"/api/v1/posts/{pid}/comments/", {"content": "Thanks", "parent_id": cid}, format="json")
    assert data(reply)["parent_id"] == cid
    assert ca.post(f"/api/v1/posts/{pid}/comments/", {"content": "bad", "parent_id": data(reply)["id"]}, format="json").status_code == 400  # one level only
    assert [x["content"] for x in data(ca.get(f"/api/v1/posts/{pid}/comments/"))] == ["Nice!", "Thanks"]
    assert data(ca.get(f"/api/v1/posts/{pid}/"))["comments_count"] == 2
    assert ca.post(f"/api/v1/posts/{pid}/comments/", {"content": "   "}, format="json").status_code == 400
    # edit: author only
    assert ca.patch(f"/api/v1/comments/{cid}/", {"content": "x"}, format="json").status_code == 403
    assert data(cb.patch(f"/api/v1/comments/{cid}/", {"content": "Nice trail!"}, format="json"))["edited"] is True
    # delete: stranger no, post owner yes (removes the reply too)
    assert client_for(carol).delete(f"/api/v1/comments/{cid}/").status_code == 403
    assert ca.delete(f"/api/v1/comments/{cid}/").status_code == 204
    assert data(ca.get(f"/api/v1/posts/{pid}/comments/")) == []
    assert data(ca.get(f"/api/v1/posts/{pid}/"))["comments_count"] == 0


def test_comments_from_blocked_users_are_hidden(alice, bob, carol, client_for, make_post):
    pid = make_post(alice)["id"]
    client_for(bob).post(f"/api/v1/posts/{pid}/comments/", {"content": "from bob"}, format="json")
    client_for(carol).post(f"/api/v1/posts/{pid}/comments/", {"content": "from carol"}, format="json")
    client_for(alice).post(f"/api/v1/users/{bob.id}/block/")
    assert [c["content"] for c in data(client_for(alice).get(f"/api/v1/posts/{pid}/comments/"))] == ["from carol"]


def test_media_upload_and_attach_rules(alice, bob, client_for):
    ca = client_for(alice)
    up = ca.post("/api/v1/media/", {"file": SimpleUploadedFile("p.png", png(), "image/png")}, format="multipart")
    assert up.status_code == 201
    mid = data(up)["id"]
    assert ca.post("/api/v1/media/", {"file": SimpleUploadedFile("x.png", b"not an image", "image/png")}, format="multipart").status_code == 400
    # someone else's media can't be attached
    assert client_for(bob).post("/api/v1/posts/", {"caption": "steal", "media_ids": [mid]}, format="json").status_code == 400
    r = ca.post("/api/v1/posts/", {"caption": "with photo", "media_ids": [mid]}, format="json")
    d = data(r)
    assert len(d["media"]) == 1 and d["photos"][0].startswith("http") and d["media"][0]["width"] == 30
    # a photo-only post is allowed, an already-used image is not
    assert ca.post("/api/v1/posts/", {"caption": "again", "media_ids": [mid]}, format="json").status_code == 400
    mid2 = data(ca.post("/api/v1/media/", {"file": SimpleUploadedFile("p.png", png(), "image/png")}, format="multipart"))["id"]
    assert ca.post("/api/v1/posts/", {"media_ids": [mid2]}, format="json").status_code == 201


def test_feed_query_count_is_flat(alice, bob, client_for, make_post, django_assert_max_num_queries):
    """The feed must not issue per-post queries (no N+1)."""
    ca, cb = client_for(alice), client_for(bob)
    for i in range(15):
        pid = make_post(bob, f"post {i}")["id"]
        ca.post(f"/api/v1/posts/{pid}/like/")
        ca.post(f"/api/v1/posts/{pid}/comments/", {"content": "c"}, format="json")
    with django_assert_max_num_queries(8):
        r = ca.get("/api/v1/posts/?limit=15")
    assert r.status_code == 200 and len(data(r)) == 15
    first = data(r)[0]
    assert first["is_liked"] is True and first["comments_count"] == 1 and first["author_username"]


def test_comment_list_query_count_is_flat(alice, bob, client_for, make_post, django_assert_max_num_queries):
    pid = make_post(alice)["id"]
    for i in range(12):
        client_for(bob).post(f"/api/v1/posts/{pid}/comments/", {"content": f"c{i}"}, format="json")
    with django_assert_max_num_queries(8):
        r = client_for(alice).get(f"/api/v1/posts/{pid}/comments/?limit=12")
    assert len(data(r)) == 12


def test_notifications_for_like_and_comment_dedupe(alice, bob, client_for, make_post):
    pid = make_post(alice)["id"]
    client_for(bob).post(f"/api/v1/posts/{pid}/like/")
    client_for(bob).delete(f"/api/v1/posts/{pid}/like/")
    client_for(bob).post(f"/api/v1/posts/{pid}/like/")  # like/unlike spam must not spam alice
    client_for(bob).post(f"/api/v1/posts/{pid}/comments/", {"content": "hi"}, format="json")
    kinds = [n["notification_type"] for n in data(client_for(alice).get("/api/v1/notifications/"))]
    assert sorted(kinds) == ["COMMENT", "LIKE"]
