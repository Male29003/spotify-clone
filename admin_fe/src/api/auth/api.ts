import { api } from "../axiosConfig";

const authApi = {
    login: (data: any) => api.post('/users/login/', data),
    register: (data: any) => api.post('/users/register/', data),
    refreshToken: (data: {refresh: string}) => api.post('/users/login/refresh/', data)
}

export default authApi;