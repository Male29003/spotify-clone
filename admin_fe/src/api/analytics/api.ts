import { api } from "../axiosConfig";

export const analyticsApi = {
    getArtistDashboard: () => api.get('/analytics/artist-dashboard/'),
    getAdminDashboard: () => api.get('/analytics/admin-dashboard/'),
};