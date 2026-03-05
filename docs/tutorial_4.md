# Tutorial 4 — Sales Module: Invoicing, Payments & Atomic Stock Deduction

> **What we cover in this tutorial:**
> 1. Why we rebuilt the Sales module from scratch
> 2. CompanyTaxSettings — per-company VAT/GST configuration
> 3. The Invoice model — design decisions and lifecycle
> 4. InvoiceItem — price snapshots, per-item tax, auto-fill from Product
> 5. `Invoice.confirm()` — transactional atomicity explained line by line
> 6. Payment model — partial payments, multiple methods
> 7. `Invoice.record_payment()` — auto status transitions
> 8. `Invoice.void()` — stock reversal
> 9. Customer outstanding balance — aggregate queries
> 10. Serializer read/write split — why two serializers per model
> 11. ViewSet actions — thin controllers, fat models
> 12. Migration strategy — how we handled breaking schema changes
> 13. Full API walkthrough — create an invoice, confirm it, pay it

---

## Table of Contents

1. [Why We Rebuilt the Sales Module](#1-why-we-rebuilt-the-sales-module)
2. [CompanyTaxSettings — One Tax Config Per Company](#2-companytaxsettings--one-tax-config-per-company)
3. [Invoice vs SalesOrder — Two Different Concepts](#3-invoice-vs-salesorder--two-different-concepts)
4. [The Invoice Model — Full Field Walkthrough](#4-the-invoice-model--full-field-walkthrough)
5. [Why We STORE Totals Instead of Computing Them](#5-why-we-store-totals-instead-of-computing-them)
6. [InvoiceItem — Price Snapshots and Per-Item Tax](#6-invoiceitem--price-snapshots-and-per-item-tax)
7. [Invoice.confirm() — The Most Important Method](#7-invoiceconfirm--the-most-important-method)
8. [transaction.atomic() — Deep Dive](#8-transactionatomic--deep-dive)
9. [Payment Model — Multiple Payments Per Invoice](#9-payment-model--multiple-payments-per-invoice)
10. [Invoice.record_payment() — Auto Status Transitions](#10-invoicerecord_payment--auto-status-transitions)
11. [Invoice.void() — Stock Reversal](#11-invoicevoid--stock-reversal)
12. [Customer.outstanding_balance — Aggregate Queries](#12-customeroutstanding_balance--aggregate-queries)
13. [Serializers — Read vs Write Split](#13-serializers--read-vs-write-split)
14. [ViewSets — Thin Controllers, Fat Models](#14-viewsets--thin-controllers-fat-models)
15. [The DRY State Machine _transition() Helper](#15-the-dry-state-machine-_transition-helper)
16. [InvoiceItemViewSet — DRAFT-Only Guard](#16-invoiceitemviewset--draft-only-guard)
17. [Migration Strategy — Handling Breaking Changes](#17-migration-strategy--handling-breaking-changes)
18. [Full API Walkthrough — Invoice to Payment](#18-full-api-walkthrough--invoice-to-payment)
19. [Summary — What We Built](#19-summary--what-we-built)

---

## 1. Why We Rebuilt the Sales Module

After tutorial 3, the sales module had these problems:

| Problem | Old Code | Impact |
|---|---|---|
| No InvoiceItem | Invoice linked directly to SalesOrder | Can't create standalone invoices for services |
| No Payment model | `amount_paid` was just a number field set manually | Can't track partial payments or payment history |
| No tax config | Tax rate was a single field on each order | Every user had to manually set the same tax rate |
| No stock deduction | Confirming an invoice didn't touch stock | Stock was wrong — no automatic update |
| No void logic | Invoice had no way to be reversed | Mistakes couldn't be undone |
| Computed totals only | Subtotal/total were `@property` methods | Totals would change if product prices changed later |

The old Invoice model was essentially a stub. In a real ERP, the Invoice is the most critical financial document. We needed to rebuild it properly.

---

## 2. CompanyTaxSettings — One Tax Config Per Company

### The Problem Without It

Without a centralized tax config, every time someone created an invoice they'd have to manually type:
- Tax rate: `20` (their country's VAT rate)
- Tax name: `VAT`
- Currency: `GBP`

If you have 100 invoices a month, you'd type these same values 100 times. And if the tax rate ever changes (governments change VAT rates), you'd need to find and update every future invoice.

### The Solution

```python
class CompanyTaxSettings(BaseModel):
    """Tax configuration — stored once per company, applied to all invoices."""

    tax_name = models.CharField(max_length=50, default='VAT')
    # "VAT" in UK/Europe, "GST" in Australia/India, "Sales Tax" in USA

    default_tax_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('0.00'),
        validators=[
            MinValueValidator(Decimal('0')),
            MaxValueValidator(Decimal('100')),
        ],
    )
    prices_include_tax = models.BooleanField(default=False)
    # False = tax-exclusive: £100 + 20% VAT = £120 charged
    # True  = tax-inclusive: £100 already includes VAT (£83.33 net + £16.67 VAT)

    currency_code = models.CharField(max_length=3, default='USD')
    currency_symbol = models.CharField(max_length=5, default='$')
```

**Where it's used:** When creating an Invoice, the view checks:

```python
# In InvoiceViewSet.perform_create()
tax_settings = CompanyTaxSettings.objects.filter(company=request.company).first()
if tax_settings:
    invoice.tax_rate = tax_settings.default_tax_rate
    invoice.tax_label = tax_settings.tax_name
```

So every invoice gets the company's tax rate automatically. The admin/manager only needs to set it ONCE.

**Why inherit from `BaseModel`?**

`BaseModel` provides the `company` FK. This means each Company gets exactly one `CompanyTaxSettings` record. Company A can have 20% VAT, Company B can have 18% GST — completely isolated.

---

## 3. Invoice vs SalesOrder — Two Different Concepts

This is a concept many beginners confuse. Let me explain clearly:

| | SalesOrder | Invoice |
|---|---|---|
| **What it represents** | A commitment to sell | A legal payment claim |
| **When created** | When customer places an order | When you want to request payment |
| **Affects stock?** | No | Yes — on confirmation |
| **Affects accounts?** | No | Yes — creates receivable |
| **Can exist without the other?** | Yes | Yes |
| **Immutable after a point?** | After DELIVERED | After CONFIRMED |

**Real-world analogy:**
- A SalesOrder is like a **restaurant receipt** — it says "you ordered this"
- An Invoice is like a **bank statement charge** — it says "you owe this, pay by this date"

In some businesses:
- You take an order → wait until goods are ready → then invoice
- In others (consulting, services) → you invoice first → no order exists

Our system supports both. The `Invoice.order` FK is **optional** (`null=True, blank=True`):

```python
class Invoice(BaseModel):
    order = models.OneToOneField(
        SalesOrder,
        on_delete=models.SET_NULL,
        null=True, blank=True,          # ← Order is optional
        related_name='invoice',
    )
```

---

## 4. The Invoice Model — Full Field Walkthrough

```python
class Invoice(BaseModel):
    # Identity
    invoice_number = models.CharField(max_length=50)     # INV-001, INV-002...
    reference = models.CharField(max_length=100, blank=True)  # Customer PO number

    # Who
    customer = models.ForeignKey(Customer, ...)
    order = models.OneToOneField(SalesOrder, null=True, blank=True, ...)

    # When
    issue_date = models.DateField(default=timezone.now)  # Today by default
    due_date = models.DateField()                        # Payment deadline

    # Status — the lifecycle
    status = models.CharField(choices=Status.choices, default=Status.DRAFT)
```

**Status lifecycle:**
```
DRAFT
  │
  ├── confirm()  ──────────────────────────► CONFIRMED
  │                                              │
  │                                              ├── record_payment()
  │                                              │   (partial)  ──► PARTIAL
  │                                              │
  │                                              ├── record_payment()
  │                                              │   (full)  ──────► PAID
  │                                              │
  │                                              └── void()  ───────► VOIDED
  │
  └── void() ──────────────────────────────────────────────────────► VOIDED
```

**The financial fields:**
```python
    # Stored totals (not computed — see Section 5 for why)
    subtotal = models.DecimalField(...)       # Sum of all item totals
    discount_rate = models.DecimalField(...)  # % discount on the whole invoice
    discount_amount = models.DecimalField()   # Calculated: subtotal × discount_rate/100
    tax_rate = models.DecimalField()          # % tax (copied from CompanyTaxSettings)
    tax_amount = models.DecimalField()        # Calculated: (subtotal-discount) × tax_rate/100
    tax_label = models.CharField()            # 'VAT', 'GST', etc. (snapshot)
    amount_due = models.DecimalField()        # Final: subtotal - discount + tax
    amount_paid = models.DecimalField()       # Running total of payments received
```

**Audit trail for confirmation:**
```python
    confirmed_by = models.ForeignKey(settings.AUTH_USER_MODEL, ...)
    confirmed_at = models.DateTimeField(null=True, blank=True)
```

This answers: "Who confirmed this invoice and when?" — critical for audit.

**Database indexes:**
```python
    class Meta:
        indexes = [
            models.Index(fields=['status', 'due_date']),    # For overdue queries
            models.Index(fields=['customer', 'status']),    # For customer statements
        ]
```

Why indexes? If you have 100,000 invoices, finding all overdue ones (`WHERE status != 'paid' AND due_date < today`) without an index does a **full table scan** — reads every row. With an index on `(status, due_date)`, PostgreSQL jumps directly to matching rows. This makes the query 1000x faster.

---

## 5. Why We STORE Totals Instead of Computing Them

This is one of the most important design decisions in the module. The old code did this:

```python
# OLD (bad) — computed on the fly
class Invoice(BaseModel):
    @property
    def total(self):
        return sum(item.total for item in self.items.all())
```

The new code stores the totals after confirmation:

```python
# NEW (correct) — stored at confirmation time
class Invoice(BaseModel):
    subtotal = models.DecimalField(...)        # Stored
    discount_amount = models.DecimalField()   # Stored
    tax_amount = models.DecimalField()        # Stored
    amount_due = models.DecimalField()        # Stored
```

**Why is computed bad?**

Scenario:
1. You create an invoice for 10 units of "Laptop" at £500 each → total = £5,000
2. Customer doesn't pay for 3 months
3. Sale! You change Laptop's `selling_price` to £400
4. Customer finally pays — you check the invoice... it now shows £4,000 instead of £5,000

The invoice amount changed retroactively. That's **legally wrong** and a accounting nightmare.

**Why is stored correct?**

Once confirmed, `amount_due = £5,000` is written to the database and **never changes**. Even if you update the product price tomorrow, this invoice will always show £5,000.

**The trade-off:**

Stored totals means the values are only accurate AFTER `confirm()` is called. On a DRAFT invoice, `amount_due` shows 0 (default). We recalculate inside `confirm()`:

```python
def _calculate_totals(self) -> None:
    """Called once inside confirm() — then values are frozen."""
    result = self.items.aggregate(
        subtotal=Sum(F('quantity') * F('unit_price'), ...)
    )
    # Calculate, store, never recalculate
```

---

## 6. InvoiceItem — Price Snapshots and Per-Item Tax

```python
class InvoiceItem(BaseModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')

    product = models.ForeignKey(
        'inventory.Product',
        on_delete=models.PROTECT,
        null=True, blank=True,   # ← Optional! Non-inventory items allowed
    )
    description = models.CharField(max_length=500)  # "Web Design Services"
    quantity = models.DecimalField(max_digits=14, decimal_places=3)
    unit_price = models.DecimalField(max_digits=14, decimal_places=2)

    # Per-item tax and discount (can differ from invoice-level!)
    tax_rate = models.DecimalField(default=Decimal('0'))
    discount_rate = models.DecimalField(default=Decimal('0'))
```

**Why `product` is optional:** A law firm might invoice consulting hours (no product), but also invoice for printing costs (a product). One invoice, two types of items.

**Why description is separate from product name:**

```python
def save(self, *args, **kwargs):
    if self.product and not self.description:
        self.description = self.product.name  # Auto-fill from product
    if self.product and not self.unit_price:
        self.unit_price = self.product.selling_price  # Auto-fill price
    super().save(*args, **kwargs)
```

The `description` is a **snapshot** of the product name at invoice time. If you later rename "Laptop Pro" to "Laptop Pro 2024", the old invoice still shows "Laptop Pro" — which is what was sold.

**Per-item calculations:**

```python
@property
def line_total_before_tax(self):
    """quantity × unit_price, minus item-level discount."""
    gross = self.quantity * self.unit_price          # e.g. 10 × £500 = £5,000
    discount = gross * self.discount_rate / 100     # e.g. 5% = £250
    return gross - discount                          # e.g. £4,750

@property
def item_tax_amount(self):
    """Tax on this line only."""
    return self.line_total_before_tax * self.tax_rate / 100

@property
def total(self):
    """Final line total — what goes in the 'Total' column on the invoice PDF."""
    return self.line_total_before_tax + self.item_tax_amount
```

**Why per-item tax?** In many tax systems, different goods have different tax rates:
- Food items: 0% VAT (zero-rated)
- Books: 0% VAT
- Electronics: 20% VAT
- Children's clothing: 0% VAT

A single invoice can contain items with different tax rates. Per-item tax makes this possible.

---

## 7. Invoice.confirm() — The Most Important Method

This is the heart of the Sales module. Let me walk through it line by line:

```python
def confirm(self, confirmed_by_user) -> None:
```

`confirm()` is a **business method** on the model — not in the view. Why? Because:
1. It can be called from the API view
2. It can be called from a Celery task (auto-confirm after X days)
3. It can be called from tests
4. It can be called from admin actions

If the logic were in the view, you'd have to duplicate it everywhere.

```python
    # Guard 1: Only DRAFT invoices can be confirmed
    if self.status != self.Status.DRAFT:
        raise ValueError(
            f'Only DRAFT invoices can be confirmed. Current status: {self.status}'
        )
```

**Why `ValueError` not `Exception`?**

`ValueError` is semantically "wrong data" — you passed in wrong state. In the view, we catch it:

```python
# In InvoiceViewSet.confirm()
try:
    invoice.confirm(confirmed_by_user=request.user)
except ValueError as e:
    return Response({'error': str(e)}, status=400)
```

This gives the API user a clear `400 Bad Request` with the reason.

```python
    # Guard 2: Must have at least one item
    if not self.items.exists():
        raise ValueError('Cannot confirm an invoice with no items.')
```

An empty invoice is meaningless. Prevent it explicitly.

```python
    with transaction.atomic():
```

Everything from here on is ONE atomic database operation. See Section 8 for a full explanation.

```python
        # Step 1: Calculate totals
        self._calculate_totals()
```

`_calculate_totals()` uses a single DB aggregate query to sum all items:

```python
def _calculate_totals(self):
    result = self.items.aggregate(
        subtotal=Sum(
            ExpressionWrapper(
                F('quantity') * F('unit_price'),
                output_field=DecimalField(max_digits=14, decimal_places=2),
            )
        )
    )
    subtotal = result['subtotal'] or Decimal('0')
    discount_amount = (subtotal * self.discount_rate / 100).quantize(
        Decimal('0.01'), rounding=ROUND_HALF_UP   # Bank rounding
    )
    taxable = subtotal - discount_amount
    tax_amount = (taxable * self.tax_rate / 100).quantize(
        Decimal('0.01'), rounding=ROUND_HALF_UP
    )
    self.subtotal = subtotal
    self.discount_amount = discount_amount
    self.tax_amount = tax_amount
    self.amount_due = taxable + tax_amount
    # NOTE: we do NOT call self.save() here — save happens at the end of confirm()
```

**Why `ROUND_HALF_UP`?**

Python's default `Decimal` rounding is `ROUND_HALF_EVEN` (banker's rounding). For invoices shown to customers, the standard expectation is `ROUND_HALF_UP` (what everyone learns in school: 0.5 rounds up).

Example:
- £33.335 with `ROUND_HALF_EVEN` → £33.34
- £33.335 with `ROUND_HALF_UP` → £33.34 (same here)
- £33.345 with `ROUND_HALF_EVEN` → £33.34 (rounds to nearest even)
- £33.345 with `ROUND_HALF_UP` → £33.35

For financial software, it's important to document which rounding you use to avoid penny discrepancies.

```python
        # Step 2: Get the company's default warehouse
        warehouse = Warehouse.objects.filter(
            company=self.company, is_active=True
        ).first()
        if not warehouse:
            raise ValueError('No active warehouse found for this company...')
```

Stock must come from somewhere. We use the first active warehouse. In a more advanced system, you'd let the user choose the warehouse per item — but this is a reasonable default.

```python
        # Step 3: Deduct stock for each item
        for item in self.items.select_related('product').iterator():
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
```

**Why `.iterator()`?**

`iterator()` fetches items one at a time from the database instead of loading them all into memory. For an invoice with 200 line items, this prevents loading all 200 into Python's memory at once.

**How does stock actually deduct here?**

`StockMovement.objects.create()` triggers `StockMovement.save()` which we built in tutorial 3:

```python
# In StockMovement.save() — from tutorial 3
def save(self, *args, **kwargs):
    with transaction.atomic():
        super().save(*args, **kwargs)
        if is_new:
            stock, _ = Stock.objects.get_or_create(...)
            stock.apply_movement(self.movement_type, self.quantity)
            # apply_movement() raises ValueError if insufficient stock
```

If ANY product has insufficient stock, `apply_movement()` raises `ValueError`, which propagates up through `StockMovement.save()`, through `StockMovement.objects.create()`, through the `for` loop, and into `Invoice.confirm()`. Since everything is inside `transaction.atomic()`, the entire operation rolls back. Nothing is saved. The invoice stays DRAFT.

```python
        # Step 4: Mark confirmed
        self.status = self.Status.CONFIRMED
        self.confirmed_by = confirmed_by_user
        self.confirmed_at = timezone.now()
        self.save(update_fields=[
            'status', 'confirmed_by', 'confirmed_at',
            'subtotal', 'discount_amount', 'tax_amount', 'amount_due',
        ])
```

**Why `update_fields`?**

`self.save()` without `update_fields` would write ALL fields to the database. That's wasteful (many fields haven't changed) and risky (could accidentally overwrite something). `update_fields` generates a targeted SQL UPDATE:

```sql
-- With update_fields:
UPDATE sales_invoices 
SET status='confirmed', confirmed_by_id=..., confirmed_at=...,
    subtotal=..., discount_amount=..., tax_amount=..., amount_due=...
WHERE id=...;

-- Without update_fields (overwrites everything):
UPDATE sales_invoices 
SET invoice_number=..., customer_id=..., order_id=..., issue_date=...,
    due_date=..., status=..., subtotal=..., discount_rate=..., ...
    [all 20+ fields]
WHERE id=...;
```

---

## 8. transaction.atomic() — Deep Dive

This section is important enough to deserve its own chapter.

### What "atomic" means

An atomic operation is **indivisible** — it either completes fully or not at all. There is no in-between state.

Think of a bank transfer:
```
Transfer £1000 from Account A to Account B:
1. Deduct £1000 from Account A
2. Add £1000 to Account B
```

If the server crashes between step 1 and step 2, Account A is £1000 poorer but Account B never received the money. That's a disaster. Atomic transactions prevent this.

### How it works in Django

```python
from django.db import transaction

with transaction.atomic():
    operation_1()   # All good
    operation_2()   # All good
    operation_3()   # Raises ValueError!
    # ← At this point: ALL operations are rolled back
    # The database is exactly as it was before the `with` block
```

### In our Invoice.confirm()

```
transaction.atomic() block:
  ├── _calculate_totals()                  ← In memory only (no save yet)
  ├── StockMovement.create() for item 1    ← Stock for Laptop deducted ✓
  ├── StockMovement.create() for item 2    ← Stock for Keyboard deducted ✓
  ├── StockMovement.create() for item 3    ← Mouse: INSUFFICIENT STOCK! ✗ ValueError raised
  └── ROLLBACK: All StockMovements deleted, Invoice unchanged
```

Result: Customer calls you asking why invoice wasn't confirmed. You check the error: "Mouse has only 2 units, invoice wants 5." You restock the mouse, try again, and now all 3 deductions succeed.

### Nested atomic blocks

Both `StockMovement.save()` and `Invoice.confirm()` use `transaction.atomic()`. Django handles this correctly with **savepoints**:

```
Invoice.confirm() atomic block ─────────────────────────────────┐
  │                                                              │
  ├── StockMovement.save() atomic block ──────────────────────┐  │
  │   (This is a SAVEPOINT inside the outer atomic block)     │  │
  │   └── If this fails → rollback to savepoint               │  │
  └─────────────────────────────────────────────────────────────┘
```

If `StockMovement.save()` fails, it triggers a rollback of the outer `Invoice.confirm()` too — exactly what we want.

---

## 9. Payment Model — Multiple Payments Per Invoice

### Why a separate model instead of just a field?

The old code: `Invoice.amount_paid = DecimalField()` — you just set it manually.

Problems:
- Who paid? When? How? (cash, bank transfer, card?)
- Can't track multiple partial payments
- No audit trail
- What if you need to reverse a payment?

The new code — a separate `Payment` model:

```python
class Payment(BaseModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name='payments')
    amount = models.DecimalField(...)
    payment_date = models.DateField(default=timezone.now)

    class Method(models.TextChoices):
        CASH = 'cash', 'Cash'
        BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
        CREDIT_CARD = 'credit_card', 'Credit Card'
        CHEQUE = 'cheque', 'Cheque'
        ONLINE = 'online', 'Online Payment'
        OTHER = 'other', 'Other'

    method = models.CharField(max_length=20, choices=Method.choices)
    reference = models.CharField(max_length=100, blank=True)
    # reference: bank transaction ID, cheque number, Stripe payment ID, etc.
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, ...)
```

Now you have complete payment history:
```json
{
    "invoice": "INV-001",
    "amount_due": "5000.00",
    "payments": [
        {"amount": "2000.00", "date": "2026-02-01", "method": "bank_transfer", "reference": "TXN889923"},
        {"amount": "2000.00", "date": "2026-02-15", "method": "bank_transfer", "reference": "TXN901234"},
        {"amount": "1000.00", "date": "2026-03-01", "method": "cash", "reference": ""}
    ],
    "amount_paid": "5000.00",
    "balance": "0.00",
    "status": "paid"
}
```

**Why immutable?**

```python
# In PaymentAdmin
def has_change_permission(self, request, obj=None):
    return False    # ← Can't edit a payment record

def has_delete_permission(self, request, obj=None):
    return False    # ← Can't delete a payment record
```

If a payment was recorded incorrectly, you don't delete it. You issue a **credit note** (a new negative payment or void the invoice). This preserves the audit trail. Auditors and tax authorities require this.

---

## 10. Invoice.record_payment() — Auto Status Transitions

```python
def record_payment(self, amount: Decimal, recorded_by_user) -> 'Payment':
    # Guard: only payable statuses
    not_payable = {self.Status.DRAFT, self.Status.VOIDED}
    if self.status in not_payable:
        raise ValueError(f'Cannot record payment on a {self.status} invoice.')

    amount = Decimal(str(amount)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    # Guard: can't overpay
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
        self.amount_paid = self.amount_paid + amount

        # Auto-transition status
        if self.balance <= 0:
            self.status = self.Status.PAID      # ← Fully paid
        else:
            self.status = self.Status.PARTIAL   # ← Partially paid

        self.save(update_fields=['amount_paid', 'status'])

    return payment
```

**Why `Decimal(str(amount))`?**

If someone passes `amount=1000.1` (a float), Python's floating point can make it `999.99999999999` or `1000.1000000000001`. Converting to `str` first (`"1000.1"`) then to `Decimal` gives exact decimal representation.

**The auto-transition logic:**

```
amount_due = £5000
payment 1:  £2000 → amount_paid = £2000, balance = £3000, status = PARTIAL
payment 2:  £2000 → amount_paid = £4000, balance = £1000, status = PARTIAL
payment 3:  £1000 → amount_paid = £5000, balance = £0.00, status = PAID
```

**Why overpayment protection?**

```python
if amount > self.balance:
    raise ValueError('Payment exceeds outstanding balance...')
```

Without this, someone could accidentally record `£50,000` payment on a `£5,000` invoice. Then `amount_paid` becomes `£50,000`, `balance` becomes `-£45,000`. That's meaningless and breaks accounting.

---

## 11. Invoice.void() — Stock Reversal

```python
def void(self, voided_by_user) -> None:
    # Can't void a paid or already-voided invoice
    if self.status in {self.Status.PAID, self.Status.VOIDED}:
        raise ValueError(f'Cannot void a {self.status} invoice.')

    with transaction.atomic():
        if self.status == self.Status.CONFIRMED:
            # Reverse any stock deductions
            warehouse = Warehouse.objects.filter(company=self.company, is_active=True).first()
            if warehouse:
                for item in self.items.select_related('product').iterator():
                    StockMovement.objects.create(
                        movement_type=StockMovement.MovementType.RETURN,  # ← RETURN not SALE
                        quantity=item.quantity,
                        ...
                    )

        self.status = self.Status.VOIDED
        self.save(update_fields=['status'])
```

**The RETURN movement type:**

From tutorial 3, `Stock.apply_movement()` handles RETURN like an IN movement — it adds quantity back:

```python
# In Stock.apply_movement() (from tutorial 3)
if movement_type in (MovementType.IN, MovementType.PURCHASE, MovementType.RETURN):
    self.quantity = F('quantity') + quantity   # Stock goes back UP
```

So voiding a confirmed invoice:
1. Creates RETURN movements for every item → stock goes back to pre-invoice levels
2. All inside `transaction.atomic()` — either all stock comes back or none does
3. Sets invoice status to VOIDED

**Why can't you void a PAID invoice?**

A customer paid you. If you void the invoice, what happens to the money they paid? That's a business process question (refund? credit note?), not something software can decide automatically. The system forces you to handle it manually.

---

## 12. Customer.outstanding_balance — Aggregate Queries

```python
@property
def outstanding_balance(self):
    """Total amount owed across all open invoices."""
    result = self.invoices.filter(
        status__in=[
            Invoice.Status.DRAFT,
            Invoice.Status.CONFIRMED,
            Invoice.Status.PARTIAL,
        ]
    ).aggregate(
        total=models.Sum(
            models.ExpressionWrapper(
                models.F('amount_due') - models.F('amount_paid'),
                output_field=models.DecimalField(max_digits=14, decimal_places=2),
            )
        )
    )
    return result['total'] or Decimal('0')
```

**What this SQL looks like:**

```sql
SELECT SUM(amount_due - amount_paid) as total
FROM sales_invoices
WHERE customer_id = 'abc-123'
  AND status IN ('draft', 'confirmed', 'partial');
```

**Why NOT do this in Python?**

```python
# WRONG — loads all invoices into memory
total = sum(
    inv.amount_due - inv.amount_paid
    for inv in self.invoices.filter(status__in=[...])
)
```

For a customer with 5,000 invoices, this loads 5,000 Invoice objects into Python memory. The `.aggregate()` approach does the summation in PostgreSQL and returns ONE number. The database does this in milliseconds.

---

## 13. Serializers — Read vs Write Split

For each major model, we created two serializers:

| Serializer | Used for | What it exposes |
|---|---|---|
| `InvoiceSerializer` | GET (list, detail) | Everything including computed fields, nested items, payments |
| `InvoiceWriteSerializer` | POST, PUT, PATCH | Only writable fields, strict validation |

### Why split?

**For reading**, you want rich output:
```json
{
    "id": "abc-123",
    "invoice_number": "INV-001",
    "customer_detail": {"id": "...", "name": "Acme Ltd"},
    "status": "confirmed",
    "status_label": "Confirmed",
    "balance": "3000.00",
    "is_overdue": false,
    "payment_percentage": "40.0",
    "items": [...],
    "payments": [...]
}
```

**For writing**, you don't want the user to set `balance` or `is_overdue` (they're computed):
```json
{
    "invoice_number": "INV-001",
    "customer": "uuid-here",
    "due_date": "2026-04-01",
    "discount_rate": "5.00",
    "tax_rate": "20.00"
}
```

**How the ViewSet chooses:**

```python
class InvoiceViewSet(CompanyQuerysetMixin, ModelViewSet):

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return InvoiceWriteSerializer    # ← Write: strict, lean
        return InvoiceSerializer             # ← Read: rich, full
```

### RecordPaymentSerializer — A Specialized Input Serializer

For the `record-payment` action, we don't use the full `PaymentSerializer` — we use a dedicated input serializer:

```python
class RecordPaymentSerializer(serializers.Serializer):
    """Minimal input for recording a payment — not a ModelSerializer."""
    amount = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=Decimal('0.01'))
    method = serializers.ChoiceField(choices=Payment.Method.choices, default='bank_transfer')
    payment_date = serializers.DateField(required=False)
    reference = serializers.CharField(max_length=100, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
```

**Why not `ModelSerializer` here?**

`ModelSerializer` generates fields from the model. But for `record_payment`, we don't want all Payment fields — just the subset that the API user should provide. `Serializer` (not `ModelSerializer`) gives us full control.

### Validation Example

```python
class InvoiceWriteSerializer(serializers.ModelSerializer):

    def validate(self, attrs):
        """Cross-field validation: due date must be after issue date."""
        issue = attrs.get('issue_date')
        due = attrs.get('due_date')
        if issue and due and due < issue:
            raise serializers.ValidationError({
                'due_date': 'Due date cannot be before issue date.'
            })
        return attrs
```

This prevents nonsensical invoices like issue_date=2026-05-01, due_date=2026-01-01.

---

## 14. ViewSets — Thin Controllers, Fat Models

The principle "thin controllers, fat models" means:
- **Models** contain the business logic (confirm, record_payment, void)
- **ViewSets** only handle HTTP concerns (parse request, call model method, return response)

Compare the view's `confirm` action to the model's `confirm()` method:

```python
# InvoiceViewSet.confirm() — the view (THIN)
@action(detail=True, methods=['post'], permission_classes=[IsManager, HasCompany])
def confirm(self, request, pk=None):
    invoice = self.get_object()     # HTTP concern: get object by pk
    try:
        invoice.confirm(confirmed_by_user=request.user)  # Delegate ALL logic to model
    except ValueError as e:
        return Response({'error': str(e)}, status=400)  # HTTP concern: error response
    return Response(InvoiceSerializer(invoice).data)     # HTTP concern: format response
```

The view has 6 lines. The model method has 50+. The view knows nothing about stock deductions, atomic transactions, or totals calculation. It just:
1. Gets the invoice
2. Calls `invoice.confirm()`
3. Returns a response

This is correct architecture. If you ever add a mobile app or a CLI tool, they can call `invoice.confirm()` directly without going through HTTP.

---

## 15. The DRY State Machine _transition() Helper

The `SalesOrderViewSet` had 5 state transition actions (confirm, process, ship, deliver, cancel). Without the helper, each one would look like this:

```python
# Without helper — repeated 5 times
@action(detail=True, methods=['post'])
def confirm(self, request, pk=None):
    order = self.get_object()
    if order.status != SalesOrder.Status.DRAFT:
        return Response({'error': 'Only DRAFT orders can be confirmed.'}, status=400)
    order.status = SalesOrder.Status.CONFIRMED
    order.updated_by = request.user
    order.save(update_fields=['status', 'updated_by'])
    return Response(SalesOrderSerializer(order).data)

@action(detail=True, methods=['post'])
def process(self, request, pk=None):
    order = self.get_object()
    if order.status != SalesOrder.Status.CONFIRMED:
        return Response({'error': 'Only CONFIRMED orders can be processed.'}, status=400)
    order.status = SalesOrder.Status.PROCESSING
    order.updated_by = request.user
    order.save(update_fields=['status', 'updated_by'])
    return Response(SalesOrderSerializer(order).data)
# ... 3 more times
```

With the helper (DRY — Don't Repeat Yourself):

```python
# With helper — each action is 3 lines
def _transition(self, request, pk, from_status, to_status, error_msg):
    order = self.get_object()
    if order.status != from_status:
        return Response({'error': error_msg}, status=400)
    order.status = to_status
    order.updated_by = request.user
    order.save(update_fields=['status', 'updated_by'])
    return Response(SalesOrderSerializer(order, context={'request': request}).data)

@action(detail=True, methods=['post'])
def confirm(self, request, pk=None):
    return self._transition(request, pk,
        SalesOrder.Status.DRAFT, SalesOrder.Status.CONFIRMED,
        'Only DRAFT orders can be confirmed.')

@action(detail=True, methods=['post'])
def process(self, request, pk=None):
    return self._transition(request, pk,
        SalesOrder.Status.CONFIRMED, SalesOrder.Status.PROCESSING,
        'Only CONFIRMED orders can be moved to processing.')
```

If we needed to change the transition logic (e.g., add logging), we change `_transition()` once. Without the helper, we'd change it in 5 places.

---

## 16. InvoiceItemViewSet — DRAFT-Only Guard

```python
class InvoiceItemViewSet(CompanyQuerysetMixin, ModelViewSet):

    def perform_create(self, serializer):
        self._check_invoice_is_draft(serializer.validated_data.get('invoice'))
        super().perform_create(serializer)

    def perform_update(self, serializer):
        self._check_invoice_is_draft(serializer.instance.invoice)
        super().perform_update(serializer)

    def _check_invoice_is_draft(self, invoice):
        if invoice and invoice.status != Invoice.Status.DRAFT:
            raise PermissionDenied(
                f'Invoice {invoice.invoice_number} is {invoice.status}. '
                'Items can only be added or edited on DRAFT invoices.'
            )
```

**Why this guard?**

Once an invoice is CONFIRMED:
- `amount_due` is finalized and stored
- Stock has been deducted
- The invoice may have been emailed to the customer

If you could still add or edit items after confirmation, the stored `amount_due` would be wrong. The guard prevents this at the API level. Even if a bug in the frontend tries to add items to a confirmed invoice, the API rejects it with `403 Forbidden`.

---

## 17. Migration Strategy — Handling Breaking Changes

### The Problem

Our old `sales` migrations had this structure:
```
0001_initial: Customer, SalesOrder, SalesOrderItem, Invoice
```

The new `Invoice` model has completely different fields — the old `customer` field didn't exist, the old `order` field was non-nullable, etc.

Running `makemigrations` would generate an ALTER TABLE migration that would need to know default values for new non-nullable columns that already have rows. Django asks interactively: "provide a one-off default."

### The Clean Solution

Since we're rebuilding the module completely and this is a development database (no production data to preserve), the cleanest approach:

```bash
# Step 1: Drop the old tables
psql core_db -c "
DROP TABLE IF EXISTS sales_invoices CASCADE;
DROP TABLE IF EXISTS sales_order_items CASCADE;
DROP TABLE IF EXISTS sales_orders CASCADE;
DROP TABLE IF EXISTS sales_customers CASCADE;
DELETE FROM django_migrations WHERE app = 'sales';
"

# Step 2: Remove old migration files
rm apps/sales/migrations/0001_initial.py

# Step 3: Regenerate fresh migrations
python manage.py makemigrations sales --name="initial_sales_v2"

# Step 4: Apply
python manage.py migrate
```

**Why did finance migrations break too?**

The `finance.0001_initial` migration had a dependency:

```python
# In finance/migrations/0001_initial.py
dependencies = [
    ('sales', '0001_initial'),   # ← This reference broke when we deleted it
]
```

When Django loads migrations, it validates the entire dependency graph. A broken reference causes `NodeNotFoundError` and nothing works until you fix it. We dropped the finance tables too and regenerated both together.

**In production, you would NEVER do this.** You'd write a proper `0002_` migration that carefully alters columns without dropping data. But for local development during active development, this is the pragmatic approach.

---

## 18. Full API Walkthrough — Invoice to Payment

Here's a complete real-world workflow using the API.

### Step 0 — Login
```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@erp.com", "password": "Admin1234!"}'
# Save the access token
TOKEN="eyJhbGciOiJIUzI1NiI..."
```

### Step 1 — Set up company tax settings
```bash
curl -X POST http://127.0.0.1:8000/api/v1/sales/tax-settings/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tax_name": "VAT",
    "default_tax_rate": "20.00",
    "currency_code": "GBP",
    "currency_symbol": "£",
    "prices_include_tax": false
  }'
```

### Step 2 — Create a customer
```bash
curl -X POST http://127.0.0.1:8000/api/v1/sales/customers/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Ltd",
    "email": "billing@acme.com",
    "credit_limit": "10000.00"
  }'
# Note the customer ID
CUSTOMER_ID="uuid-from-response"
```

### Step 3 — Create a DRAFT invoice
```bash
curl -X POST http://127.0.0.1:8000/api/v1/sales/invoices/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_number": "INV-001",
    "customer": "'$CUSTOMER_ID'",
    "issue_date": "2026-03-05",
    "due_date": "2026-04-05",
    "discount_rate": "0.00",
    "tax_rate": "20.00",
    "tax_label": "VAT"
  }'
# Note invoice ID
INVOICE_ID="uuid-from-response"
```

### Step 4 — Add items to the invoice
```bash
# First, get a product ID from inventory
PRODUCT_ID="your-product-uuid"

curl -X POST http://127.0.0.1:8000/api/v1/sales/invoice-items/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice": "'$INVOICE_ID'",
    "product": "'$PRODUCT_ID'",
    "quantity": "10",
    "unit_price": "500.00"
  }'
# description and unit_price auto-filled from product if left blank
```

### Step 5 — Confirm the invoice (stock deducted here)
```bash
curl -X POST http://127.0.0.1:8000/api/v1/sales/invoices/$INVOICE_ID/confirm/ \
  -H "Authorization: Bearer $TOKEN"
```

Response if successful:
```json
{
    "status": "confirmed",
    "subtotal": "5000.00",
    "tax_amount": "1000.00",
    "amount_due": "6000.00",
    "balance": "6000.00",
    "confirmed_at": "2026-03-05T18:00:00Z"
}
```

Response if stock insufficient:
```json
{
    "error": "Insufficient stock: 5 available, 10 requested for Laptop Pro."
}
```
(Invoice stays DRAFT, nothing saved)

### Step 6 — Record a partial payment
```bash
curl -X POST http://127.0.0.1:8000/api/v1/sales/invoices/$INVOICE_ID/record-payment/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "3000.00",
    "method": "bank_transfer",
    "reference": "TXN-ABC123",
    "payment_date": "2026-03-10"
  }'
```

Response:
```json
{
    "message": "Payment of 3000.00 recorded successfully.",
    "invoice": {
        "status": "partial",
        "amount_paid": "3000.00",
        "balance": "3000.00",
        "payment_percentage": "50.0"
    }
}
```

### Step 7 — Pay the remaining balance
```bash
curl -X POST http://127.0.0.1:8000/api/v1/sales/invoices/$INVOICE_ID/record-payment/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": "3000.00", "method": "bank_transfer"}'
```

Response:
```json
{
    "invoice": {
        "status": "paid",
        "amount_paid": "6000.00",
        "balance": "0.00",
        "payment_percentage": "100.0"
    }
}
```

### Step 8 — Check overdue invoices
```bash
curl http://127.0.0.1:8000/api/v1/sales/invoices/overdue/ \
  -H "Authorization: Bearer $TOKEN"
```

### Step 9 — Customer account statement
```bash
curl http://127.0.0.1:8000/api/v1/sales/customers/$CUSTOMER_ID/statement/ \
  -H "Authorization: Bearer $TOKEN"
```

Response:
```json
{
    "customer": {"name": "Acme Ltd"},
    "outstanding_balance": "0.00",
    "unpaid_invoices": []
}
```

---

## 19. Summary — What We Built

### Files changed/created

| File | Key changes |
|---|---|
| `apps/sales/models.py` | Complete rewrite — 7 models, 4 business methods, 400+ lines |
| `apps/sales/serializers.py` | 8 serializers with read/write split — 250 lines |
| `apps/sales/views.py` | 7 ViewSets, 15+ custom actions — 300 lines |
| `apps/sales/admin.py` | Rich admin with immutable payments — 120 lines |
| `apps/sales/urls.py` | 7 routes |
| `apps/sales/migrations/0001_initial.py` | New schema — all tables |
| `apps/finance/migrations/0002_initial.py` | Split migration for finance dependency |

### Models in the new sales module

| Model | Purpose | Key feature |
|---|---|---|
| `CompanyTaxSettings` | Per-company VAT/GST config | Applied automatically to new invoices |
| `Customer` | Buyers / clients | `outstanding_balance` aggregate property |
| `SalesOrder` | Order commitment | State machine (DRAFT→DELIVERED) |
| `SalesOrderItem` | Order line items | DB-aggregated totals |
| `Invoice` | Financial claim | `confirm()`, `record_payment()`, `void()` |
| `InvoiceItem` | Invoice lines | Price snapshot, per-item tax |
| `Payment` | Payment records | Multi-payment, immutable audit trail |

### Key concepts learned

1. **Invoice vs SalesOrder** — two separate concepts, not the same thing
2. **Stored vs computed totals** — why financial snapshots matter
3. **`transaction.atomic()`** — all-or-nothing operations, savepoints
4. **Stock deduction on confirmation** — `StockMovement(SALE)` created atomically
5. **Stock reversal on void** — `StockMovement(RETURN)` to undo deduction
6. **Overpayment protection** — guards prevent accounting errors
7. **`ROUND_HALF_UP`** — correct decimal rounding for money
8. **`Decimal(str(float))`** — safe float→Decimal conversion
9. **Thin controller, fat model** — views delegate all logic to model methods
10. **DRY helpers** — `_transition()` eliminates repeated state machine code
11. **DRAFT-only guards** — items locked after invoice confirmation
12. **Database indexes** — speed up overdue/customer queries at 100k+ records
13. **Migration strategy** — when and how to cleanly reset dev migrations
14. **Per-item tax rates** — supports zero-rated, reduced-rate, and standard-rate items
15. **`iterator()`** — memory-efficient iteration over large querysets

---

> **Next logical steps:** The Finance module needs to record revenue entries when invoices are paid (double-entry bookkeeping). The HR module needs leave approval workflows. Celery can automate marking invoices as OVERDUE when their due date passes. Each of these builds directly on the patterns established in this tutorial.
