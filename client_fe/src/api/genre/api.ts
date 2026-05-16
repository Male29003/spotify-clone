import { api } from "../axiosConfig";

const genreApi = {
    get: (params?: { search?: string; page?: number; limit?: number }) => {
        return api.get('/genres/', { params });
    },
    getDetail: (slug: string) => api.get(`/genres/${slug}/`),
    getRandomMix: () => api.get('/genres/random-mix/'),
};

export default genreApi;