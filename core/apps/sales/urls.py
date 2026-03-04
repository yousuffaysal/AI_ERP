"""Sales URL routing."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CompanyTaxSettingsViewSet,
    CustomerViewSet,
    InvoiceItemViewSet,
    InvoiceViewSet,
    PaymentViewSet,
    SalesOrderItemViewSet,
    SalesOrderViewSet,
)

router = DefaultRouter()
router.register('tax-settings',    CompanyTaxSettingsViewSet, basename='tax-settings')
router.register('customers',       CustomerViewSet,           basename='customer')
router.register('orders',          SalesOrderViewSet,         basename='sales-order')
router.register('order-items',     SalesOrderItemViewSet,     basename='sales-order-item')
router.register('invoices',        InvoiceViewSet,            basename='invoice')
router.register('invoice-items',   InvoiceItemViewSet,        basename='invoice-item')
router.register('payments',        PaymentViewSet,            basename='payment')

urlpatterns = [
    path('', include(router.urls)),
]
