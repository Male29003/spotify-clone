import { api } from "../axiosConfig";

export const analyticsApi = {
    getArtistDashboard: (params?: { start_date: string, end_date: string }) => 
        api.get('/analytics/artist-dashboard/', { params }),
        
    getAdminDashboard: (params?: { start_date: string, end_date: string }) => 
        api.get('/analytics/admin-dashboard/', { params }),
};