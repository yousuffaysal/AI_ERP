"""Inventory admin — rich, filterable configuration for all models."""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import Category, Product, Stock, StockMovement, Supplier, SupplierProduct, Unit, Warehouse


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'company', 'full_path']
    list_filter = ['company']
    search_fields = ['name']
    ordering = ['name']
    readonly_fields = ['id', 'full_path', 'created_at', 'updated_at']


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ['name', 'abbreviation', 'company']
    list_filter = ['company']
    search_fields = ['name', 'abbreviation']
    readonly_fields = ['id']


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'contact_name', 'email', 'payment_terms_days', 'is_active', 'company']
    list_filter = ['is_active', 'company']
    search_fields = ['name', 'code', 'email', 'contact_name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        (None, {'fields': ('id', 'company', 'name', 'code', 'is_active')}),
        (_('Contact'), {'fields': ('contact_name', 'email', 'phone', 'address', 'website')}),
        (_('Terms'), {'fields': ('payment_terms_days',)}),
        (_('Timestamps'), {'fields': ('created_at', 'updated_at')}),
    )


class SupplierProductInline(admin.TabularInline):
    model = SupplierProduct
    extra = 0
    fields = ['supplier', 'supplier_sku', 'unit_cost', 'lead_time_days', 'is_preferred', 'min_order_quantity']


class StockInline(admin.TabularInline):
    model = Stock
    extra = 0
    fields = ['warehouse', 'quantity', 'last_movement_at']
    readonly_fields = ['last_movement_at']
    can_delete = False


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'sku', 'category', 'cost_price', 'selling_price',
        'reorder_level', 'status', 'is_low_stock', 'company',
    ]
    list_filter = ['status', 'category', 'company']
    search_fields = ['name', 'sku', 'barcode']
    readonly_fields = ['id', 'total_stock', 'is_low_stock', 'profit_margin', 'created_at', 'updated_at']
    inlines = [SupplierProductInline, StockInline]
    fieldsets = (
        (None, {'fields': ('id', 'company', 'name', 'sku', 'barcode', 'status', 'image')}),
        (_('Classification'), {'fields': ('category', 'unit', 'description', 'weight_kg')}),
        (_('Pricing'), {'fields': ('cost_price', 'selling_price', 'profit_margin')}),
        (_('Stock Control'), {
            'fields': ('reorder_level', 'reorder_quantity', 'total_stock', 'is_low_stock'),
        }),
        (_('Timestamps'), {'fields': ('created_at', 'updated_at')}),
    )

    def is_low_stock(self, obj):
        return obj.is_low_stock
    is_low_stock.boolean = True
    is_low_stock.short_description = 'Low Stock?'


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'location', 'manager_name', 'is_active', 'company']
    list_filter = ['is_active', 'company']
    search_fields = ['name', 'code', 'location']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ['product', 'warehouse', 'quantity', 'last_movement_at', 'company']
    list_filter = ['warehouse', 'company']
    search_fields = ['product__name', 'product__sku']
    readonly_fields = ['id', 'last_movement_at', 'created_at', 'updated_at']
    # Stock is managed by StockMovement — limit direct editing in admin
    def has_add_permission(self, request):
        return False


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = [
        'created_at', 'movement_type', 'product', 'warehouse',
        'quantity', 'unit_cost', 'reference', 'company',
    ]
    list_filter = ['movement_type', 'warehouse', 'company', 'created_at']
    search_fields = ['product__name', 'product__sku', 'reference', 'notes']
    readonly_fields = ['id', 'created_at', 'updated_at', 'created_by']
    ordering = ['-created_at']

    # Movements are immutable records — no editing or deletion via admin
    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
