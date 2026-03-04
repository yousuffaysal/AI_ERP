"""
Sales serializers — layered read/write separation.

Pattern:
  - Mini serializers: for embedding (compact, no nested objects)
  - Full read serializers: rich computed fields, nested objects (GET only)
  - Write serializers: strict validation, writable fields only (POST/PATCH)
"""
from decimal import Decimal

from rest_framework import serializers

from .models import (
    CompanyTaxSettings,
    Customer,
    Invoice,
    InvoiceItem,
    Payment,
    SalesOrder,
    SalesOrderItem,
)


# ---------------------------------------------------------------------------
# Company Tax Settings
# ---------------------------------------------------------------------------

class CompanyTaxSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyTaxSettings
        fields = [
            'id',
            'tax_number', 'tax_name',
            'default_tax_rate', 'default_discount_rate',
            'prices_include_tax',
            'currency_code', 'currency_symbol',
        ]
        read_only_fields = ['id']


# ---------------------------------------------------------------------------
# Customer
# ---------------------------------------------------------------------------

class CustomerMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'email']


class CustomerSerializer(serializers.ModelSerializer):
    outstanding_balance = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )

    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'email', 'phone', 'address',
            'city', 'country', 'tax_id',
            'credit_limit', 'outstanding_balance',
            'notes', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


# ---------------------------------------------------------------------------
# Sales Order
# ---------------------------------------------------------------------------

class SalesOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = SalesOrderItem
        fields = [
            'id', 'product', 'product_name', 'product_sku',
            'quantity', 'unit_price', 'total', 'notes',
        ]
        read_only_fields = ['id']

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError('Quantity must be greater than zero.')
        return value


class SalesOrderSerializer(serializers.ModelSerializer):
    customer_detail = CustomerMiniSerializer(source='customer', read_only=True)
    items = SalesOrderItemSerializer(many=True, read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)

    # Computed financials (read-only)
    subtotal = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    discount_amount = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    tax_amount = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = SalesOrder
        fields = [
            'id', 'order_number', 'customer', 'customer_detail',
            'status', 'status_label',
            'order_date', 'delivery_date', 'notes',
            'discount', 'tax_rate',
            'subtotal', 'discount_amount', 'tax_amount', 'total',
            'items', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class SalesOrderWriteSerializer(serializers.ModelSerializer):
    """Write serializer for creating / updating orders (no nested reads)."""
    class Meta:
        model = SalesOrder
        fields = [
            'order_number', 'customer',
            'order_date', 'delivery_date', 'notes',
            'discount', 'tax_rate',
        ]

    def validate_discount(self, value):
        if not (0 <= value <= 100):
            raise serializers.ValidationError('Discount must be between 0 and 100%.')
        return value


# ---------------------------------------------------------------------------
# Invoice Item
# ---------------------------------------------------------------------------

class InvoiceItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True, default='')
    line_total_before_tax = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )
    item_tax_amount = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )
    total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = InvoiceItem
        fields = [
            'id', 'product', 'product_name', 'description',
            'quantity', 'unit_price',
            'discount_rate', 'tax_rate',
            'line_total_before_tax', 'item_tax_amount', 'total',
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        # If product provided and no unit_price, use product's selling_price
        product = attrs.get('product')
        if product and not attrs.get('unit_price'):
            attrs['unit_price'] = product.selling_price
        if product and not attrs.get('description'):
            attrs['description'] = product.name
        return attrs

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError('Quantity must be greater than zero.')
        return value


# ---------------------------------------------------------------------------
# Payment
# ---------------------------------------------------------------------------

class PaymentSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(
        source='recorded_by.full_name', read_only=True
    )
    method_label = serializers.CharField(source='get_method_display', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'amount',
            'payment_date', 'method', 'method_label',
            'reference', 'notes',
            'recorded_by', 'recorded_by_name',
            'created_at',
        ]
        read_only_fields = ['id', 'recorded_by', 'created_at']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Payment amount must be positive.')
        return value


class RecordPaymentSerializer(serializers.Serializer):
    """Lightweight input serializer for the record_payment action."""
    amount = serializers.DecimalField(
        max_digits=14, decimal_places=2,
        min_value=Decimal('0.01'),
    )
    method = serializers.ChoiceField(
        choices=Payment.Method.choices,
        default=Payment.Method.BANK_TRANSFER,
    )
    payment_date = serializers.DateField(required=False)
    reference = serializers.CharField(max_length=100, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


# ---------------------------------------------------------------------------
# Invoice
# ---------------------------------------------------------------------------

class InvoiceMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ['id', 'invoice_number', 'status', 'amount_due', 'balance']


class InvoiceSerializer(serializers.ModelSerializer):
    """Full read serializer — returned on GET list and detail."""
    customer_detail = CustomerMiniSerializer(source='customer', read_only=True)
    items = InvoiceItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    balance = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    payment_percentage = serializers.DecimalField(
        max_digits=5, decimal_places=1, read_only=True
    )
    confirmed_by_name = serializers.CharField(
        source='confirmed_by.full_name', read_only=True, default=None
    )

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'reference',
            'customer', 'customer_detail',
            'order',
            'issue_date', 'due_date',
            'status', 'status_label',
            # Financials
            'subtotal', 'discount_rate', 'discount_amount',
            'tax_rate', 'tax_amount', 'tax_label',
            'amount_due', 'amount_paid',
            'balance', 'is_overdue', 'payment_percentage',
            # Meta
            'confirmed_by', 'confirmed_by_name', 'confirmed_at',
            'notes', 'terms',
            'items', 'payments',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id',
            'subtotal', 'discount_amount', 'tax_amount', 'amount_due', 'amount_paid',
            'confirmed_by', 'confirmed_at', 'created_at', 'updated_at',
        ]


class InvoiceWriteSerializer(serializers.ModelSerializer):
    """
    Write serializer for DRAFT invoice creation and editing.
    Once confirmed, invoices should not be edited via API.
    """

    class Meta:
        model = Invoice
        fields = [
            'invoice_number', 'reference',
            'customer', 'order',
            'issue_date', 'due_date',
            'discount_rate', 'tax_rate', 'tax_label',
            'notes', 'terms',
        ]

    def validate_discount_rate(self, value):
        if not (0 <= value <= 100):
            raise serializers.ValidationError('Discount must be between 0 and 100%.')
        return value

    def validate(self, attrs):
        issue = attrs.get('issue_date')
        due = attrs.get('due_date')
        if issue and due and due < issue:
            raise serializers.ValidationError({
                'due_date': 'Due date cannot be before issue date.'
            })
        return attrs
