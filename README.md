# AI ERP Platform

A modern, multi-tenant Enterprise Resource Planning system with built-in AI forecasting and analytics.

## Architecture

```text
ai-erp-platform/
│
├── frontend/        ← React / Next.js (App Router, Tailwind, Zustand)
├── backend/         ← Django REST Framework (Core API, Multi-tenancy)
├── ai-service/      ← FastAPI (ML models, Forecasting, Anomaly Detection)
├── docker/          ← Docker configuration overrides
└── docs/            ← Tutorials and architecture decisions
```

## Quick Start (Docker)

1. Clone the repository
2. Set up environment variables (copy `.env.example` to `backend/.env`)
3. Run the full stack:
```bash
docker-compose up --build -d
```

### Services
- Frontend: `http://localhost:3000`
- Backend API (Swagger): `http://localhost:8000/api/v1/docs/`
- AI Service API (Swagger): `http://localhost:8001/docs/`

## Development Guides

- [Tutorial 1: Project Setup & User Auth](docs/tutorial_1.md)
- [Tutorial 2: Multi-tenant Architecture](docs/tutorial_2.md)
- [Tutorial 3: Inventory & Migrations](docs/tutorial_3.md)
- [Tutorial 4: Sales & Billing](docs/tutorial_4.md)
