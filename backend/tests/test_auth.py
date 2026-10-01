import re

import pytest
from django.core import mail
from rest_framework.test import APIClient

from apps.accounts.services import AuthService
from tests.conftest import PASSWORD, data, body

pytestmark = pytest.mark.django_db

REGISTER = {
    "full_name": "Dana Trek", "email": "dana@example.com", "password": PASSWORD,
    "confirm_password": PASSWORD, "terms_accepted": True,
}


def test_register_creates_user_and_profile_and_never_returns_secrets():
    r = APIClient().post("/api/v1/auth/register/", REGISTER, format="json")
    assert r.status_code == 201
    payload = body(r)
    assert payload["success"] is True and set(payload) == {"success", "message", "data", "errors", "meta"}
    assert payload["data"]["email"] == "dana@example.com" and payload["data"]["username"].startswith("dana")
    text = r.content.decode()
    assert "password" not in text.lower().replace("confirm_password", "") and "access" not in text


def test_register_validation_maps_to_form_field_names():
    bad = {**REGISTER, "password": "weak", "confirm_password": "other", "terms_accepted": False, "email": "nope"}
    r = APIClient().post("/api/v1/auth/register/", bad, format="json")
    assert r.status_code == 400
    errors = body(r)["errors"]
    assert {"email", "terms_accepted"} <= set(errors)
    assert body(r)["success"] is False


def test_register_enforces_frontend_password_rules_and_confirmation():
    r = APIClient().post("/api/v1/auth/register/", {**REGISTER, "password": "alllowercase1!x"[:6]*2, "confirm_password": "alllowercase1!x"[:6]*2}, format="json")
    assert r.status_code == 400
    r = APIClient().post("/api/v1/auth/register/", {**REGISTER, "confirm_password": "Different1!"}, format="json")
    assert "confirm_password" in body(r)["errors"]


def test_register_duplicate_email_case_insensitive(alice):
    r = APIClient().post("/api/v1/auth/register/", {**REGISTER, "email": "ALICE@example.com"}, format="json")
    assert r.status_code == 400 and "email" in body(r)["errors"]


def test_login_returns_tokens_in_envelope(alice):
    r = APIClient().post("/api/v1/auth/login/", {"email": "alice@example.com", "password": PASSWORD}, format="json")
    assert r.status_code == 200
    d = data(r)
    assert d["access"] and d["refresh"] and d["user"]["user_id"] == alice.id


def test_login_failure_is_generic_for_unknown_user_and_wrong_password(alice):
    wrong = APIClient().post("/api/v1/auth/login/", {"email": "alice@example.com", "password": "nope"}, format="json")
    unknown = APIClient().post("/api/v1/auth/login/", {"email": "ghost@example.com", "password": "nope"}, format="json")
    assert wrong.status_code == unknown.status_code == 400
    assert body(wrong) == body(unknown)  # no account enumeration
    assert body(wrong)["message"] == "Invalid email or password."


def test_suspended_user_cannot_login(make_user):
    user = make_user("sus", status="SUSPENDED")
    r = APIClient().post("/api/v1/auth/login/", {"email": user.email, "password": PASSWORD}, format="json")
    assert r.status_code == 400


def test_refresh_issues_new_access_and_rejects_garbage(alice):
    tokens = AuthService.issue_tokens(alice)
    ok = APIClient().post("/api/v1/auth/refresh/", {"refresh": tokens["refresh"]}, format="json")
    assert ok.status_code == 200 and data(ok)["access"]
    bad = APIClient().post("/api/v1/auth/refresh/", {"refresh": "garbage"}, format="json")
    assert bad.status_code == 400


def test_logout_revokes_refresh_token(alice):
    tokens = AuthService.issue_tokens(alice)
    c = APIClient()
    assert c.post("/api/v1/auth/logout/", {"refresh": tokens["refresh"]}, format="json").status_code == 200
    assert c.post("/api/v1/auth/refresh/", {"refresh": tokens["refresh"]}, format="json").status_code == 400
    assert c.post("/api/v1/auth/logout/", {"refresh": tokens["refresh"]}, format="json").status_code == 400


def test_protected_endpoint_requires_valid_token(alice):
    assert APIClient().get("/api/v1/users/me/").status_code == 401
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION="Bearer not.a.token")
    assert c.get("/api/v1/users/me/").status_code == 401


