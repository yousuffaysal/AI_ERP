"""HR URLs."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DepartmentViewSet, EmployeeViewSet, LeaveRequestViewSet, LeaveTypeViewSet

router = DefaultRouter()
router.register('departments', DepartmentViewSet, basename='department')
router.register('employees', EmployeeViewSet, basename='employee')
router.register('leave-types', LeaveTypeViewSet, basename='leave-type')
router.register('leave-requests', LeaveRequestViewSet, basename='leave-request')

urlpatterns = [path('', include(router.urls))]
