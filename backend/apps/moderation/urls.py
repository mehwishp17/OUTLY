from django.urls import path

from . import views

urlpatterns = [
    path("reports/", views.ReportCreateView.as_view()),
    path("reports/mine/", views.MyReportsView.as_view()),
    path("admin/reports/", views.ReportQueueView.as_view()),
    path("admin/reports/<int:report_id>/", views.ReportDetailView.as_view()),
    path("admin/reports/<int:report_id>/action/", views.ReportActionView.as_view()),
    path("admin/users/", views.AdminUserListView.as_view()),
    path("admin/users/<int:user_id>/", views.AdminUserDetailView.as_view()),
    path("admin/posts/", views.AdminPostListView.as_view()),
    path("admin/posts/<int:post_id>/", views.AdminPostDetailView.as_view()),
    path("admin/places/<int:object_id>/", views.AdminPlaceVerifyView.as_view()),
    path("admin/trails/<int:object_id>/", views.AdminTrailVerifyView.as_view()),
    path("admin/audit-logs/", views.AuditLogListView.as_view()),
]
