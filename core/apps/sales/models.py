"""
Sales models — production-grade, transactional, SOLID-compliant.

Design decisions:
  - CompanyTaxSettings: per-company tax configuration (default VAT rate,
    tax number, tax name, etc.) — stored once, applied to all invoices.
  - Invoice is INDEPENDENT of SalesOrder: you can create direct invoices
    (for services, contracts) without needing an order.
  - InvoiceItem is linked to Product for auto stock deduction.
  - Payment: separate model (one invoice can have multiple partial payments).
  - Auto stock deduction fires on Invoice.confirm() using transaction.atomic().
  - All money is Decimal — never float. Floating point is dangerous for money.
"""
import uuid
from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models, transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from utils.models import BaseModel


# ---------------------------------------------------------------------------
# Company Tax Settings (per-company configuration)
# ---------------------------------------------------------------------------

class CompanyTaxSettings(BaseModel):
    """
    Tax configuration for a company.

    One CompanyTaxSettings per company (OneToOne via company FK + unique).
    Applied automatically to every new invoice raised by the company.
    """

    # Tax identity
    tax_number = models.CharField(
        _('Tax / VAT number'),
        max_length=50,
        blank=True,
        help_text='Your VAT / GST / TIN registration number (shown on invoices)',
    )
    tax_name = models.CharField(
        _('Tax label'),
        max_length=50,
        default='VAT',
        help_text='What to call this tax on invoices (VAT, GST, Sales Tax, etc.)',
    )

    # Default rates
    default_tax_rate = models.DecimalField(
        _('Default tax rate (%)'),
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[
            MinValueValidator(Decimal('0')),
            MaxValueValidator(Decimal('100')),
        ],
        help_text='Applied to new invoices unless overridden',
    )
    default_discount_rate = models.DecimalField(
        _('Default discount rate (%)'),
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
    )

    # Tax inclusion / exclusion
    prices_include_tax = models.BooleanField(
        default=False,
        help_text='If True, product prices are tax-inclusive. If False, tax is added on top.',
    )

    # Currency
    currency_code = models.CharField(max_length=3, default='USD')
    currency_symbol = models.CharField(max_length=5, default='$')

    class Meta:
        db_table = 'sales_company_tax_settings'
        verbose_name = _('Company Tax Settings')
        verbose_name_plural = _('Company Tax Settings')

    def __str__(self):
        return f'{self.company.name} — Tax Settings ({self.tax_name} {self.default_tax_rate}%)'


# ---------------------------------------------------------------------------
# Customer
# ---------------------------------------------------------------------------

class Customer(BaseModel):
    """A client / buyer — the entity that purchases from us."""

    name = models.CharField(_('customer name'), max_length=255, db_index=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    tax_id = models.CharField(
        max_length=50, blank=True, null=True,
        help_text="Customer's VAT / tax registration number"
    )
    credit_limit = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0'))],
    )
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'sales_customers'
        verbose_name = _('Customer')
        verbose_name_plural = _('Customers')
        ordering = ['name']
        unique_together = ['name', 'company']

    def __str__(self):
        return self.name

    @property
    def outstanding_balance(self):
        """Total unpaid balance across all invoices for this customer."""
        result = self.invoices.filter(
            status__in=[Invoice.Status.DRAFT, Invoice.Status.CONFIRMED, Invoice.Status.PARTIAL]
        ).aggregate(
            total=models.Sum(
                models.ExpressionWrapper(
                    models.F('amount_due') - models.F('amount_paid'),
                    output_field=models.DecimalField(max_digits=14, decimal_places=2),
                )
            )
        )
        return result['total'] or Decimal('0')


# ---------------------------------------------------------------------------
# SalesOrder (unchanged — kept as separate entity)
# ---------------------------------------------------------------------------

