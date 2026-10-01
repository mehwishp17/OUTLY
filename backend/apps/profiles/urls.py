from django.urls import path

from . import views

urlpatterns = [
    path("users/", views.UserSearchView.as_view()),
    path("users/me/", views.MyProfileView.as_view()),
    path("users/me/photo/", views.MyPhotoView.as_view()),
    path("users/<int:user_id>/", views.PublicProfileView.as_view()),
]
