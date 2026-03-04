# AI_ERP

A **production-ready Django REST API** for an ERP system, built with multi-tenant architecture, JWT authentication, and modular domain apps.

## Project Structure

```
AI_ERP/
└── core/               ← Main Django project
    ├── apps/           ← Business domain apps
    │   ├── accounts/   ← Users, Companies, JWT auth
    │   ├── inventory/  ← Products, Warehouses, Stock
    │   ├── sales/      ← Customers, Orders, Invoices
    │   ├── hr/         ← Employees, Departments, Leave
    │   ├── finance/    ← Accounts, Transactions, Budgets
    │   └── audit/      ← Immutable audit trail
    ├── config/         ← Django settings, URLs, Celery
    ├── utils/          ← Shared models, mixins, middleware
    ├── Dockerfile
    ├── docker-compose.yml
    └── requirements.txt
```

## Quick Start

```bash
cd core
cp .env.example .env      # Fill in your DB credentials
docker-compose up --build
```

API Docs: **http://localhost:8000/api/v1/docs/**

## Tech Stack

- **Django 5** + **Django REST Framework**
- **PostgreSQL** + **Redis** + **Celery**
- **JWT** authentication (SimpleJWT)
- **Multi-tenant** isolation via Company model
- **Docker** + **docker-compose**

## Tutorials

- [`core/tutorial_1.md`](core/tutorial_1.md) — Project setup, models, ViewSets, Docker
- [`core/tutorial_2.md`](core/tutorial_2.md) — Multi-tenant Company implementation
