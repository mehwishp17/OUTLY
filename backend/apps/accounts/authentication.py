from rest_framework import exceptions
from rest_framework_simplejwt.authentication import JWTAuthentication

SAFE = ("GET", "HEAD", "OPTIONS")


class ActiveJWTAuthentication(JWTAuthentication):
    """Bearer-JWT auth that re-checks the account state on every request, so a
    suspended user is locked out immediately (not when the token expires) and a
    restricted user is read-only."""

    def get_user(self, validated_token):
        user = super().get_user(validated_token)  # raises if missing/inactive
        if user.status in ("SUSPENDED", "DELETED"):
            raise exceptions.AuthenticationFailed("This account is not active.", code="account_disabled")
        return user

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None
        user, token = result
        if user.status == "RESTRICTED" and request.method not in SAFE and "/auth/" not in request.path:
            raise exceptions.PermissionDenied("Your account is restricted and can't make changes right now.")
        return user, token
