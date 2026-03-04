"""Account management URL routes (users, companies)."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts.views import CompanyViewSet, UserViewSet

router = DefaultRouter()
router.register('users', UserViewSet, basename='user')
router.register('companies', CompanyViewSet, basename='company')

urlpatterns = [
    path('', include(router.urls)),
]
