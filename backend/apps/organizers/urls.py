from django.urls import path

from . import views

urlpatterns = [
    path("organizers/apply/", views.ApplyView.as_view()),
    path("organizers/me/", views.MyOrganizerView.as_view()),
    path("organizers/me/analytics/", views.OrganizerAnalyticsView.as_view()),
    path("organizers/<int:user_id>/", views.PublicOrganizerView.as_view()),
    path("events/<int:event_id>/announce/", views.AnnounceView.as_view()),
    path("admin/organizers/", views.AdminOrganizerListView.as_view()),
    path("admin/organizers/<int:organizer_id>/review/", views.AdminOrganizerReviewView.as_view()),
]
