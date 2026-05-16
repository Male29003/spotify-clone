import { api } from "../axiosConfig";

const playlistApi = {
    get: () => api.get('/playlists/'),
    getDetail: (slug: string) => api.get(`/playlists/${slug}/`),
    getLibrary: () => api.get(`/playlists/me/library/`),
    getFavourite: () => api.get(`/playlists/me/favourite/`),

    create: (data: any) => api.post(`/playlists/me/library/`, data),
    update: (slug: string, data: any) => api.patch(`/playlists/${slug}/`, data,{
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }),
    delete: (slug: string) => api.delete(`/playlists/${slug}/`),
};

export default playlistApi