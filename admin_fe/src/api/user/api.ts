import { api } from "../axiosConfig";

export const userApi = {
    getMe: () => api.get('/users/me/'),

    getNotifications: () => api.get('/users/me/noti/'),
    readNotifications: (id: number) => api.patch(`/users/me/noti/${id}/`),

    changePassword: (data: any) => api.patch('/users/me/change-password/', data),

    getUserProfile: (username: string) => api.get(`/users/profile/${username}/`),

    updateMe: (data: any) => api.patch('/users/me/', data),
}

export const adminApi = {
    get: (params: { search?: string, page?: number, limit?: number, is_premium?:boolean, is_active: boolean, is_staff: boolean }) => {
        return api.get('/users/admin/manage/', { params });
    },

    getDetail: (id: number) => {
        return api.get(`/users/admin/manage/${id}`)
    },
    toggleUserStatus: (
        id: number, 
        data: { is_active: boolean, block_note?: string, block_reason?: number}
    ) => api.patch(`/users/admin/manage/${id}/toggle-active/`, data),
     
    updateUserRole: (id: number, data: { type: string }) => api.patch(`/users/admin/manage/${id}/role/`, data),

    getStaff: (params: any) => api.get('/users/admin/manage/staff/', { params }),
    getStaffDetail: (id: number) => api.get(`/users/admin/manage/staff/${id}`),
    createStaff: (data: any) => api.post(`/users/admin/manage/create-staff/`, data),
    updateStaff: (id: number, data: any) => api.patch(`/users/admin/manage/staff/${id}/`, data),
    deleteStaff: (id: number) => api.delete(`/users/admin/manage/staff/${id}/`),
}