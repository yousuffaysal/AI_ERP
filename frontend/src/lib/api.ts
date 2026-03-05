/**
 * Axios API client — points at Django backend.
 * JWT token auto-attached from localStorage on every request.
 */
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiClient = axios.create({
    baseURL: `${API_URL}/api/v1`,
    headers: { "Content-Type": "application/json" },
});

// Attach JWT on every request
apiClient.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token");
        if (token) config.headers.Authorization = `Bearer ${token}`;
        const companyId = localStorage.getItem("company_id");
        if (companyId) config.headers["X-Company-ID"] = companyId;
    }
    return config;
});

// Auto-refresh token on 401
apiClient.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            try {
                const refresh = localStorage.getItem("refresh_token");
                const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh/`, { refresh });
                localStorage.setItem("access_token", data.access);
                original.headers.Authorization = `Bearer ${data.access}`;
                return apiClient(original);
            } catch {
                localStorage.clear();
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

// ---------- Auth ----------
export const auth = {
    login: (email: string, password: string) =>
        apiClient.post("/auth/login/", { email, password }),
    logout: (refresh: string) =>
        apiClient.post("/auth/logout/", { refresh }),
};

// ---------- Inventory ----------
export const inventory = {
    products: () => apiClient.get("/inventory/products/"),
    lowStock: () => apiClient.get("/inventory/products/low-stock/"),
    suppliers: () => apiClient.get("/inventory/suppliers/"),
    movements: () => apiClient.get("/inventory/movements/"),
    movementSummary: () => apiClient.get("/inventory/movements/summary/"),
};

// ---------- Sales ----------
export const sales = {
    invoices: () => apiClient.get("/sales/invoices/"),
    overdue: () => apiClient.get("/sales/invoices/overdue/"),
    dashboard: () => apiClient.get("/sales/invoices/dashboard/"),
    confirmInvoice: (id: string) => apiClient.post(`/sales/invoices/${id}/confirm/`),
    recordPayment: (id: string, data: object) =>
        apiClient.post(`/sales/invoices/${id}/record-payment/`, data),
};

// ---------- HR ----------
export const hr = {
    employees: () => apiClient.get("/hr/employees/"),
    leaveRequests: () => apiClient.get("/hr/leave-requests/"),
};

// ---------- Finance ----------
export const finance = {
    accounts: () => apiClient.get("/finance/accounts/"),
    transactions: () => apiClient.get("/finance/transactions/"),
};

// ---------- AI Service ----------
const AI_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8001";
export const aiService = {
    forecast: (data: object) => axios.post(`${AI_URL}/api/v1/forecast/demand/`, data),
    anomalies: () => axios.get(`${AI_URL}/api/v1/anomalies/`),
    recommend: (data: object) => axios.post(`${AI_URL}/api/v1/recommendations/`, data),
};
