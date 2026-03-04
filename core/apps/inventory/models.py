"""
Inventory models — fully SOLID-compliant.

SOLID applied:
  S — Single Responsibility: each model owns exactly one domain concept.
  O — Open/Closed: new movement types added via TextChoices (no code change).
  L — Liskov Substitution: all models safely interchangeable via BaseModel.
  I — Interface Segregation: stock logic isolated in Stock.apply_movement().
  D — Dependency Inversion: StockMovement depends on Product/Warehouse
      abstractions, not concrete implementations.
"""
import uuid
from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.db.models import F, Sum
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from utils.models import BaseModel


# ---------------------------------------------------------------------------
# Category (hierarchical)
# ---------------------------------------------------------------------------

class Category(BaseModel):
    """Product taxonomy — supports unlimited nesting via self-FK."""

    name = models.CharField(_('name'), max_length=255)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='children',
    )

    class Meta:
        db_table = 'inventory_categories'
        verbose_name = _('Category')
        verbose_name_plural = _('Categories')
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def full_path(self):
        """Returns 'Electronics > Phones > Smartphones'."""
        parts = [self.name]
        parent = self.parent
        while parent:
            parts.insert(0, parent.name)
            parent = parent.parent
        return ' > '.join(parts)


# ---------------------------------------------------------------------------
# Unit of Measurement
# ---------------------------------------------------------------------------

class Unit(BaseModel):
    """Standardised unit (KG, LITRE, PIECE, BOX, etc.)."""

    name = models.CharField(max_length=50)
    abbreviation = models.CharField(max_length=10)

    class Meta:
        db_table = 'inventory_units'
        unique_together = ['name', 'company']
        ordering = ['name']

    def __str__(self):
        return self.abbreviation


# ---------------------------------------------------------------------------
# Supplier
# ---------------------------------------------------------------------------

