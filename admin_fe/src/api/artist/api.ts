import { api } from "../axiosConfig";

export const artistProfileApi = {
    get: () => api.get('/artists/me/'),
    patch: (data: any) => api.patch('/artists/me/', data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    }),
}

export const adminApi = {
    get: (
        params?: { search?: string; page?: number; limit?: number; status?: string }
    ) => api.get('/artists/admin/manage/', { params }),
    
    approveArtist: (short_id: string) => api.patch(`/artists/admin/${short_id}/approve/`, {}),
    
    getArtistDetail: (short_id: string) => api.get(`/artists/admin/manage/${short_id}/`),
    
    toggleArtistStatus: (
        short_id: string, 
        data: { action?: string; block_reason?: number, block_note?: string }
    ) => 
        api.patch(`/artists/admin/manage/${short_id}/block/`, data),

    getPendingVerifications: () => api.get(`/artists/admin/verifications/`),
    actionVerification: (
        id: number, data:{ action: string, reject_reason?: number, reject_note?: string}
    ) => api.patch(`/artists/admin/verifications/${id}/action/`, data)
}