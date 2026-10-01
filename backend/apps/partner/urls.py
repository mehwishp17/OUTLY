from django.urls import path

from . import views

urlpatterns = [
    path("partner-requests/", views.PartnerListCreateView.as_view()),
    path("partner-requests/<int:request_id>/", views.PartnerDetailView.as_view()),
    path("partner-requests/<int:request_id>/close/", views.PartnerCloseView.as_view()),
    path("partner-requests/<int:request_id>/join/", views.PartnerJoinView.as_view()),
    path("partner-requests/<int:request_id>/join-requests/", views.PartnerJoinRequestsView.as_view()),
    path("partner-requests/<int:request_id>/join-requests/<int:join_id>/review/", views.PartnerJoinReviewView.as_view()),
]
