from django.urls import path

from . import views

urlpatterns = [
    path("badges/", views.BadgeListView.as_view()),
    path("achievements/", views.MyAchievementsView.as_view()),
    path("leaderboard/", views.LeaderboardView.as_view()),
    path("users/<int:user_id>/badges/", views.UserBadgesView.as_view()),
]
