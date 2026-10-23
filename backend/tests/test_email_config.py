"""Email configuration and safe failure handling.

No test here sends a real email: delivery is Django's in-memory mailbox or a fake that raises.
These tests prove the configuration is parsed and failures are handled safely; they do NOT prove
that a message reaches an inbox (that needs a real-inbox test with a configured provider).
"""
import logging
import os
import smtplib
import subprocess
import sys
from pathlib import Path

import pytest
from django.core import mail
from rest_framework.test import APIClient

from apps.accounts import services
from apps.accounts.services import AuthService
from tests.conftest import PASSWORD, body

pytestmark = pytest.mark.django_db

BACKEND_DIR = Path(__file__).resolve().parent.parent
EMAIL_VARS = (
    "EMAIL_BACKEND", "EMAIL_HOST", "EMAIL_PORT", "EMAIL_HOST_USER", "EMAIL_HOST_PASSWORD",
    "EMAIL_USE_TLS", "EMAIL_USE_SSL", "EMAIL_TIMEOUT", "DEFAULT_FROM_EMAIL",
)
SMTP = "django.core.mail.backends.smtp.EmailBackend"
CONSOLE = "django.core.mail.backends.console.EmailBackend"


def load_settings(**overrides):
    """Imports config.settings in a clean subprocess. Every email variable is set explicitly (empty = unset),
    so nothing in a developer's local backend/.env can leak into the result."""
    env = {**os.environ, "DJANGO_DEBUG": "true", "DJANGO_SECRET_KEY": "x" * 50, **{name: "" for name in EMAIL_VARS}, **overrides}
    code = (
        "import config.settings as s, json;"
        "print(json.dumps({k: getattr(s, k) for k in ('EMAIL_BACKEND','EMAIL_HOST','EMAIL_PORT','EMAIL_HOST_USER',"
        "'EMAIL_HOST_PASSWORD','EMAIL_USE_TLS','EMAIL_USE_SSL','EMAIL_TIMEOUT','DEFAULT_FROM_EMAIL')}))"
    )
    return subprocess.run([sys.executable, "-B", "-c", code], cwd=BACKEND_DIR, env=env, capture_output=True, text=True, timeout=60)


def parsed(**overrides):
    import json

    result = load_settings(**overrides)
    assert result.returncode == 0, result.stderr[-400:]
    return json.loads(result.stdout.strip().splitlines()[-1])


# ---------------- settings parsing ----------------
def test_defaults_keep_the_console_backend_when_smtp_is_not_configured():
    cfg = parsed()
    assert cfg["EMAIL_BACKEND"] == CONSOLE
    assert cfg["EMAIL_USE_TLS"] is False and cfg["EMAIL_USE_SSL"] is False
    assert cfg["DEFAULT_FROM_EMAIL"] == "OUTLY <no-reply@outly.local>"


def test_brevo_smtp_configuration_is_parsed_from_the_environment():
    cfg = parsed(
        EMAIL_HOST="smtp-relay.brevo.com", EMAIL_PORT="587", EMAIL_USE_TLS="true", EMAIL_USE_SSL="false",
        EMAIL_HOST_USER="test-smtp-login", EMAIL_HOST_PASSWORD="test-smtp-key", DEFAULT_FROM_EMAIL="OUTLY <sender@example.test>",
    )
    assert cfg["EMAIL_BACKEND"] == SMTP  # EMAIL_HOST set, no explicit backend -> SMTP
    assert cfg["EMAIL_HOST"] == "smtp-relay.brevo.com" and cfg["EMAIL_PORT"] == 587
    assert cfg["EMAIL_USE_TLS"] is True and cfg["EMAIL_USE_SSL"] is False
    assert cfg["EMAIL_HOST_USER"] == "test-smtp-login" and cfg["EMAIL_HOST_PASSWORD"] == "test-smtp-key"
    assert cfg["DEFAULT_FROM_EMAIL"] == "OUTLY <sender@example.test>"
    assert cfg["EMAIL_TIMEOUT"] == 10  # a stuck server cannot hang the request


