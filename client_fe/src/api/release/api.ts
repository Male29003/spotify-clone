import { api } from "../axiosConfig";

export const listenerReleaseApi= {
    get: (params?: { search?: string; page?: number; limit?: number, artist_short_id?: string }) => {
        return api.get('/releases/', {params});
    },
    getDetail: (short_id: string) => api.get(`/releases/${short_id}/`),
    getFavourite: () => api.get(`/releases/favourite/`),
    getTrending: () => api.get('/releases/get-trending/'),
    getRecent: () => api.get('/releases/recent/'),
    getRecommended: () => api.get('/releases/recommended/'),
    toggleFavourite: (short_id: string) => api.post(`/releases/${short_id}/favourite/`),


    download: (short_id: string, config?: any) => api.get(`/releases/${short_id}/download/`, {
        'responseType': 'blob',
        ...config,
    }),

    getRelated: (short_id: string) => api.get(`/releases/${short_id}/related/`)
};
