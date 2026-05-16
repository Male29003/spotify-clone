import Axios from "axios"
import { BACKEND_ENDPOINT } from "../configs/get_env"
import { useAuthStore } from "../stores/auth/authStore";

export const api = Axios.create({
    baseURL: BACKEND_ENDPOINT,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    }
});
const clearLocalDataAndRedirect = () => {
    useAuthStore.getState().clearUser();
    localStorage.removeItem('spotify-player-storage');
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

export async function handleLogout() {
    useAuthStore.getState().clearUser();
    localStorage.removeItem('spotify-player-storage');
    
    try {
        // dùng Axios gốc để tránh vào Interceptor gọi vòng lặp
        await Axios.post(`${BACKEND_ENDPOINT}/users/logout/`, {}, {
            withCredentials: true 
        });
    } catch (error) {
        console.error("Logout Error:", error);
    } finally {
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }
}
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

        // Bỏ qua nếu là API Login, hoặc API Refresh bị lỗi
        if (!originalRequest || originalRequest.url.includes('/login/') || originalRequest.url.includes('/refresh/') || originalRequest.url.includes('/logout/')) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            
            // h refresh cua3 nếu user  
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }
            // Đánh dấu tránh lặp vô tận
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Gọi API lấy token mới
                await Axios.post(`${BACKEND_ENDPOINT}/users/login/refresh/`, {}, {
                    withCredentials: true 
                });
                // Trả token mới cho user trong hàng đời
                processQueue(null);
                // Chạy lại request gốc
                return api(originalRequest);

            } catch (refreshError) {
                // refresh token hh -> log out user ra
                processQueue(refreshError);
                clearLocalDataAndRedirect()
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);