def test_an_explicit_email_backend_always_wins():
    assert parsed(EMAIL_HOST="smtp-relay.brevo.com", EMAIL_BACKEND=CONSOLE)["EMAIL_BACKEND"] == CONSOLE
    assert parsed(EMAIL_BACKEND=SMTP)["EMAIL_BACKEND"] == SMTP


def test_tls_and_ssl_cannot_both_be_enabled():
    result = load_settings(EMAIL_HOST="smtp-relay.brevo.com", EMAIL_USE_TLS="true", EMAIL_USE_SSL="true")
    assert result.returncode != 0
    assert "cannot both be enabled" in result.stderr


def test_malformed_numbers_and_booleans_fall_back_safely():
    cfg = parsed(EMAIL_HOST="smtp-relay.brevo.com", EMAIL_PORT="not-a-number", EMAIL_USE_TLS="maybe", EMAIL_TIMEOUT="soon")
    assert cfg["EMAIL_PORT"] == 25 and cfg["EMAIL_USE_TLS"] is False and cfg["EMAIL_TIMEOUT"] == 10


# ---------------- sending: success path ----------------
def test_password_reset_and_verification_mail_use_the_existing_links_and_are_accepted(alice, settings):
    settings.FRONTEND_URL = "https://app.example.test"
    assert AuthService.send_password_reset(alice.email) is True
    assert AuthService.send_verification_email(alice) is True
    reset, verify = mail.outbox
    assert reset.to == [alice.email] and "https://app.example.test/reset-password?uid=" in reset.body and "&token=" in reset.body
    assert verify.to == [alice.email] and "https://app.example.test/verify-email?token=" in verify.body
    assert AuthService.send_password_reset("nobody@example.com") is False  # unknown address: nothing sent
    assert len(mail.outbox) == 2


def test_send_uses_the_configured_sender_and_never_fails_silently(alice, monkeypatch, settings):
    settings.DEFAULT_FROM_EMAIL = "OUTLY <sender@example.test>"
    seen = {}

    def fake_send_mail(subject, message, from_email, recipient_list, **kwargs):
        seen.update(from_email=from_email, recipients=recipient_list, **kwargs)
        return 1

    monkeypatch.setattr(services, "send_mail", fake_send_mail)
    assert AuthService.send_password_reset(alice.email) is True
    assert seen == {"from_email": "OUTLY <sender@example.test>", "recipients": [alice.email], "fail_silently": False}


# ---------------- sending: failures ----------------
@pytest.fixture
def smtp_failure(monkeypatch, settings):
    """send_mail raises an SMTP error whose text contains sensitive-looking server details."""
    settings.EMAIL_HOST_PASSWORD = "dummy-smtp-key-123"

    def boom(*args, **kwargs):
        raise smtplib.SMTPAuthenticationError(535, b"auth failed for dummy-smtp-key-123 on smtp.internal.example")

    monkeypatch.setattr(services, "send_mail", boom)


def assert_log_is_safe(caplog, user, secrets=()):
    text = caplog.text
    assert "email send failed" in text and "kind=" in text and f"user_id={user.pk}" in text
    assert "SMTPAuthenticationError" in text  # the exception class is useful and safe
    for forbidden in ("reset-password", "verify-email", "token", "uid=", user.email, "dummy-smtp-key-123",
                      "smtp.internal.example", "auth failed", "Use this link", "Welcome to OUTLY", *secrets):
        assert forbidden not in text, forbidden


def test_a_failed_password_reset_send_is_handled_safely_and_logged_without_secrets(alice, smtp_failure, caplog):
    caplog.set_level(logging.INFO)
    assert AuthService.send_password_reset(alice.email) is False  # reported as not sent, and no exception escapes
    assert_log_is_safe(caplog, alice)
    assert "kind=password_reset" in caplog.text


def test_a_failed_verification_send_is_handled_safely_and_logged_without_secrets(alice, smtp_failure, caplog):
    caplog.set_level(logging.INFO)
    assert AuthService.send_verification_email(alice) is False
    assert_log_is_safe(caplog, alice)
    assert "kind=verify_email" in caplog.text


