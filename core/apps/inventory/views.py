"""
Inventory views — SOLID-compliant, company-scoped.

Open/Closed principle: new endpoints are added as @action methods without
modifying existing ViewSet behaviour.

Single Responsibility: each ViewSet owns exactly one resource.
"""
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from utils.mixins import CompanyQuerysetMixin
from utils.permissions import HasCompany, IsAdmin, IsManager

from .models import Category, Product, Stock, StockMovement, Supplier, SupplierProduct, Unit, Warehouse
from .serializers import (
    CategorySerializer,
    ProductCreateUpdateSerializer,
    ProductSerializer,
    StockMovementSerializer,
    StockSerializer,
    SupplierProductSerializer,
    SupplierSerializer,
    UnitSerializer,
    WarehouseSerializer,
)


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------

class CategoryViewSet(CompanyQuerysetMixin, ModelViewSet):
    """
    Product categories — hierarchical tree, company-scoped.
    GET /categories/?parent=<id>  — filter by parent (None = root categories)
    """
    queryset = Category.objects.select_related('parent').prefetch_related('children').all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, HasCompany]
    search_fields = ['name', 'description']
    filterset_fields = ['parent']
    ordering_fields = ['name', 'created_at']

    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        """List immediate children of a category."""
        category = self.get_object()
        children = Category.objects.filter(parent=category, company=request.company)
        serializer = CategorySerializer(children, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """List all products in this category."""
        category = self.get_object()
        products = Product.objects.filter(
            category=category, company=request.company, status=Product.Status.ACTIVE
        ).select_related('unit')
        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Unit
# ---------------------------------------------------------------------------

class UnitViewSet(CompanyQuerysetMixin, ModelViewSet):
    """Units of measurement — company-scoped, Manager+ only."""
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [IsManager, HasCompany]
    search_fields = ['name', 'abbreviation']
    ordering_fields = ['name']


# ---------------------------------------------------------------------------
# Supplier
# ---------------------------------------------------------------------------

class SupplierViewSet(CompanyQuerysetMixin, ModelViewSet):
    """
    Suppliers — company-scoped.
    Includes nested endpoint for supplier's product list.
    """
    queryset = Supplier.objects.prefetch_related('supplier_products__product').all()
    serializer_class = SupplierSerializer
    permission_classes = [IsManager, HasCompany]
    search_fields = ['name', 'code', 'contact_name', 'email']
    filterset_fields = ['is_active']
    ordering_fields = ['name', 'created_at']

    @action(detail=True, methods=['get'], url_path='products')
    def supplier_products(self, request, pk=None):
        """List all products supplied by this supplier, with pricing."""
        supplier = self.get_object()
        sp_qs = supplier.supplier_products.select_related('product').all()
        serializer = SupplierProductSerializer(sp_qs, many=True)
        return Response(serializer.data)


class SupplierProductViewSet(CompanyQuerysetMixin, ModelViewSet):
    """Supplier ↔ Product pricing and terms (through-table)."""
    queryset = SupplierProduct.objects.select_related('supplier', 'product').all()
    serializer_class = SupplierProductSerializer
    permission_classes = [IsManager, HasCompany]
    filterset_fields = ['supplier', 'product', 'is_preferred']
    ordering_fields = ['unit_cost', 'lead_time_days']


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------

class ProductViewSet(CompanyQuerysetMixin, ModelViewSet):
    """
    Products — fully company-scoped, rich analytics.

    Extra endpoints:
      GET  /products/low_stock/         — products at or below reorder level
      GET  /products/{id}/analytics/    — turnover + days-of-stock for one product
      GET  /products/{id}/stock/        — stock breakdown by warehouse
      GET  /products/{id}/movements/    — full movement history for one product
    """
    queryset = Product.objects.select_related('category', 'unit').prefetch_related('stock_entries').all()
    permission_classes = [IsAuthenticated, HasCompany]
    search_fields = ['name', 'sku', 'barcode', 'description']
    filterset_fields = ['category', 'status', 'unit']
    ordering_fields = ['name', 'selling_price', 'cost_price', 'created_at']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ProductCreateUpdateSerializer
        return ProductSerializer

    # ------------------------------------------------------------------
    # Custom actions (Open/Closed: extending without modifying)
    # ------------------------------------------------------------------

    @action(detail=False, methods=['get'], url_path='low-stock')
    def low_stock(self, request):
        """
        Return all products where total stock ≤ reorder_level.

        Filters in Python (not SQL) because total_stock is a computed
        aggregate that can't be used directly in ORM .filter().
        For large product catalogs, consider a materialized view or
        a stored `stock_quantity` field updated by the movement signal.
        """
        products = self.get_queryset().filter(
            status=Product.Status.ACTIVE
        ).prefetch_related('stock_entries')

        low_stock_products = [p for p in products if p.is_low_stock]

        serializer = ProductSerializer(
            low_stock_products, many=True, context={'request': request}
        )
        return Response({
            'count': len(low_stock_products),
            'results': serializer.data,
        })

    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """
        Per-product inventory analytics:
          - Annual turnover rate
          - 30-day and 90-day turnover rate
          - Days of stock remaining
          - Profit margin
          - Total stock value
        """
        product = self.get_object()
        return Response({
            'product_id': str(product.id),
            'product_name': product.name,
            'sku': product.sku,
            'total_stock': str(product.total_stock),
            'total_stock_value': str(product.total_stock * product.cost_price),
            'reorder_level': product.reorder_level,
            'is_low_stock': product.is_low_stock,
            'profit_margin_pct': str(product.profit_margin),
            'inventory_turnover_365d': str(product.inventory_turnover_rate(days=365)),
            'inventory_turnover_90d': str(product.inventory_turnover_rate(days=90)),
            'inventory_turnover_30d': str(product.inventory_turnover_rate(days=30)),
            'days_of_stock_remaining': product.days_of_stock_remaining(),
        })

    @action(detail=True, methods=['get'])
    def stock(self, request, pk=None):
        """Stock breakdown by warehouse for a single product."""
        product = self.get_object()
        stock_entries = Stock.objects.filter(
            product=product, company=request.company
        ).select_related('warehouse')
        serializer = StockSerializer(stock_entries, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def movements(self, request, pk=None):
        """Full movement history for a product (paginated)."""
        product = self.get_object()
        qs = StockMovement.objects.filter(
            product=product, company=request.company
        ).select_related('warehouse', 'created_by').order_by('-created_at')

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = StockMovementSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = StockMovementSerializer(qs, many=True)
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Warehouse
# ---------------------------------------------------------------------------

class WarehouseViewSet(CompanyQuerysetMixin, ModelViewSet):
    """
    Warehouses — company-scoped.
    Extra: GET /warehouses/{id}/stock/ — all stock in this warehouse.
    """
    queryset = Warehouse.objects.prefetch_related('stock_entries').all()
    serializer_class = WarehouseSerializer
    permission_classes = [IsManager, HasCompany]
    search_fields = ['name', 'code', 'location']
    filterset_fields = ['is_active']
    ordering_fields = ['name']

    @action(detail=True, methods=['get'])
    def stock(self, request, pk=None):
        """All stock entries for this warehouse."""
        warehouse = self.get_object()
        stock_entries = Stock.objects.filter(
            warehouse=warehouse, company=request.company
        ).select_related('product')
        serializer = StockSerializer(stock_entries, many=True)
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Stock (read-only — mutations happen via StockMovement)
# ---------------------------------------------------------------------------

class StockViewSet(CompanyQuerysetMixin, ReadOnlyModelViewSet):
    """
    Current stock levels — read-only, company-scoped.

    Stock balances are maintained automatically by StockMovement.save().
    Never create or edit Stock records directly via the API.
    """
    queryset = Stock.objects.select_related('product', 'warehouse').all()
    serializer_class = StockSerializer
    permission_classes = [IsAuthenticated, HasCompany]
    filterset_fields = ['product', 'warehouse']
    ordering_fields = ['quantity', 'updated_at']

    @action(detail=False, methods=['get'], url_path='low-stock')
    def low_stock(self, request):
        """
        All stock entries where quantity ≤ product.reorder_level.
        Useful for warehouse-level low-stock monitoring.
        """
        qs = self.get_queryset().filter(
            quantity__lte=models_reorder_filter()
        ).select_related('product', 'warehouse')

        # Python-level filter since we can't do a cross-field filter easily
        low = [s for s in self.get_queryset() if s.quantity <= s.product.reorder_level]
        serializer = StockSerializer(low, many=True)
        return Response({'count': len(low), 'results': serializer.data})


def models_reorder_filter():
    """Placeholder — actual filtering done in Python above."""
    from django.db.models import F
    return F('product__reorder_level')


# ---------------------------------------------------------------------------
# StockMovement
# ---------------------------------------------------------------------------

class StockMovementViewSet(CompanyQuerysetMixin, ModelViewSet):
    """
    Stock movement ledger — company-scoped.

    Creating a movement automatically updates the Stock balance.
    Movements are append-only (no DELETE or PUT).
    """
    queryset = StockMovement.objects.select_related(
        'product', 'warehouse', 'created_by'
    ).all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsManager, HasCompany]
    filterset_fields = ['product', 'warehouse', 'movement_type']
    search_fields = ['reference', 'notes', 'product__name', 'product__sku']
    ordering_fields = ['created_at']
    # Append-only: no updates or deletes
    http_method_names = ['get', 'post', 'head', 'options']

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Aggregated movement summary by type for the company.
        Useful for dashboard widgets.
        """
        from django.db.models import Sum, Count
        qs = self.get_queryset()

        summary = (
            qs.values('movement_type')
            .annotate(
                count=Count('id'),
                total_quantity=Sum('quantity'),
            )
            .order_by('movement_type')
        )
        return Response(list(summary))
