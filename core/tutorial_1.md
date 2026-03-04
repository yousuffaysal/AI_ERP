# Tutorial 1: Building a Production-Ready Django REST API from Scratch

**Project Name:** Core ERP  
**Location:** `/Users/yusuf/AI_ERP/core/`  
**Goal:** Build a scalable, enterprise-grade REST API for an ERP system from zero.

---

> This tutorial walks you through **every single decision** made while building this project.
> You will learn *what* was created, *where* it lives, *why* it was done that way, and 
> *how* it all connects together.

---

## Table of Contents

1. [Why Django? Why REST? Why PostgreSQL?](#1-why-django-why-rest-why-postgresql)
2. [Project Layout Philosophy](#2-project-layout-philosophy)
3. [Step 1 — requirements.txt](#3-step-1--requirementstxt)
4. [Step 2 — Environment Variables (.env)](#4-step-2--environment-variables-env)
5. [Step 3 — The Config Package](#5-step-3--the-config-package)
6. [Step 4 — Modular Settings](#6-step-4--modular-settings)
7. [Step 5 — manage.py](#7-step-5--managepy)
8. [Step 6 — The Utility Layer (utils/)](#8-step-6--the-utility-layer-utils)
9. [Step 7 — The Accounts App (Custom User Model)](#9-step-7--the-accounts-app-custom-user-model)
10. [Step 8 — The Inventory App](#10-step-8--the-inventory-app)
11. [Step 9 — The Sales App](#11-step-9--the-sales-app)
12. [Step 10 — The HR App](#12-step-10--the-hr-app)
13. [Step 11 — The Finance App](#13-step-11--the-finance-app)
14. [Step 12 — The Audit App](#14-step-12--the-audit-app)
15. [Step 13 — Docker and docker-compose](#15-step-13--docker-and-docker-compose)
16. [How Everything Connects](#16-how-everything-connects)
17. [What to Do Next (Running the Project)](#17-what-to-do-next-running-the-project)

---

## 1. Why Django? Why REST? Why PostgreSQL?

Before touching a single file, you need to understand the tools chosen and **why**.

### Django

Django is a Python web framework that gives you:
- A built-in ORM (Object-Relational Mapper) — you write Python classes and it creates database tables for you.
- A built-in admin panel at `/admin/` — browse, add, edit, delete records without writing any UI.
- A mature ecosystem of packages built specifically for it.
- Battle-tested security (CSRF protection, SQL injection prevention, password hashing).

For an **ERP system** that will handle data from multiple departments (accounts, inventory, sales, HR, finance), Django's "batteries included" approach saves enormous time.

### Django REST Framework (DRF)

Django on its own renders HTML pages. But modern applications often need a **JSON API** — a backend that any frontend (React, Vue, mobile app) can talk to. DRF adds:
- **Serializers** — convert Python model instances to JSON and validate incoming data.
- **ViewSets** — combine list, create, retrieve, update, delete into one class.
- **Routers** — automatically generate URL patterns from ViewSets.
- **Authentication** and **permission** classes.

### PostgreSQL

PostgreSQL is the most feature-rich open-source relational database. The main reasons to use it over SQLite (Django's default):
- Handles multiple users writing at the same time (concurrent writes).
- Supports JSON columns (we use this for storing audit log changes).
- Scales to millions of rows without issues.
- Production systems always use PostgreSQL (or MySQL), never SQLite.

---

## 2. Project Layout Philosophy

A very common mistake beginners make is putting everything in one giant file or at the top level of the project. As the application grows, this becomes unmaintainable.

We follow **two key principles**:

### Principle 1: Separate Configuration from Business Logic

```
core/
├── config/         ← Django project config (settings, urls, wsgi, celery)
├── apps/           ← Business logic (each app = one business domain)
└── utils/          ← Shared tools used by all apps
```

`config/` only knows about *project-wide* setup. It doesn't know what a Product or Employee is.  
`apps/` contains all the actual business logic, split by domain.  
`utils/` contains reusable code that doesn't belong to any single app.

### Principle 2: One App = One Business Domain

Instead of mixing product code with employee code, each domain gets its own Django app:

```
apps/
├── accounts/    ← Users, authentication, tenants
├── inventory/   ← Products, warehouses, stock
├── sales/       ← Customers, orders, invoices
├── hr/          ← Employees, departments, leave
├── finance/     ← Accounts, transactions, budgets
└── audit/       ← Who did what, when
```

This makes the codebase **navigable** — if a bug is in the order system, you go to `apps/sales/`. You never have to wonder where things live.

---

## 3. Step 1 — requirements.txt

**File:** `/Users/yusuf/AI_ERP/core/requirements.txt`

This is the first file created in any Python project. It lists every external package the project depends on.

```
# Django Core
Django==5.0.3
djangorestframework==3.15.1
django-cors-headers==4.3.1

# Database
psycopg2-binary==2.9.9

# Authentication
djangorestframework-simplejwt==5.3.1

# Environment Variables
python-decouple==3.8
django-environ==0.11.2

# Filtering, Search & Pagination
django-filter==24.1

# API Documentation
drf-spectacular==0.27.1

# Task Queue
celery==5.3.6
redis==5.0.3
django-celery-beat==2.6.0

# Utilities
Pillow==10.2.0

# Production Server
gunicorn==21.2.0
whitenoise==6.6.0

# Testing
pytest==8.1.1
pytest-django==4.8.0
factory-boy==3.3.0
```

### Why version pin? (e.g., `Django==5.0.3` not just `Django`)

When you install without a version, pip gives you the latest version. If a package releases a breaking change 6 months later and a colleague installs fresh, their version won't match yours. Pinning versions makes the project **reproducible**.

### Why each package?

| Package | Why |
|---|---|
| `Django` | The web framework itself |
| `djangorestframework` | Adds JSON API capabilities to Django |
| `django-cors-headers` | Allows your React/Vue frontend (on port 3000) to call this API (on port 8000) — without it, browsers block the request |
| `psycopg2-binary` | The Python "driver" that lets Django talk to PostgreSQL |
| `djangorestframework-simplejwt` | Handles creating and validating JWT tokens |
| `django-environ` | Reads `.env` files into Python variables |
| `django-filter` | Adds `?status=active&category=1` URL filtering to your API |
| `drf-spectacular` | Auto-generates Swagger/OpenAPI documentation from your code |
| `celery` | Runs tasks in the background (e.g., send an email after an order is placed) |
| `redis` | The message broker Celery uses to queue tasks |
| `Pillow` | Python image library — needed for `ImageField` on models (user avatars, product photos) |
| `gunicorn` | The production web server — Django's built-in server is only for development |
| `whitenoise` | Serves static files (CSS, JS) directly from Django without needing a separate Nginx just for that |
| `pytest-django` | Makes the pytest testing framework work with Django |

---

## 4. Step 2 — Environment Variables (.env)

**File:** `/Users/yusuf/AI_ERP/core/.env.example`

**Never hardcode secrets in your code.** If your `SECRET_KEY` or database password is written directly in `settings.py` and you push to GitHub, attackers will find it. Environment variables solve this.

The `.env.example` file is a **template** — it shows all the variables the project needs, but with placeholder values. Each developer copies it to `.env` and fills in the real values. The real `.env` is listed in `.gitignore` so it's never committed to version control.

```bash
# How a developer sets up the project:
cp .env.example .env
# Then edit .env with their own DB password, secret key, etc.
```

### Key variables explained

```ini
# Django's secret key — used for signing cookies and CSRF tokens.
# MUST be long, random, and kept secret.
SECRET_KEY=your-very-secret-key-here-change-in-production

# When DEBUG=True, Django shows detailed error pages.
# When DEBUG=False (production), it shows a generic 500 page (so you don't leak code to attackers).
DEBUG=True

# Database connection details
DB_NAME=core_db
DB_USER=core_user
DB_PASSWORD=strongpassword
DB_HOST=localhost
DB_PORT=5432

# JWT token lifetimes
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60    # Access token expires in 1 hour
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7       # Refresh token lasts 7 days
```

---

## 5. Step 3 — The Config Package

**Directory:** `/Users/yusuf/AI_ERP/core/config/`

```
config/
├── __init__.py          ← Makes this a Python package
├── settings/
│   ├── __init__.py
│   ├── base.py          ← Shared settings (all environments)
│   ├── development.py   ← Development overrides
│   └── production.py    ← Production overrides
├── urls.py              ← Root URL configuration
├── wsgi.py              ← WSGI server entry point
├── asgi.py              ← ASGI server entry point (async support)
└── celery.py            ← Celery task queue configuration
```

### Why is it called `config/` and not `core/`?

When you run `django-admin startproject core`, Django creates a folder called `core/` with all the settings inside it. This is fine for small tutorials, but for a real project, naming the settings folder `config/` is **much clearer**. It immediately tells anyone reading the project: "this is configuration, not business logic."

### config/urls.py — The Root URL File

**File:** `/Users/yusuf/AI_ERP/core/config/urls.py`

This is the "traffic director" of your application. Every HTTP request that arrives at your server gets routed here first, then forwarded to the right app.

```python
API_V1 = 'api/v1/'

urlpatterns = [
    path('admin/', admin.site.urls),           # Django admin panel

    # API documentation (auto-generated!)
    path(f'{API_V1}schema/', SpectacularAPIView.as_view(), name='schema'),
    path(f'{API_V1}docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # App-level URL files
    path(f'{API_V1}auth/', include('apps.accounts.urls.auth_urls')),
    path(f'{API_V1}accounts/', include('apps.accounts.urls.account_urls')),
    path(f'{API_V1}inventory/', include('apps.inventory.urls')),
    path(f'{API_V1}sales/', include('apps.sales.urls')),
    path(f'{API_V1}hr/', include('apps.hr.urls')),
    path(f'{API_V1}finance/', include('apps.finance.urls')),
    path(f'{API_V1}audit/', include('apps.audit.urls')),
]
```

**Why `api/v1/` prefix?**

Versioning your API from day one is professional practice. When you make breaking changes later (v2), old clients using v1 still work. Never remove versioning — adding it later breaks all existing clients.

**Why two separate URL files for accounts (`auth_urls` and `account_urls`)?**

Authentication endpoints (login, logout, refresh token) are fundamentally different from account management endpoints (create user, list users). Separating them makes it clearer what each group of endpoints does, and allows different permission logic.

### config/celery.py

**File:** `/Users/yusuf/AI_ERP/core/config/celery.py`

```python
app = Celery('core')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
```

Celery is a background task runner. Imagine a user places an order — you don't want them to wait while the server sends a confirmation email (that could take 2 seconds). Instead:
1. The API instantly returns "Order created!"
2. A Celery task is queued: "send confirmation email for order #123"
3. A background worker picks up the task and sends the email

`autodiscover_tasks()` automatically finds any `tasks.py` file inside each installed app.

---

## 6. Step 4 — Modular Settings

### config/settings/base.py — The Foundation

**File:** `/Users/yusuf/AI_ERP/core/config/settings/base.py`

This file contains settings that are **the same in all environments** (development, production, testing).

#### Reading the .env file

```python
import environ

env = environ.Env()
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = env('SECRET_KEY')
DEBUG = env.bool('DEBUG', default=False)
```

`django-environ` reads the `.env` file and provides typed access — `env.bool()` converts the string `"True"` from the .env file into a Python `True` boolean. Without this, everything from a `.env` file is a string.

#### INSTALLED_APPS — Split into Three Groups

```python
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    # ... Django's own apps
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    # ... packages we installed from PyPI
]

LOCAL_APPS = [
    'apps.accounts',
    'apps.inventory',
    # ... our own apps
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS
```

**Why split into three lists?** When you read `INSTALLED_APPS` three months later, you immediately know which apps are Django built-ins, which are installed packages, and which are your own code. If you need to remove a package, you know exactly where to look.

**Why `apps.accounts` and not just `accounts`?**

Because our apps live inside the `apps/` subfolder. Django needs the full Python path to find them. If the `accounts` folder is at `apps/accounts/`, the import path is `apps.accounts`.

#### AUTH_USER_MODEL — The Most Important Setting

```python
AUTH_USER_MODEL = 'accounts.User'
```

This single line is **critical** and must be set before you run your first migration. It tells Django: "Don't use your built-in `auth.User` model — use our custom `User` model in the `accounts` app instead."

**Why customize the user model?**

Django's default user model uses `username` as the login field. We want to use `email`. The default model also has no `role` field or `tenant` relationship. Changing the user model AFTER running migrations is extremely difficult (requires wiping the database). Always set a custom user model at the very start of any project.

#### REST_FRAMEWORK Configuration

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'utils.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 25,
    'EXCEPTION_HANDLER': 'utils.exceptions.custom_exception_handler',
}
```

These are **global defaults** for all API endpoints. Without having to write it on every view:
- All endpoints require a valid JWT token by default (`IsAuthenticated`)
- All list endpoints return pages of 25 items
- All errors go through our custom exception handler for consistent formatting

Individual views can override these defaults when needed.

#### SIMPLE_JWT Configuration

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'TOKEN_OBTAIN_SERIALIZER': 'apps.accounts.serializers.CustomTokenObtainPairSerializer',
}
```

**How JWT works (simplified):**
1. User sends email + password to `/api/v1/auth/login/`
2. Server validates and returns two tokens:
   - **Access token** — short-lived (60 min), sent with every API request
   - **Refresh token** — long-lived (7 days), used only to get a new access token
3. For every API call, the client sends: `Authorization: Bearer <access_token>`
4. After 60 min, the access token expires. The client sends the refresh token to get a new access token.
5. **`ROTATE_REFRESH_TOKENS: True`** — every time you use the refresh token, you get a new one. This prevents an attacker who steals a refresh token from using it forever.
6. **`BLACKLIST_AFTER_ROTATION: True`** — the old refresh token is saved in the database and rejected if anyone tries to use it again.

### config/settings/development.py

**File:** `/Users/yusuf/AI_ERP/core/config/settings/development.py`

```python
from .base import *  # Import everything from base

DEBUG = True
ALLOWED_HOSTS = ['*']          # Accept requests from anywhere
CORS_ALLOW_ALL_ORIGINS = True  # Allow any frontend to call the API
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # Print emails to terminal
```

**`from .base import *`** — The dot before `base` means "relative import" — import from the `base.py` file in the same directory. This loads all the base settings, and then we override only what needs to change for development.

In development you **want** debug mode on (detailed error pages) and you **don't want** to set up a real email server.

### config/settings/production.py

**File:** `/Users/yusuf/AI_ERP/core/config/settings/production.py`

```python
from .base import *

DEBUG = False  # Never True in production

# Security headers — these tell browsers to be extra careful
SECURE_BROWSER_XSS_FILTER = True         # Enable browser's XSS protection
SECURE_HSTS_SECONDS = 31536000           # Force HTTPS for 1 year
SECURE_SSL_REDIRECT = True               # Redirect all HTTP to HTTPS
SESSION_COOKIE_SECURE = True             # Session cookie only sent over HTTPS
CSRF_COOKIE_SECURE = True                # CSRF cookie only sent over HTTPS
```

Each of these settings prevents a specific type of attack:
- **XSS (Cross-Site Scripting)** — attackers injecting scripts into your pages
- **HSTS** — forces browsers to always use HTTPS (never HTTP)
- **Secure cookies** — prevents cookies from being stolen over HTTP connections

---

## 7. Step 5 — manage.py

**File:** `/Users/yusuf/AI_ERP/core/manage.py`

```python
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
```

This is Django's command-line tool. You use it for everything:

```bash
python manage.py runserver       # Start development server
python manage.py makemigrations  # Create migration files from model changes
python manage.py migrate         # Apply migrations to the database
python manage.py createsuperuser # Create an admin user
python manage.py shell           # Open a Python shell with Django loaded
```

The `setdefault` means: "use development settings UNLESS the environment variable has already been set." In production (via Docker), the environment variable is set to `config.settings.production`, so `setdefault` has no effect.

---

## 8. Step 6 — The Utility Layer (utils/)

**Directory:** `/Users/yusuf/AI_ERP/core/utils/`

```
utils/
├── __init__.py
├── models.py       ← Reusable abstract base models
├── pagination.py   ← Custom pagination response format
├── exceptions.py   ← Custom error response format
├── middleware.py   ← Tenant detection middleware
└── permissions.py  ← Role-based access permission classes
```

The `utils/` package is created before any app because the apps **depend on it**. Every model in every app inherits from `utils/models.py`.

### utils/models.py — The Base Model Hierarchy

**File:** `/Users/yusuf/AI_ERP/core/utils/models.py`

This is one of the most important design decisions in the project. We create a **layered inheritance chain**:

```
TimeStampedModel
    ↓
AuditableModel
    ↓
TenantModel
    ↓
BaseModel  ← Used by most models
```

```python
class TimeStampedModel(models.Model):
    """Automatically tracks when records were created and updated."""
    created_at = models.DateTimeField(auto_now_add=True)  # Set once, on creation
    updated_at = models.DateTimeField(auto_now=True)       # Updated every time the record is saved

    class Meta:
        abstract = True   # ← KEY: This is NOT a database table. It's a blueprint.
```

**`abstract = True`** means Django will NOT create a `timestampedmodel` table. Instead, when another model inherits from `TimeStampedModel`, those fields get **copied into** that model's table. Every table that inherits it gets `created_at` and `updated_at` columns automatically.

```python
class AuditableModel(TimeStampedModel):
    """Tracks WHO created and updated each record."""
    created_by = models.ForeignKey(
        'accounts.User',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='%(app_label)s_%(class)s_created',  # ← Automatic unique related name
    )
    # ...
    class Meta:
        abstract = True
```

**`related_name='%(app_label)s_%(class)s_created'`** — When multiple models inherit from `AuditableModel`, they all have a ForeignKey to `User`. Without unique `related_name` values, Django would throw an error because two foreign keys from different models would have the same reverse accessor. The `%(app_label)s_%(class)s` template auto-generates unique names based on the app and model name.

```python
class TenantModel(AuditableModel):
    """Links the record to a specific Tenant (for multi-tenancy)."""
    tenant = models.ForeignKey(
        'accounts.Tenant',
        on_delete=models.CASCADE,
        related_name='%(app_label)s_%(class)s_set',
        null=True, blank=True,
    )
    class Meta:
        abstract = True


class BaseModel(UUIDModel, TenantModel):
    """
    The "everything" base model. Inherits:
    - UUID primary key (from UUIDModel)
    - Tenant isolation (from TenantModel)
    - Audit fields (from AuditableModel via TenantModel)
    - Timestamps (from TimeStampedModel via the chain)
    """
    class Meta:
        abstract = True
```

Now when we write in `apps/inventory/models.py`:

```python
class Product(BaseModel):
    name = models.CharField(max_length=255)
    # ...
```

The actual database table `inventory_products` will have ALL of these columns:
- `id` (UUID, primary key)
- `tenant_id` (ForeignKey to tenants)
- `created_by_id` (ForeignKey to users)
- `updated_by_id` (ForeignKey to users)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- Plus `name` and all the product-specific fields

**This is the power of abstract model inheritance** — you write audit/tenant fields once and every model gets them for free.

### utils/pagination.py

**File:** `/Users/yusuf/AI_ERP/core/utils/pagination.py`

```python
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 25
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,        # Total records
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'next': self.get_next_link(),              # URL of next page
            'previous': self.get_previous_link(),
            'results': data,                           # The actual records
        })
```

DRF's default pagination response only has `count`, `next`, `previous`, and `results`. We add `total_pages` and `current_page` because frontends almost always need to render page number buttons (1, 2, 3...) and without `total_pages` you'd have to calculate it yourself.

### utils/exceptions.py

**File:** `/Users/yusuf/AI_ERP/core/utils/exceptions.py`

Without this, DRF returns errors in inconsistent formats:
- Validation error: `{"email": ["This field is required."]}`
- Auth error: `{"detail": "Authentication credentials were not provided."}`
- Not found: `{"detail": "Not found."}`

With our custom handler, ALL errors follow the same envelope:

```python
{
    "success": false,
    "status_code": 400,
    "error": "BAD_REQUEST",
    "message": "Email is required.",
    "details": { "email": ["This field is required."] }
}
```

The frontend can always check `response.data.success` and display `response.data.message` to the user. No special-casing needed.

### utils/permissions.py

**File:** `/Users/yusuf/AI_ERP/core/utils/permissions.py`

```python
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.Roles.ADMIN
        )

class IsManager(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in (User.Roles.ADMIN, User.Roles.MANAGER)
        )
```

**Why not just use Django's `is_staff` flag?** Django's `is_staff` is a simple boolean (True/False). We have three distinct roles with different privilege levels. Using a `role` field on the User model is far more expressive and extensible — you can later add a `VIEWER` role without any structural changes.

**Why is `IsManager` also accessible to Admins?** An Admin is always at least a Manager. Making Admins re-pass Manager checks separately would be confusing. `IsManager` = Admin OR Manager.

### utils/middleware.py — Tenant Middleware

**File:** `/Users/yusuf/AI_ERP/core/utils/middleware.py`

```python
class TenantMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.tenant = None
        tenant_id = request.headers.get('X-Tenant-ID')

        if tenant_id:
            request.tenant = Tenant.objects.get(id=tenant_id, is_active=True)
        elif hasattr(request, 'user') and request.user.is_authenticated:
            request.tenant = getattr(request.user, 'tenant', None)
```

**How multi-tenancy works here:**

Imagine two companies use this ERP: Company A and Company B. Both have their own users, products, and orders — but they share the same Django application and the same database.

The middleware runs on **every single request** before it reaches any view. It figures out which tenant this request belongs to by:
1. Checking if the request has an `X-Tenant-ID` header (explicit tenant specification)
2. Falling back to the logged-in user's assigned tenant

Then in every ViewSet, we filter the queryset:

```python
def get_queryset(self):
    qs = super().get_queryset()
    tenant = getattr(self.request, 'tenant', None)
    if tenant:
        qs = qs.filter(tenant=tenant)   # Company A never sees Company B's data
    return qs
```

**Why lazy import inside the method?**

```python
try:
    from apps.accounts.models import Tenant
except ImportError:
    return
```

The middleware is in `utils/` and `accounts/` is in `apps/`. If we put the import at the top of the file, Python would try to import `Tenant` before Django is fully set up — causing a circular import error. Using a lazy import (inside the function, not at the top of the file) defers it until Django is ready.

---

## 9. Step 7 — The Accounts App (Custom User Model)

**Directory:** `/Users/yusuf/AI_ERP/core/apps/accounts/`

```
accounts/
├── __init__.py
├── apps.py           ← Django app configuration class
├── models.py         ← User and Tenant models
├── managers.py       ← Custom UserManager
├── serializers.py    ← Convert User to/from JSON + JWT customization
├── views.py          ← API views for auth and user management
├── admin.py          ← Django admin configuration
└── urls/
    ├── __init__.py
    ├── auth_urls.py      ← Login, logout, token, me
    └── account_urls.py   ← User CRUD, tenant CRUD
```

### apps/accounts/models.py

**File:** `/Users/yusuf/AI_ERP/core/apps/accounts/models.py`

#### The Tenant Model

```python
class Tenant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)
```

**Why UUID primary key instead of auto-incrementing integers?**

With integers, the IDs of your tenants are 1, 2, 3, 4... A user could easily guess that there are 4 tenants and try `/api/v1/accounts/tenants/3/` to access another company's data. UUIDs like `550e8400-e29b-41d4-a716-446655440000` are impossibly hard to guess — 2^122 possible values.

**Why a `slug` field?**

A slug is a URL-friendly version of the name: `"Acme Corporation"` → `"acme-corporation"`. Slugs are used in URLs and are human-readable, unlike UUIDs.

#### The Custom User Model

```python
class User(AbstractBaseUser, PermissionsMixin):
    class Roles(models.TextChoices):
        ADMIN = 'admin', _('Admin')
        MANAGER = 'manager', _('Manager')
        STAFF = 'staff', _('Staff')
```

**`AbstractBaseUser`** — Django's base class for custom user models. It handles password hashing and authentication, but leaves `username`, `email`, and all other fields up to you.

**`PermissionsMixin`** — Adds `is_superuser`, `groups`, and `user_permissions` to the model. Without this, Django's built-in `permission` system (used by the admin panel) won't work.

**`models.TextChoices`** — A clean way to define a set of allowed string values. Instead of writing `role = "admin"` (a raw string that could be misspelled), you write `role = User.Roles.ADMIN`. If you misspell `ADMIN`, Python gives you an error immediately.

```python
    USERNAME_FIELD = 'email'           # Use email as the login identifier
    REQUIRED_FIELDS = ['first_name', 'last_name']  # Required when creating via createsuperuser
```

### apps/accounts/managers.py

**File:** `/Users/yusuf/AI_ERP/core/apps/accounts/managers.py`

Django's `AbstractBaseUser` requires you to provide a custom manager that knows how to create users.

```python
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The email address must be set.')
        email = self.normalize_email(email)  # Lowercase the domain part: User@GMAIL.COM → User@gmail.com
        user = self.model(email=email, **extra_fields)
        user.set_password(password)          # Hashes the password — never stores it in plain text
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)
```

`set_password()` is crucial — **passwords are NEVER stored in plain text**. Django hashes them using PBKDF2 with SHA256 by default. Even if an attacker gets your database dump, they can't read the passwords.

### apps/accounts/serializers.py

**File:** `/Users/yusuf/AI_ERP/core/apps/accounts/serializers.py`

Serializers serve two purposes:
1. **Outbound (model → JSON):** Convert a User Python object to a dictionary/JSON for the API response.
2. **Inbound (JSON → model):** Validate incoming JSON data and create/update model instances.

#### Why multiple serializers for User?

```python
class UserSerializer(...)       # READ — show user profile info
class UserCreateSerializer(...) # WRITE — create new user (with password fields)
class UserUpdateSerializer(...) # PARTIAL UPDATE — only name, phone, avatar (not email, not role)
```

You need different views of the same model data depending on the operation:
- When listing users, you don't include passwords.
- When creating a user, you need `password` + `password_confirm`, but you don't include them when reading.
- When a user updates their own profile, they should NOT be able to change their own role (that's an admin operation).

#### The Custom JWT Serializer

```python
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims to the JWT payload
        token['email'] = user.email
        token['role'] = user.role
        token['tenant_id'] = str(user.tenant.id) if user.tenant else None
        return token
```

A JWT is a three-part base64-encoded string: `header.payload.signature`. The `payload` part contains "claims" — any data you want to embed. By default, simplejwt only puts `user_id` in the payload.

We add `role` and `tenant_id` because then the **frontend can read the user's role directly from the token** without making an extra API call after login. The token is `user_id=5, role=admin, tenant_id=<uuid>` — enough to make UI decisions (show admin menu? yes/no).

### apps/accounts/views.py

**File:** `/Users/yusuf/AI_ERP/core/apps/accounts/views.py`

#### LogoutView — Blacklisting Tokens

```python
class LogoutView(APIView):
    def post(self, request):
        refresh_token = request.data['refresh']
        token = RefreshToken(refresh_token)
        token.blacklist()   # Save to DB — this token is now invalid forever
```

JWT tokens are **stateless** — the server doesn't normally store them. Once issued, they're valid until they expire. This means a "logout" in pure JWT is meaningless (the token still works). The blacklist feature saves used/revoked tokens to the database so they can be rejected. This requires `rest_framework_simplejwt.token_blacklist` in `INSTALLED_APPS`.

#### UserViewSet — Role-Scoped Access

```python
class UserViewSet(ModelViewSet):
    def get_permissions(self):
        if self.action in ('list', 'create'):
            return [IsManager()]   # Manager can see and create users
        return [IsAdmin()]         # Only Admin can edit/delete users
```

`get_permissions()` is called on every request. By overriding it, we can apply **different permissions to different HTTP methods** on the same ViewSet — DRF's `permission_classes` attribute only supports one set for all actions.

### apps/accounts/urls/ — Split Auth from Account URLs

**File:** `/Users/yusuf/AI_ERP/core/apps/accounts/urls/auth_urls.py`

```python
urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('me/', MeView.as_view()),
    path('me/change-password/', ChangePasswordView.as_view()),
]
```

**File:** `/Users/yusuf/AI_ERP/core/apps/accounts/urls/account_urls.py`

```python
router = DefaultRouter()
router.register('users', UserViewSet, basename='user')
router.register('tenants', TenantViewSet, basename='tenant')
```

`DefaultRouter` automatically creates these URL patterns from `UserViewSet`:
- `GET /users/` → list all users
- `POST /users/` → create user
- `GET /users/{id}/` → get user
- `PATCH /users/{id}/` → update user
- `DELETE /users/{id}/` → delete user
- `POST /users/{id}/activate/` → custom action
- `POST /users/{id}/deactivate/` → custom action

This is the power of DRF ViewSets — one class, seven URL patterns, all standard REST conventions followed automatically.

---

## 10. Step 8 — The Inventory App

**Directory:** `/Users/yusuf/AI_ERP/core/apps/inventory/`

```
inventory/
├── __init__.py
├── apps.py
├── models.py       ← Category, Unit, Product, Warehouse, Stock, StockMovement
├── serializers.py
├── views.py
└── urls.py
```

### apps/inventory/models.py

**File:** `/Users/yusuf/AI_ERP/core/apps/inventory/models.py`

#### Category — Self-Referential Foreign Key

```python
class Category(BaseModel):
    name = models.CharField(max_length=255)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children')
```

`ForeignKey('self', ...)` creates a tree structure:
```
Electronics (parent=None)
  ├── Phones (parent=Electronics)
  │     └── Smartphones (parent=Phones)
  └── Laptops (parent=Electronics)
```

`null=True` on parent means top-level categories have no parent (they are root nodes). `on_delete=models.SET_NULL` means if you delete "Electronics", its children don't get deleted — their `parent` just becomes `NULL`, making them also top-level.

#### Product — Pricing Fields as Decimal

```python
cost_price = models.DecimalField(max_digits=14, decimal_places=2, default=0)
selling_price = models.DecimalField(max_digits=14, decimal_places=2, default=0)
```

Always use `DecimalField` for money, **never `FloatField`**. Floats have precision errors: `0.1 + 0.2 = 0.30000000000000004` in Python. For prices, every cent matters.

#### Stock vs StockMovement — Two Separate Tables

```python
class Stock(BaseModel):
    """CURRENT quantity of a product in a warehouse (the live balance)."""
    product = ...
    warehouse = ...
    quantity = models.DecimalField(...)
    
    class Meta:
        unique_together = ['product', 'warehouse']  # One row per product+warehouse combo

class StockMovement(BaseModel):
    """HISTORY of every change to stock (the audit trail)."""
    movement_type = models.CharField(choices=MovementType.choices)  # IN, OUT, TRANSFER, ADJUSTMENT
    quantity = ...
    reference = ...  # e.g., "Order #1234" or "Supplier Invoice #567"
```

This is a classic **ledger pattern**:
- `Stock` tells you the current answer: "How many units of Product X are in Warehouse Y right now?"
- `StockMovement` tells you the history: "How did we get to that number?"

You never delete or update movement records — they are immutable history. When stock changes, you INSERT a new movement record AND UPDATE the Stock balance.

---

## 11. Step 9 — The Sales App

**Directory:** `/Users/yusuf/AI_ERP/core/apps/sales/`

### apps/sales/models.py

**File:** `/Users/yusuf/AI_ERP/core/apps/sales/models.py`

#### SalesOrder State Machine

```python
class Status(models.TextChoices):
    DRAFT = 'draft'           # Just started, can still be edited
    CONFIRMED = 'confirmed'   # Customer confirmed, locked for editing
    PROCESSING = 'processing' # Being prepared
    SHIPPED = 'shipped'       # On the way
    DELIVERED = 'delivered'   # Done
    CANCELLED = 'cancelled'   # Never mind
```

An order should move through states in sequence. You can't deliver an order that hasn't been shipped. In `views.py`, we enforce this:

```python
@action(detail=True, methods=['post'])
def confirm(self, request, pk=None):
    order = self.get_object()
    if order.status != SalesOrder.Status.DRAFT:
        return Response({'error': 'Only draft orders can be confirmed.'}, status=400)
    order.status = SalesOrder.Status.CONFIRMED
    order.save()
```

This is a **guard** — it prevents invalid state transitions.

#### Computed Properties for Order Total

```python
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
```

`@property` means `order.total` is accessed like an attribute, not a method (`order.total` not `order.total()`). The calculation is **not stored in the database** — it's computed on demand from the line items. This ensures the total is always accurate and never out of sync.

#### Why `on_delete=models.PROTECT` on SalesOrderItem?

```python
product = models.ForeignKey(Product, on_delete=models.PROTECT)
```

`PROTECT` means: "If someone tries to delete this Product, raise an error if there are any OrderItems referencing it." You should not be able to delete a product that has been sold. This is **referential integrity** at the database level.

---

## 12. Step 10 — The HR App

**Directory:** `/Users/yusuf/AI_ERP/core/apps/hr/`

### apps/hr/models.py

**File:** `/Users/yusuf/AI_ERP/core/apps/hr/models.py`

#### Employee Linked to User — Optional

```python
class Employee(BaseModel):
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employee'
    )
    employee_id = models.CharField(max_length=20, unique=True)
```

An `Employee` can exist without a `User` account (e.g., a part-time worker who doesn't log into the system). When they do have a user account, `OneToOneField` ensures one employee = one user (not many employees sharing an account).

`related_name='employee'` means from a user object, you can access their employee profile as `user.employee`.

#### Department Manager — Circular Reference

```python
class Department(BaseModel):
    manager = models.ForeignKey(
        'Employee',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='managed_departments'
    )
```

Notice the forward reference `'Employee'` (in quotes) instead of `Employee` (the class). This is a **lazy reference** — it resolves the class name after all models are loaded. Without quotes, Python would fail because `Employee` is defined after `Department` in the file.

---

## 13. Step 11 — The Finance App

**Directory:** `/Users/yusuf/AI_ERP/core/apps/finance/`

### apps/finance/models.py

**File:** `/Users/yusuf/AI_ERP/core/apps/finance/models.py`

#### Chart of Accounts — Hierarchical

```python
class Account(BaseModel):
    class AccountType(models.TextChoices):
        ASSET = 'asset'
        LIABILITY = 'liability'
        EQUITY = 'equity'
        REVENUE = 'revenue'
        EXPENSE = 'expense'
    
    code = models.CharField(max_length=20, unique=True)  # e.g., "1000", "2100"
    parent = models.ForeignKey('self', null=True, blank=True, ...)
```

In accounting, accounts are organized into a hierarchy:
```
1000  Assets
  1100  Cash
  1200  Accounts Receivable
2000  Liabilities
  2100  Accounts Payable
```

This is the same self-referential pattern as `Category`.

#### Transaction — Immutable Records

In `views.py`:
```python
class TransactionViewSet(ModelViewSet):
    http_method_names = ['get', 'post', 'head', 'options']  # No PUT, PATCH, DELETE
```

Financial transactions are **immutable** — you never edit or delete a transaction record. This is an accounting principle. If you made an error, you post a **correcting entry** (a new transaction that reverses the error), not edit the old one. This preserves the full audit trail of every financial event.

---

## 14. Step 12 — The Audit App

**Directory:** `/Users/yusuf/AI_ERP/core/apps/audit/`

This app is special — its purpose is to record what happens to all the other apps.

### apps/audit/models.py

**File:** `/Users/yusuf/AI_ERP/core/apps/audit/models.py`

```python
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class AuditLog(UUIDModel, TimeStampedModel):
    user = models.ForeignKey('accounts.User', ...)
    action = models.CharField(choices=Action.choices)   # create/update/delete/login...
    content_type = models.ForeignKey(ContentType, ...)  # Which MODEL was affected?
    object_id = models.CharField(max_length=255)         # Which specific RECORD was affected?
    content_object = GenericForeignKey('content_type', 'object_id')
    changes = models.JSONField(default=dict)             # What fields changed?
    ip_address = models.GenericIPAddressField()
```

**`GenericForeignKey`** allows one model to have a foreign key to ANY other model — without knowing in advance which model it will reference. Django's `ContentType` framework tracks every model in the application as a row in the `django_content_type` table.

Without GenericForeignKey, you'd need:
```python
# Anti-pattern — a FK for every possible model:
product = models.ForeignKey(Product, null=True)
employee = models.ForeignKey(Employee, null=True)
order = models.ForeignKey(SalesOrder, null=True)
# ... dozens of fields, 99% always NULL
```

With GenericForeignKey:
```python
# Clean — one FK that works for any model:
content_type = models.ForeignKey(ContentType)  # "This log is about a Product"
object_id = "uuid-of-the-product"              # "This specific product"
```

**Database Indexes for Performance:**

```python
class Meta:
    indexes = [
        models.Index(fields=['user', '-created_at']),           # "Show all actions by user X"
        models.Index(fields=['content_type', 'object_id']),     # "Show all changes to product Y"
        models.Index(fields=['action', '-created_at']),         # "Show all deletes today"
    ]
```

Indexes are like a book's index — instead of reading every page to find "Django", you jump directly to the relevant pages. Without indexes, queries over millions of audit log rows would be extremely slow.

### apps/audit/middleware.py

**File:** `/Users/yusuf/AI_ERP/core/apps/audit/middleware.py`

```python
class AuditLogMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        if request.method not in {'POST', 'PUT', 'PATCH', 'DELETE'}:
            return response   # Only log mutating operations
        # ...
        AuditLog.objects.create(
            user=request.user,
            action=action_map[request.method],
            object_repr=request.path,
            changes=dict(request.data),
            ip_address=_get_ip(request),
        )
        return response
```

This middleware runs **after** every request completes. For any mutating request (not GET), it automatically creates an audit log entry. This means every create, update, or delete that goes through the API is recorded — **without any view needing to know about it**. This is called a **cross-cutting concern** — it applies everywhere, but lives in one place.

### apps/audit/admin.py

```python
@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False     # Nobody can add audit logs via admin

    def has_change_permission(self, request, obj=None):
        return False     # Nobody can edit audit logs

    def has_delete_permission(self, request, obj=None):
        return False     # Nobody can delete audit logs
```

Audit logs must be **immutable** — even from the admin panel. If an administrator could delete audit logs, the audit trail becomes meaningless. These three methods returning `False` completely lock down the data.

---

## 15. Step 13 — Docker and docker-compose

### Dockerfile

**File:** `/Users/yusuf/AI_ERP/core/Dockerfile`

```dockerfile
FROM python:3.12-slim         # Start from a minimal Python image (~150MB vs ~900MB for full Python)

ENV PYTHONDONTWRITEBYTECODE=1  # Don't create .pyc files (not needed in containers)
ENV PYTHONUNBUFFERED=1         # Print logs immediately (don't buffer them)

RUN apt-get install -y libpq-dev gcc  # System libraries needed to build psycopg2

COPY requirements.txt ./
RUN pip install -r requirements.txt   # Install before copying code (Docker cache optimization)

COPY . .                              # Copy all project files

RUN addgroup --system appgroup && adduser --system appuser  # Non-root user
USER appuser                          # Run as non-root for security

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
```

**Why copy `requirements.txt` before project files?**

Docker builds images in layers. If we copy everything first and then install, any code change (even a one-letter fix) invalidates the cache layer that installed all packages, forcing a fresh pip install every time. By copying `requirements.txt` first, the package installation layer is only re-run when requirements actually change.

**Why 4 gunicorn workers?**

Gunicorn spawns multiple worker processes to handle concurrent requests. A common formula is `(2 × CPU cores) + 1`. For a 2-core server: 5 workers. For Docker Desktop (usually 2 CPUs), 4 workers is fine.

### docker-compose.yml

**File:** `/Users/yusuf/AI_ERP/core/docker-compose.yml`

```yaml
services:
  db:                              # PostgreSQL service
    image: postgres:16-alpine      # Alpine = tiny container image
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]  # Wait until DB is ready

  redis:                           # Redis service (Celery broker)
    image: redis:7-alpine

  web:                             # Django application
    depends_on:
      db:
        condition: service_healthy # Wait for DB healthcheck to pass before starting
    command: >
      sh -c "python manage.py migrate &&   # Run migrations on startup
             gunicorn config.wsgi:application ..."

  celery:                          # Background worker
    command: celery -A config.celery worker

  celery-beat:                     # Scheduled tasks
    command: celery -A config.celery beat
```

**Why `healthcheck` + `depends_on` with `condition: service_healthy`?**

Docker starts containers roughly "at the same time". Without health checks, the Django container starts and immediately tries to connect to PostgreSQL — but PostgreSQL might not be ready yet. The healthcheck makes Docker wait until PostgreSQL is actually accepting connections before starting Django.

**Why a `celery-beat` service?**

`celery` (the worker) executes tasks when they're added to the queue. But who adds the tasks for scheduled jobs (e.g., "send monthly report every 1st of the month")? That's `celery-beat` — it's a scheduler that reads the schedule from the database and adds tasks to the queue at the right time.

---

## 16. How Everything Connects

Here's the full request lifecycle for a typical API call:

### Example: `PATCH /api/v1/hr/employees/abc-123/`

1. **Request arrives** at gunicorn → forwarded to Django's WSGI handler (`config/wsgi.py`)

2. **Middleware chain runs** (in order from `MIDDLEWARE` in `base.py`):
   - `SecurityMiddleware` — enforces HTTPS, sets security headers
   - `WhiteNoiseMiddleware` — intercepts requests for static files
   - `CorsMiddleware` — adds CORS headers to allow browser requests
   - `AuthenticationMiddleware` — reads the `Authorization: Bearer <token>` header, validates the JWT, attaches the user to `request.user`
   - `AuditLogMiddleware` — will run on the way OUT (in `process_response`)
   - `TenantMiddleware` — reads `X-Tenant-ID`, attaches tenant to `request.tenant`

3. **URL routing** — `config/urls.py` matches `/api/v1/hr/employees/abc-123/` → forwards to `apps/hr/urls.py` → `EmployeeViewSet`

4. **Permission check** — `get_permissions()` returns `[IsAuthenticated]`. DRF checks: is `request.user` authenticated? If not → 401 Unauthorized.

5. **ViewSet dispatch** — `PATCH` method → `partial_update` action → `get_queryset()` filters employees by `request.tenant`, then fetches employee `abc-123`. If not found → 404.

6. **Serializer validation** — `EmployeeSerializer` validates the incoming JSON. If invalid → 400 with error details.

7. **Save** — `serializer.save()` updates the database record.

8. **Response** — serialized employee data returned with 200 OK.

9. **`AuditLogMiddleware.process_response`** — sees `PATCH` method, creates `AuditLog(user=request.user, action='update', object_repr='/api/v1/hr/employees/abc-123/', ...)`.

The user never sees steps 1-9 — they just get a JSON response in milliseconds.

---

## 17. What to Do Next (Running the Project)

### Step A: Copy and Edit the .env File

```bash
cd /Users/yusuf/AI_ERP/core
cp .env.example .env
```

Open `.env` and change:
- `SECRET_KEY` — generate one with: `python -c "import secrets; print(secrets.token_urlsafe(50))"`
- `DB_PASSWORD` — any strong password you choose

### Step B: Start with Docker

```bash
docker-compose up --build
```

This will:
1. Build the Docker image
2. Start PostgreSQL and Redis
3. Wait for PostgreSQL health check
4. Run `python manage.py migrate` (create all database tables)
5. Start gunicorn

### Step C: Create a Superuser

In a new terminal:

```bash
docker-compose exec web python manage.py createsuperuser
```

Enter email, first name, last name, and password.

### Step D: Create Migrations First

Since we wrote custom models, you need to generate migration files before migrating:

```bash
docker-compose exec web python manage.py makemigrations accounts
docker-compose exec web python manage.py makemigrations inventory
docker-compose exec web python manage.py makemigrations sales
docker-compose exec web python manage.py makemigrations hr
docker-compose exec web python manage.py makemigrations finance
docker-compose exec web python manage.py makemigrations audit
docker-compose exec web python manage.py migrate
```

### Step E: Test the API

Visit:
- **Swagger Docs:** http://localhost:8000/api/v1/docs/
- **Django Admin:** http://localhost:8000/admin/

Test login via Swagger:
```json
POST /api/v1/auth/login/
{
    "email": "admin@example.com",
    "password": "yourpassword"
}
```

You'll get back:
```json
{
    "access": "eyJ0eXAiOiJKV1Q...",
    "refresh": "eyJ0eXAiOiJKV1Q...",
    "user": {
        "id": "uuid",
        "email": "admin@example.com",
        "role": "admin",
        ...
    }
}
```

Use the `access` token in the Swagger "Authorize" button: `Bearer eyJ0eXAiOiJKV1Q...`

---

## Summary: The Mental Map

```
.env ─────────────────────────────────────────┐
                                              │
config/settings/base.py ← reads it           │
        │                                    │
        ├── INSTALLED_APPS (all 6 apps)      │
        ├── AUTH_USER_MODEL = accounts.User  │
        ├── REST_FRAMEWORK config            │
        ├── SIMPLE_JWT config                │
        └── MIDDLEWARE (order matters!)      │
                                             │
config/urls.py ── routes requests to ──> apps/
                                             │
apps/accounts/  ← Users, Tenants, JWT        │
apps/inventory/ ← Products, Stock            │
apps/sales/     ← Orders, Invoices           │
apps/hr/        ← Employees, Leave           │
apps/finance/   ← Accounts, Transactions     │
apps/audit/     ← AuditLog (reads all)       │
                                             │
utils/models.py ← BaseModel ← used by ALL apps
utils/permissions.py ← IsAdmin, IsManager
utils/exceptions.py ← Consistent errors
utils/middleware.py ← Tenant per request
```

Every request flows:

```
HTTP Request
    → Middleware chain (security, auth, tenant)
    → URL Router
    → ViewSet (permission check → queryset filter → serializer → save)
    → AuditLog created
    → JSON Response
```

---

*End of Tutorial 1. You now have a complete understanding of why every file and every decision in this project exists.*