def test_a_backend_that_sends_nothing_is_reported_as_a_failure(alice, monkeypatch, caplog):
    caplog.set_level(logging.INFO)
    monkeypatch.setattr(services, "send_mail", lambda *a, **k: 0)
    assert AuthService.send_password_reset(alice.email) is False
    assert "backend_returned_0" in caplog.text and "token" not in caplog.text


# ---------------- public behaviour stays the same when sending fails ----------------
def test_password_reset_response_stays_generic_for_known_and_unknown_addresses_even_when_sending_fails(alice, smtp_failure):
    client = APIClient()
    known = client.post("/api/v1/auth/password-reset/", {"email": alice.email}, format="json")
    unknown = client.post("/api/v1/auth/password-reset/", {"email": "nobody@example.com"}, format="json")
    assert known.status_code == unknown.status_code == 200
    assert body(known) == body(unknown)
    for response in (known, unknown):
        text = response.content.decode()
        assert "smtp" not in text.lower() and "dummy-smtp-key" not in text and "535" not in text


def test_registration_still_succeeds_when_the_verification_email_cannot_be_sent(smtp_failure, caplog, django_capture_on_commit_callbacks):
    caplog.set_level(logging.INFO)
    payload = {"full_name": "New Person", "email": "new.person@example.com", "password": PASSWORD, "confirm_password": PASSWORD, "terms_accepted": True}
    with django_capture_on_commit_callbacks(execute=True):
        response = APIClient().post("/api/v1/auth/register/", payload, format="json")
    assert response.status_code == 201
    assert "email send failed" in caplog.text and "new.person@example.com" not in caplog.text


def test_resend_verification_response_is_generic_when_sending_fails(make_user, smtp_failure):
    user = make_user("unverified")
    assert user.email_verified is False
    response = APIClient().post("/api/v1/auth/resend-verification/", {"email": user.email}, format="json")
    unknown = APIClient().post("/api/v1/auth/resend-verification/", {"email": "nobody@example.com"}, format="json")
    assert response.status_code == unknown.status_code == 200 and body(response) == body(unknown)


def test_the_reset_and_verification_flows_still_work_end_to_end_with_the_in_memory_mailbox(alice):
    import re

    AuthService.send_password_reset(alice.email)
    uid, token = re.search(r"uid=([^&\s]+)&token=([^\s]+)", mail.outbox[0].body).groups()
    new = "Brand-new1!Pass"
    done = APIClient().post(
        "/api/v1/auth/password-reset/confirm/", {"uid": uid, "token": token, "password": new, "confirm_password": new}, format="json"
    )
    assert done.status_code == 200
    AuthService.send_verification_email(alice)
    verify_token = re.search(r"token=([^\s]+)", mail.outbox[1].body).group(1)
    assert APIClient().post("/api/v1/auth/verify-email/", {"token": verify_token}, format="json").status_code == 200


# ---------------- diagnostics: success signal and provider hints ----------------
def test_an_accepted_send_is_logged_with_safe_context_only(alice, caplog):
    caplog.set_level(logging.INFO)
    assert AuthService.send_password_reset(alice.email) is True
    assert f"email accepted by the mail backend kind=password_reset user_id={alice.pk}" in caplog.text
    for forbidden in ("reset-password", "token", "uid=", alice.email, "Use this link"):
        assert forbidden not in caplog.text, forbidden


@pytest.mark.parametrize(
    "error, hint",
    [
        (smtplib.SMTPAuthenticationError(535, b"server reply with a secret"), "check EMAIL_HOST_USER and EMAIL_HOST_PASSWORD"),
        (smtplib.SMTPSenderRefused(550, b"server reply", "sender@example.test"), "DEFAULT_FROM_EMAIL must be a verified sender"),
        (TimeoutError("server reply"), "did not answer in time"),
    ],
)
def test_common_provider_failures_get_a_fixed_hint_without_leaking_the_error_text(alice, monkeypatch, caplog, error, hint):
    caplog.set_level(logging.INFO)

    def boom(*args, **kwargs):
        raise error

    monkeypatch.setattr(services, "send_mail", boom)
    assert AuthService.send_password_reset(alice.email) is False
    assert hint in caplog.text
    for forbidden in ("server reply", "secret", "sender@example.test", alice.email, "reset-password", "token"):
        assert forbidden not in caplog.text, forbidden
