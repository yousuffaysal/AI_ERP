# AI ERP Service Execution Guide

This document explains how to start and run all the microservices required for the AI ERP application.

## 🚀 Running the Services

The application consists of three main services that must be running simultaneously.

### 1. Backend (Django API)
The core business logic and database management.
- **Port:** `8000`
- **Command:**
  ```bash
  cd backend
  source venv/bin/activate
  python manage.py runserver 0.0.0.0:8000
  ```
- **Access:** [http://localhost:8000](http://localhost:8000)
- **Admin Panel:** [http://localhost:8000/admin](http://localhost:8000/admin)

### 2. Frontend (Next.js)
The user interface dashboard.
- **Port:** `3000` (default) or `3001` (if 3000 is occupied)
- **Command:**
  ```bash
  cd frontend
  npm run dev
  ```
- **Access:** [http://localhost:3000](http://localhost:3000) (or [http://localhost:3001](http://localhost:3001))

### 3. AI Service (FastAPI)
The machine learning and predictive analysis engine.
- **Port:** `8001`
- **Command:**
  ```bash
  cd ai-service
  source venv/bin/activate
  uvicorn app.main:app --host 0.0.0.0 --port 8001
  ```
- **Access:** [http://localhost:8001](http://localhost:8001)
- **API Docs:** [http://localhost:8001/docs](http://localhost:8001/docs)

---

## 🛠 Summary of Ports

| Service | Port | Description |
| :--- | :--- | :--- |
| **Backend** | `8000` | Django REST API |
| **Frontend** | `3000/3001` | Next.js Dashboard |
| **AI Service** | `8001` | FastAPI ML Service |

## 💡 Troubleshooting
- Ensure **Redis** is running if you encounter caching errors.
- If a port is occupied, you can kill the process or let the service (like Next.js) automatically pick the next available port.
- Use the `.env` files in each directory to configure specific environment variables.
