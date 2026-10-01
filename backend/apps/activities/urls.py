from django.urls import path

from . import views

urlpatterns = [
    path("activities/", views.ActivityListCreateView.as_view()),
    path("activities/history/", views.ActivityHistoryView.as_view()),
    path("activities/<int:activity_id>/", views.ActivityDetailView.as_view()),
    path("activities/<int:activity_id>/join/", views.ActivityJoinView.as_view()),
    path("activities/<int:activity_id>/participants/", views.ActivityParticipantsView.as_view()),
    path("users/<int:user_id>/activities/", views.UserActivitiesView.as_view()),
]
