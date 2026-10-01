from django.urls import path

from . import views

urlpatterns = [
    path("users/me/follow-requests/", views.FollowRequestsView.as_view()),
    path("users/me/follow-requests/<int:follow_id>/", views.FollowRequestReviewView.as_view()),
    path("users/me/blocks/", views.BlockedUsersView.as_view()),
    path("users/<int:user_id>/follow/", views.FollowView.as_view()),
    path("users/<int:user_id>/block/", views.BlockView.as_view()),
    path("users/<int:user_id>/followers/", views.FollowersView.as_view()),
    path("users/<int:user_id>/following/", views.FollowingView.as_view()),
]
