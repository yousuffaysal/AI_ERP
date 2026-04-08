# Tutorial 7: Cloud Databases and Access Control Troubleshooting

In our previous tutorials, we built a complex AI ERP application spanning multiple microservices. In this tutorial, we focus on moving our backend closer to production by transitioning our database infrastructure to the cloud and squashing complex multi-tenancy access bugs.

---

## Part 1: Migrating to Neon PostgreSQL (Serverless DB)

For initial development, we relied heavily on standard `db.sqlite3`. While SQLite is fantastic for local rapid prototyping, it does not handle high-concurrency background AI workers well, nor does it support advanced indexing techniques necessary for an ERP. 

We migrated our primary backend to **Neon Serverless PostgreSQL**.

### 12-Factor App Configuration (`django-environ`)
Previously, our `.env` configuration for the database required specifying `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PORT`, and `DB_HOST` separately. This format is rigid.

We refactored `backend/config/settings/base.py` and our `.env` file to utilize a single URL-based connection string parsed by `django-environ`:
```env
DATABASE_URL=postgres://user:password@hostname/dbname?sslmode=require
```
```python
DATABASES = {
    'default': env.db('DATABASE_URL', default='sqlite:///db.sqlite3')
}
```
This is fully 12-Factor App compliant. If we want to dynamically spin up new environments (like a testing branch), we only need to inject a single environment variable, vastly simplifying deployment pipelines.

---

## Part 2: Troubleshooting Multi-Tenancy (The 403 Forbidden Bug)

Upon migrating our data to the fresh Neon Postgres instance, we programmatically created an Admin user and attempted to load our Next.js frontend dashboard. 

Instantly, the dashboard crashed with red `AxiosError: Request failed with status code 403` overlays blocking `/inventory/products/` and `/sales/invoices/`.

### The Root Cause
A `403 Forbidden` response indicates the user's authentication token is perfectly valid, but the user does not have permission to view the resource. 

Our ERP enforces **Multi-Tenant Isolation**. In `backend/utils/middleware.py` and `CompanyQuerysetMixin`, every REST endpoint implicitly checks:
1. Does the current HTTP request have an associated `Company`?
2. If `request.company` resolves to `None`, block the network request immediately to strictly ensure cross-tenant data leakage never happens.

Because our new Admin user was created manually via a database shell script (instead of through a frontend "Create Company" onboarding flow), the `company` Foreign Key on the `User` model was `None`. The backend operated perfectly by kicking the user out.

### The Fix
To patch this, we opened the Django python shell connected to Neon and established a default workspace:
```python
from apps.accounts.models import Company
from django.contrib.auth import get_user_model

# 1. Create the base entity
company, _ = Company.objects.get_or_create(name='Main Company', defaults={'slug': 'main-company'})

# 2. Assign the disconnected user
admin_user = get_user_model().objects.get(email='yusuf_h@fmail.com')
admin_user.company = company
admin_user.save()
```
When the user refreshed the Next.js application, the `Dashboard` loaded smoothly, accurately routing their data into the bounds of the "Main Company".

---

## Part 3: Configuration Reloading and The 500 Error

During the transition, a code deduplication of our `settings.py` accidentally removed the `AI_SERVICE_URL` variable definition at the end of the file.

When resolving the multi-tenancy bug, the frontend successfully displayed the data grids but the Top-Right "AI Business Health" widget threw a `500 Internal Server Error`. 
Looking into the console stack trace, the backend crashed immediately when it attempted to spawn the `AIClient()` because it called `settings.AI_SERVICE_URL`.

We quickly appended the configuration directly into the live development server:
```python
AI_SERVICE_URL = env("AI_SERVICE_URL", default="http://localhost:8001")
```
Because Django's WSGI development server (`manage.py runserver`) is backed by a `StatReloader` watchdog, it instantaneously detected the `base.py` file modification, rebooted its threaded workers in 100 milliseconds, and allowed the frontend to immediately render the AI Health Score without needing us to restart the server manually.

### Key Takeaway
Errors like 403 and 500 are standard in multi-service microservice transitions. By systematically trusting the logs and adhering to clear tenant boundaries, we resolved data-visibility blockers efficiently and secured our application on a Serverless Postgres backbone.
