import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getToken } from '../../utils/helper';

const api: AxiosInstance = axios.create({
    baseURL: 'https://base_url/',
    headers: {
        'Content-Type': 'application/json',
    },
});
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getToken();
        if (token && config.headers) {
            (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error) => {
        return Promise.reject(error.response || error.message);
    }
);

export default api;