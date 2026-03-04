# Tutorial 3 — Inventory Module, GitHub, Migrations & PostgreSQL

> **What we cover in this tutorial:**
> 1. Building a production-grade Inventory module following SOLID principles
> 2. Pushing the entire project to GitHub with meaningful commit messages
> 3. Generating Django migrations for all 6 apps
> 4. Installing and connecting PostgreSQL locally (no Docker needed)
> 5. Running the Django dev server
> 6. Debugging and fixing a real Swagger schema error
> 7. Understanding the Swagger UI

---

## Table of Contents

1. [Why We Rebuilt the Inventory Module](#1-why-we-rebuilt-the-inventory-module)
2. [SOLID Principles — What They Mean in Practice](#2-solid-principles--what-they-mean-in-practice)
3. [New Models: Supplier, SupplierProduct, Enhanced Product](#3-new-models-supplier-supplierproduct-enhanced-product)
4. [Stock.apply_movement() — The Core Business Logic](#4-stockapply_movement--the-core-business-logic)
5. [StockMovement.save() — Auto Stock Update](#5-stockmovementsave--auto-stock-update)
6. [Product Business Methods](#6-product-business-methods)
7. [Serializers — Read vs Write Separation](#7-serializers--read-vs-write-separation)
8. [Custom ViewSet Actions (Extra Endpoints)](#8-custom-viewset-actions-extra-endpoints)
9. [Admin Configuration](#9-admin-configuration)
10. [Pushing to GitHub — Proper Commit Messages](#10-pushing-to-github--proper-commit-messages)
11. [Creating Django Migrations](#11-creating-django-migrations)
12. [Installing PostgreSQL Locally via Homebrew](#12-installing-postgresql-locally-via-homebrew)
13. [Connecting Django to PostgreSQL](#13-connecting-django-to-postgresql)
14. [Running Migrations on PostgreSQL](#14-running-migrations-on-postgresql)
15. [Creating a Superuser](#15-creating-a-superuser)
16. [Starting the Dev Server](#16-starting-the-dev-server)
17. [Debugging the Swagger Schema Error](#17-debugging-the-swagger-schema-error)
18. [Understanding Swagger UI](#18-understanding-swagger-ui)
19. [Summary — What We Built](#19-summary--what-we-built)

---

## 1. Why We Rebuilt the Inventory Module

At the end of tutorial 2, the inventory module existed but was basic:

```
apps/inventory/models.py      ← Had Category, Unit, Product, Warehouse, Stock, StockMovement
                                 but NO Supplier model
                                 NO auto stock update on movement
                                 NO low stock alert
                                 NO inventory turnover calculation
```

That's fine for a prototype, but for a real ERP system you need:

| Missing Feature | Why It Matters |
|---|---|
| **Supplier model** | Every product comes from a supplier. You need to track who sells you what, at what price and lead time |
| **Auto stock update** | When you record a stock movement, the stock balance should update automatically — not manually |
| **Low stock flag** | Warehouse managers need to know when to reorder |
| **Inventory turnover** | Finance teams measure how fast inventory is sold |

So we rebuilt the inventory module from scratch following **SOLID principles**.

---

## 2. SOLID Principles — What They Mean in Practice

SOLID is a set of 5 design principles for writing clean, maintainable code. Let me explain each one with real code from our project.

---

### S — Single Responsibility Principle

> **"Each class should have only one reason to change."**

**Bad approach (before):**
```python
# StockMovement was doing everything
class StockMovement(BaseModel):
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Also updating stock balance here directly
        # Also validating stock sufficiency here
        # Also doing logging here
        # One class doing 4 different jobs — bad!
```

**Our approach (after):**
```python
# Stock owns all stock math (its one job)
class Stock(BaseModel):
    def apply_movement(self, movement_type, quantity):
        # This method owns ALL balance math
        # Stock has one reason to change: balance calculation rules change
        ...

# StockMovement only delegates (its one job)
class StockMovement(BaseModel):
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if is_new:
            stock.apply_movement(...)   # delegates to Stock
```

Each class has exactly one job. If the stock calculation formula changes, you only edit `Stock`. If the movement recording logic changes, you only edit `StockMovement`.

---

### O — Open/Closed Principle

> **"Classes should be open for extension, but closed for modification."**

We want to add new movement types (like `RETURN` or `PURCHASE`) without changing any existing working code.

**How we did it — TextChoices:**
```python
class StockMovement(BaseModel):
    class MovementType(models.TextChoices):
        IN          = 'in',           'Stock In'
        OUT         = 'out',          'Stock Out'
        PURCHASE    = 'purchase',     'Purchase Receipt'   # ← Just ADD new line
        SALE        = 'sale',         'Sales Issue'        # ← No other code changed
        ADJUSTMENT  = 'adjustment',   'Adjustment'
        TRANSFER_OUT = 'transfer_out', 'Transfer Out'
        TRANSFER_IN  = 'transfer_in',  'Transfer In'
        RETURN       = 'return',       'Return'            # ← Added RETURN type
```

To add a new movement type, you **only add one line**. You do NOT modify `Stock.apply_movement()`, you do NOT modify views. The system is closed for modification, open for extension.

---

### L — Liskov Substitution Principle

> **"Subclasses should be safely usable anywhere their parent class is used."**

All our models inherit from `BaseModel`:
```python
class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey('accounts.Company', ...)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, ...)

    class Meta:
        abstract = True
```

Because `Product`, `Supplier`, `Warehouse`, `StockMovement` all correctly extend `BaseModel`, you can pass any of them to `CompanyQuerysetMixin` and it works. You never need to check "is this a Product or a Supplier?" — they all behave the same at the mixin level.

---

### I — Interface Segregation Principle

> **"Don't force classes to depend on methods they don't use."**

`Stock.apply_movement()` is a clean, focused interface:

```python
def apply_movement(self, movement_type: str, quantity: Decimal) -> None:
    """
    One clear interface for updating the balance.
    The caller (StockMovement) doesn't need to know HOW the math works.
    It just calls: stock.apply_movement('sale', Decimal('10'))
    """
```

`StockMovement` does NOT access `stock.quantity` directly. It does NOT do `stock.quantity -= quantity`. It calls the interface and trusts it. This means if we change how the math works inside `Stock`, `StockMovement` is not affected at all.

---

### D — Dependency Inversion Principle

> **"High-level modules should not depend on low-level modules. Both should depend on abstractions."**

`StockMovement.save()` is the high-level module (orchestrator).
`Stock.apply_movement()` is the abstraction (interface).

```python
# StockMovement depends on the ABSTRACTION (apply_movement)
# NOT on the internals of Stock
def save(self, *args, **kwargs):
    with transaction.atomic():
        super().save(*args, **kwargs)
        if is_new:
            stock, _ = Stock.objects.get_or_create(...)
            stock.apply_movement(self.movement_type, self.quantity)  # ← abstraction
```

If tomorrow we replace `Stock` with a `StockLedger` class that has the same `apply_movement()` method, `StockMovement.save()` doesn't need to change at all.

---

## 3. New Models: Supplier, SupplierProduct, Enhanced Product

### File: `apps/inventory/models.py`

#### 3.1 — Supplier Model

```python
class Supplier(BaseModel):
    """
    External supplier / vendor for products.
    """
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True)
    contact_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    website = models.URLField(blank=True)
    payment_terms_days = models.PositiveSmallIntegerField(default=30)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'inventory_suppliers'
        unique_together = ['name', 'company']   # ← Two companies can have same supplier name
```

**Why `unique_together = ['name', 'company']`?**

Because we have multiple companies (multi-tenant). "ABC Ltd" as a supplier in Company A is different from "ABC Ltd" in Company B. So uniqueness is enforced at the company level, not globally.

#### 3.2 — SupplierProduct (Through Table)

A product can have **multiple suppliers**. A supplier can provide **multiple products**. This is a **Many-to-Many** relationship. But we need extra data for each combination (price, lead time), so we use a **through model**:

```python
class SupplierProduct(BaseModel):
    """Through table for Supplier ↔ Product M2M with extra fields."""
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    supplier_sku = models.CharField(max_length=100, blank=True)  # Their code for this product
    unit_cost = models.DecimalField(max_digits=14, decimal_places=2)  # Price from this supplier
    lead_time_days = models.PositiveSmallIntegerField(default=1)      # Days to deliver
    is_preferred = models.BooleanField(default=False)                 # Primary supplier?
    min_order_quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ['supplier', 'product']   # Each pair only once
```

**Why a through model instead of a simple M2M?**

If you just do `suppliers = ManyToManyField(Supplier)`, you lose all the extra data. The through model lets you store price, lead time, and preferred status per supplier-product combination.

**In the Product model:**
```python
class Product(BaseModel):
    suppliers = models.ManyToManyField(
        Supplier,
        through='SupplierProduct',    # ← Points to our through table
        related_name='products',
        blank=True,
    )
```

#### 3.3 — Enhanced Product Fields

```python
class Product(BaseModel):
    # Old fields kept
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100)
    cost_price = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    reorder_level = models.PositiveIntegerField(default=0)

    # New fields added
    reorder_quantity = models.PositiveIntegerField(default=0)  # ← How much to order
    weight_kg = models.DecimalField(...)                       # ← For shipping calculations
    barcode = models.CharField(...)
```

**Why `reorder_quantity`?**
`reorder_level` tells you WHEN to order ("order when stock drops below 10").
`reorder_quantity` tells you HOW MUCH to order ("order 50 units at a time"). Both are needed for proper purchasing workflows.

---

## 4. Stock.apply_movement() — The Core Business Logic

This is the most important method in the inventory module. It lives in `Stock` and is responsible for ALL balance math.

```python
def apply_movement(self, movement_type: str, quantity: Decimal) -> None:
    if movement_type in (StockMovement.MovementType.IN, StockMovement.MovementType.PURCHASE):
        # Stock going UP — simple addition using F() expression
        self.quantity = F('quantity') + quantity

    elif movement_type in (StockMovement.MovementType.OUT, StockMovement.MovementType.SALE):
        # Stock going DOWN — need to check sufficiency first
        self.refresh_from_db(fields=['quantity'])   # ← Get the ACTUAL current DB value
        if self.quantity < quantity:
            raise ValueError(
                f'Insufficient stock: {self.quantity} available, '
                f'{quantity} requested for {self.product.name}.'
            )
        self.quantity = F('quantity') - quantity

    elif movement_type == StockMovement.MovementType.ADJUSTMENT:
        # ADJUSTMENT is different — it SETS the quantity, doesn't add/subtract
        self.quantity = quantity

    self.last_movement_at = timezone.now()
    self.save(update_fields=['quantity', 'last_movement_at'])
    self.refresh_from_db(fields=['quantity'])
```

**Why `F('quantity')` instead of `self.quantity += quantity`?**

This is a critical concept. Consider two users recording stock movements simultaneously:

```
User A reads quantity = 100
User B reads quantity = 100
User A adds 50  → saves 150
User B adds 30  → saves 130  ← WRONG! Should be 180
```

This is a **race condition**. Using `F('quantity') + quantity` tells the database to do the addition at the SQL level:

```sql
UPDATE inventory_stock SET quantity = quantity + 50 WHERE id = ...;
```

The database handles this atomically. Both operations are safe.

**Why `refresh_from_db()` before the OUT check?**

When checking insufficiency, we need the MOST RECENT value from the database, not the potentially stale Python object value. `refresh_from_db(fields=['quantity'])` forces a fresh SELECT for just that one field.

**Why `update_fields=['quantity', 'last_movement_at']`?**

Instead of `self.save()` (which writes ALL fields), `update_fields` tells Django to only UPDATE the two fields that changed. This is 3-5x faster and avoids accidentally overwriting other fields.

---

## 5. StockMovement.save() — Auto Stock Update

```python
class StockMovement(BaseModel):
    def save(self, *args, **kwargs):
        is_new = self._state.adding   # True on INSERT, False on UPDATE

        with transaction.atomic():
            super().save(*args, **kwargs)

            if is_new:
                stock, _ = Stock.objects.get_or_create(
                    product=self.product,
                    warehouse=self.warehouse,
                    company=self.company,
                    defaults={'quantity': Decimal('0')},
                )
                stock.apply_movement(self.movement_type, self.quantity)
```

**Why `self._state.adding`?**

Django's `_state.adding` is `True` when the object is being INSERTed (i.e., new record) and `False` when being UPDATEd. We only want to update the stock balance on NEW movements. If you edit a movement (which shouldn't happen — they're immutable), we don't want to double-count.

**Why `transaction.atomic()`?**

Atomic means **"all or nothing"**. Either BOTH the StockMovement record is saved AND the Stock balance is updated, or NEITHER happens. Without this, you could save a movement but fail to update the stock, leaving your data inconsistent.

**Why `get_or_create`?**

The first time a product enters a warehouse, there's no Stock record for that combination. `get_or_create` either finds the existing Stock record or creates one with `quantity=0`. It replaces:

```python
# Without get_or_create (verbose and error-prone):
try:
    stock = Stock.objects.get(product=..., warehouse=...)
except Stock.DoesNotExist:
    stock = Stock.objects.create(product=..., warehouse=..., quantity=0)
```

---

## 6. Product Business Methods

We added two powerful methods to the `Product` model.

### 6.1 — `is_low_stock` (computed property)

```python
@property
def is_low_stock(self):
    """
    True when total stock across all warehouses ≤ reorder_level.
    This is always accurate — computed on-demand, not stored.
    """
    if self.reorder_level == 0:
        return False
    return self.total_stock <= Decimal(self.reorder_level)
```

**Why `@property` instead of a database column?**

A stored column (`is_low_stock = BooleanField`) would need to be updated every time stock changes. That's error-prone. A property computes it fresh every time you access it, so it's always accurate.

**But won't this be slow?**

For a single product, no — it's one aggregate query. For large lists, you'd use `prefetch_related('stock_entries')` to batch the queries.

### 6.2 — `inventory_turnover_rate(days)` method

```python
def inventory_turnover_rate(self, days: int = 365) -> Decimal:
    """
    Inventory Turnover = COGS / Average Inventory Value

    COGS = Cost Of Goods Sold = total OUT movement quantity × cost_price
    Average inventory ≈ current stock × cost_price

    Higher turnover = product sells fast (good)
    Lower turnover = product sits on shelves (ties up capital)
    """
    since = timezone.now() - timezone.timedelta(days=days)

    out_movements = (
        self.movements
        .filter(
            movement_type__in=['out', 'sale'],
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
```

**Example:**
- Product: Laptop
- Cost price: $500
- 30 laptops sold in last 365 days → COGS = 30 × $500 = $15,000
- Current stock: 10 units → Avg inventory = 10 × $500 = $5,000
- **Turnover = $15,000 / $5,000 = 3.0** (inventory turned over 3 times per year)

A turnover of 3 means the laptop stock sells out and gets restocked roughly every 4 months. That's healthy.

### 6.3 — `days_of_stock_remaining()` method

```python
def days_of_stock_remaining(self) -> int:
    """
    Based on the last 30 days of sales, how many days will current stock last?
    Returns -1 if no recent sales data exists.
    """
    since = timezone.now() - timezone.timedelta(days=30)
    # Get total sold in last 30 days
    out_data = (
        self.movements
        .filter(movement_type__in=['out', 'sale'], created_at__gte=since)
        .aggregate(total_out=Sum('quantity'))
    )
    total_out_30d = out_data['total_out'] or Decimal('0')
    if total_out_30d == 0:
        return -1               # No sales data — can't estimate
    daily_usage = total_out_30d / 30
    return int(self.total_stock / daily_usage)
```

**Example:**
- 60 units sold in the last 30 days → daily usage = 2 units/day
- Current stock = 50 units
- **Days remaining = 50 / 2 = 25 days**

This tells the warehouse manager: "You'll run out in 25 days — order now if lead time is > 25 days."

---

## 7. Serializers — Read vs Write Separation

For the `Product` model, we created **two serializers** with different purposes.

### 7.1 — Why Two Serializers?

| Concern | `ProductSerializer` | `ProductCreateUpdateSerializer` |
|---|---|---|
| **Used for** | GET (list, detail) | POST, PUT, PATCH |
| **Computed fields** | ✅ Yes (turnover, low_stock, etc.) | ❌ No (not needed on write) |
| **Validation** | Basic | Strict (SKU uniqueness, price checks) |
| **Fields shown** | All including analytics | Only writable fields |

This follows the **Interface Segregation Principle** — the read interface is rich, the write interface is strict and lean.

### 7.2 — How the ViewSet chooses which serializer

```python
class ProductViewSet(CompanyQuerysetMixin, ModelViewSet):

    def get_serializer_class(self):
        # On write operations, use the strict write serializer
        if self.action in ('create', 'update', 'partial_update'):
            return ProductCreateUpdateSerializer
        # On read operations, use the rich read serializer
        return ProductSerializer
```

### 7.3 — Validation in the Write Serializer

```python
class ProductCreateUpdateSerializer(serializers.ModelSerializer):

    def validate_sku(self, value):
        """SKU must be unique within the company."""
        request = self.context.get('request')
        company = getattr(request, 'company', None)
        qs = Product.objects.filter(sku=value, company=company)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)   # ← Don't conflict with itself on PATCH
        if qs.exists():
            raise serializers.ValidationError(
                f'SKU "{value}" already exists in your company.'
            )
        return value

    def validate_selling_price(self, value):
        """Selling price must be ≥ cost price."""
        cost = self.initial_data.get('cost_price', 0)
        if Decimal(str(value)) < Decimal(str(cost)):
            raise serializers.ValidationError(
                'Selling price cannot be less than cost price.'
            )
        return value
```

**Why validate at the serializer level (not model level)?**

Serializer validation happens before the model is saved. If the price is wrong, you get a `400 Bad Request` with a clear JSON error message before any database operation happens.

---

## 8. Custom ViewSet Actions (Extra Endpoints)

Here's how we add endpoints that go beyond basic CRUD.

### 8.1 — Low Stock Alert Endpoint

```python
class ProductViewSet(CompanyQuerysetMixin, ModelViewSet):

    @action(detail=False, methods=['get'], url_path='low-stock')
    def low_stock(self, request):
        """
        GET /api/v1/inventory/products/low-stock/
        Returns all products where stock ≤ reorder_level.
        """
        products = self.get_queryset().filter(
            status=Product.Status.ACTIVE
        )
        # is_low_stock is computed in Python (can't filter on @property in ORM)
        low_stock_products = [p for p in products if p.is_low_stock]

        serializer = ProductSerializer(
            low_stock_products, many=True, context={'request': request}
        )
        return Response({
            'count': len(low_stock_products),
            'results': serializer.data,
        })
```

**`detail=False`** means this action applies to the **list** endpoint (no `{id}` in URL).
**`detail=True`** would mean it applies to a **specific item** endpoint (`/products/{id}/something/`).

### 8.2 — Analytics Endpoint (detail=True)

```python
    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """
        GET /api/v1/inventory/products/{id}/analytics/
        Returns all inventory analytics for one product.
        """
        product = self.get_object()   # ← Gets the product by pk, enforces permissions + isolation
        return Response({
            'product_id': str(product.id),
            'total_stock': str(product.total_stock),
            'is_low_stock': product.is_low_stock,
            'profit_margin_pct': str(product.profit_margin),
            'inventory_turnover_365d': str(product.inventory_turnover_rate(days=365)),
            'inventory_turnover_90d': str(product.inventory_turnover_rate(days=90)),
            'days_of_stock_remaining': product.days_of_stock_remaining(),
        })
```

### 8.3 — StockMovement: Append-Only (No PUT or DELETE)

```python
class StockMovementViewSet(CompanyQuerysetMixin, ModelViewSet):
    """
    Stock movements are an immutable ledger — like accounting entries.
    You can record new movements (POST) and read them (GET),
    but you CANNOT edit or delete them.
    """
    http_method_names = ['get', 'post', 'head', 'options']   # ← DELETE and PUT excluded
```

This is a business rule from accounting: **you never delete a transaction**. If you made a mistake, you create a correcting entry (an ADJUSTMENT movement).

---

## 9. Admin Configuration

### File: `apps/inventory/admin.py`

```python
class StockInline(admin.TabularInline):
    """Shows stock levels right inside the Product admin page."""
    model = Stock
    extra = 0
    fields = ['warehouse', 'quantity', 'last_movement_at']
    readonly_fields = ['last_movement_at']
    can_delete = False   # Don't allow deleting stock records from admin

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'cost_price', 'selling_price', 'is_low_stock', 'company']
    inlines = [SupplierProductInline, StockInline]   # ← Tabs inside Product admin

    def is_low_stock(self, obj):
        return obj.is_low_stock
    is_low_stock.boolean = True         # ← Shows as ✅/❌ icon instead of True/False
    is_low_stock.short_description = 'Low Stock?'
```

**`inlines`** are sub-sections inside the parent form. When you open a Product in admin, you see:
- The product fields
- A table of suppliers with their pricing
- A table of current stock in each warehouse

```python
@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    # Immutable — no editing or deleting via admin either
    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
```

---

## 10. Pushing to GitHub — Proper Commit Messages

### Why meaningful commit messages?

Bad commit message: `"update files"`
Good commit message: `"feat(inventory): add Supplier model with M2M through table"`

Good commit messages are useful because:
- Future you (6 months later) can understand what changed and why
- Your team can review history without reading code
- Tools like `git log` become useful instead of useless

### Conventional Commits format

We followed the **Conventional Commits** standard:

```
<type>(<scope>): <short description>

<optional body>
```

Types used:
| Type | When |
|---|---|
| `feat` | Adding a new feature |
| `fix` | Fixing a bug |
| `docs` | Documentation only |
| `refactor` | Code change that isn't a bug fix or feature |
| `test` | Adding tests |

### The git workflow we ran

```bash
# 1. Initialize git at the root of the project
cd /Users/yusuf/AI_ERP
git init
git branch -M main    # Rename default branch to main

# 2. Create a root-level README.md
# This is what GitHub shows on the repo homepage

# 3. Stage ALL files
git add .

# 4. Check what's staged (sanity check)
git status --short

# 5. Commit with a detailed message
git commit -m "feat: initial commit — production-ready Django ERP API

## Project Overview
Production-grade Django REST API...
..."

# 6. Add the remote (GitHub repo URL)
git remote add origin https://github.com/yousuffaysal/AI_ERP.git

# 7. Push
git push -u origin main
# -u means "set upstream" — from now on just `git push` works
```

**What the output meant:**
```
73 files changed, 6343 insertions(+)
→ We pushed 73 files with 6343 lines of code in the first commit
```

---

## 11. Creating Django Migrations

### What are migrations?

Migrations are Python files that describe the current state of your database schema. Django reads them and generates SQL to CREATE/ALTER/DROP tables.

Every time you change a model, you need to:
1. `makemigrations` — generate the migration file
2. `migrate` — apply it to the database

### Why no migrations existed yet

We had models but no `migrations/` folders inside any app. Django won't auto-create these folders. You need to create them:

```bash
# Create migrations directory for each app
for app in accounts inventory sales hr finance audit; do
    mkdir -p apps/$app/migrations
    touch apps/$app/migrations/__init__.py    # Python package marker
done
```

**Why `__init__.py`?**
In Python, for a folder to be treated as a package (importable), it needs an `__init__.py` file. Without it, Django can't find the migration files.

### Running makemigrations

```bash
DJANGO_SETTINGS_MODULE=config.settings.local_sqlite python manage.py makemigrations
```

Output:
```
Migrations for 'accounts':
  apps/accounts/migrations/0001_initial.py
    - Create model Company
    - Create model User

Migrations for 'inventory':
  apps/inventory/migrations/0001_initial.py
    - Create model Category
    - Create model Product
    - Create model Supplier
    - Create model SupplierProduct
    - Add field suppliers to product
    - Create model Unit
    - Add field unit to product
    - Create model Warehouse
    - Create model StockMovement
    - Create model Stock
...
```

Each line `- Create model X` translates to a `CREATE TABLE` SQL statement. The order matters — Django figures out dependencies automatically (e.g., `Stock` needs `Product` and `Warehouse` to exist first).

### The numbering convention

The file is called `0001_initial.py`. The next migration for this app would be `0002_something.py`, then `0003_something_else.py`. This ordering tells Django which migrations have already been applied.

### What's inside a migration file?

```python
# apps/inventory/migrations/0001_initial.py (simplified)
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('accounts', '0001_initial'),   # ← Must run accounts migration first
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.UUIDField(primary_key=True, ...)),
                ('name', models.CharField(max_length=255)),
                ...
            ],
        ),
        ...
    ]
```

You almost never edit migration files by hand. You modify models, then run `makemigrations` to auto-generate them.

---

## 12. Installing PostgreSQL Locally via Homebrew

### Why PostgreSQL instead of SQLite?

| SQLite | PostgreSQL |
|---|---|
| File-based database | Proper server |
| Great for development | Required for production |
| No setup needed | Needs installation |
| No network access | Multiple apps can connect |
| Limited data types | Full data type support |
| No concurrent writes | Handles thousands of queries/sec |

Our project is designed for PostgreSQL (UUID primary keys, company-scoped unique constraints, etc.). SQLite was fine for generating migrations but we need PostgreSQL for real use.

### Installing via Homebrew

Homebrew is the standard package manager for macOS:

```bash
brew install postgresql@16
```

After installation, Homebrew shows you:
```
To start postgresql@16 now and restart at login:
  brew services start postgresql@16
```

Add PostgreSQL to your PATH (so you can use `psql` command):
```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
```

### Starting PostgreSQL

```bash
brew services start postgresql@16
# "Successfully started postgresql@16"

# brew services = macOS service manager
# start = launch and also auto-start on login
# postgresql@16 = the service name
```

### Creating the database and user

```bash
psql postgres   # Connect to the default 'postgres' database

# Inside psql:
CREATE USER core_user WITH PASSWORD 'core_pass123' CREATEDB;
CREATE DATABASE core_db OWNER core_user;

# Output:
# CREATE ROLE
# CREATE DATABASE
```

**Why a dedicated user instead of using the superuser?**

The principle of **least privilege**: Your Django app should only have the permissions it needs. A dedicated `core_user` can only access `core_db`. If someone compromises your app's database connection, they can't access other databases on the server.

`CREATEDB` permission is given so the user can create test databases when running the test suite.

---

## 13. Connecting Django to PostgreSQL

### The `.env` file

The `.env` file stores environment-specific secrets. It is **never committed to git** (it's in `.gitignore`). Each developer/environment has their own `.env`.

```ini
# .env
DB_ENGINE=django.db.backends.postgresql
DB_NAME=core_db
DB_USER=core_user
DB_PASSWORD=core_pass123
DB_HOST=localhost
DB_PORT=5432
```

### How Django reads it (in `config/settings/base.py`)

```python
import environ

env = environ.Env()
environ.Env.read_env('.env')   # Read the .env file

DATABASES = {
    'default': {
        'ENGINE': env('DB_ENGINE'),
        'NAME': env('DB_NAME'),
        'USER': env('DB_USER'),
        'PASSWORD': env('DB_PASSWORD'),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5432'),
    }
}
```

### Installing psycopg2

psycopg2 is the Python library that lets Django talk to PostgreSQL:

```bash
pip install psycopg2-binary
```

The `-binary` variant is a pre-compiled wheel that doesn't require building from C source code. For development this is fine. For production you'd use `psycopg2` (without `-binary`) for security reasons.

---

## 14. Running Migrations on PostgreSQL

```bash
DJANGO_SETTINGS_MODULE=config.settings.development python manage.py migrate
```

Output:
```
Operations to perform:
  Apply all migrations: accounts, admin, audit, auth, contenttypes, finance, hr, inventory, sales, sessions, token_blacklist

Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying auth.0001_initial... OK
  ...
  Applying accounts.0001_initial... OK
  Applying inventory.0001_initial... OK
  Applying sales.0001_initial... OK
  Applying hr.0001_initial... OK
  Applying finance.0001_initial... OK
  Applying audit.0001_initial... OK
  ...
  Applying token_blacklist.0012_alter_outstandingtoken_user... OK
```

**36 migrations** applied successfully. In PostgreSQL you can verify:
```bash
psql core_db -c "\dt"   # List all tables
```

You'll see all your tables: `inventory_products`, `inventory_suppliers`, `accounts_companies`, etc.

---

## 15. Creating a Superuser

A superuser has all permissions in Django — they can access the admin panel, all APIs, and all companies.

```bash
python manage.py createsuperuser
```

Or programmatically (what we did, to avoid interactive prompt):
```bash
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
User.objects.create_superuser(
    email='admin@erp.com',
    password='Admin1234!',
    first_name='Super',
    last_name='Admin',
)
"
```

Our `User` model uses **email as the username** (not a traditional username field). So `create_superuser` takes `email` not `username`.

---

## 16. Starting the Dev Server

```bash
DJANGO_SETTINGS_MODULE=config.settings.development python manage.py runserver 8000
```

Output:
```
Django version 5.0.3, using settings 'config.settings.development'
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

**Why set `DJANGO_SETTINGS_MODULE`?**

Our project has multiple settings files:
```
config/settings/
├── base.py         ← Shared settings
├── development.py  ← Dev overrides (DEBUG=True, etc.)
├── production.py   ← Production overrides
└── local_sqlite.py ← For running migrations without PostgreSQL
```

By setting the env variable, Django knows which file to use. You could also put it in your shell config:
```bash
echo 'export DJANGO_SETTINGS_MODULE=config.settings.development' >> ~/.zshrc
```

Then you just run `python manage.py runserver`.

### The packages needed to run

We had to install these because the initial venv was built for migrations only:

```bash
pip install whitenoise    # Serves static files in development
pip install Pillow        # Required for ImageField (product images)
pip install python-slugify
```

**Why whitenoise?**

In production, a web server (nginx, Caddy) serves static files. In development, whitenoise handles this for you so you don't need to run a separate nginx process.

---

## 17. Debugging the Swagger Schema Error

When we first opened `http://127.0.0.1:8000/api/v1/docs/` we saw:

```
Failed to load API definition.
Fetch error: Internal Server Error /api/v1/schema/
```

### Step 1 — Read the terminal

The server terminal showed:
```
AssertionError: The field 'balance' was declared on serializer ExpenseSerializer,
but has not been included in the 'fields' option.
```

Django REST Framework gives very clear error messages. Always read the terminal when the browser shows an error.

### Step 2 — Find the bug

```python
# apps/finance/serializers.py — the buggy code
class ExpenseSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    balance = serializers.DecimalField(                    # ← Declared here
        max_digits=14, decimal_places=2,
        read_only=True,
        source='amount'
    )

    class Meta:
        model = Expense
        fields = [
            'id', 'title', 'account', 'employee', 'employee_name',
            'amount', 'date', 'receipt', 'status', 'approved_by',
            # balance is NOT in this list ← THE BUG
        ]
```

**Rule:** If you declare a field as a class attribute on a serializer, you MUST include it in `fields`. Otherwise Django REST Framework raises an `AssertionError`.

### Step 3 — The fix

```python
class ExpenseSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    # Removed the spurious 'balance' field (it was just a duplicate of 'amount')
    # Added actually useful read-only display fields instead:
    account_name = serializers.CharField(source='account.name', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id', 'title', 'account', 'account_name',
            'employee', 'employee_name',
            'amount', 'date', 'receipt',
            'status', 'status_label',
            'approved_by', 'approved_by_name',
            'created_at',
        ]
```

### Step 4 — Verify

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/v1/schema/
# Output: 200
```

HTTP 200 means success. Swagger docs now load.

---

## 18. Understanding Swagger UI

Swagger UI (at `/api/v1/docs/`) is your interactive API playground. Here's how to use it:

### Step 1 — Authenticate

Every request needs a JWT token. Without it you get HTTP 401 (Unauthorized).

1. Find **`POST /api/v1/auth/login/`**
2. Click **"Try it out"**
3. Enter:
```json
{
  "email": "admin@erp.com",
  "password": "Admin1234!"
}
```
4. Click **Execute**
5. Copy the `access` token from the response
6. Click **"Authorize 🔒"** at the top of the page
7. Enter: `Bearer <paste-your-token-here>`
8. Click Authorize

Now all requests will automatically include your token.

### Step 2 — Make a request

Example: Create a supplier

1. Find **`POST /api/v1/inventory/suppliers/`**
2. Click **"Try it out"**
3. Enter the request body:
```json
{
  "name": "Tech Distributors Ltd",
  "code": "TDL-001",
  "contact_name": "John Smith",
  "email": "john@techdist.com",
  "phone": "+1-555-0100",
  "payment_terms_days": 30,
  "is_active": true
}
```
4. Click **Execute**
5. You get back HTTP `201 Created` with the new supplier (including its `id`)

### Step 3 — HTTP Status Codes

| Code | Meaning | When |
|---|---|---|
| `200 OK` | Success | GET request succeeded |
| `201 Created` | Created | POST succeeded, new record created |
| `204 No Content` | Deleted | DELETE succeeded |
| `400 Bad Request` | Validation error | You sent invalid data |
| `401 Unauthorized` | No token | You forgot to authenticate |
| `403 Forbidden` | No permission | You don't have access |
| `404 Not Found` | Doesn't exist | Wrong ID |
| `500 Server Error` | Code bug | Check the terminal |

### Understanding the query parameters

List endpoints (`GET /products/`) accept filters in the URL:

```
?search=laptop              ← Full-text search (name, SKU, description)
?status=active              ← Filter by status
?category=<uuid>            ← Filter by category ID
?ordering=-selling_price    ← Sort descending by price (minus = DESC)
?ordering=name              ← Sort ascending by name
?page=2                     ← Pagination
?page_size=50               ← Items per page (default 25)
```

---

## 19. Summary — What We Built

Here's a complete picture of what was done in this tutorial session:

### Code written

| File | Lines | What it does |
|---|---|---|
| `apps/inventory/models.py` | ~400 | Full domain model with SOLID principles |
| `apps/inventory/serializers.py` | ~300 | Read/write serializer separation, validation |
| `apps/inventory/views.py` | ~260 | 8 ViewSets, 10+ custom action endpoints |
| `apps/inventory/admin.py` | ~100 | Rich admin with inline tabs |
| `apps/inventory/urls.py` | ~30 | 8 routes registered |
| `config/settings/local_sqlite.py` | ~60 | SQLite settings for migrations without PostgreSQL |
| `apps/*/migrations/0001_initial.py` | ~722 | Auto-generated schema for all 6 apps |

### Infrastructure set up

- ✅ PostgreSQL 16 installed via Homebrew
- ✅ `core_db` database + `core_user` created
- ✅ `.env` file configured with real credentials
- ✅ All 36 migrations applied to PostgreSQL
- ✅ Superuser created: `admin@erp.com` / `Admin1234!`
- ✅ Django dev server running at `http://127.0.0.1:8000/`
- ✅ Swagger UI working at `http://127.0.0.1:8000/api/v1/docs/`

### GitHub commits pushed

| Commit | What |
|---|---|
| `a6e00f4` | Initial commit — 73 files, 6343 lines |
| `0100db5` | Complete inventory module |
| `8a06866` | All migrations + local_sqlite settings |
| `36b2710` | Fix ExpenseSerializer balance field bug |

### Key concepts learned

1. **SOLID principles** — how to apply each one with real Django code
2. **M2M through models** — for relationships with extra data
3. **F() expressions** — race-condition-safe database arithmetic
4. **transaction.atomic()** — all-or-nothing database operations
5. **Custom @action** — adding non-CRUD endpoints to ViewSets
6. **Read vs write serializers** — different serializers for different operations
7. **Conventional commits** — meaningful git history
8. **Django migrations** — how they're generated and applied
9. **PostgreSQL setup** — Homebrew install, user/db creation
10. **AssertionError debugging** — reading terminal errors and finding bugs fast

---

> **Next Steps:** The inventory module is complete. The next logical step is the **Sales module** — connecting customers, orders and the inventory (auto-deducting stock when an order is shipped), followed by the **Finance module** (recording revenue transactions when invoices are paid). Both of these will build directly on top of the models and patterns established in this tutorial.
