import { api } from "../axiosConfig";

export const studioReleaseApi = {
    get: (params: { 
        search?: string;  page?: number;  limit?: number; 
        status?: string, type?: string 
    }) => {
        return api.get('/releases/me/', {params});
    },

    getFeaturedArtist: (params: { search?: string }) => {
        return api.get('/releases/get-artist/', {params})
    },

    // Lấy detail
    getDetail: (short_id: string) => api.get(`/releases/me/${short_id}/`),

    // tạo / sửa
    create: (data: FormData) => api.post('/releases/me/', data, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }),
    update: (short_id: string, data: any) => api.patch(`/releases/me/${short_id}/`, data, {
        headers: {
            'Content-Type': 'multipart/form-data', 
        }
    }),
    delete: (short_id: string) => api.delete(`/releases/me/${short_id}/delete/`),

    // deactive
    toggleActiveRelease: (short_id: string, is_active: boolean) => api.patch(`/releases/me/${short_id}/`, { is_active }),

    // sumbit release lên
    submitRelease: (short_id: string) => api.patch(`/releases/me/${short_id}/`, {is_pending: true}),

    // thay đổi thứ tự
    reorderTracks: (short_id: string, track_ids: string[]) =>  api.patch(`/releases/me/${short_id}/reorder/`, { track_ids })
}

export const adminApi = {
    getReleases: (params: { 
        search?: string;  page?: number;  limit?: number;
        is_blocked?: boolean;  is_published?: boolean;  type?: string 
    }) => api.get('/releases/admin/manage/', { params }),
    
    // Lấy detail
    getReleaseDetail: (short_id: string) => api.get(`/releases/admin/manage/${short_id}/`),

    getPeding: () => api.get('/releases/admin/manage/pending/'),
    // Duyệt release
    actionRelease: (
        short_id: string, 
        data: { action: string, reject_reason?: number, reject_note?: string }
    ) => api.patch(`/releases/admin/manage/${short_id}/action/`, data),
    
    // Block / Unblock release
    toggleReleaseStatus: (
        short_id: string, 
        data: { action?: string; block_reason?: number, block_note?: string }
    ) => 
        api.patch(`/releases/admin/manage/${short_id}/block/`, data),
    
}