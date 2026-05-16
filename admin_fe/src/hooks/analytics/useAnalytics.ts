import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../api/analytics/api';

export const useArtistDashboardStats = () => {
    return useQuery({
        queryKey: ['artist_dashboard_stats'],
        queryFn: () => analyticsApi.getArtistDashboard(),
        staleTime: 3 * 60 * 1000,
        refetchInterval: 30 * 1000,
    });
};

export const useAdminDashboardStats = () => {
    return useQuery({
        queryKey: ['admin_dashboard_stats'],
        queryFn: () => analyticsApi.getAdminDashboard(),
        staleTime: 3 * 60 * 1000,
        refetchInterval: 30 * 1000,
    });
};