# Tutorial 5: Microservices & AI Business Health Engine

In this tutorial, we evolve the AI ERP from a monolithic Django application into a **modern 3-tier microservices architecture**, and we implement our first true Artificial Intelligence / Business Intelligence feature: The **Business Health Score Engine**.

---

## Part 1: Architecture Evolution (The Monorepo)

As the ERP grew to encompass Sales, Inventory, HR, and Finance, it became clear that injecting Machine Learning (ML) models and a modern reactive UI directly into Django was not scalable.

We restructured the codebase into a standard enterprise **Monorepo**:

```text
ai-erp-platform/
│
├── frontend/        ← React / Next.js (App Router, Tailwind, Zustand)
├── backend/         ← Django REST Framework (Core API, Multi-tenancy)
├── ai-service/      ← FastAPI (ML models, Forecasting, BI)
├── docker/          ← Docker configuration
└── docs/            ← Tutorials & Architecture Notes
```

### Why this architecture?
1. **Frontend (Next.js)**: Provides a snappy, single-page application (SPA) feel. It uses `Axios` interceptors to automatically rotate JWT refresh tokens and attach the `X-Company-ID` header to every request.
2. **Backend (Django)**: Remains the source of truth for complex relational data, multi-tenant security (`CompanyQuerysetMixin`), and the admin panel.
3. **AI Service (FastAPI)**: Python's `scikit-learn`, `pandas`, and `numpy` run much faster and safer in FastAPI's asynchronous ASGI environment than embedded within Django's synchronous WSGI request/response cycle.

### Docker Orchestration
We tied all three services together using a root `docker-compose.yml`. 
- **`erp_backend`**: Exposes port 8000.
- **`erp_ai`**: Exposes port 8001.
- **`erp_frontend`**: Exposes port 3000.
Next.js acts as a proxy, routing `/api/v1/auth/*` requests to Django, and `/api/v1/health/*` to FastAPI.

---

## Part 2: The Business Health Score Engine

We wanted to build something **unique** — not just CRUD apps. We built an engine that synthesizes data across all 4 modules (Finance, Sales, Inventory, HR) to output a single, weighted **Health Score (0-100)** for the company.

### The 4 Key Performance Indicators (KPIs)

1. **Revenue Growth (Weight: 30%)** — *Sales Module*
   - **Logic**: Sums paid invoices of the last 30 days vs the preceding 30 days. Perfect score (100) if growth exceeds 20%.
2. **Cash Stability (Weight: 30%)** — *Finance Module*
   - **Logic**: Compares operational Inflows (Credits) vs Outflows (Debits) over 90 days. Perfect score if Inflow $\ge$ 120% of Outflow.
3. **Inventory Turnover (Weight: 20%)** — *Inventory Module*
   - **Logic**: Computes Cost of Goods Sold (COGS) divided by average Inventory Value. Fast turnover ($\ge$ 4.0) yields a perfect score.
4. **Employee Productivity (Weight: 20%)** — *HR Module*
   - **Logic**: Divides 30-day Revenue by the number of Active Employees. Benchmark is \$10,000 revenue per employee.

### The FastAPI Implementation (`ai-service/app/services/health_service.py`)

To calculate this, FastAPI could have called Django's REST APIs. **However, that is an anti-pattern for heavy data aggregation.** Fetching thousands of JSON records over HTTP just to sum them up is incredibly slow.

Instead, we used **`SQLAlchemy`** and **`asyncpg`** to connect FastAPI *directly* to the shared PostgreSQL database used by Django.

By executing highly optimized, asynchronous raw SQL (`text()`), FastAPI leverages the database engine to do the heavy lifting in milliseconds.

