import { api } from "../axiosConfig";

export const genreApi = {
    get: () => {
        return api.get('/genres/');
    },
}

export const AdminGenreApi = {
    get: (params: {search?: string, page?: number, limit?: number, is_active?: boolean}) => {
        return api.get('/genres/admin/manage/', { params });
    },
    getDetail: (slug: string) => api.get(`/genres/admin/manage/${slug}/`),
    create: (data: any) => api.post('/genres/admin/manage/', data, {
        headers: { 
            'Content-Type': 'multipart/form-data' 
        }
    }),
    update: (slug: string, data: any) => api.patch(`/genres/admin/manage/${slug}/`, data, {
        headers: { 
            'Content-Type': 'multipart/form-data' 
        }
    }),
    toggleActive: (slug: string, is_active: boolean) => 
        api.patch(`/genres/admin/manage/${slug}/toggle-active/`, { is_active })
};
