"""Inventory models: Category, Product, Warehouse, StockMovement."""
from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.models import BaseModel


class Category(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children')

    class Meta:
        db_table = 'inventory_categories'
        verbose_name = _('Category')
        verbose_name_plural = _('Categories')

    def __str__(self):
        return self.name


class Unit(BaseModel):
    """Unit of measurement (e.g., KG, LITRE, PIECE)."""
    name = models.CharField(max_length=50, unique=True)
    abbreviation = models.CharField(max_length=10)

    class Meta:
        db_table = 'inventory_units'

    def __str__(self):
        return self.abbreviation


class Product(BaseModel):
    """A sellable or storable product/item."""

    class Status(models.TextChoices):
        ACTIVE = 'active', _('Active')
        INACTIVE = 'inactive', _('Inactive')
        DISCONTINUED = 'discontinued', _('Discontinued')

    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    barcode = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, blank=True)
    cost_price = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    reorder_level = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    image = models.ImageField(upload_to='products/', blank=True, null=True)

    class Meta:
        db_table = 'inventory_products'

    def __str__(self):
        return f'{self.name} ({self.sku})'


class Warehouse(BaseModel):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'inventory_warehouses'

    def __str__(self):
        return self.name


class Stock(BaseModel):
    """Current stock level of a product in a warehouse."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_entries')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='stock_entries')
    quantity = models.DecimalField(max_digits=14, decimal_places=3, default=0)

    class Meta:
        db_table = 'inventory_stock'
        unique_together = ['product', 'warehouse']

    def __str__(self):
        return f'{self.product.name} @ {self.warehouse.name}: {self.quantity}'


class StockMovement(BaseModel):
    """Tracks every stock in/out movement."""

    class MovementType(models.TextChoices):
        IN = 'in', _('Stock In')
        OUT = 'out', _('Stock Out')
        TRANSFER = 'transfer', _('Transfer')
        ADJUSTMENT = 'adjustment', _('Adjustment')

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='movements')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=20, choices=MovementType.choices)
    quantity = models.DecimalField(max_digits=14, decimal_places=3)
    reference = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'inventory_stock_movements'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.movement_type.upper()} {self.quantity} x {self.product.name}'
