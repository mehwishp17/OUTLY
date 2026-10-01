from django.urls import path

from . import views

urlpatterns = [
    path("reviews/", views.ReviewListCreateView.as_view()),
    path("reviews/<int:review_id>/", views.ReviewDetailView.as_view()),
    path("places/<int:place_id>/reviews/", views.ReviewListCreateView.as_view()),
    path("trails/<int:trail_id>/reviews/", views.ReviewListCreateView.as_view()),
    path("events/<int:event_id>/reviews/", views.ReviewListCreateView.as_view()),
]
