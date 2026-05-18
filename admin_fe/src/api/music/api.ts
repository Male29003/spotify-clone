import { api } from "../axiosConfig";

export const sharedApi = {
    stream: async (short_id: string) => {
        const response = await api.get(`/music/track/stream/${short_id}/`, { 
            responseType: 'blob' 
        });
        return response; 
    },
}

export const studioMusicApi = {
    // Lấy danh sách nhạc của tôi
    get: (
        params: { search?: string, page?: number, limit?: number, is_active?: boolean, genre?: number }
    ) => api.get('/music/admin/me/manage/', { params }),

    // Upload bài hát mới
    upload: (formData: FormData) => {
        return api.post('/music/me/manage/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Cập nhật thông tin bài hát
    patch: (short_id: string, data: any) => {
        return api.patch(`/music/me/manage/${short_id}/`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    
    // lay6ấy unassigned
    getUnassigned: () => api.get('/music/me/unassigned/'),
};

export const adminApi = {
    get: (
        params: { 
            search?: string, page?: number, limit?: number, status?: string, genre?: number
        }) => api.get('/music/admin/manage/', { params }),
    
    getDetail: (short_id: string) => api.get(`/music/admin/manage/${short_id}/`),

    blockTrack: (
        short_id: string, 
        data: { action?: string; block_reason?: number, block_note?: string }
    ) => 
        api.patch(`/music/admin/manage/${short_id}/block/`, data),
}