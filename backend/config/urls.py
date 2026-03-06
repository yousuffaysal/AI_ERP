"""Core URL Configuration."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

# API version prefix
API_V1 = 'api/v1/'

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),

    # API Schema
    path(f'{API_V1}schema/', SpectacularAPIView.as_view(), name='schema'),
    path(f'{API_V1}docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path(f'{API_V1}redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # App Routers
    path(f'{API_V1}auth/', include('apps.accounts.urls.auth_urls')),
    path(f'{API_V1}accounts/', include('apps.accounts.urls.account_urls')),
    path(f'{API_V1}inventory/', include('apps.inventory.urls')),
    path(f'{API_V1}sales/', include('apps.sales.urls')),
    path(f'{API_V1}hr/', include('apps.hr.urls')),
    path(f'{API_V1}finance/', include('apps.finance.urls')),
    path(f'{API_V1}reports/', include('apps.reports.urls')),
    path(f'{API_V1}audit/', include('apps.audit.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
