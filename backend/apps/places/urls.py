from django.urls import path

from . import views

urlpatterns = [
    path("places/", views.PlaceListCreateView.as_view()),
    path("places/<int:place_id>/", views.PlaceDetailView.as_view()),
    path("places/<int:place_id>/save/", views.PlaceSaveView.as_view()),
    path("trails/", views.TrailListCreateView.as_view()),
    path("trails/<int:trail_id>/", views.TrailDetailView.as_view()),
    path("trails/<int:trail_id>/points/", views.TrailPointsView.as_view()),
    path("users/me/saved-places/", views.SavedPlacesView.as_view()),
    path("map/", views.MapView.as_view()),
]
