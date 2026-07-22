import axios from 'axios';
import { notifications } from '@mantine/notifications';

const BASE_URL = import.meta.env.VITE_BE_API_URL || 'http://localhost:8080/api';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

function toIpv4BaseUrl(url) {
    if (typeof url !== 'string') {
        return url;
    }
    return url.replace('http://localhost:', 'http://127.0.0.1:');
}

// Request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - SỬA LẠI
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Không xử lý gì nếu là logout request
        if (error.config?.url?.includes('/auth/logout')) {
            return Promise.reject(error);
        }

        if (error.config?.suppressErrorNotification) {
            return Promise.reject(error);
        }

        // Fallback for environments where localhost resolution intermittently fails.
        // Axios also sets `request` for ordinary HTTP errors. Retry only when no
        // response was received, otherwise a 404/500 is mislabeled as a network error.
        if (!error.response && error.request && error.config && !error.config.__retriedWithIpv4) {
            const originalBaseUrl = error.config.baseURL || BASE_URL;
            if (typeof originalBaseUrl === 'string' && originalBaseUrl.includes('http://localhost:')) {
                error.config.__retriedWithIpv4 = true;
                error.config.baseURL = toIpv4BaseUrl(originalBaseUrl);
                return axiosInstance.request(error.config);
            }
        }

        if (error.response) {
            switch (error.response.status) {
                case 401:
                    localStorage.removeItem('accessToken');
                    notifications.show({
                        title: 'Session Expired',
                        message: 'Please login again',
                        color: 'red',
                    });
                    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                        window.location.href = '/login';
                    }
                    break;
                case 403:
                    notifications.show({
                        title: 'Access Denied',
                        message: 'You do not have permission to perform this action',
                        color: 'red',
                    });
                    break;
                case 500:
                    notifications.show({
						id: 'server-error',
                        title: 'Server Error',
                        message: 'Something went wrong. Please try again later.',
                        color: 'red',
                    });
                    break;
				case 503:
					notifications.show({
						id: 'service-unavailable',
						title: 'Service unavailable',
						message: 'The requested service is starting or temporarily unavailable. Please try again shortly.',
						color: 'red',
					});
					break;
                default:
                    notifications.show({
                        title: 'Error',
                        message: error.response.data?.message || 'An error occurred',
                        color: 'red',
                    });
            }
        } else if (error.request) {
            const backendUrl = new URL(BASE_URL, window.location.origin);
            notifications.show({
                title: 'Network Error',
                message: `Cannot reach backend server at ${backendUrl.origin}.`,
                color: 'red',
            });
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