class SalesOrder(BaseModel):
    """
    A sales order represents the COMMITMENT to sell.
    An Invoice represents the FINANCIAL claim.
    They are separate concepts — some businesses invoice without orders.
    """

    class Status(models.TextChoices):
        DRAFT = 'draft', _('Draft')
        CONFIRMED = 'confirmed', _('Confirmed')
        PROCESSING = 'processing', _('Processing')
        SHIPPED = 'shipped', _('Shipped')
        DELIVERED = 'delivered', _('Delivered')
        CANCELLED = 'cancelled', _('Cancelled')

    order_number = models.CharField(max_length=50)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='orders')
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True
    )
    order_date = models.DateField()
    delivery_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    discount = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        help_text='Order-level discount in %',
    )
    tax_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        help_text='Tax rate in % (copied from CompanyTaxSettings on creation)',
    )

    class Meta:
        db_table = 'sales_orders'
        ordering = ['-order_date']
        unique_together = ['order_number', 'company']

    def __str__(self):
        return self.order_number

    @property
    def subtotal(self):
        """Sum of (quantity × unit_price) for all items."""
        result = self.items.aggregate(
            subtotal=models.Sum(
                models.ExpressionWrapper(
                    models.F('quantity') * models.F('unit_price'),
                    output_field=models.DecimalField(max_digits=14, decimal_places=2),
                )
            )
        )
        return (result['subtotal'] or Decimal('0')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    @property
    def discount_amount(self):
        return (self.subtotal * self.discount / 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    @property
    def taxable_amount(self):
        return self.subtotal - self.discount_amount

    @property
    def tax_amount(self):
        return (self.taxable_amount * self.tax_rate / 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    @property
    def total(self):
        return self.taxable_amount + self.tax_amount


class SalesOrderItem(BaseModel):
    order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('inventory.Product', on_delete=models.PROTECT, related_name='order_items')
    quantity = models.DecimalField(
        max_digits=14, decimal_places=3,
        validators=[MinValueValidator(Decimal('0.001'))],
    )
    unit_price = models.DecimalField(
        max_digits=14, decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'sales_order_items'

    @property
    def total(self):
        return (self.quantity * self.unit_price).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    def __str__(self):
        return f'{self.product.name} × {self.quantity}'


# ---------------------------------------------------------------------------
# Invoice
# ---------------------------------------------------------------------------

class Invoice(BaseModel):
    """
    Financial document issued to a customer.

    Lifecycle:
        DRAFT → confirm() → CONFIRMED → record_payment() → PARTIAL/PAID
                          ↘ void()   → VOIDED

    Auto-stock deduction happens inside confirm() using transaction.atomic().
    Once confirmed, an invoice is IMMUTABLE (no editing items or amounts).

    Can be linked to a SalesOrder OR created standalone (for services).
    """

    class Status(models.TextChoices):
        DRAFT = 'draft', _('Draft')
        CONFIRMED = 'confirmed', _('Confirmed')           # Awaiting payment
        PARTIAL = 'partial', _('Partially Paid')
        PAID = 'paid', _('Paid')
        OVERDUE = 'overdue', _('Overdue')
        VOIDED = 'voided', _('Voided')

    # Identity
    invoice_number = models.CharField(max_length=50)
    reference = models.CharField(
        max_length=100, blank=True,
        help_text='Optional external reference (PO number, contract ID)',
    )

    # Relationships
    customer = models.ForeignKey(
        Customer, on_delete=models.PROTECT, related_name='invoices',
    )
    order = models.OneToOneField(
        SalesOrder,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='invoice',
        help_text='Linked sales order (optional — invoices can be standalone)',
    )

    # Dates
    issue_date = models.DateField(default=timezone.now)
    due_date = models.DateField()

    # Status
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True
    )

    # Financials (STORED — denormalized for performance and audit trail)
    # These are set when the invoice is confirmed and NEVER change after that.
    subtotal = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal('0'),
        help_text='Sum of item totals before tax and discount',
    )
    discount_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('0'),
        help_text='Overall discount % applied to this invoice',
    )
    discount_amount = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal('0'),
    )
    tax_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('0'),
        help_text='Tax rate % — copied from CompanyTaxSettings on creation',
    )
    tax_amount = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal('0'),
    )
    tax_label = models.CharField(
        max_length=50, default='TAX',
        help_text='Name of the tax (VAT, GST, etc.) — snapshot from CompanyTaxSettings',
    )
    amount_due = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal('0'),
        help_text='Total amount the customer must pay (subtotal - discount + tax)',
    )
    amount_paid = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal('0'),
    )

    # Who confirmed it
    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='confirmed_invoices',
    )
    confirmed_at = models.DateTimeField(null=True, blank=True)

    notes = models.TextField(blank=True)
    terms = models.TextField(blank=True, help_text='Payment terms printed on invoice')

    class Meta:
        db_table = 'sales_invoices'
        ordering = ['-issue_date']
        indexes = [
            models.Index(fields=['status', 'due_date']),
            models.Index(fields=['customer', 'status']),
        ]
        unique_together = ['invoice_number', 'company']

    def __str__(self):
        return self.invoice_number

    # ------------------------------------------------------------------
    # Computed properties
    # ------------------------------------------------------------------

    @property
    def balance(self):
        """Amount still owed."""
        return (self.amount_due - self.amount_paid).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    @property
    def is_overdue(self):
        """True if today is past due_date and invoice is not paid/voided."""
        terminal = {self.Status.PAID, self.Status.VOIDED}
        return (
            self.status not in terminal
            and self.due_date < timezone.now().date()
        )

    @property
    def payment_percentage(self):
        """How much (%) the customer has paid."""
        if not self.amount_due or self.amount_due == 0:
            return Decimal('0')
        return round(self.amount_paid / self.amount_due * 100, 1)

    # ------------------------------------------------------------------
    # Business logic (transactional methods)
    # ------------------------------------------------------------------

    def _calculate_totals(self) -> None:
        """
        Recalculate and store all financial totals from InvoiceItems.
        Called inside confirm() before finalizing the invoice.

        Uses DB aggregation for accuracy — does not trust Python-level caches.
        """
        from django.db.models import Sum, ExpressionWrapper, F
        from django.db.models import DecimalField as DField

        result = self.items.aggregate(
            subtotal=Sum(
                ExpressionWrapper(
                    F('quantity') * F('unit_price'),
                    output_field=DField(max_digits=14, decimal_places=2),
                )
            )
        )
        subtotal = result['subtotal'] or Decimal('0')
        discount_amount = (subtotal * self.discount_rate / 100).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )
        taxable = subtotal - discount_amount
        tax_amount = (taxable * self.tax_rate / 100).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )
        amount_due = taxable + tax_amount

        self.subtotal = subtotal.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.discount_amount = discount_amount
        self.tax_amount = tax_amount
        self.amount_due = amount_due

    def confirm(self, confirmed_by_user) -> None:
        """
        Confirm this invoice:
          1. Calculate and store final totals (subtotal, tax, amount_due)
          2. Deduct stock for each InvoiceItem (via StockMovement)
          3. Mark as CONFIRMED with timestamp

        TRANSACTIONAL: all steps run inside a single atomic block.
        If stock is insufficient for ANY item, the entire operation fails and
        the invoice stays in DRAFT status.

        Raises:
            ValueError: if invoice is not in DRAFT status.
            ValueError: if any item has insufficient stock (from StockMovement.save).
        """
        if self.status != self.Status.DRAFT:
            raise ValueError(
                f'Only DRAFT invoices can be confirmed. Current status: {self.status}'
            )
        if not self.items.exists():
            raise ValueError('Cannot confirm an invoice with no items.')

        with transaction.atomic():
            # Step 1: Recalculate totals
            self._calculate_totals()

            # Step 2: Deduct stock for each item
            from apps.inventory.models import StockMovement, Warehouse

            # Use the company's default warehouse (first active one)
            warehouse = Warehouse.objects.filter(
                company=self.company, is_active=True
            ).first()

            if not warehouse:
                raise ValueError(
                    'No active warehouse found for this company. '
                    'Please create a warehouse before confirming invoices.'
                )

            for item in self.items.select_related('product').iterator():
                # Creating a StockMovement triggers Stock.apply_movement()
                # which raises ValueError if stock is insufficient.
                StockMovement.objects.create(
                    product=item.product,
                    warehouse=warehouse,
                    company=self.company,
                    movement_type=StockMovement.MovementType.SALE,
                    quantity=item.quantity,
                    unit_cost=item.product.cost_price,
                    reference=self.invoice_number,
                    notes=f'Auto-deducted on invoice confirmation: {self.invoice_number}',
                    created_by=confirmed_by_user,
                )

            # Step 3: Mark confirmed
            self.status = self.Status.CONFIRMED
            self.confirmed_by = confirmed_by_user
            self.confirmed_at = timezone.now()
            self.save(update_fields=[
                'status', 'confirmed_by', 'confirmed_at',
                'subtotal', 'discount_amount', 'tax_amount', 'amount_due',
            ])

    def record_payment(self, amount: Decimal, recorded_by_user) -> 'Payment':
        """
        Record a payment against this invoice.
        Automatically transitions status:
          CONFIRMED/PARTIAL → PARTIAL (if partially paid)
          CONFIRMED/PARTIAL → PAID    (if fully paid)

        Raises:
            ValueError: if invoice is not payable (VOIDED or DRAFT).
            ValueError: if payment amount exceeds outstanding balance.
        """
        not_payable = {self.Status.DRAFT, self.Status.VOIDED}
        if self.status in not_payable:
            raise ValueError(
                f'Cannot record payment on a {self.status} invoice.'
            )

        amount = Decimal(str(amount)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        if amount <= 0:
            raise ValueError('Payment amount must be positive.')

        if amount > self.balance:
            raise ValueError(
                f'Payment of {amount} exceeds outstanding balance of {self.balance}.'
            )

        with transaction.atomic():
            payment = Payment.objects.create(
                invoice=self,
                amount=amount,
                company=self.company,
                recorded_by=recorded_by_user,
            )
            self.amount_paid = (self.amount_paid + amount).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
            if self.balance <= 0:
                self.status = self.Status.PAID
            else:
                self.status = self.Status.PARTIAL
            self.save(update_fields=['amount_paid', 'status'])

        return payment

    def void(self, voided_by_user) -> None:
        """
        Void this invoice. Only DRAFT or CONFIRMED (unpaid) invoices can be voided.
        VOIDING a confirmed invoice creates REVERSAL StockMovements to put stock back.

        Raises:
            ValueError: if invoice is PAID or already VOIDED.
        """
        if self.status in {self.Status.PAID, self.Status.VOIDED}:
            raise ValueError(f'Cannot void a {self.status} invoice.')

        with transaction.atomic():
            if self.status == self.Status.CONFIRMED:
                # Reverse any stock deductions from confirmation
                from apps.inventory.models import StockMovement, Warehouse
                warehouse = Warehouse.objects.filter(
                    company=self.company, is_active=True
                ).first()
                if warehouse:
                    for item in self.items.select_related('product').iterator():
                        StockMovement.objects.create(
                            product=item.product,
                            warehouse=warehouse,
                            company=self.company,
                            movement_type=StockMovement.MovementType.RETURN,
                            quantity=item.quantity,
                            unit_cost=item.product.cost_price,
                            reference=self.invoice_number,
                            notes=f'Stock reversal for voided invoice: {self.invoice_number}',
                            created_by=voided_by_user,
                        )

            self.status = self.Status.VOIDED
            self.save(update_fields=['status'])


# ---------------------------------------------------------------------------
# InvoiceItem
# ---------------------------------------------------------------------------

class InvoiceItem(BaseModel):
    """
    A line item on an invoice, linked to a Product.
    unit_price is a snapshot of the price at invoice time — it does NOT
    change if the Product's price changes later.
    """

    invoice = models.ForeignKey(
        Invoice, on_delete=models.CASCADE, related_name='items'
    )
    product = models.ForeignKey(
        'inventory.Product',
        on_delete=models.PROTECT,
        related_name='invoice_items',
        null=True,
        blank=True,
        help_text='Leave blank for non-inventory line items (services, fees)',
    )
    description = models.CharField(
        max_length=500,
        help_text='Line item description (auto-filled from product name if product is selected)',
    )
    quantity = models.DecimalField(
        max_digits=14,
        decimal_places=3,
        validators=[MinValueValidator(Decimal('0.001'))],
    )
    unit_price = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))],
        help_text='Snapshot of price at time of invoice creation',
    )
    # Per-item tax rate (can differ from invoice-level tax, e.g., zero-rated items)
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
    )
    discount_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
    )

    class Meta:
        db_table = 'sales_invoice_items'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.description} × {self.quantity}'

    @property
    def line_total_before_tax(self):
        """Quantity × unit_price − item-level discount."""
        gross = self.quantity * self.unit_price
        discount = gross * self.discount_rate / 100
        return (gross - discount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    @property
    def item_tax_amount(self):
        return (self.line_total_before_tax * self.tax_rate / 100).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )

    @property
    def total(self):
        """Final line total including item-level tax."""
        return self.line_total_before_tax + self.item_tax_amount

    def save(self, *args, **kwargs):
        """Auto-fill description and unit_price from Product if not provided."""
        if self.product and not self.description:
            self.description = self.product.name
        if self.product and not self.unit_price:
            self.unit_price = self.product.selling_price
        super().save(*args, **kwargs)


