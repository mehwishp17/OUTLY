from django.urls import path

from . import views

urlpatterns = [
    path("events/", views.EventListCreateView.as_view()),
    path("events/<int:event_id>/", views.EventDetailView.as_view()),
    path("events/<int:event_id>/join/", views.EventJoinView.as_view()),
    path("events/<int:event_id>/invite/", views.EventInviteView.as_view()),
    path("events/<int:event_id>/moderate/", views.EventModerateView.as_view()),
    path("events/<int:event_id>/participants/", views.EventParticipantsView.as_view()),
    path("events/<int:event_id>/participants/<int:user_id>/", views.EventParticipantDecisionView.as_view()),
]
