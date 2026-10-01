from django.urls import path

from . import views

urlpatterns = [
    path("auth/register/", views.RegisterView.as_view()),
    path("auth/login/", views.LoginView.as_view()),
    path("auth/refresh/", views.RefreshView.as_view()),
    path("auth/logout/", views.LogoutView.as_view()),
    path("auth/password-reset/", views.PasswordResetView.as_view()),
    path("auth/password-reset/confirm/", views.PasswordResetConfirmView.as_view()),
    path("auth/verify-email/", views.VerifyEmailView.as_view()),
    path("auth/resend-verification/", views.ResendVerificationView.as_view()),
    path("auth/change-password/", views.ChangePasswordView.as_view()),
    path("auth/sessions/", views.SessionListView.as_view()),
    path("auth/sessions/<int:session_id>/", views.SessionRevokeView.as_view()),
]
