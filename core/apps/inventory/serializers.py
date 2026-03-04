"""
Inventory serializers — SOLID-compliant, layered.

Serializer responsibilities:
  - Read (list/detail): show computed fields (is_low_stock, turnover, etc.)
  - Write (create/update): validate and persist model data
  - Nested: mini-serializers for embedding in other serializers
"""
from decimal import Decimal

from rest_framework import serializers

from .models import (
    Category,
    Stock,
    StockMovement,
    Supplier,
    SupplierProduct,
    Unit,
    Product,
    Warehouse,
)


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------

class CategoryMiniSerializer(serializers.ModelSerializer):
    """Compact — for embedding inside ProductSerializer."""
    class Meta:
        model = Category
        fields = ['id', 'name']


class CategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True, default=None)
    full_path = serializers.CharField(read_only=True)
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description',
            'parent', 'parent_name', 'full_path',
            'product_count', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_product_count(self, obj):
        return obj.products.count()


# ---------------------------------------------------------------------------
# Unit
# ---------------------------------------------------------------------------

class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ['id', 'name', 'abbreviation']
        read_only_fields = ['id']


# ---------------------------------------------------------------------------
# Supplier
# ---------------------------------------------------------------------------

class SupplierMiniSerializer(serializers.ModelSerializer):
    """Compact — embedded in ProductSerializer."""
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'code']


class SupplierSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'code', 'contact_name', 'email', 'phone',
            'address', 'website', 'payment_terms_days',
            'is_active', 'product_count', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_product_count(self, obj):
        return obj.supplier_products.count()


class SupplierProductSerializer(serializers.ModelSerializer):
    """Through-table serializer for supplier-specific product pricing."""
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)

    class Meta:
        model = SupplierProduct
        fields = [
            'id', 'supplier', 'supplier_name',
            'product', 'product_name', 'product_sku',
            'supplier_sku', 'unit_cost', 'lead_time_days',
            'is_preferred', 'min_order_quantity',
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        """Ensure only one preferred supplier per product per company."""
        if attrs.get('is_preferred'):
            existing = SupplierProduct.objects.filter(
                product=attrs.get('product'),
                is_preferred=True,
            )
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError(
                    {'is_preferred': 'This product already has a preferred supplier. Unset the existing one first.'}
                )
        return attrs


# ---------------------------------------------------------------------------
# Product (the most complex serializer)
# ---------------------------------------------------------------------------

class ProductMiniSerializer(serializers.ModelSerializer):
    """Compact — for embedding in Stock, StockMovement, etc."""
    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'selling_price']


