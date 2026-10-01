import re

from django.core.exceptions import ValidationError


def validate_strong_password(password):
    """Same five rules the frontend sign-up form shows."""
    missing = []
    if len(password) < 8:
        missing.append("at least 8 characters")
    if not re.search(r"[A-Z]", password):
        missing.append("one uppercase letter")
    if not re.search(r"[a-z]", password):
        missing.append("one lowercase letter")
    if not re.search(r"\d", password):
        missing.append("one number")
    if not re.search(r"[^A-Za-z0-9]", password):
        missing.append("one special character")
    if missing:
        raise ValidationError("Password must include: " + ", ".join(missing) + ".")
