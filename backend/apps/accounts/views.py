import logging

from django.contrib.auth import get_user_model
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from . import serializers as s
from .services import AuthService

User = get_user_model()
security_log = logging.getLogger("outly.security")


def ok(data=None, message="", code=status.HTTP_200_OK):
    response = Response(data, status=code)
    response.message = message
    return response


class PublicView(APIView):
    authentication_classes: list = []
    permission_classes = [AllowAny]


class RegisterView(PublicView):
    throttle_scope = "register"

    @extend_schema(request=s.RegisterSerializer, responses={201: s.RegisteredUserSerializer})
    def post(self, request):
        serializer = s.RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = AuthService.register(
            full_name=serializer.validated_data["full_name"].strip(),
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
            phone=serializer.validated_data.get("phone", ""),
        )
        user = User.objects.select_related("profile").get(pk=user.pk)
        return ok(s.RegisteredUserSerializer(user).data, "Account created successfully.", status.HTTP_201_CREATED)


class LoginView(PublicView):
    throttle_scope = "login"

    @extend_schema(request=s.LoginSerializer, responses={200: s.LoginDataSerializer})
    def post(self, request):
        serializer = s.LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = AuthService.authenticate(serializer.validated_data["email"], serializer.validated_data["password"])
        if user is None:
            security_log.warning("login failed ip=%s", request.META.get("REMOTE_ADDR"))
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"credentials": ["Invalid email or password."]})
        data = {**AuthService.issue_tokens(user), "user": s.RegisteredUserSerializer(user).data}
        return ok(data, "Login successful.")


class RefreshView(PublicView):
    throttle_scope = "login"

    @extend_schema(request=s.RefreshSerializer, responses={200: s.AccessSerializer})
    def post(self, request):
        serializer = s.RefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            refresh = RefreshToken(serializer.validated_data["refresh"])
            user = User.objects.filter(pk=refresh["user_id"]).only("status", "is_active", "role").first()
        except TokenError:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"refresh": ["Token is invalid or expired."]}) from None
        if user is None or not user.is_active or user.status in ("SUSPENDED", "DELETED"):
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"refresh": ["Token is invalid or expired."]})
        access = refresh.access_token
        access["role"] = user.role
        return ok({"access": str(access)}, "Token refreshed.")


class LogoutView(PublicView):
    @extend_schema(request=s.RefreshSerializer, responses={200: None})
    def post(self, request):
        serializer = s.RefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            RefreshToken(serializer.validated_data["refresh"]).blacklist()
        except TokenError:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"refresh": ["Token is invalid or already revoked."]}) from None
        return ok({}, "Logged out.")


class PasswordResetView(PublicView):
    throttle_scope = "password_reset"

    @extend_schema(request=s.PasswordResetRequestSerializer, responses={200: None})
    def post(self, request):
        serializer = s.PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        AuthService.send_password_reset(serializer.validated_data["email"])
        return ok({}, "If this email is registered with OUTLY, reset instructions have been sent.")


class PasswordResetConfirmView(PublicView):
    throttle_scope = "password_reset"

    @extend_schema(request=s.PasswordResetConfirmSerializer, responses={200: None})
    def post(self, request):
        serializer = s.PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = AuthService.confirm_password_reset(
            serializer.validated_data["uid"], serializer.validated_data["token"], serializer.validated_data["password"]
        )
        if user is None:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"token": ["This reset link is invalid or has expired."]})
        return ok({}, "Your password has been reset. Please log in.")


class VerifyEmailView(PublicView):
    throttle_scope = "verify_email"

    @extend_schema(request=s.VerifyEmailSerializer, responses={200: None})
    def post(self, request):
        serializer = s.VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if AuthService.verify_email(serializer.validated_data["token"]) is None:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"token": ["This verification link is invalid or has expired."]})
        return ok({}, "Email verified.")


class ResendVerificationView(PublicView):
    throttle_scope = "verify_email"

    @extend_schema(request=s.ResendVerificationSerializer, responses={200: None})
    def post(self, request):
        serializer = s.ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(email__iexact=serializer.validated_data["email"], email_verified=False).first()
        if user:
            AuthService.send_verification_email(user)
        return ok({}, "If this email needs verification, a new link has been sent.")


class ChangePasswordView(APIView):
    throttle_scope = "password_reset"

    @extend_schema(request=s.ChangePasswordSerializer, responses={200: None})
    def post(self, request):
        serializer = s.ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        if not request.user.check_password(serializer.validated_data["current_password"]):
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"current_password": ["Current password is incorrect."]})
        request.user.set_password(serializer.validated_data["password"])
        request.user.save(update_fields=["password", "updated_at"])
        AuthService.revoke_all_sessions(request.user)
        return ok({}, "Password changed. Please log in again.")


class SessionListView(APIView):
    """Active refresh tokens (devices/sessions) of the signed-in user."""

    @extend_schema(responses={200: s.SessionSerializer(many=True)})
    def get(self, request):
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

        tokens = OutstandingToken.objects.filter(
            user=request.user, expires_at__gt=timezone.now(), blacklistedtoken__isnull=True
        ).order_by("-created_at")[:50]
        return ok(s.SessionSerializer(tokens, many=True).data)


class SessionRevokeView(APIView):
    @extend_schema(responses={204: None})
    def delete(self, request, session_id):
        from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

        token = OutstandingToken.objects.filter(pk=session_id, user=request.user).first()
        if token is None:
            from rest_framework.exceptions import NotFound

            raise NotFound("Session not found.")
        BlacklistedToken.objects.get_or_create(token=token)
        return Response(status=status.HTTP_204_NO_CONTENT)