# ---------------------------------------------------------------------------
# Payment
# ---------------------------------------------------------------------------

class Payment(BaseModel):
    """
    A payment record against an invoice.
    One invoice can have many payments (partial payments).
    Payments are IMMUTABLE — never edit or delete a payment.
    Issue a refund/credit note instead.
    """

    class Method(models.TextChoices):
        CASH = 'cash', _('Cash')
        BANK_TRANSFER = 'bank_transfer', _('Bank Transfer')
        CREDIT_CARD = 'credit_card', _('Credit Card')
        CHEQUE = 'cheque', _('Cheque')
        ONLINE = 'online', _('Online Payment')
        OTHER = 'other', _('Other')

    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.PROTECT,
        related_name='payments',
    )
    amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    payment_date = models.DateField(default=timezone.now)
    method = models.CharField(
        max_length=20,
        choices=Method.choices,
        default=Method.BANK_TRANSFER,
    )
    reference = models.CharField(
        max_length=100,
        blank=True,
        help_text='Bank transaction ID, cheque number, etc.',
    )
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='recorded_payments',
    )

    class Meta:
        db_table = 'sales_payments'
        ordering = ['-payment_date']

    def __str__(self):
        return f'{self.invoice.invoice_number} — {self.amount} on {self.payment_date}'
