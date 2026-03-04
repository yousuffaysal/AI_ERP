"""Inventory URLs."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, ProductViewSet, StockMovementViewSet, StockViewSet, UnitViewSet, WarehouseViewSet

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('units', UnitViewSet, basename='unit')
router.register('products', ProductViewSet, basename='product')
router.register('warehouses', WarehouseViewSet, basename='warehouse')
router.register('stock', StockViewSet, basename='stock')
router.register('movements', StockMovementViewSet, basename='stock-movement')

urlpatterns = [path('', include(router.urls))]
