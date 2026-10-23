import functools
import logging
import os
import threading

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.contrib.auth.tokens import default_token_generator
from django.core import signing
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework_simplejwt.tokens import RefreshToken

from apps.profiles.services import ProfileService

User = get_user_model()
security_log = logging.getLogger("outly.security")
email_log = logging.getLogger("outly.email")

VERIFY_SALT = "outly.verify-email"
VERIFY_MAX_AGE = 60 * 60 * 24 * 3

# Cap simultaneous password hashes per process. Argon2 uses ~46 MiB each, so an
# unbounded burst of logins could exhaust RAM on a small instance (and would be a
# cheap denial-of-service). Excess requests simply wait a few milliseconds.
_HASH_SLOTS = threading.BoundedSemaphore(int(os.environ.get("PASSWORD_HASH_CONCURRENCY", "2")))


@functools.lru_cache(maxsize=1)
def _dummy_hash():
    """Hash in the *currently preferred* algorithm, so an unknown email costs the
    same as a real one (no account enumeration by timing)."""
    return make_password("outly-dummy-password")


# Fixed, secret-free hints for the most common provider problems, keyed by exception class name.
_SEND_FAILURE_HINTS = {
    "SMTPAuthenticationError": " hint=the provider rejected the SMTP login; check EMAIL_HOST_USER and EMAIL_HOST_PASSWORD (the SMTP key)",
    "SMTPSenderRefused": " hint=the provider refused the sender; DEFAULT_FROM_EMAIL must be a verified sender",
    "SMTPNotSupportedError": " hint=check EMAIL_PORT with EMAIL_USE_TLS / EMAIL_USE_SSL",
    "TimeoutError": " hint=the SMTP server did not answer in time; check EMAIL_HOST, EMAIL_PORT and the network",
    "ConnectionRefusedError": " hint=nothing accepted the connection; check EMAIL_HOST and EMAIL_PORT",
}


def _deliver(subject, body, recipient, *, kind, user_id):
    """Sends one account email. Returns whether the mail backend accepted it; never raises.

    A failure is logged with safe context only (kind, user id, exception class): never the link or token,
    the message, the address, or the SMTP server's reply. Callers keep their generic public responses.
    "Accepted" means the mail backend took the message - not that it reached the inbox."""
    try:
        sent = send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [recipient], fail_silently=False)
    except Exception as exc:  # SMTP, network, TLS, auth or configuration errors
        name = type(exc).__name__
        email_log.error("email send failed kind=%s user_id=%s error=%s%s", kind, user_id, name, _SEND_FAILURE_HINTS.get(name, ""))
        return False
    if not sent:
        email_log.error("email not sent kind=%s user_id=%s error=backend_returned_0", kind, user_id)
        return False
    email_log.info("email accepted by the mail backend kind=%s user_id=%s", kind, user_id)
    return True


class AuthService:
    @staticmethod
    @transaction.atomic
    def register(*, full_name, email, password, phone=""):
        user = User.objects.create_user(
            email=email, password=password, phone=phone, terms_accepted_at=timezone.now()
        )
        ProfileService.create_for_user(user, full_name=full_name)
        transaction.on_commit(lambda: AuthService.send_verification_email(user))
        return user

    @staticmethod
    def authenticate(email, password):
        """Returns the user or None. Constant-ish time for unknown emails."""
        from django.contrib.auth.hashers import check_password

        user = User.objects.select_related("profile").filter(email__iexact=email.strip()).first()
        if user is None:
            with _HASH_SLOTS:
                check_password(password, _dummy_hash())
            return None
        with _HASH_SLOTS:
            valid = user.check_password(password)  # also upgrades old hashes to Argon2id
        if not valid:
            return None
        if not user.is_active or user.status in ("SUSPENDED", "DELETED"):
            return None
        return user

    @staticmethod
    def issue_tokens(user):
        refresh = RefreshToken.for_user(user)
        refresh["role"] = user.role
        User.objects.filter(pk=user.pk).update(last_login=timezone.now())
        return {"access": str(refresh.access_token), "refresh": str(refresh)}

    # ---- email verification ----
    @staticmethod
    def verification_token(user):
        return signing.dumps({"uid": user.pk, "email": user.email}, salt=VERIFY_SALT)

    @staticmethod
    def send_verification_email(user):
        link = f"{settings.FRONTEND_URL}/verify-email?token={AuthService.verification_token(user)}"
        return _deliver(
            "Verify your OUTLY email",
            f"Welcome to OUTLY! Confirm your email address:\n\n{link}\n\nThis link expires in 3 days.",
            user.email,
            kind="verify_email",
            user_id=user.pk,
        )

    @staticmethod
    def verify_email(token):
        try:
            payload = signing.loads(token, salt=VERIFY_SALT, max_age=VERIFY_MAX_AGE)
        except signing.BadSignature:
            return None
        user = User.objects.filter(pk=payload["uid"], email=payload["email"]).first()
        if user and not user.email_verified:
            user.email_verified = True
            user.save(update_fields=["email_verified", "updated_at"])
        return user

    # ---- password reset ----
    @staticmethod
    def send_password_reset(email):
        """Always silent about whether the email exists (no enumeration)."""
        user = User.objects.filter(email__iexact=email.strip(), is_active=True).first()
        if not user:
            return False  # nothing is sent; the caller's public response is the same either way
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
        return _deliver(
            "Reset your OUTLY password",
            f"Use this link to choose a new password:\n\n{link}\n\nIf you didn't ask for this, ignore this email.",
            user.email,
            kind="password_reset",
            user_id=user.pk,
        )

    @staticmethod
    @transaction.atomic
    def confirm_password_reset(uid, token, new_password):
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid)))
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return None
        if not default_token_generator.check_token(user, token):
            return None
        user.set_password(new_password)
        user.save(update_fields=["password", "updated_at"])
        AuthService.revoke_all_sessions(user)  # signs out every device
        security_log.info("password reset completed user_id=%s", user.pk)
        return user

    # ---- sessions ----
    @staticmethod
    def revoke_all_sessions(user):
        from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

        tokens = OutstandingToken.objects.filter(user=user)
        BlacklistedToken.objects.bulk_create(
            [BlacklistedToken(token=t) for t in tokens.exclude(blacklistedtoken__isnull=False)],
            ignore_conflicts=True,
        )
