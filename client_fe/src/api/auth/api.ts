import { api } from "../axiosConfig";

const authApi = {
    login: (data: any) => api.post('/users/login/', data),
    refreshToken: (data: {refresh: string}) => api.post('/users/login/refresh/', data),
    
    register: (data: any) => api.post('/users/register/', data),
    verifyRegister: (data: { email: string, otp: string }) => api.post('/users/verify-register/', data),

    forgotPassword: (email: string) => api.post(`/users/me/forgot-password/`, { email }),
    verifyOTP: (data: { email: string, otp: string }) => api.post(`/users/me/verify-otp/`, data),
    resetPassword: (data: any) => api.post(`/users/me/reset-password/`, data),
}

export default authApi;