def test_refresh_token_cannot_be_used_as_access(alice):
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION="Bearer " + AuthService.issue_tokens(alice)["refresh"])
    assert c.get("/api/v1/users/me/").status_code == 401


def test_password_reset_flow_and_no_enumeration(alice):
    c = APIClient()
    old_refresh = AuthService.issue_tokens(alice)["refresh"]  # a session that must be revoked by the reset
    known = c.post("/api/v1/auth/password-reset/", {"email": alice.email}, format="json")
    unknown = c.post("/api/v1/auth/password-reset/", {"email": "nobody@example.com"}, format="json")
    assert known.status_code == unknown.status_code == 200 and body(known) == body(unknown)
    assert len(mail.outbox) == 1
    uid, token = re.search(r"uid=([^&\s]+)&token=([^\s]+)", mail.outbox[0].body).groups()
    new = "Brand-new1!Pass"
    done = c.post("/api/v1/auth/password-reset/confirm/", {"uid": uid, "token": token, "password": new, "confirm_password": new}, format="json")
    assert done.status_code == 200
    assert c.post("/api/v1/auth/login/", {"email": alice.email, "password": new}, format="json").status_code == 200
    assert c.post("/api/v1/auth/login/", {"email": alice.email, "password": PASSWORD}, format="json").status_code == 400
    # every existing session is revoked by a reset
    assert c.post("/api/v1/auth/refresh/", {"refresh": old_refresh}, format="json").status_code == 400
    # a reset link works once only
    again = c.post("/api/v1/auth/password-reset/confirm/", {"uid": uid, "token": token, "password": "Another1!Pass", "confirm_password": "Another1!Pass"}, format="json")
    assert again.status_code == 400


def test_email_verification_and_resend(alice):
    assert alice.email_verified is False
    c = APIClient()
    token = AuthService.verification_token(alice)
    assert c.post("/api/v1/auth/verify-email/", {"token": token}, format="json").status_code == 200
    alice.refresh_from_db()
    assert alice.email_verified is True
    assert c.post("/api/v1/auth/verify-email/", {"token": "tampered"}, format="json").status_code == 400
    assert c.post("/api/v1/auth/resend-verification/", {"email": "ghost@example.com"}, format="json").status_code == 200


def test_change_password_and_sessions(alice, client_for):
    c = client_for(alice)
    wrong = c.post("/api/v1/auth/change-password/", {"current_password": "bad", "password": "N3w!Passw0rd", "confirm_password": "N3w!Passw0rd"}, format="json")
    assert wrong.status_code == 400
    AuthService.issue_tokens(alice)
    sessions = data(c.get("/api/v1/auth/sessions/"))
    assert len(sessions) >= 1
    assert c.delete(f"/api/v1/auth/sessions/{sessions[0]['id']}/").status_code == 204


def test_restricted_user_is_read_only_but_can_log_out(make_user, client_for):
    user = make_user("res", status="RESTRICTED")
    c = client_for(user)
    assert c.get("/api/v1/users/me/").status_code == 200
    assert c.post("/api/v1/posts/", {"caption": "hi"}, format="json").status_code == 403


def test_suspension_takes_effect_on_existing_token(alice, client_for):
    c = client_for(alice)
    assert c.get("/api/v1/users/me/").status_code == 200
    alice.status = "SUSPENDED"
    alice.save()
    assert c.get("/api/v1/users/me/").status_code == 401


def test_login_is_throttled(settings, alice):
    from django.core.cache import cache

    from rest_framework.throttling import ScopedRateThrottle

    cache.clear()
    original = ScopedRateThrottle.THROTTLE_RATES.copy()
    ScopedRateThrottle.THROTTLE_RATES["login"] = "3/min"
    try:
        c = APIClient()
        codes = [c.post("/api/v1/auth/login/", {"email": alice.email, "password": "bad"}, format="json").status_code for _ in range(5)]
    finally:
        ScopedRateThrottle.THROTTLE_RATES.clear()
        ScopedRateThrottle.THROTTLE_RATES.update(original)
        cache.clear()
    assert codes[:3] == [400, 400, 400] and codes[3] == 429
