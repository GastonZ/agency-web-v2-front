import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getToken } from '../../utils/helper';

const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getToken();
        if (token) {
            // Ensure headers object exists (defensive across axios versions/config merges)
            config.headers = (config.headers || {}) as any;
            (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error) => {
        const response = error?.response;
        const status = response?.status;
        const data = response?.data || {};

        const code = String(data?.code || data?.errorCode || data?.error?.code || "").toLowerCase();
        const message = String(data?.message || data?.error?.message || "").toLowerCase();

        const billingLimitError =
            status === 402 ||
            status === 429 ||
            code.includes("quota") ||
            code.includes("limit") ||
            code.includes("billing") ||
            message.includes("quota") ||
            message.includes("limite") ||
            message.includes("límite");

        if (billingLimitError && typeof window !== "undefined") {
            window.dispatchEvent(
                new CustomEvent("billing:limit-reached", {
                    detail: {
                        status,
                        code,
                        message: data?.message || data?.error?.message || "",
                        raw: data,
                    },
                }),
            );
        }

        return Promise.reject(error.response || error.message);
    }
);

export default api;
