import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { studioReleaseApi, adminApi as systemAdminApi } from '../../api/release/api';
import { CustomToast } from '../../components/shared/feedback/CustomToast';

// ======================= For artist ======================= 
// GET
export const useGetMyReleases = (
    params: {  
        search?: string;  page?: number;  limit?: number;
        status?: string, type?: string 
    },
    isEnabled: boolean = true
) => {
    return useQuery({ 
        queryKey: ['my_releases', params], 
        queryFn: () => studioReleaseApi.get(params),
        enabled: isEnabled,
        placeholderData: keepPreviousData
    });
};

export const useGetFeaturedArtists = (search: string) => {
    return useQuery({
        queryKey: ['featured_artists', search],
        queryFn: () => studioReleaseApi.getFeaturedArtist({search}),
        enabled: search.trim().length > 1, 
        staleTime: 1000 * 60 * 5,
    })
}

export const useGetMyReleaseDetail = (short_id: string, options = {}) => {
    return useQuery({
        queryKey: ['my_release_detail', short_id],
        queryFn: () => studioReleaseApi.getDetail(short_id),
        ...options
    })
}

// POST, PUT, PATCH
export const useCreateRelease = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: FormData) => studioReleaseApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my_releases']})
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    })
}

export const useUpdateMyRelease = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({short_id, data} : {short_id: string, data: any}) => studioReleaseApi.update(short_id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['my_release_detail', variables.short_id] })
            queryClient.invalidateQueries({ queryKey: ['my_releases'] })
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    })
}

export const useToggleActiveRelease = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({short_id, is_active} : {short_id: string, is_active: boolean}) => studioReleaseApi.toggleActiveRelease(short_id, is_active),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['my_release_detail', variables.short_id] })
            queryClient.invalidateQueries({ queryKey: ['my_releases'] })
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    })
}

export const useDeleteDraftRelease = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (short_id: string) => studioReleaseApi.delete(short_id),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['my_release_detail', variables] })
            queryClient.invalidateQueries({ queryKey: ['my_releases'] })
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    })
}

export const useSumbmitRelease = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (short_id: string) => studioReleaseApi.submitRelease(short_id),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['my_release_detail', variables] })
            queryClient.invalidateQueries({ queryKey: ['my_releases'] })
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    })
}

// thay đổi thứ t75 nhạc
export const useReorderReleaseTracks = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ short_id, track_ids }: { short_id: string, track_ids: string[] }) => 
            studioReleaseApi.reorderTracks(short_id, track_ids),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['my_release_detail', variables.short_id] });
            //admin
            queryClient.invalidateQueries({ queryKey: ['admin_releases', variables.short_id] });
            queryClient.invalidateQueries({ queryKey: ['admin_release_detail', variables.short_id] });
            // listener
            queryClient.invalidateQueries({ queryKey: ['favourite_releases'] });
            queryClient.invalidateQueries({ queryKey: ['release_detail', variables.short_id] });
            queryClient.invalidateQueries({ queryKey: ['recommended-releases'] });
            queryClient.invalidateQueries({queryKey: ['trending_releases']})
            queryClient.invalidateQueries({ queryKey: ['recent-releases'] });
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    });
};


// =========================== For admin ==========================================
export const useGetAdminReleases = (
    params: {  
        search?: string;  page?: number;  limit?: number;
        is_blocked?: boolean;  is_published?: boolean;  type?: string 
    },
    isEnabled: boolean = true
) => {
    return useQuery({
        queryKey: ['admin_releases', params],
        queryFn: () => systemAdminApi.getReleases(params),
        enabled: isEnabled,
    });
};

export const useGetReleaseDetail = (short_id: string, options = {}) => {
    return useQuery({
        queryKey: ['admin_release_detail', short_id],
        queryFn: () => systemAdminApi.getReleaseDetail(short_id),
        ...options
    });
}

export const useGetPendingReleases = () => {
    return useQuery({
        queryKey: ['pendingReleases'],
        queryFn: () => systemAdminApi.getPeding(),
    });
};

export const useActionRelease = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ short_id, data }: { short_id: string, data: any }) => 
            systemAdminApi.actionRelease(short_id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pendingReleases'] });
        }
    });
};

export const useAdminToggleRelease = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ short_id, data }: { short_id: string, data: { action?: string; block_reason?: number, block_note?: string } }) => 
            systemAdminApi.toggleReleaseStatus(short_id, data),
        onSuccess: (res: any, variables) => {
            CustomToast.success(res.detail || "Status updated!");
            queryClient.invalidateQueries({ queryKey: ['admin_releases'] });
            queryClient.invalidateQueries({ queryKey: ['admin_release_detail', variables.short_id]});
            // artist
            queryClient.invalidateQueries({ queryKey: ['my_release_detail', variables.short_id] });
            queryClient.invalidateQueries({ queryKey: ['my_releases'] })
            //listener
            queryClient.invalidateQueries({ queryKey: ['releases'] })
            queryClient.invalidateQueries({ queryKey: ['favourite_releases'] })
            queryClient.invalidateQueries({ queryKey: ['trending_releases'] })
            queryClient.invalidateQueries({ queryKey: ['recent-releases'] })
            queryClient.invalidateQueries({ queryKey: ['recommended-releases'] })
            queryClient.invalidateQueries({ queryKey: ['release_detail', variables.short_id] })

        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    });
};


