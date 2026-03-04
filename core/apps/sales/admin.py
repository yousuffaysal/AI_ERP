"""Sales admin — rich, inline-heavy configuration."""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import (
    CompanyTaxSettings, Customer, Invoice, InvoiceItem,
    Payment, SalesOrder, SalesOrderItem,
)


@admin.register(CompanyTaxSettings)
class CompanyTaxSettingsAdmin(admin.ModelAdmin):
    list_display = ['company', 'tax_name', 'default_tax_rate', 'currency_code', 'prices_include_tax']
    list_filter = ['company']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        (None, {'fields': ('id', 'company')}),
        (_('Tax Identity'), {'fields': ('tax_number', 'tax_name', 'default_tax_rate', 'prices_include_tax')}),
        (_('Discounts'), {'fields': ('default_discount_rate',)}),
        (_('Currency'), {'fields': ('currency_code', 'currency_symbol')}),
        (_('Timestamps'), {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'credit_limit', 'outstanding_balance', 'is_active', 'company']
    list_filter = ['is_active', 'company', 'country']
    search_fields = ['name', 'email', 'phone', 'tax_id']
    readonly_fields = ['id', 'outstanding_balance', 'created_at', 'updated_at']

    def outstanding_balance(self, obj):
        return obj.outstanding_balance
    outstanding_balance.short_description = 'Outstanding (£)'


class SalesOrderItemInline(admin.TabularInline):
    model = SalesOrderItem
    extra = 0
    fields = ['product', 'quantity', 'unit_price', 'total']
    readonly_fields = ['total']

    def total(self, obj):
        return obj.total
    total.short_description = 'Line Total'


@admin.register(SalesOrder)
class SalesOrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'customer', 'status', 'order_date', 'total', 'company']
    list_filter = ['status', 'company', 'order_date']
    search_fields = ['order_number', 'customer__name']
    readonly_fields = ['id', 'subtotal', 'discount_amount', 'tax_amount', 'total', 'created_at', 'updated_at']
    inlines = [SalesOrderItemInline]
    fieldsets = (
        (None, {'fields': ('id', 'company', 'order_number', 'customer', 'status')}),
        (_('Dates'), {'fields': ('order_date', 'delivery_date')}),
        (_('Pricing'), {'fields': ('discount', 'tax_rate', 'subtotal', 'discount_amount', 'tax_amount', 'total')}),
        (_('Notes'), {'fields': ('notes',)}),
        (_('Timestamps'), {'fields': ('created_at', 'updated_at')}),
    )


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0
    fields = ['product', 'description', 'quantity', 'unit_price', 'discount_rate', 'tax_rate', 'total']
    readonly_fields = ['total']

    def total(self, obj):
        return obj.total if obj.pk else '-'
    total.short_description = 'Line Total'

    def get_readonly_fields(self, request, obj=None):
        # Once invoice is confirmed, items are read-only
        if obj and obj.status != 'draft':
            return [f.name for f in self.model._meta.fields]
        return self.readonly_fields


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    fields = ['amount', 'payment_date', 'method', 'reference', 'recorded_by']
    readonly_fields = ['recorded_by']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False  # Payments recorded via API only


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = [
        'invoice_number', 'customer', 'status', 'issue_date', 'due_date',
        'amount_due', 'amount_paid', 'balance', 'is_overdue', 'company',
    ]
    list_filter = ['status', 'company', 'issue_date']
    search_fields = ['invoice_number', 'reference', 'customer__name']
    readonly_fields = [
        'id', 'subtotal', 'discount_amount', 'tax_amount', 'amount_due',
        'amount_paid', 'balance', 'is_overdue', 'payment_percentage',
        'confirmed_by', 'confirmed_at', 'created_at', 'updated_at',
    ]
    inlines = [InvoiceItemInline, PaymentInline]
    fieldsets = (
        (None, {'fields': ('id', 'company', 'invoice_number', 'reference', 'customer', 'order', 'status')}),
        (_('Dates'), {'fields': ('issue_date', 'due_date', 'is_overdue')}),
        (_('Financials'), {
            'fields': (
                'discount_rate', 'tax_rate', 'tax_label',
                'subtotal', 'discount_amount', 'tax_amount',
                'amount_due', 'amount_paid', 'balance', 'payment_percentage',
            ),
        }),
        (_('Confirmation'), {'fields': ('confirmed_by', 'confirmed_at')}),
        (_('Notes'), {'fields': ('notes', 'terms')}),
        (_('Timestamps'), {'fields': ('created_at', 'updated_at')}),
    )

    def is_overdue(self, obj):
        return obj.is_overdue
    is_overdue.boolean = True

    def balance(self, obj):
        return obj.balance
    balance.short_description = 'Balance Due'

    def payment_percentage(self, obj):
        return f'{obj.payment_percentage}%'
    payment_percentage.short_description = '% Paid'

    def has_delete_permission(self, request, obj=None):
        # Paid or voided invoices can't be deleted
        if obj and obj.status in ('paid', 'voided'):
            return False
        return super().has_delete_permission(request, obj)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['invoice', 'amount', 'payment_date', 'method', 'reference', 'recorded_by', 'company']
    list_filter = ['method', 'company', 'payment_date']
    search_fields = ['invoice__invoice_number', 'reference']
    readonly_fields = ['id', 'created_at', 'updated_at']

    def has_change_permission(self, request, obj=None):
        return False  # Payments are immutable

    def has_delete_permission(self, request, obj=None):
        return False  # Never delete payment records