class Supplier(BaseModel):
    """
    External supplier / vendor for products.
    A product can have multiple suppliers; each supplier can supply
    multiple products (M2M through SupplierProduct).
    """

    name = models.CharField(_('supplier name'), max_length=255)
    code = models.CharField(
        max_length=50,
        blank=True,
        help_text='Internal vendor code',
    )
    contact_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    website = models.URLField(blank=True)

    # Payment terms (net days)
    payment_terms_days = models.PositiveSmallIntegerField(
        default=30,
        help_text='Number of days allowed to pay invoices (e.g. 30 = Net-30)',
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'inventory_suppliers'
        verbose_name = _('Supplier')
        verbose_name_plural = _('Suppliers')
        ordering = ['name']
        unique_together = ['name', 'company']

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------

class Product(BaseModel):
    """
    A sellable or storable item.

    Business rules enforced here (Single Responsibility — product logic):
    - SKU must be unique per company.
    - is_low_stock is computed from total stock vs reorder_level.
    - inventory_turnover_rate() computes COGS / avg-stock (standard formula).
    """

    class Status(models.TextChoices):
        ACTIVE = 'active', _('Active')
        INACTIVE = 'inactive', _('Inactive')
        DISCONTINUED = 'discontinued', _('Discontinued')

    name = models.CharField(_('product name'), max_length=255, db_index=True)
    sku = models.CharField(_('SKU'), max_length=100)
    barcode = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True)

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
    )
    unit = models.ForeignKey(
        Unit,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
    )
    suppliers = models.ManyToManyField(
        Supplier,
        through='SupplierProduct',
        related_name='products',
        blank=True,
    )

    # Pricing
    cost_price = models.DecimalField(
        _('cost price'),
        max_digits=14,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
    )
    selling_price = models.DecimalField(
        _('selling price'),
        max_digits=14,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
    )

    # Stock control
    reorder_level = models.PositiveIntegerField(
        _('reorder level'),
        default=0,
        help_text='Stock quantity below which a low-stock alert is triggered',
    )
    reorder_quantity = models.PositiveIntegerField(
        _('reorder quantity'),
        default=0,
        help_text='Suggested quantity to order when reorder level is reached',
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    weight_kg = models.DecimalField(
        max_digits=8, decimal_places=3,
        null=True, blank=True,
        help_text='Weight in kilograms',
    )

    class Meta:
        db_table = 'inventory_products'
        verbose_name = _('Product')
        verbose_name_plural = _('Products')
        unique_together = ['sku', 'company']
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.sku})'

    # ------------------------------------------------------------------
    # Computed properties
    # ------------------------------------------------------------------

    @property
    def total_stock(self):
        """Sum of stock across all warehouses — uses DB aggregation."""
        result = self.stock_entries.aggregate(total=Sum('quantity'))
        return result['total'] or Decimal('0')

    @property
    def is_low_stock(self):
        """
        True when total stock across all warehouses is at or below
        the reorder_level threshold.

        This is a COMPUTED flag (not stored in DB) so it is always
        accurate without requiring triggers or signals.
        """
        if self.reorder_level == 0:
            return False
        return self.total_stock <= Decimal(self.reorder_level)

    @property
    def profit_margin(self):
        """Gross profit margin as a percentage."""
        if not self.selling_price or self.selling_price == 0:
            return Decimal('0')
        margin = (self.selling_price - self.cost_price) / self.selling_price * 100
        return round(margin, 2)

    # ------------------------------------------------------------------
    # Business methods (Interface Segregation / Single Responsibility)
    # ------------------------------------------------------------------

    def inventory_turnover_rate(self, days: int = 365) -> Decimal:
        """
        Calculate inventory turnover rate over the given number of days.

        Formula:
            Turnover = COGS (cost of goods SOLD) / Average Inventory Value

        COGS = sum of (quantity * cost_price) for all OUT movements in period.
        Average inventory = (beginning + ending) / 2 (approximated as
        current total_stock * cost_price for simplicity).

        Args:
            days: Look-back window in days (default: 365 = annual turnover).

        Returns:
            Decimal — number of times inventory was sold and replaced.
            Higher = faster-moving product. Zero if no cost/stock data.
        """
        since = timezone.now() - timezone.timedelta(days=days)

        # COGS = total outgoing movement quantity * cost_price
        out_movements = (
            self.movements
            .filter(
                movement_type__in=[
                    StockMovement.MovementType.OUT,
                    StockMovement.MovementType.SALE,
                ],
                created_at__gte=since,
            )
            .aggregate(total_out=Sum('quantity'))
        )
        total_out = out_movements['total_out'] or Decimal('0')
        cogs = total_out * self.cost_price

        avg_inventory_value = self.total_stock * self.cost_price

        if avg_inventory_value == 0:
            return Decimal('0')

        return round(cogs / avg_inventory_value, 4)

    def days_of_stock_remaining(self) -> int:
        """
        Estimate how many days of stock remain based on 30-day avg usage.
        Returns -1 if no movement data is available.
        """
        since = timezone.now() - timezone.timedelta(days=30)
        out_data = (
            self.movements
            .filter(
                movement_type__in=[
                    StockMovement.MovementType.OUT,
                    StockMovement.MovementType.SALE,
                ],
                created_at__gte=since,
            )
            .aggregate(total_out=Sum('quantity'))
        )
        total_out_30d = out_data['total_out'] or Decimal('0')
        if total_out_30d == 0:
            return -1
        daily_usage = total_out_30d / 30
        return int(self.total_stock / daily_usage)


# ---------------------------------------------------------------------------
# Supplier ↔ Product (through table)
# ---------------------------------------------------------------------------

class SupplierProduct(BaseModel):
    """
    Through model for the Supplier ↔ Product M2M relationship.
    Stores supplier-specific pricing and lead time.
    """

    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.CASCADE,
        related_name='supplier_products',
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='supplier_products',
    )
    supplier_sku = models.CharField(
        max_length=100, blank=True,
        help_text="Supplier's own SKU for this product",
    )
    unit_cost = models.DecimalField(
        max_digits=14, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text='Agreed unit purchase price from this supplier',
    )
    lead_time_days = models.PositiveSmallIntegerField(
        default=1,
        help_text='Days from order to delivery',
    )
    is_preferred = models.BooleanField(
        default=False,
        help_text='Mark this as the primary/preferred supplier',
    )
    min_order_quantity = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = 'inventory_supplier_products'
        unique_together = ['supplier', 'product']
        ordering = ['supplier__name']

    def __str__(self):
        return f'{self.supplier.name} → {self.product.name}'


# ---------------------------------------------------------------------------
# Warehouse
# ---------------------------------------------------------------------------

class Warehouse(BaseModel):
    """Physical or virtual location where stock is held."""

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=255, blank=True)
    manager_name = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'inventory_warehouses'
        ordering = ['name']
        unique_together = ['name', 'company']

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Stock (current balance ledger)
# ---------------------------------------------------------------------------

