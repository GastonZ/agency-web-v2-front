import axios from 'axios';
import { getToken } from '../../utils/helper';

const api = axios.create({
    baseURL: 'https://base_url',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error.response || error.message);
    }
);

export default api;