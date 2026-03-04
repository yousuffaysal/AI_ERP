"""Inventory views — all ViewSets company-scoped via CompanyQuerysetMixin."""
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from utils.mixins import CompanyQuerysetMixin
from utils.permissions import HasCompany, IsManager

from .models import Category, Product, Stock, StockMovement, Unit, Warehouse
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    StockMovementSerializer,
    StockSerializer,
    UnitSerializer,
    WarehouseSerializer,
)


class CategoryViewSet(CompanyQuerysetMixin, ModelViewSet):
    """Product categories — hierarchical, company-scoped."""
    queryset = Category.objects.select_related('parent').all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, HasCompany]
    search_fields = ['name']
    filterset_fields = ['parent']
    ordering_fields = ['name', 'created_at']


class UnitViewSet(CompanyQuerysetMixin, ModelViewSet):
    """Units of measurement — company-scoped."""
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [IsManager, HasCompany]


class ProductViewSet(CompanyQuerysetMixin, ModelViewSet):
    """
    Products — fully company-scoped.
    CompanyQuerysetMixin guarantees:
      - GET returns only this company's products.
      - POST auto-assigns company to the new product.
    """
    queryset = Product.objects.select_related('category', 'unit').all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, HasCompany]
    search_fields = ['name', 'sku', 'barcode', 'description']
    filterset_fields = ['category', 'status', 'unit']
    ordering_fields = ['name', 'selling_price', 'created_at']


class WarehouseViewSet(CompanyQuerysetMixin, ModelViewSet):
    """Warehouses — company-scoped."""
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [IsManager, HasCompany]
    search_fields = ['name', 'location']
    filterset_fields = ['is_active']


class StockViewSet(CompanyQuerysetMixin, ModelViewSet):
    """
    Current stock levels — read-only, company-scoped.
    Stock records are managed via StockMovement, not directly edited.
    """
    queryset = Stock.objects.select_related('product', 'warehouse').all()
    serializer_class = StockSerializer
    permission_classes = [IsAuthenticated, HasCompany]
    http_method_names = ['get', 'head', 'options']
    filterset_fields = ['product', 'warehouse']
    ordering_fields = ['updated_at']


class StockMovementViewSet(CompanyQuerysetMixin, ModelViewSet):
    """Stock movements (in/out/transfer/adjustment) — company-scoped."""
    queryset = StockMovement.objects.select_related('product', 'warehouse').all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsManager, HasCompany]
    filterset_fields = ['product', 'warehouse', 'movement_type']
    search_fields = ['reference', 'notes']
    ordering_fields = ['created_at']
