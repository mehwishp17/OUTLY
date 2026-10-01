"""Cross-cutting security checks (IDOR, auth on every route) and the frontend/API contract."""
import re

import pytest
import yaml
from django.urls import get_resolver
from rest_framework.test import APIClient

from tests.conftest import body, data

pytestmark = pytest.mark.django_db

PUBLIC = {"/api/v1/health/", "/api/v1/auth/register/", "/api/v1/auth/login/", "/api/v1/auth/refresh/",
          "/api/v1/auth/logout/", "/api/v1/auth/password-reset/", "/api/v1/auth/password-reset/confirm/",
          "/api/v1/auth/verify-email/", "/api/v1/auth/resend-verification/"}


def _routes():
    out = []

    def walk(patterns, prefix=""):
        for p in patterns:
            if hasattr(p, "url_patterns"):
                walk(p.url_patterns, prefix + str(p.pattern))
            else:
                out.append(prefix + str(p.pattern))

    walk(get_resolver().url_patterns)
    return [r for r in out if r.startswith("api/v1/")]


def test_every_api_route_rejects_anonymous_requests():
    """No endpoint is accidentally public: everything except the auth bootstrap returns 401."""
    client = APIClient()
    checked = 0
    for route in _routes():
        url = "/" + re.sub(r"<int:\w+>", "1", route)
        if url in PUBLIC:
            continue
        for method in ("get", "post"):
            status = getattr(client, method)(url).status_code
            assert status in (401, 405), f"{method.upper()} {url} -> {status}"
        checked += 1
    assert checked > 60


def test_idor_resources_return_404_not_403_for_foreign_private_objects(alice, bob, client_for):
    ca = client_for(alice)
    act = ca.post("/api/v1/activities/", {"title": "Secret plan", "privacy": "PRIVATE"}, format="json").json()["data"]["id"]
    cid = client_for(alice).post("/api/v1/chats/direct/", {"user_id": bob.id}, format="json").json()["data"]["id"]
    cb = client_for(bob)
    carol_client = APIClient()
    assert cb.get(f"/api/v1/activities/{act}/").status_code == 404
    assert cb.patch(f"/api/v1/activities/{act}/", {"title": "x"}, format="json").status_code == 404
    assert cb.get("/api/v1/chats/conversations/").status_code == 200  # bob IS a member of this one
    assert carol_client.get(f"/api/v1/chats/conversations/{cid}/messages/").status_code == 401


def test_sequential_ids_do_not_leak_other_users_data(alice, bob, carol, client_for):
    cid = client_for(alice).post("/api/v1/chats/direct/", {"user_id": bob.id}, format="json").json()["data"]["id"]
    for i in range(cid - 1, cid + 3):  # probe neighbouring ids as an outsider
        assert client_for(carol).get(f"/api/v1/chats/conversations/{i}/messages/").status_code == 404
        assert client_for(carol).post(f"/api/v1/chats/conversations/{i}/read/").status_code == 404


def test_responses_never_contain_password_or_token_material(alice, client_for):
    for url in ("/api/v1/users/me/", f"/api/v1/users/{alice.id}/", "/api/v1/auth/sessions/"):
        text = client_for(alice).get(url).content.decode().lower()
        assert "pbkdf2" not in text and "md5$" not in text and "password" not in text and "eyj" not in text


def test_error_responses_do_not_leak_internals(alice, client_for):
    r = client_for(alice).get("/api/v1/places/?near=garbage")
    assert "Traceback" not in r.content.decode() and body(r)["success"] is False
    assert client_for(alice).get("/api/v1/nope/").status_code == 404


def test_malformed_json_and_oversized_input_are_400(alice, client_for):
    c = client_for(alice)
    assert c.post("/api/v1/posts/", data="{bad json", content_type="application/json").status_code == 400
    assert c.post("/api/v1/posts/", {"caption": "x" * 5000}, format="json").status_code == 400


def test_sql_injection_strings_are_inert(alice, client_for):
    c = client_for(alice)
    for evil in ("'; DROP TABLE posts_post;--", "\" OR 1=1 --"):
        assert c.get("/api/v1/places/", {"search": evil}).status_code == 200
        assert c.get("/api/v1/search/", {"q": evil}).status_code == 200
        assert c.get("/api/v1/users/", {"search": evil}).status_code == 200


def test_xss_payload_is_stored_verbatim_and_served_as_json(alice, client_for):
    payload = "<script>alert(1)</script>"
    r = client_for(alice).post("/api/v1/posts/", {"caption": payload}, format="json")
    assert r["Content-Type"].startswith("application/json") and r["X-Content-Type-Options"] == "nosniff"
    assert data(r)["caption"] == payload  # output encoding is the client's job; JSON never renders as HTML


