from django.urls import path

from . import views

urlpatterns = [path("admin/analytics/overview/", views.OverviewView.as_view())]