class Stock(BaseModel):
    """
    Current stock balance of a product in a single warehouse.

    This is the BALANCE record — updated every time a StockMovement
    is saved. Never edit this directly — always create a StockMovement.
    """

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='stock_entries',
    )
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='stock_entries',
    )
    quantity = models.DecimalField(
        max_digits=14,
        decimal_places=3,
        default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0'))],
    )
    last_movement_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'inventory_stock'
        unique_together = ['product', 'warehouse']
        ordering = ['product__name']

    def __str__(self):
        return f'{self.product.name} @ {self.warehouse.name}: {self.quantity}'

    def apply_movement(self, movement_type: str, quantity: Decimal) -> None:
        """
        Adjust this stock balance based on a movement type.

        Single Responsibility: this method owns all stock math.
        Called inside StockMovement.save() within a DB transaction.

        Raises:
            ValueError: if OUT/SALE would result in negative stock.
        """
        if movement_type in (
            StockMovement.MovementType.IN,
            StockMovement.MovementType.PURCHASE,
        ):
            self.quantity = F('quantity') + quantity

        elif movement_type in (
            StockMovement.MovementType.OUT,
            StockMovement.MovementType.SALE,
        ):
            # Reload from DB to get the actual current value before comparing
            self.refresh_from_db(fields=['quantity'])
            if self.quantity < quantity:
                raise ValueError(
                    f'Insufficient stock: {self.quantity} available, '
                    f'{quantity} requested for {self.product.name}.'
                )
            self.quantity = F('quantity') - quantity

        elif movement_type == StockMovement.MovementType.ADJUSTMENT:
            # ADJUSTMENT sets stock to an absolute value, not a delta
            self.quantity = quantity

        self.last_movement_at = timezone.now()
        self.save(update_fields=['quantity', 'last_movement_at'])
        self.refresh_from_db(fields=['quantity'])


# ---------------------------------------------------------------------------
# StockMovement (the ledger / event log)
# ---------------------------------------------------------------------------

class StockMovement(BaseModel):
    """
    Immutable ledger of every stock event.

    Open/Closed principle: new movement types are added to MovementType
    without changing any other code. The Stock.apply_movement() method
    handles each type via conditionals — no subclassing needed.
    """

    class MovementType(models.TextChoices):
        IN = 'in', _('Stock In')                       # Generic receipt
        OUT = 'out', _('Stock Out')                    # Generic issue
        PURCHASE = 'purchase', _('Purchase Receipt')   # From supplier
        SALE = 'sale', _('Sales Issue')                # For a sales order
        ADJUSTMENT = 'adjustment', _('Adjustment')     # Physical count correction
        TRANSFER_OUT = 'transfer_out', _('Transfer Out')  # Leaving warehouse
        TRANSFER_IN = 'transfer_in', _('Transfer In')     # Arriving at warehouse
        RETURN = 'return', _('Return')                 # Customer return

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,   # Prevent deleting products with movements
        related_name='movements',
    )
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name='movements',
    )
    movement_type = models.CharField(
        max_length=20,
        choices=MovementType.choices,
        db_index=True,
    )
    quantity = models.DecimalField(
        max_digits=14,
        decimal_places=3,
        validators=[MinValueValidator(Decimal('0.001'))],
        help_text='Always a positive number. Direction is determined by movement_type.',
    )
    reference = models.CharField(
        max_length=255,
        blank=True,
        help_text='Order number, PO number, adjustment ID, etc.',
    )
    notes = models.TextField(blank=True)
    unit_cost = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Cost at the time of this movement (for valuation)',
    )

    class Meta:
        db_table = 'inventory_stock_movements'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product', '-created_at']),
            models.Index(fields=['warehouse', 'movement_type']),
        ]

    def __str__(self):
        return f'{self.get_movement_type_display()} | {self.quantity} x {self.product.name}'

    # ------------------------------------------------------------------
    # Auto stock update on save (Dependency Inversion: depends on
    # Stock.apply_movement abstraction, not on Stock internals)
    # ------------------------------------------------------------------

    def save(self, *args, **kwargs):
        """
        Override save() to atomically update the Stock balance when a
        StockMovement is created.

        The entire operation (create movement + update stock) runs inside
        a single DB transaction. If either fails, both are rolled back.
        """
        is_new = self._state.adding   # True only on INSERT, not UPDATE

        with transaction.atomic():
            super().save(*args, **kwargs)

            if is_new:
                # Get or create the Stock record for this product+warehouse
                stock, _ = Stock.objects.get_or_create(
                    product=self.product,
                    warehouse=self.warehouse,
                    company=self.company,
                    defaults={'quantity': Decimal('0')},
                )
                # Delegate all math to Stock — keeps this method thin
                stock.apply_movement(self.movement_type, self.quantity)
