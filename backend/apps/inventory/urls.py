"""Inventory URL routing."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    ProductViewSet,
    StockMovementViewSet,
    StockViewSet,
    SupplierProductViewSet,
    SupplierViewSet,
    UnitViewSet,
    WarehouseViewSet,
)

router = DefaultRouter()
router.register('categories',        CategoryViewSet,        basename='category')
router.register('units',             UnitViewSet,            basename='unit')
router.register('suppliers',         SupplierViewSet,        basename='supplier')
router.register('supplier-products', SupplierProductViewSet, basename='supplier-product')
router.register('products',          ProductViewSet,         basename='product')
router.register('warehouses',        WarehouseViewSet,       basename='warehouse')
router.register('stock',             StockViewSet,           basename='stock')
router.register('movements',         StockMovementViewSet,   basename='stock-movement')

urlpatterns = [
    path('', include(router.urls)),
]
