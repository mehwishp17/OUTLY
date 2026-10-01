from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.common.views import health

api_v1 = [
    path("health/", health),
    path("", include("apps.accounts.urls")),
    path("", include("apps.profiles.urls")),
    path("", include("apps.follows.urls")),
    path("", include("apps.posts.urls")),
    path("", include("apps.places.urls")),
    path("", include("apps.activities.urls")),
    path("", include("apps.events.urls")),
    path("", include("apps.groups.urls")),
    path("", include("apps.partner.urls")),
    path("", include("apps.messaging.urls")),
    path("", include("apps.notifications.urls")),
    path("", include("apps.reviews.urls")),
    path("", include("apps.achievements.urls")),
    path("", include("apps.organizers.urls")),
    path("", include("apps.moderation.urls")),
    path("", include("apps.analytics.urls")),
    path("search/", include("apps.places.search_urls")),
]

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(authentication_classes=[], permission_classes=[]), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema", authentication_classes=[], permission_classes=[])),
    path("api/v1/", include(api_v1)),
]
if settings.DEBUG or settings.MEDIA_URL.startswith("/"):
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