def test_cors_only_allows_configured_origin(alice):
    c = APIClient()
    ok = c.options("/api/v1/health/", HTTP_ORIGIN="http://localhost:3000", HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET")
    bad = c.options("/api/v1/health/", HTTP_ORIGIN="https://evil.example", HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET")
    assert ok.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert "access-control-allow-origin" not in bad.headers


# ---------------- health / schema / frontend contract ----------------
def test_health_endpoint_public_and_secret_free():
    r = APIClient().get("/api/v1/health/")
    assert r.status_code == 200 and data(r) == {"status": "ok", "database": "ok"}


def test_openapi_schema_reflects_real_routes_and_envelope():
    r = APIClient().get("/api/schema/")
    assert r.status_code == 200
    spec = yaml.safe_load(r.content)
    paths = spec["paths"]
    for must in ("/api/v1/auth/login/", "/api/v1/posts/", "/api/v1/groups/", "/api/v1/partner-requests/",
                 "/api/v1/chats/conversations/", "/api/v1/notifications/", "/api/v1/events/{event_id}/join/",
                 "/api/v1/reports/", "/api/v1/admin/analytics/overview/", "/api/v1/search/"):
        assert must in paths, must
    login_ok = paths["/api/v1/auth/login/"]["post"]["responses"]["200"]["content"]["application/json"]["schema"]
    assert set(login_ok["properties"]) >= {"success", "message", "data", "errors", "meta"}
    # every documented route exists in the URLconf (no fake endpoints)
    real = {"/" + re.sub(r"<int:(\w+)>", r"{\1}", route) for route in _routes()}
    assert set(paths) - {"/api/schema/"} <= real
    assert APIClient().get("/api/docs/").status_code == 200


def test_frontend_feed_contract(alice, bob, client_for, make_post):
    """Exactly what lib/api/feed.ts reads: posts, comments, users/{id}, users/me."""
    pid = make_post(bob, "Contract post")["id"]
    client_for(alice).post(f"/api/v1/posts/{pid}/comments/", {"content": "c1"}, format="json")
    posts = data(client_for(alice).get("/api/v1/posts/"))
    p = posts[0]
    assert isinstance(p["id"], int) and isinstance(p["author_id"], int)
    assert p["caption"] == "Contract post" and p["status"] == "ACTIVE"
    assert p["created_at"] and p["updated_at"]  # frontend compares them to detect edits
    comment = data(client_for(alice).get(f"/api/v1/posts/{pid}/comments/"))[0]
    assert comment["post"] == pid and comment["author_id"] == alice.id and comment["content"] == "c1" and comment["created_at"]
    author = data(client_for(alice).get(f"/api/v1/users/{bob.id}/"))
    assert author["user_id"] == bob.id and author["display_name"] and author["username"] and "photo" in author
    me = data(client_for(alice).get("/api/v1/users/me/"))
    assert {"user_id", "email", "username", "display_name", "bio", "interests", "photo"} <= set(me)
    # PATCH body the profile screen sends
    r = client_for(alice).patch("/api/v1/users/me/", {"display_name": "A", "username": "alice_new", "bio": "b", "interests": ["x"]}, format="json")
    assert r.status_code == 200 and body(r)["success"] is True


def test_frontend_auth_envelope_contract():
    c = APIClient()
    reg = c.post("/api/v1/auth/register/", {"full_name": "Zed Z", "email": "z@example.com", "password": "Str0ng!Pass", "confirm_password": "Str0ng!Pass", "terms_accepted": True}, format="json")
    assert reg.status_code == 201 and "access" not in reg.content.decode()  # register returns no tokens (frontend logs in after)
    login = c.post("/api/v1/auth/login/", {"email": "z@example.com", "password": "Str0ng!Pass"}, format="json")
    d = data(login)
    assert d["access"] and d["refresh"]  # frontend findString("access"/"refresh") at any depth
    refreshed = c.post("/api/v1/auth/refresh/", {"refresh": d["refresh"]}, format="json")
    assert data(refreshed)["access"]  # frontend reads data.access
    bad = c.post("/api/v1/auth/login/", {"email": "z@example.com", "password": "no"}, format="json")
    assert body(bad)["errors"] == {"credentials": ["Invalid email or password."]}
    err = c.post("/api/v1/auth/register/", {}, format="json")
    assert set(body(err)["errors"]) >= {"full_name", "email", "password", "confirm_password", "terms_accepted"}
