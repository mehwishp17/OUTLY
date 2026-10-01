from django.urls import path

from .search import SearchView

urlpatterns = [path("", SearchView.as_view())]
