import { api } from "../axiosConfig";

export const listenerArtistApi = {
    get: (params?: { search?: string; page?: number; limit?: number }) => {
        return api.get('/artists/', { params });
    },
    getDetail: (short_id: string) => api.get(`/artists/${short_id}/`),
    getFavourite: () => api.get('/artists/favourite/'),
    getTrending: () => api.get('/artists/get-trending/'),
    toggleFavourite: (short_id: string) => api.post(`/artists/${short_id}/favourite/`),
    apply: (data: FormData) => api.post('/artists/apply/', data, {
        headers: { 
            'Content-Type': 'multipart/form-data' 
        }
    }),

    getRelated: (short_id: string) => api.get(`/artists/${short_id}/related/`),
    getDiscography: (short_id: string, type?: string) => 
        api.get(`/artists/${short_id}/discography/`, {
            params: { type }
        })

};