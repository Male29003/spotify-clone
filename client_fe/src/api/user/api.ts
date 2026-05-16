import { api } from "../axiosConfig";

export const userApi = {
    getMe: () => api.get('/users/me/'),
    getNotifications: () => api.get('/users/me/noti/'),
    readNotifications: (id: number) => api.patch(`/users/me/noti/${id}/`),

    getUserProfile: (username: string) => api.get(`/users/profile/${username}/`),
    updateMe: (data: any) => api.patch('/users/me/', data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    }),
    changePassword: (data: any) => api.patch('/users/me/change-password/', data),
}
