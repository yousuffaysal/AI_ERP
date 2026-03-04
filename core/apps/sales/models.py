"""Sales models: Customer, SalesOrder, SalesOrderItem, Invoice."""
from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.models import BaseModel


class Customer(BaseModel):
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True)
    tax_id = models.CharField(max_length=50, blank=True, null=True)
    credit_limit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'sales_customers'

    def __str__(self):
        return self.name


class SalesOrder(BaseModel):
    class Status(models.TextChoices):
        DRAFT = 'draft', _('Draft')
        CONFIRMED = 'confirmed', _('Confirmed')
        PROCESSING = 'processing', _('Processing')
        SHIPPED = 'shipped', _('Shipped')
        DELIVERED = 'delivered', _('Delivered')
        CANCELLED = 'cancelled', _('Cancelled')

    order_number = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='orders')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    order_date = models.DateField()
    delivery_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # percentage
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)   # percentage

    class Meta:
        db_table = 'sales_orders'
        ordering = ['-order_date']

    def __str__(self):
        return self.order_number

    @property
    def subtotal(self):
        return sum(item.total for item in self.items.all())

    @property
    def total(self):
        subtotal = self.subtotal
        discount_amount = subtotal * (self.discount / 100)
        after_discount = subtotal - discount_amount
        tax_amount = after_discount * (self.tax_rate / 100)
        return after_discount + tax_amount


class SalesOrderItem(BaseModel):
    order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('inventory.Product', on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=14, decimal_places=3)
    unit_price = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        db_table = 'sales_order_items'

    @property
    def total(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f'{self.product.name} x {self.quantity}'


class Invoice(BaseModel):
    class Status(models.TextChoices):
        UNPAID = 'unpaid', _('Unpaid')
        PARTIAL = 'partial', _('Partly Paid')
        PAID = 'paid', _('Paid')
        OVERDUE = 'overdue', _('Overdue')
        VOIDED = 'voided', _('Voided')

    invoice_number = models.CharField(max_length=50, unique=True)
    order = models.OneToOneField(SalesOrder, on_delete=models.PROTECT, related_name='invoice')
    issue_date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UNPAID)
    amount_due = models.DecimalField(max_digits=14, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    class Meta:
        db_table = 'sales_invoices'

    @property
    def balance(self):
        return self.amount_due - self.amount_paid

    def __str__(self):
        return self.invoice_number
