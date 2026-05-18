import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../api/analytics/api';

export const useArtistDashboardStats = (dateRange: { start_date: string, end_date: string }) => {
    return useQuery({
        queryKey: ['artist_dashboard_stats', dateRange.start_date, dateRange.end_date], // Gắn dependency để nó tự fetch lại khi đổi ngày
        queryFn: () => analyticsApi.getArtistDashboard(dateRange),
        staleTime: 3 * 60 * 1000,
    });
};

export const useAdminDashboardStats = (dateRange: { start_date: string, end_date: string }) => {
    return useQuery({
        queryKey: ['admin_dashboard_stats', dateRange.start_date, dateRange.end_date],
        queryFn: () => analyticsApi.getAdminDashboard(dateRange),
        staleTime: 3 * 60 * 1000,
    });
};