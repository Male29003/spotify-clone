import { api } from "../axiosConfig";

export const listenerMusicApi = {
    stream: async (short_id: string) => {
        const response = await api.get(`/music/track/stream/${short_id}/`, { 
            responseType: 'blob' 
        });
        return response; 
    },
    recordHistory: (short_id: string) => api.post(`music/history/record/`, { short_id }),

    get: (params?: { search?: string; page?: number; limit?: number }) => {
        return api.get('/music/track/', { params })
    },
    getDetail: (short_id: string) => api.get(`/music/track/${short_id}/`),
    getFavourite: () => api.get(`/music/me/favourite/`),
    getRecent: () => api.get('/music/recent/'),
    getTrending: () => api.get('/music/get-trending/'),
    getRecommended: () => api.get('music/recommend/'),
    toggleFavourite: (short_id: string) => api.post(`/music/track/${short_id}/favourite/`),

    download: (short_id: string, config?: any) => api.get(`/music/track/${short_id}/download/`, {
        'responseType': 'blob',
        ...config
    }),

    getRelated: (short_id: string) => api.get(`/music/${short_id}/related/`)

};
