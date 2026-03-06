# Tutorial 6: Integrating AI and Building a Smart Reporting Engine

Welcome to the final installment of the AI ERP Platform series. In our previous tutorials, we transformed our monolithic application into a powerful microservice architecture, routing our heavy Machine Learning workloads to a dedicated asynchronous FastAPI service (`ai-service`). 

In this tutorial, we will cover the final pieces that turn this platform into an Enterprise-ready powerhouse:
1. **Advanced Predictive ML Models:** Upgrading our algorithms to handle multi-variate metrics and output dynamic explanations.
2. **The `AIClient` Interface:** Securely and asynchronously linking our core Django Backend to the FastAPI microservice, backed by blazing-fast Redis caching.
3. **The Smart Reporting Engine:** A dynamic, celery-powered engine capable of compiling custom queries, exporting them as PDFs or Excel spreadsheets, and emailing them automatically on a schedule.

---

## Part 1: Advanced Predictive ML Models (Phase 2.1)

While baseline models can provide "theoretical" insights, Enterprise businesses need algorithms that map strictly to real-world edge cases like profit margins and exact duplicates. We upgraded two core ML endpoints in our `ai-service`:

### 1. Advanced Anomaly Detection (`IsolationForest` & Pandas)
**Endpoint:** `POST /api/v1/anomalies/detect`

Instead of simply flagging a time-series dip, our anomaly detector now ingests complex transactional dictionaries (e.g., `amount`, `employee_id`, `customer_id`). 
- It uses an **Isolation Forest** to identify irregular patterns (like a sudden 10x spike in a specific employee's expense submissions). 
- Simultaneously, it utilizes `pandas.DataFrame.duplicated()` to aggressively hunt for exact identical transactions submitted rapidly.
- **Explainability:** ML models are useless if users don't trust them. The engine calculates the dataset medians and returns a natural language **Reason String** (e.g., `"Unusually high amount (5000 vs median 100)"` or `"Exact duplicate detected for features: amount, employee_id"`).

### 2. Intelligent Pricing Optimization (`LinearRegression`)
**Endpoint:** `POST /api/v1/pricing/optimize`

Standard demand elasticity curves seek to maximize *gross revenue*. This is dangerous. Selling 1,000 items for $1 is worse than selling 10 items for $100 if the unit cost is $0.99.
- Our regression model now ingests `unit_cost`, `current_velocity`, and `competitor_price`.
- It simulates 1,000 distinct price points. 
- Using `numpy`, it maximizes **Profit Margin** `((Price - Unit Cost) * Predicted Quantity)`.
- It explicitly applies heavy score penalties to any proposed price hike that would cause the sales velocity to drop by more than 50%, ensuring we don't accidentally freeze our inventory.

---

## Part 2: The Django AIClient (Phase 3)

With our FastAPI ML engine fully functional, we needed Django—our primary user-facing backend—to consume it seamlessly.

**Location:** `backend/utils/ai_client.py`

### Asynchronous HTTP (`httpx`)
If Django uses the standard `requests` library to query the AI engine, the WSGI/ASGI worker threads physically lock up while waiting for the mathematics to compile. We used `httpx.AsyncClient` to fire non-blocking requests to FastAPI.
- We implemented strict **Timeouts** (e.g., `5.0` seconds). If the ML engine is overwhelmed, Django catches the `httpx.TimeoutException` and returns a safe fallback dictionary rather than returning a 504 Gateway Error to the end user.

### Redis Caching
Machine learning inferences are extremely expensive, but they rarely change minute-by-minute. 
- Using Django's modern asynchronous cache interface (`await cache.aget()`), we proxy all AI requests.
- **Health Scores** are cached for 1 Hour.
- **Forecasts** are cached for 24 Hours.
- If an executive refreshes their dashboard 100 times, the AI Service is only queried *once*. The other 99 requests are served instantly from the Redis cache RAM.

---

## Part 3: The Smart Reporting Engine (Phase 4)

Executives require tailored visibility. They don't want to dig through the database; they want automated PDFs delivered to their inbox.

### 1. The Dynamic Query Builder
**Location:** `backend/apps/reports/services/query.py`

We abstracted hardcoded SQL reports into a generic class that accepts JSON filters.
For example, submitting `{"model": "sales_invoice", "filters": {"status": "PAID"}}` will dynamically map to the `sales_invoice` app.
- **Critical Security:** The engine implicitly enforces multi-tenant boundaries by forcefully overriding `.filter(company=request.user.company)` onto every single query, absolutely preventing any cross-tenant data leakage.

### 2. Live Document Generators
The output of the dynamic query runs through our export classes:
- **Excel Export (`openpyxl`):** Instantiates an Excel Workbook in memory, dynamically sizes the columns based on the largest data string, applies a styling header, and streams back physical `.xlsx` bytes.
- **PDF Export (`reportlab`):** Maps the data into a responsive landscape `Table` class, coloring the grid and applying corporate header spacing.

### 3. Automated Delivery (`django-celery-beat`)
**Endpoint:** `POST /api/v1/reports/schedule`

You can submit an `email_to` address alongside the JSON query block. This dispatches a background `@shared_task` explicitly to the Celery worker queue:
1. The Celery worker runs the Dynamic Query.
2. The Celery worker generates the PDF byte-stream in local RAM.
3. The Celery worker instantiates a `django.core.mail.EmailMessage`, attaching the PDF bytes, and dispatches the email to the executive.
4. Meanwhile, the web server was completely insulated and handled thousands of other user clicks.

---

## Conclusion

Over the course of these 6 tutorials, we have evolved a basic Django monolithic API into an Enterprise Application featuring:
- Role-based multi-tenancy.
- Unsupervised isolation forest anomaly hunting.
- Asynchronous microservice architectures spanning multiple programming standards.
- Production-ready Redis caching and Celery background workers.

You now possess the architectural foundation required to build and scale industry-leading AI tools. Happy coding!
