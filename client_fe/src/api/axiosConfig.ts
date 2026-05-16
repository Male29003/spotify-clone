import axios from "axios";
import { BACKEND_ENDPOINT } from "../configs/get_env";
import { useAuthStore } from "../stores/auth/authStore";

export const api = axios.create({
    baseURL: BACKEND_ENDPOINT,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    }
});

async function handleLogout() {
    useAuthStore.getState().clearUser();
    localStorage.removeItem('spotify-player-storage');
    localStorage.removeItem('spotify-auth-storage');
    try {
        await api.post('/users/logout/');
    } catch (error) {
        console.error("Error:", error);
    } finally {
        if (window.location.pathname !== '/') {
            window.location.href = '/';
        }
    }
    
};

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const originalRequest = error.config;

        if (!originalRequest || originalRequest.url.includes('/login/') || originalRequest.url.includes('/refresh/')) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Tự động xài Cookie Refresh để lấy Cookie Access mới
                await axios.post(`${BACKEND_ENDPOINT}/users/login/refresh/`, {}, {
                    withCredentials: true 
                });

                processQueue(null);
                return api(originalRequest);

            } catch (refreshError) {
                processQueue(refreshError);
                handleLogout();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);