class ProductSerializer(serializers.ModelSerializer):
    """
    Full read serializer for Product list/detail.
    Includes all computed business properties.
    """
    category_detail = CategoryMiniSerializer(source='category', read_only=True)
    unit_abbr = serializers.CharField(source='unit.abbreviation', read_only=True, default='')

    # Computed/business fields (read-only)
    total_stock = serializers.DecimalField(
        max_digits=14, decimal_places=3, read_only=True
    )
    is_low_stock = serializers.BooleanField(read_only=True)
    profit_margin = serializers.DecimalField(
        max_digits=6, decimal_places=2, read_only=True
    )
    inventory_turnover = serializers.SerializerMethodField()
    days_of_stock = serializers.SerializerMethodField()
    preferred_supplier = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'barcode', 'description',
            'category', 'category_detail',
            'unit', 'unit_abbr',
            'cost_price', 'selling_price', 'profit_margin',
            'reorder_level', 'reorder_quantity',
            'status', 'image', 'weight_kg',
            # Analytics
            'total_stock', 'is_low_stock', 'inventory_turnover',
            'days_of_stock', 'preferred_supplier',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_inventory_turnover(self, obj):
        """Annual inventory turnover rate."""
        return str(obj.inventory_turnover_rate(days=365))

    def get_days_of_stock(self, obj):
        """Estimated days of remaining stock based on 30-day usage."""
        return obj.days_of_stock_remaining()

    def get_preferred_supplier(self, obj):
        sp = obj.supplier_products.filter(is_preferred=True).select_related('supplier').first()
        if sp:
            return {'id': str(sp.supplier.id), 'name': sp.supplier.name, 'unit_cost': str(sp.unit_cost)}
        return None


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Write serializer — stricter validation, no computed read-only fields."""

    class Meta:
        model = Product
        fields = [
            'name', 'sku', 'barcode', 'description',
            'category', 'unit',
            'cost_price', 'selling_price',
            'reorder_level', 'reorder_quantity',
            'status', 'image', 'weight_kg',
        ]

    def validate_selling_price(self, value):
        cost = self.initial_data.get('cost_price', 0)
        try:
            if Decimal(str(value)) < Decimal(str(cost)):
                raise serializers.ValidationError(
                    'Selling price cannot be less than cost price.'
                )
        except Exception:
            pass
        return value

    def validate_sku(self, value):
        """SKU must be unique within the company."""
        request = self.context.get('request')
        company = getattr(request, 'company', None) if request else None
        qs = Product.objects.filter(sku=value, company=company)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                f'SKU "{value}" already exists in your company.'
            )
        return value


# ---------------------------------------------------------------------------
# Warehouse
# ---------------------------------------------------------------------------

class WarehouseSerializer(serializers.ModelSerializer):
    total_stock_value = serializers.SerializerMethodField()

    class Meta:
        model = Warehouse
        fields = [
            'id', 'name', 'code', 'location', 'manager_name',
            'is_active', 'total_stock_value', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_total_stock_value(self, obj):
        """Total value of all stock in this warehouse (quantity × cost_price)."""
        from django.db.models import F, Sum, ExpressionWrapper, DecimalField
        result = (
            obj.stock_entries
            .select_related('product')
            .aggregate(
                total=Sum(
                    ExpressionWrapper(
                        F('quantity') * F('product__cost_price'),
                        output_field=DecimalField(max_digits=20, decimal_places=2),
                    )
                )
            )
        )
        return str(result['total'] or Decimal('0'))


# ---------------------------------------------------------------------------
# Stock
# ---------------------------------------------------------------------------

class StockSerializer(serializers.ModelSerializer):
    product_detail = ProductMiniSerializer(source='product', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    stock_value = serializers.SerializerMethodField()
    is_low_stock = serializers.SerializerMethodField()

    class Meta:
        model = Stock
        fields = [
            'id', 'product', 'product_detail',
            'warehouse', 'warehouse_name',
            'quantity', 'stock_value',
            'is_low_stock', 'last_movement_at', 'updated_at',
        ]
        read_only_fields = ['id', 'updated_at', 'last_movement_at']

    def get_stock_value(self, obj):
        return str(obj.quantity * obj.product.cost_price)

    def get_is_low_stock(self, obj):
        """Per-warehouse low stock (uses product reorder_level)."""
        return obj.quantity <= obj.product.reorder_level


# ---------------------------------------------------------------------------
# StockMovement
# ---------------------------------------------------------------------------

class StockMovementSerializer(serializers.ModelSerializer):
    product_detail = ProductMiniSerializer(source='product', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    movement_type_label = serializers.CharField(
        source='get_movement_type_display', read_only=True
    )
    total_cost = serializers.SerializerMethodField()

    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'product_detail',
            'warehouse', 'warehouse_name',
            'movement_type', 'movement_type_label',
            'quantity', 'unit_cost', 'total_cost',
            'reference', 'notes',
            'created_at', 'created_by',
        ]
        read_only_fields = ['id', 'created_at', 'created_by']

    def get_total_cost(self, obj):
        if obj.unit_cost:
            return str(obj.quantity * obj.unit_cost)
        return None

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError('Quantity must be greater than zero.')
        return value

    def validate(self, attrs):
        """
        Cross-field validation: for OUT/SALE movements, verify that
        sufficient stock exists BEFORE creating the movement.
        This gives a clear validation error instead of a database error.
        """
        movement_type = attrs.get('movement_type')
        product = attrs.get('product')
        warehouse = attrs.get('warehouse')
        quantity = attrs.get('quantity', Decimal('0'))

        if movement_type in (
            StockMovement.MovementType.OUT,
            StockMovement.MovementType.SALE,
            StockMovement.MovementType.TRANSFER_OUT,
        ):
            try:
                stock = Stock.objects.get(product=product, warehouse=warehouse)
                if stock.quantity < quantity:
                    raise serializers.ValidationError({
                        'quantity': (
                            f'Insufficient stock: {stock.quantity} available in this '
                            f'warehouse, {quantity} requested.'
                        )
                    })
            except Stock.DoesNotExist:
                raise serializers.ValidationError({
                    'quantity': 'No stock record exists for this product in this warehouse.'
                })
        return attrs
