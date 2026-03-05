# Core ERP — Production-Ready Django REST API

A **scalable, enterprise-grade** Django REST API for an ERP system, built with best practices for multi-tenancy, JWT authentication, modular app structure, and Docker deployments.

---

## 📐 Project Structure

```
core/
├── config/                     # Django project config
│   ├── settings/
│   │   ├── base.py             # Shared settings
│   │   ├── development.py      # Dev overrides
│   │   └── production.py       # Production hardening
│   ├── urls.py                 # Root URL configuration
│   ├── wsgi.py
│   ├── asgi.py
│   └── celery.py               # Celery app
│
├── apps/                       # Modular Django apps
│   ├── accounts/               # Users, Roles, Tenants, JWT
│   ├── inventory/              # Products, Stock, Warehouses
│   ├── sales/                  # Orders, Customers, Invoices
│   ├── hr/                     # Employees, Departments, Leave
│   ├── finance/                # Accounts, Transactions, Budgets
│   └── audit/                  # Immutable audit trail
│
├── utils/                      # Shared utilities
│   ├── models.py               # Base abstract models
│   ├── pagination.py           # Custom paginators
│   ├── exceptions.py           # Consistent error responses
│   ├── middleware.py           # Tenant middleware
│   └── permissions.py          # Role-based permission classes
│
├── manage.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── pytest.ini
└── .env.example
```

---

## 🚀 Quick Start

### 1. Clone & setup environment

```bash
cd core
cp .env.example .env
# Edit .env with your credentials
```

### 2. Run with Docker (recommended)

```bash
docker-compose up --build
```

This starts:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **Django** on port 8000
- **Celery Worker** & **Celery Beat**

### 3. Run without Docker

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create database tables
python manage.py migrate

# Create a superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

---

## 🔐 Authentication

Uses **JWT (JSON Web Tokens)** via `djangorestframework-simplejwt`.

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/auth/login/` | POST | Login — returns `access` + `refresh` |
| `/api/v1/auth/token/refresh/` | POST | Refresh access token |
| `/api/v1/auth/logout/` | POST | Blacklist refresh token |
| `/api/v1/auth/me/` | GET/PATCH | Current user profile |
| `/api/v1/auth/me/change-password/` | POST | Change password |

**Authorization Header:**
```
Authorization: Bearer <access_token>
```

The JWT payload includes `email`, `role`, and `tenant_id`.

---

## 👥 User Roles

| Role | Level | Permissions |
|---|---|---|
| `admin` | Full access | All operations, user management, audit logs |
| `manager` | Elevated | Approve workflows, manage staff data |
| `staff` | Basic | View data, submit requests |

---

## 🏢 Multi-Tenancy

Each `User` belongs to a `Tenant`. API requests are scoped to the tenant:
1. Via **`X-Tenant-ID`** header (explicit)
2. Fallback to the authenticated **user's tenant**

---

## 📦 API Endpoints

| App | Base URL |
|---|---|
| Accounts | `/api/v1/accounts/users/` |
| Tenants | `/api/v1/accounts/tenants/` |
| Inventory | `/api/v1/inventory/products/` |
| Sales | `/api/v1/sales/orders/` |
| HR | `/api/v1/hr/employees/` |
| Finance | `/api/v1/finance/transactions/` |
| Audit | `/api/v1/audit/logs/` |

**Interactive Docs (Swagger):** [http://localhost:8000/api/v1/docs/](http://localhost:8000/api/v1/docs/)
**ReDoc:** [http://localhost:8000/api/v1/redoc/](http://localhost:8000/api/v1/redoc/)

---

## 🧪 Testing

```bash
# Run all tests
pytest

# With coverage
pytest --cov=apps --cov-report=html
```

---

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f web

# Run migrations
docker-compose exec web python manage.py migrate

# Create superuser
docker-compose exec web python manage.py createsuperuser

# Shell
docker-compose exec web python manage.py shell

# Stop
docker-compose down
```

---

## ⚙️ Key Dependencies

| Package | Purpose |
|---|---|
| `Django 5.0` | Web framework |
| `djangorestframework` | REST API |
| `simplejwt` | JWT authentication |
| `psycopg2-binary` | PostgreSQL adapter |
| `django-environ` | `.env` configuration |
| `django-filter` | Query filtering |
| `drf-spectacular` | OpenAPI / Swagger docs |
| `celery + redis` | Async task queue |
| `gunicorn` | Production WSGI server |
| `whitenoise` | Static file serving |

---

## 🏗️ Environment Variables

See [`.env.example`](.env.example) for the full reference.

Critical variables:
- `SECRET_KEY` — Django secret key (change in production!)
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`
- `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` (default: 60)
- `DJANGO_SETTINGS_MODULE` — Switch between `development` / `production`
