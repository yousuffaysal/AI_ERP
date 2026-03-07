import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Access the host environment's DRF URL or default to localhost:8000
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach JWT Access Token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle 401 Unauthorized (Token Refresh)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If we catch a 401 and haven't already retried this exact request
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = useAuthStore.getState().refreshToken;
            if (refreshToken) {
                try {
                    // Attempt to refresh the access token via Django's auth module
                    const response = await axios.post(`${API_URL}/accounts/token/refresh/`, {
                        refresh: refreshToken,
                    });

                    const newAccessToken = response.data.access;

                    // Update the global Zustand store with the fresh token
                    useAuthStore.getState().setTokens(newAccessToken, refreshToken);

                    // Re-attach the new token to the failed request and retry it
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // If the refresh token itself is expired/invalid, hard logout
                    useAuthStore.getState().logout();
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            } else {
                // No refresh token exists at all
                useAuthStore.getState().logout();
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);
