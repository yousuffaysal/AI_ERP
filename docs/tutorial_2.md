# Tutorial 2: Implementing Multi-Tenant Architecture (Company Model)

**What we had:** A partial `Tenant` model that barely worked — only 2 of 18 ViewSets filtered data by tenant. The rest exposed ALL company data to everyone.  
**What we built:** A watertight, DRY, guaranteed multi-tenant isolation system using a `Company` model.

> This tutorial continues directly from Tutorial 1. Read that first if you haven't.

---

## Table of Contents

1. [The Problem with the Old Tenant Approach](#1-the-problem-with-the-old-tenant-approach)
2. [Step 1 — Renaming Tenant to Company (models.py)](#2-step-1--renaming-tenant-to-company-modelsspy)
3. [Step 2 — The Abstract Base Model (utils/models.py)](#3-step-2--the-abstract-base-model-utilsmodelspy)
4. [Step 3 — The Central Enforcement Mixin (utils/mixins.py)](#4-step-3--the-central-enforcement-mixin-utilsmixinspy)
5. [Step 4 — The Middleware (utils/middleware.py)](#5-step-4--the-middleware-utilsmiddlewarepy)
6. [Step 5 — Updated Permissions (utils/permissions.py)](#6-step-5--updated-permissions-utilspermissionspy)
7. [Step 6 — Accounts Serializers](#7-step-6--accounts-serializers)
8. [Step 7 — Accounts Views](#8-step-7--accounts-views)
9. [Step 8 — Applying the Mixin to All Domain Apps](#9-step-8--applying-the-mixin-to-all-domain-apps)
10. [Step 9 — The Audit Middleware Update](#10-step-9--the-audit-middleware-update)
11. [Step 10 — Middleware Ordering in Settings](#11-step-10--middleware-ordering-in-settings)
12. [Step 11 — Writing Isolation Tests](#12-step-11--writing-isolation-tests)
13. [How Data Flows Through the Entire Stack](#13-how-data-flows-through-the-entire-stack)
14. [Common Mistakes and How We Prevented Them](#14-common-mistakes-and-how-we-prevented-them)

---

## 1. The Problem with the Old Tenant Approach

After Tutorial 1, the project had a `Tenant` model in `apps/accounts/models.py` and a `TenantMiddleware` that set `request.tenant`. The pattern looked like this in views:

```python
# The OLD (unsafe) way in apps/inventory/views.py
class ProductViewSet(ModelViewSet):
    queryset = Product.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        tenant = getattr(self.request, 'tenant', None)
        if tenant:
            qs = qs.filter(tenant=tenant)
        return qs
```

This has **three critical problems**:

### Problem 1: It Was Optional

With the old approach, a developer could write a new ViewSet and simply **forget** to add `get_queryset()`. There was zero enforcement. Let's count how many ViewSets actually had this filter:

```
CategoryViewSet    ← NO filter  ← DATA LEAK
UnitViewSet        ← NO filter  ← DATA LEAK
ProductViewSet     ← HAS filter ✓
WarehouseViewSet   ← NO filter  ← DATA LEAK
StockViewSet       ← NO filter  ← DATA LEAK
StockMovementViewSet ← HAS filter ✓
CustomerViewSet    ← NO filter  ← DATA LEAK
SalesOrderViewSet  ← NO filter  ← DATA LEAK
InvoiceViewSet     ← NO filter  ← DATA LEAK
EmployeeViewSet    ← NO filter  ← DATA LEAK
... and so on
```

**Only 2 of 18 ViewSets were filtered.** The other 16 were returning ALL data to ANY authenticated user from ANY company.

### Problem 2: The "if tenant:" Silent Pass-Through

Look at this line from the old code:

```python
if tenant:
    qs = qs.filter(tenant=tenant)
return qs   # ← If tenant is None, returns EVERYTHING unfiltered
```

If `request.tenant` was `None` for any reason (middleware failed, user had no tenant, etc.), the code silently fell through and returned the **entire unfiltered queryset**. There was no error, no log, no 403. The data just leaked.

### Problem 3: Manual Repetition (DRY violation)

Every ViewSet needed to copy the same 5-line `get_queryset` pattern. This is a DRY (Don't Repeat Yourself) violation. When you copy-paste the same logic in 18 places, fixing a bug means finding and updating all 18 places. You will always miss one.

### The Solution We Built

|   | Old | New |
|---|---|---|
| Isolation | Manual, optional, copyable | Automatic via mixin |
| Missing company | Silent pass-through (returns all data) | Hard 403 error |
| Adding new ViewSet | Developer must remember to add filter | Just inherit the mixin |
| Tenant name | `Tenant` (generic) | `Company` (business-clear) |
| Tenant fields | name, slug, domain, is_active | + email, phone, address, logo, plan, max_users |

---

## 2. Step 1 — Renaming Tenant to Company (models.py)

**File:** `/Users/yusuf/AI_ERP/core/apps/accounts/models.py`

### Why Rename?

In an ERP system, "tenant" is a technical term (from SaaS multi-tenancy). The business people who will use this system think in terms of "companies" or "organisations". Naming your core concept after the technical pattern instead of the business domain is a code smell.

Good naming rule: **name things after what they ARE in the domain, not how they're implemented.**

### The New Company Model

```python
class Company(models.Model):

    class SubscriptionPlan(models.TextChoices):
        FREE = 'free', _('Free')
        STARTER = 'starter', _('Starter')
        PROFESSIONAL = 'professional', _('Professional')
        ENTERPRISE = 'enterprise', _('Enterprise')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True)

    # --- Contact / identity fields (NEW) ---
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)

    # --- Routing (existed before) ---
    domain = models.CharField(max_length=255, blank=True, null=True, unique=True)

    # --- Plan & limits (NEW) ---
    subscription_plan = models.CharField(
        max_length=20,
        choices=SubscriptionPlan.choices,
        default=SubscriptionPlan.FREE,
    )
    max_users = models.PositiveIntegerField(default=5)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'companies'   # ← database table named clearly
```

### Why db_table = 'companies'?

By default, Django names the table `accounts_company` (appname_modelname). We explicitly set `db_table = 'companies'` for three reasons:
1. It's shorter and cleaner in SQL queries.
2. `companies` means something to a DBA reading the schema — `accounts_company` is confusing.
3. There's only ever one Company model, so the app prefix is redundant.

### Why `SubscriptionPlan` as an inner class?

```python
class Company(models.Model):
    class SubscriptionPlan(models.TextChoices):
        FREE = 'free', _('Free')
        ...
    subscription_plan = models.CharField(choices=SubscriptionPlan.choices)
```

Defining choices as a nested class means:
- The choices live **next to the field** that uses them — easy to find.
- You access them as `Company.SubscriptionPlan.ENTERPRISE` — self-documenting.
- If you add a new plan, you change only one place.

### Computed Properties

```python
@property
def active_user_count(self):
    return self.users.filter(is_active=True).count()

@property
def is_at_user_limit(self):
    return self.active_user_count >= self.max_users
```

`@property` means these behave like attributes, not methods:
- `company.active_user_count` ← no parentheses needed
- They are computed fresh each time — always accurate, never stale

`self.users.filter(...)` works because `User` has `company = ForeignKey(Company, related_name='users')`. The `related_name='users'` creates a reverse relationship so you can go in either direction:
- `user.company` → the user's company
- `company.users` → all users in the company

### Updated User FK

```python
class User(AbstractBaseUser, PermissionsMixin):
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='users',
        null=True,
        blank=True,
        db_index=True,           # ← NEW: speeds up queries filtering by company
    )
```

`db_index=True` creates a database index on the `company_id` column. When you run `User.objects.filter(company=some_company)`, the database doesn't read every user row — it jumps directly to the matching rows using the index. For a company with 10,000 users in a database of 1,000,000, this makes the query roughly 100x faster.

---

## 3. Step 2 — The Abstract Base Model (utils/models.py)

**File:** `/Users/yusuf/AI_ERP/core/utils/models.py`

The change here is surgical but important:

```python
# Old
class TenantModel(AuditableModel):
    tenant = models.ForeignKey(
        'accounts.Tenant',   # ← old reference
        ...
    )

# New
class CompanyModel(AuditableModel):
    company = models.ForeignKey(
        'accounts.Company',  # ← updated reference
        on_delete=models.CASCADE,
        related_name='%(app_label)s_%(class)s_set',
        null=True,
        blank=True,
        db_index=True,       # ← added index for performance
    )
```

And `BaseModel` now inherits from `CompanyModel`:

```python
class BaseModel(UUIDModel, CompanyModel):
    class Meta:
        abstract = True
```

Because `BaseModel` is abstract and every domain model inherits from `BaseModel`, this single change gives **every** `Product`, `Order`, `Employee`, `Transaction`, and `AuditLog` in the system a `company` ForeignKey automatically.

You don't update any of the domain models themselves (`inventory/models.py`, `sales/models.py`, etc.) — the field inheritance does the work.

---

## 4. Step 3 — The Central Enforcement Mixin (utils/mixins.py)

**File:** `/Users/yusuf/AI_ERP/core/utils/mixins.py` ← **New file**

This is the most important piece of the entire multi-tenant implementation. Read this carefully.

```python
class CompanyQuerysetMixin:
    """
    Mixin that enforces company-scoped queryset filtering for all ViewSets.
    """

    def get_company(self):
        company = getattr(self.request, 'company', None)
        if company is None:
            raise PermissionDenied(
                detail='No company context found. Include the X-Company-ID header...'
            )
        return company

    def get_queryset(self):
        qs = super().get_queryset()
        company = self.get_company()   # ← Will raise 403 if None
        return qs.filter(company=company)

    def perform_create(self, serializer):
        company = self.get_company()
        extra = {'company': company}
        user = self.request.user
        if user and user.is_authenticated:
            extra['created_by'] = user
            extra['updated_by'] = user
        serializer.save(**extra)

    def perform_update(self, serializer):
        extra = {}
        if self.request.user.is_authenticated:
            extra['updated_by'] = self.request.user
        serializer.save(**extra)
```

### How Mixin Inheritance Works in Python

When a ViewSet inherits from `CompanyQuerysetMixin`:

```python
class ProductViewSet(CompanyQuerysetMixin, ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
```

Python uses **Method Resolution Order (MRO)** to determine which `get_queryset()` runs when DRF calls it:

```
ProductViewSet.get_queryset()     → not defined here
CompanyQuerysetMixin.get_queryset()  → FOUND — runs this
  calls: super().get_queryset()
  super() = ModelViewSet (the next in MRO)
  ModelViewSet.get_queryset()     → returns Product.objects.all()
  Back in mixin: filters by company, returns result
```

So the mixin intercepts the queryset, filters it, and returns the filtered version. The ViewSet itself needs zero filtering code.

### Why `get_company()` raises `PermissionDenied` (not returns `None`)

Compare these two approaches:

```python
# Approach A — unsafe (old way)
def get_queryset(self):
    company = getattr(self.request, 'company', None)
    if company:
        return qs.filter(company=company)
    return qs  # ← if company is None: returns ALL data. DANGEROUS.

# Approach B — safe (our way)
def get_company(self):
    company = getattr(self.request, 'company', None)
    if company is None:
        raise PermissionDenied(...)   # ← hard stop. No data returned.
    return company
```

With Approach A, any failure in the middleware chain silently returns all data. With Approach B, the request gets a **403 error immediately** — the developer is forced to fix the root cause (why is there no company?), and users never see data they shouldn't.

### Why `perform_create()` sets `company`?

DRF's default `perform_create(serializer)` just calls `serializer.save()`. By overriding it, we intercept the save and inject extra fields:

```python
serializer.save(
    company=company,           # ← ensures new record belongs to current company
    created_by=request.user,
    updated_by=request.user,
)
```

This means when a user does `POST /api/v1/inventory/products/`, they don't need to send `company` in the request body — it's automatically set from their session. This is both **convenient** (fewer fields to send) and **secure** (users can't fake a company ID in the request body).

### The Superuser Debug Bypass

```python
def get_queryset(self):
    from django.conf import settings
    qs = super().get_queryset()

    if (
        settings.DEBUG and
        request.user.is_superuser and
        request.query_params.get('all_companies') == 'true'
    ):
        return qs  # return unfiltered

    company = self.get_company()
    return qs.filter(company=company)
```

Sometimes during development, a superuser (you) needs to see all data without specifying a company — for debugging or management tasks. `?all_companies=true` enables this.

**Critically, this only works when `settings.DEBUG = True`.** In production (`DEBUG = False`), even a superuser cannot bypass company isolation. This prevents accidentally exposing a backdoor in production.

---

## 5. Step 4 — The Middleware (utils/middleware.py)

**File:** `/Users/yusuf/AI_ERP/core/utils/middleware.py`

```python
class CompanyMiddleware(MiddlewareMixin):

    def process_request(self, request):
        request.company = None   # ← Set a safe default first

        try:
            from apps.accounts.models import Company
        except ImportError:
            return

        # Priority 1: Explicit X-Company-ID header
        company_id = request.headers.get('X-Company-ID')
        if company_id:
            try:
                request.company = Company.objects.get(id=company_id, is_active=True)
                return
            except (Company.DoesNotExist, ValueError):
                logger.warning('Invalid X-Company-ID: %s', company_id)
                # Fall through — don't error out, try the user's company

        # Priority 2: Authenticated user's linked company
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            request.company = getattr(user, 'company', None)
```

### Why two resolution methods?

**Method 1 (Header):** Useful for admin tools, API clients, or scenarios where a superuser needs to act on behalf of a specific company without logging in as that company's user.

**Method 2 (User's company):** The normal case. When a manager at Acme Corp logs in, their `user.company` resolves to Acme's Company record. They never need to send the header.

### Why `request.company = None` at the start?

Safety. If the middleware throws any exception or encounters any error, `request.company` is already set to `None`. Then `CompanyQuerysetMixin.get_company()` will raise a 403. Without this initialisation, `request.company` might be undefined, causing `AttributeError` exceptions in the mixin — a different and confusing error.

### Why `select_related()` in the header lookup?

```python
Company.objects.select_related().get(id=company_id, is_active=True)
```

`select_related()` means: when you fetch the Company, also fetch any related records in the same SQL query (eager loading). This avoids N+1 query problems if you later access fields on related objects. It's a performance habit.

### Why the lazy import?

```python
def process_request(self, request):
    try:
        from apps.accounts.models import Company
    except ImportError:
        return
```

The import is inside the method, not at the top of the file. Django loads middleware very early in startup, before all models are guaranteed to be ready. If `Company` is imported at the module level (`from apps.accounts.models import Company` at the top of `middleware.py`), it might fail with `AppRegistryNotReady`. Importing lazily — inside the function — defers it until the function is first called, by which point Django has fully initialised.

---

## 6. Step 5 — Updated Permissions (utils/permissions.py)

**File:** `/Users/yusuf/AI_ERP/core/utils/permissions.py`

Two main additions:

### HasCompany — An Early-Exit Guard

```python
class HasCompany(BasePermission):
    message = 'No company context found. Ensure your account is linked to a company.'

    def has_permission(self, request, view):
        return getattr(request, 'company', None) is not None
```

This runs **before** `get_queryset()` is even called. If there's no company on the request, the API responds with 403 immediately, without even hitting the database.

We already have the hard guard in `CompanyQuerysetMixin.get_company()`, so why have `HasCompany` too?

**Defence in depth.** The mixin's guard triggers inside `get_queryset()`. But some DRF code paths skip `get_queryset()` for certain custom actions. `HasCompany` as a permission class runs on ALL requests to the view, regardless of which action is invoked. Two layers of protection.

### IsSameCompany — Object-Level Guard

```python
class IsSameCompany(BasePermission):

    def has_object_permission(self, request, view, obj):
        request_company = getattr(request, 'company', None)
        obj_company = getattr(obj, 'company', None)
        if request_company is None or obj_company is None:
            return False
        return request_company.id == obj_company.id
```

`has_object_permission()` is called by DRF during `retrieve`, `update`, and `destroy` actions — when a specific object is being accessed. Even if `get_queryset()` filters correctly, `IsSameCompany` provides a third layer: checking the specific object that was resolved.

**Why is `request_company.id == obj_company.id` better than `request_company == obj_company`?**

Python's `==` on model instances by default checks object identity, not equality. Two `Company` objects loaded by different queries that refer to the same database row might compare as `False`. Comparing `.id` (the UUID primary key) compares strings, which is always reliable.

---

## 7. Step 6 — Accounts Serializers

**File:** `/Users/yusuf/AI_ERP/core/apps/accounts/serializers.py`

### CompanySerializer and CompanyMiniSerializer

```python
class CompanyMiniSerializer(serializers.ModelSerializer):
    """Compact — embedded inside UserSerializer."""
    class Meta:
        model = Company
        fields = ['id', 'name', 'slug', 'subscription_plan']


class CompanySerializer(serializers.ModelSerializer):
    """Full version — for the /companies/ endpoint."""
    active_user_count = serializers.IntegerField(read_only=True)
    is_at_user_limit = serializers.BooleanField(read_only=True)
```

**Why two serializers?**

When you list users, you want basic company info inline — but serializing the full Company object (with all 15 fields) for every user in a 500-user list is wasteful. `CompanyMiniSerializer` gives just enough information (4 fields) for the frontend to know which company a user belongs to.

`full_detail = CompanySerializer` for the `/companies/` endpoint where you actually WANT all fields.

This is a common pattern: **fat serializer** for the resource's own endpoint, **slim/nested serializer** when it's embedded in another resource.

### Updated UserSerializer with Nested Company

```python
class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    company_detail = CompanyMiniSerializer(source='company', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone',
            'company',         # ← just the UUID (writable)
            'company_detail',  # ← nested object (read-only)
            ...
        ]
```

`source='company'` tells DRF: "use the `company` field on the model as the source for this serializer field." The field name (`company_detail`) differs from the source (`company`) so both can exist simultaneously.

A frontend receives:
```json
{
  "company": "uuid-value",
  "company_detail": {
    "id": "uuid-value",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "subscription_plan": "professional"
  }
}
```

The flat UUID is useful for passing in forms (write). The nested object is useful for display (read).

### Upgraded JWT Payload

```python
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.full_name
        token['company_id'] = str(user.company.id) if user.company else None
        token['company_name'] = user.company.name if user.company else None  # ← NEW
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data  # ← also return full user in response
        return data
```

Now the login response contains BOTH the JWT tokens AND the full user profile:

```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": {
    "id": "...", "email": "...", "role": "admin", "company_detail": {...}
  }
}
```

A frontend can:
1. Parse the `access` JWT client-side to get `company_id` and `role` without an extra API call.
2. Use `user` from the login response to immediately populate the UI (user profile, header bar, permissions).

The frontend **never needs to call `/api/v1/auth/me/` after login** — everything it needs is already in the login response.

---

## 8. Step 7 — Accounts Views

**File:** `/Users/yusuf/AI_ERP/core/apps/accounts/views.py`

### CompanyViewSet — The Special Case

```python
class CompanyViewSet(ModelViewSet):
    """NOT inheriting CompanyQuerysetMixin — intentionally."""
    queryset = Company.objects.all()
    permission_classes = [IsAdmin]
```

This is the only ViewSet that **doesn't** inherit `CompanyQuerysetMixin`. Why?

`CompanyQuerysetMixin` filters by `request.company`. But `Company` is the entity that defines tenancy — it cannot itself be filtered by company. That would be circular (`Company.objects.filter(company=company)` makes no sense — Company doesn't have a `company` foreign key).

Only **superusers or platform-level admins** should manage the Company list. Platform admins administer which companies exist; company-level admins administer the data inside their company.

### UserViewSet — With Mixin

```python
class UserViewSet(CompanyQuerysetMixin, ModelViewSet):
    queryset = User.objects.select_related('company').all()
    ...

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsManager(), HasCompany()]
        return [IsAdmin(), HasCompany()]
```

**`get_permissions()` override:** DRF processes permissions as a list. Returning `[IsManager(), HasCompany()]` means the request must satisfy BOTH:
1. The user must be a Manager or Admin.
2. The request must have a company context.

Both must pass for the request to proceed.

### New `change_role` Action

```python
@action(detail=True, methods=['patch'], permission_classes=[IsAdmin, HasCompany])
def change_role(self, request, pk=None):
    user = self.get_object()
    new_role = request.data.get('role')
    if new_role not in User.Roles.values:
        return Response({'role': f'Invalid role. Choose from: {list(User.Roles.values)}'}, status=400)
    user.role = new_role
    user.save(update_fields=['role'])
    return Response(UserSerializer(user).data)
```

**Why a separate `change_role` action instead of just including `role` in the update serializer?**

If `role` was in the generic PATCH serializer, a Manager could potentially pass `role=admin` in a PATCH request and escalate their own privileges. By putting role changes into a dedicated `@action` with `IsAdmin` permission only, we enforce that **only Admins can change roles**, regardless of what data is sent in a PATCH request.

---

## 9. Step 8 — Applying the Mixin to All Domain Apps

**Files:** All 5 domain app `views.py` files

The pattern is the same for all 18 ViewSets. Here's inventory as the full example:

```python
# Before (unsafe — only ProductViewSet filtered)
class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.all()
    permission_classes = [IsAuthenticated]
    # ← No get_queryset. ALL categories from ALL companies visible.

class ProductViewSet(ModelViewSet):
    queryset = Product.objects.all()
    def get_queryset(self):
        qs = super().get_queryset()
        tenant = getattr(self.request, 'tenant', None)
        if tenant:
            qs = qs.filter(tenant=tenant)
        return qs

# After (safe — all ViewSets filtered)
class CategoryViewSet(CompanyQuerysetMixin, ModelViewSet):
    queryset = Category.objects.all()
    permission_classes = [IsAuthenticated, HasCompany]
    # ← No get_queryset needed. CompanyQuerysetMixin handles it.

class ProductViewSet(CompanyQuerysetMixin, ModelViewSet):
    queryset = Product.objects.all()
    # ← No get_queryset needed. Line count reduced, safety improved.
```

The mixin also removed the old `get_queryset` overrides from ViewSets that had them (ProductViewSet, StockMovementViewSet) — the mixin replaces them.

### Sales: Full State Machine

In the updated `SalesOrderViewSet`, we added the full order lifecycle:

```python
@action(detail=True, methods=['post'])
def confirm(self, request, pk=None):
    order = self.get_object()     # ← already filtered to request.company
    if order.status != SalesOrder.Status.DRAFT:
        return Response({'error': '...'}, status=400)
    order.status = SalesOrder.Status.CONFIRMED
    order.updated_by = request.user   # ← audit trail
    order.save(update_fields=['status', 'updated_by'])
    return Response(SalesOrderSerializer(order).data)
```

**`update_fields=['status', 'updated_by']`** — this is a Django optimisation. Instead of updating ALL columns in the row (`UPDATE orders SET name=..., status=..., customer_id=..., ...`), it only updates the two columns that actually changed (`UPDATE orders SET status=..., updated_by=... WHERE id=...`). On a busy database with many concurrent writes, this reduces lock contention significantly.

### HR: Ownership-Aware Leave Cancellation

```python
@action(detail=True, methods=['post'])
def cancel(self, request, pk=None):
    leave = self.get_object()
    is_own_request = (
        hasattr(request.user, 'employee') and
        leave.employee == request.user.employee
    )
    is_manager = request.user.role in ('admin', 'manager')
    if not (is_own_request or is_manager):
        return Response({'error': 'You can only cancel your own leave requests.'}, status=403)
    ...
```

Staff can only cancel their OWN leave requests. Managers can cancel any leave request. We check `request.user.employee` — the reverse `OneToOne` relationship from User to Employee — to determine if the requesting user IS the employee who submitted the leave.

`hasattr(request.user, 'employee')` — we check with `hasattr` first because not every `User` has an associated `Employee` record (e.g., the admin user). Accessing `request.user.employee` on a user without an employee would raise `RelatedObjectDoesNotExist`.

### Finance: Immutable Transactions

```python
class TransactionViewSet(CompanyQuerysetMixin, ModelViewSet):
    http_method_names = ['get', 'post', 'head', 'options']
    # ← No 'put', 'patch', 'delete'
```

Financial transactions are **immutable by design** — an accounting principle. If you allowed editing a transaction, someone could retroactively alter financial records. Limiting HTTP methods to GET and POST at the framework level means no route exists for mutation. Even if a developer accidentally wires up an edit form, there's no endpoint to call.

---

## 10. Step 9 — The Audit Middleware Update

**File:** `/Users/yusuf/AI_ERP/core/apps/audit/middleware.py`

Key changes from the original:

### Sensitive Field Scrubbing

```python
body = {
    k: '***'
    if k.lower() in ('password', 'token', 'secret', 'key')
    else v
    for k, v in request.data.items()
}
```

If a user changes their password via `POST /auth/me/change-password/` with `{"old_password": "...", "new_password": "..."}`, we don't want those values stored in the audit log database. The scrubbing replaces any field whose name contains `password`, `token`, `secret`, or `key` with `"***"`.

This is a **dict comprehension** — a Python one-liner that builds a new dictionary from an existing one, applying a transformation to each value.

### Company ID in Audit Log

```python
extra={
    'status_code': response.status_code,
    'method': request.method,
    'company_id': str(request.company.id) if getattr(request, 'company', None) else None,
}
```

We record `company_id` in the audit log's `extra` JSON field. This means you can query the audit log for all actions by Company A: `AuditLog.objects.filter(extra__company_id=str(company_a.id))`.

### Why `try/except` around the whole block?

```python
try:
    AuditLog.objects.create(...)
except Exception as exc:
    logger.warning('AuditLogMiddleware failed — %s', exc)
```

**Audit failures must NEVER break the actual request.** If the audit logging fails (database connection dropped, JSON serialisation error, model changed), the user's actual operation should still succeed. Wrapping the audit write in `try/except` and logging the failure ensures this. The exception is logged so engineers can investigate, but the response is still returned to the user.

---

## 11. Step 10 — Middleware Ordering in Settings

**File:** `/Users/yusuf/AI_ERP/core/config/settings/base.py`

The final middleware list:

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',   # ← sets request.user
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'utils.middleware.CompanyMiddleware',      # ← sets request.company (needs request.user)
    'apps.audit.middleware.AuditLogMiddleware', # ← reads request.company (needs both)
]
```

**Order matters critically.** Django processes middleware top-to-bottom on the way IN (request) and bottom-to-top on the way OUT (response).

- `CompanyMiddleware` must come AFTER `AuthenticationMiddleware` — because `CompanyMiddleware` reads `request.user.company`, and `request.user` is only set by `AuthenticationMiddleware`.
- `AuditLogMiddleware` must come AFTER `CompanyMiddleware` — because `AuditLogMiddleware.process_response()` reads `request.company`, which is only set by `CompanyMiddleware`.

If you get the order wrong, you'll see errors like `AttributeError: 'HttpRequest' object has no attribute 'company'` on startup requests.

**Also: we removed the duplicate MIDDLEWARE definition.** The base.py file had two `MIDDLEWARE = [...]` blocks — one from the original setup (with TenantMiddleware) and one we inserted with CompanyMiddleware. Python sees the last assignment, so the original was overwriting our new one. We removed the stale old block entirely.

---

## 12. Step 11 — Writing Isolation Tests

**File:** `/Users/yusuf/AI_ERP/core/apps/accounts/tests/test_company_isolation.py`

### Why are these tests so important?

Unit tests for database queries are easy to skip — "I see the code filters by company, obviously it works." But multi-tenancy bugs are **silent**. They don't crash your server. They don't throw exceptions. They just return too much data. By the time you notice, potentially thousands of queries have leaked data.

The tests prove — with actual database records — that the isolation works.

### Test Setup Pattern (Reusable Helpers)

```python
def make_company(name='Test Co', slug=None):
    slug = slug or name.lower().replace(' ', '-')
    return Company.objects.create(name=name, slug=slug)

def make_user(company, email, role=User.Roles.STAFF, password='TestPass123!'):
    return User.objects.create_user(...)

def auth_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return client
```

These helper functions avoid repeating setup code in every test. `TestCase.setUp()` calls them to create the test data before each test method runs.

### Test Class 1: Core Isolation

```python
class CompanyIsolationTest(TestCase):

    def test_company_a_sees_only_its_products(self):
        response = self.client_a.get('/api/v1/inventory/products/')
        names = [p['name'] for p in response.data['results']]
        self.assertIn('Laptop A', names)
        self.assertNotIn('Laptop B', names)   # ← this is the money test

    def test_company_a_cannot_access_company_b_product_by_id(self):
        url = f'/api/v1/inventory/products/{self.product_b.id}/'
        response = self.client_a.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)  # ← NOT 403!
```

**Why 404 (Not Found) and not 403 (Forbidden)?**

This is a security subtlety. If we returned 403, we'd be leaking information: "This product exists but you can't access it." An attacker could enumerate product IDs and learn which IDs belong to other companies.

Returning 404 says: "This product doesn't exist" — from the perspective of the querying company, it genuinely doesn't (it's filtered out of the queryset). The attacker learns nothing.

This behaviour comes automatically from `CompanyQuerysetMixin.get_queryset()`. The product is simply not in the queryset returned for Company A, so DRF's `get_object()` raises `Http404`.

### Test Class 2: No Company Context

```python
class NoCompanyContextTest(TestCase):

    def setUp(self):
        self.orphan_user = User.objects.create_user(
            email='orphan@example.com',
            company=None,    # ← the key: no company
        )
        self.client = auth_client(self.orphan_user)

    def test_orphan_user_cannot_list_products(self):
        response = self.client.get('/api/v1/inventory/products/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
```

This tests the hard guard in `CompanyQuerysetMixin.get_company()`. A valid, authenticated user with no company assigned gets 403 on company-scoped endpoints.

### Test Class 3: Middleware Resolution

```python
def test_middleware_resolves_company_from_x_company_id_header(self):
    client = APIClient()
    refresh = RefreshToken.for_user(self.user)  # user belongs to company1
    client.credentials(
        HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}',
        HTTP_X_COMPANY_ID=str(company2.id),     # header points to company2
    )
    response = client.get('/api/v1/inventory/products/')
    names = [p['name'] for p in response.data['results']]
    self.assertIn('Header Product', names)  # product belonging to company2
```

`client.credentials()` sets default headers on the test client — every subsequent request will include these headers. `HTTP_X_COMPANY_ID` is Django's internal WSGI key for the `X-Company-ID` header (Django prefixes all custom headers with `HTTP_` and uppercases them).

### Test Class 4: Auto-Assignment

```python
def test_new_category_auto_assigned_to_company(self):
    response = self.client.post('/api/v1/inventory/categories/', {
        'name': 'Auto Category',
    }, format='json')
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    category = Category.objects.get(id=response.data['id'])
    self.assertEqual(category.company, self.company)   # ← auto-assigned!
```

The POST body has only `name`. No `company` field was sent. The test verifies that `category.company` is nonetheless correctly set to the requesting user's company — via `CompanyQuerysetMixin.perform_create()`.

---

## 13. How Data Flows Through the Entire Stack

Here is the complete journey of a single request: `GET /api/v1/inventory/products/`

```
Browser/Client
    │
    ▼ HTTP Request
    │   Authorization: Bearer eyJ...
    │   X-Company-ID: <optional>
    │
┌───▼────────────────────────────┐
│  SecurityMiddleware             │ (HTTPS checks, security headers)
│  CorsMiddleware                 │ (add CORS headers for browser)
│  AuthenticationMiddleware       │ → sets request.user = User(admin@acme.com)
│  CompanyMiddleware              │ → reads user.company → sets request.company = Acme
│  AuditLogMiddleware             │ (only acts on response, on the way back)
└───┬────────────────────────────┘
    │
    ▼ URL Router (config/urls.py)
    │   /api/v1/inventory/ → inventory.urls
    │   /products/ → ProductViewSet.list()
    │
┌───▼────────────────────────────┐
│  ProductViewSet.list()          │
│    ├─ permission_classes        │ → [IsAuthenticated, HasCompany]
│    │     ✓ user authenticated   │
│    │     ✓ request.company set  │
│    │                            │
│    ├─ get_queryset()            │ (from CompanyQuerysetMixin)
│    │     get_company()          │ → returns Acme (or raises 403)
│    │     Product.objects.all()  │
│    │     .filter(company=Acme)  │ → only Acme's products
│    │                            │
│    ├─ paginate_queryset()       │ → paginate results (25 per page)
│    └─ get_serializer(many=True) │ → serialize to JSON
└───┬────────────────────────────┘
    │
    ▼ Response (JSON)
    │
AuditLogMiddleware.process_response()
    │   request.method = 'GET' → skip (not a mutating request)
    │
    ▼ 200 OK
    {
      "count": 42,
      "results": [
        {"id": "...", "name": "Laptop A", "company": "acme-uuid", ...},
        ...
      ]
    }
    → Only Acme Corp's products. Zero data from any other company.
```

---

## 14. Common Mistakes and How We Prevented Them

### Mistake 1: Filtering by Tenant Can Be Bypassed

**Old code:**
```python
if tenant:
    qs = qs.filter(tenant=tenant)
return qs  # ← if tenant is None, unfiltered!
```

**Prevention:** `get_company()` raises `PermissionDenied` if company is `None`. There is no code path that returns an unfiltered queryset.

### Mistake 2: Forgetting to Add Filter to New ViewSet

**Old code:** Each ViewSet was responsible for filtering itself. If you forgot, no tests failed, no error was raised.

**Prevention:** The `CompanyQuerysetMixin` is inherited by every ViewSet. Forgetting to add it causes a different problem to track down, but the RIGHT pattern is visible in every existing ViewSet — new developers copy the pattern.

We could add a framework-level check (a custom base class that all ViewSets must inherit) to catch this automatically, but that's a step beyond the current implementation.

### Mistake 3: Storing Passwords in Audit Logs

**Old code:** `changes=dict(request.data)` — stored the entire request body including passwords.

**Prevention:**
```python
body = {
    k: '***' if k.lower() in ('password', 'token', 'secret', 'key') else v
    for k, v in request.data.items()
}
```

### Mistake 4: Wrong Middleware Order

**Old code:** `TenantMiddleware` appeared before `AuthenticationMiddleware`, so `request.user` wasn't set when we tried to read `user.company`.

**Prevention:**  Explicit comment in settings explaining why `CompanyMiddleware` must come after `AuthenticationMiddleware`. Plus the ordering is now correct and tested.

### Mistake 5: 403 Instead of 404 on Foreign Records

If `request.company != obj.company`, returning 403 leaks the existence of the record to an attacker.

**Prevention:** By filtering the queryset in `get_queryset()`, the record simply doesn't appear. DRF's `get_object()` raises `Http404` automatically. The attacker's response: "Not found" — true from their company's perspective.

---

## Summary: What Changed from Tutorial 1

| Concept | Tutorial 1 | Tutorial 2 |
|---|---|---|
| Multi-tenant entity | `Tenant` model | `Company` model (richer) |
| Field name | `tenant` | `company` |
| Middleware | `TenantMiddleware` | `CompanyMiddleware` |
| Header | `X-Tenant-ID` | `X-Company-ID` |
| Isolation enforcement | Manual `get_queryset()` in 2 of 18 ViewSets | `CompanyQuerysetMixin` — all 18 ViewSets |
| Missing context | Silent pass-through (data leak) | Hard 403 |
| Create audit | Manual | Auto via `perform_create()` |
| Tests | None | 5 test classes, 15 methods |
| JWT claims | `tenant_id` | `company_id`, `company_name`, full user profile |

---

*End of Tutorial 2.*