#### Example: Calculating Employee Productivity directly via SQL
```python
# 1. Get active employee count from the HR table
emp_query = text("""
    SELECT COUNT(id) FROM hr_employees
    WHERE company_id = :company_id AND status = 'active'
""")
emp_res = await self.db.execute(emp_query, {"company_id": self.company_id})
emp_count = int(emp_res.scalar() or 0)

# 2. Get 30-day revenue from the Sales table
rev_query = text("""
    SELECT SUM(amount_paid) FROM sales_invoices
    WHERE company_id = :company_id
      AND status IN ('paid', 'partial')
      AND issue_date >= current_date - interval '30 days'
""")
rev_res = await self.db.execute(rev_query, {"company_id": self.company_id})
revenue = float(rev_res.scalar() or 0)

rev_per_emp = revenue / emp_count if emp_count > 0 else 0
```

### The API Endpoint (`ai-service/app/api/v1/endpoints/health.py`)

The `/api/v1/health/score` endpoint processes these asynchronous queries concurrently, calculates the weighted score, and returns an actionable JSON summary.

```json
{
  "score": 85.4,
  "status": "Green",
  "explanation": "Business is highly healthy. Strong cash flow and revenue growth.",
  "metrics": {
    "revenue_growth_pct": 24.5,
    "revenue_score": 100.0,
    "operating_cash_ratio": 1.4,
    "cash_score": 100.0,
    "inventory_turnover_rate": 2.1,
    "inventory_score": 52.5,
    "revenue_per_employee": 8450.0,
    "employee_productivity_score": 84.5
  },
  "company_id": "b2b4eeb6-1430-4e31-ad6e-1d63ddabf291"
}
```

## Review
In this step we learned:
- **Monorepo Design**: Splitting concerns (React vs Django vs FastAPI) while keeping them version-controlled together.
- **Database Sharing**: How microservices can safely share an aggregate PostgreSQL database for extreme read performance.
- **Asynchronous SQLAlchemy**: Fixing the `greenlet` dependency error to run non-blocking queries with `asyncpg`.
- **Business Intelligence Logic**: Translating raw operational data tables into executive-level KPIs (Turnover, Cash Flow, Growth).

---

## Part 3: Predictive ML Models (Phase 2)

Alongside the Business Health engine, we built 3 distinct Predictive Machine Learning capabilities directly into the FastAPI `ai-service`. These utilize Python's world-class data science ecosystem (`scikit-learn`, `pandas`, `numpy`, `statsmodels`).

### 1. Demand Forecasting
**Endpoint:** `POST /api/v1/forecast/demand`
**Library:** `statsmodels.tsa.arima.model.ARIMA`

Analyzes historical sales volume to predict future needs.
- **Model:** ARIMA (AutoRegressive Integrated Moving Average).
- **Process:** Ingests raw sales dictionaries, converts them to a Pandas time-series DatetimeIndex, and fits an ARIMA(1,1,1) model. 
- **Output:** Returns a day-by-day forecasted demand, total aggregate demand over the period, a statistical confidence interval, and a suggested restock quantity (Predicted Demand minus Current Stock).

### 2. Anomaly Detection
**Endpoint:** `POST /api/v1/anomalies/detect`
**Library:** `sklearn.ensemble.IsolationForest`

Unsupervised machine learning designed to flag outliers in any time-series data without requiring labeled examples—useful for catching fraudulent expenses, sudden traffic drops, or inventory shrink.
- **Model:** Isolation Forest.
- **Process:** Feeds a 2D array of metrics into the forest. Data points that require the fewest splits to isolate are flagged as anomalies (`-1`).
- **Output:** An array of the specific timestamps flagged as anomalous, complete with a severity `anomaly_score`.

### 3. Price Optimization
**Endpoint:** `POST /api/v1/pricing/optimize`
**Library:** `sklearn.preprocessing.PolynomialFeatures` & `LinearRegression`

Calculates the exact theoretical price point that maximizes total revenue based on historical demand elasticity.
- **Model:** Degree-2 Polynomial Regression representing a downward-sloping Demand Curve.
- **Process:** Maps historical Price vs. Quantity Sold points. Generates 1,000 theoretical price variations. Multiplies Price × Predicted Quantity to calculate Projected Revenue for each point. Matches the absolute maximum revenue via `numpy.argmax`.
- **Output:** The exact optimal price (e.g., $10.44), the predicted units sold at that price, and the maximum achievable revenue.
