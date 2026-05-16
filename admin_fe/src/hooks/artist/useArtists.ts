import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { artistProfileApi } from '../../api/artist/api';
import { userApi } from '../../api/user/api';
import { adminApi as systemAdminApi } from '../../api/artist/api';
import { CustomToast } from '../../components/shared/feedback/CustomToast';
import { useAuthStore } from '../../stores/auth/authStore';
import { formatUserProfile } from '../../utils/formatters';

// ======================= For artist ======================= 
export const useGetMyArtistProfile = () => {
    return useQuery({ 
        queryKey: ['my_artist_profile'], 
        queryFn: () => artistProfileApi.get() 
    });
};

export const useUpdateArtistProfile = () => {
    const queryClient = useQueryClient();
    const { user, setUser } = useAuthStore(state => state)
    return useMutation({
        mutationFn: async ({ userData, artistData }: { userData: any, artistData: any }) => {
            await Promise.all([
                artistProfileApi.patch(artistData),
                userApi.updateMe(userData)
            ]);
            return true;
        },
        onSuccess: async () =>{
            queryClient.invalidateQueries({ queryKey: ['my_artist_profile'] })
            await queryClient.invalidateQueries({ queryKey: ['user_me'] });
            
            const newUserData: any = await userApi.getMe();
            let newArtistData: any = undefined

            if(newUserData.type === 'artist') {
                newArtistData = await artistProfileApi.get()
            }

            const newProfileData = formatUserProfile(newUserData, newArtistData)
            setUser({
                ...user,
                ...newProfileData
            })
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    });
};


// =========================== Quản lý nghệ sĩ ==========================================
// Lấy toàn bộ Artist (cho trang Manage)
export const useGetAdminArtists = (
    params?: { search?: string; page?: number; limit?: number; status?: string }
) => {
    return useQuery({
        queryKey: ['admin', 'artists_list', params],
        queryFn: () => systemAdminApi.get(params),
    });
};

// Hook duyệt Artist
export const useApproveArtist = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (short_id: string) => systemAdminApi.approveArtist(short_id),
        onSuccess: () => {
            CustomToast.success("Artist approved successfully!");
            queryClient.invalidateQueries({ queryKey: ['admin', 'artists_list'] });
            queryClient.invalidateQueries({ queryKey: ['artists'] });
            queryClient.invalidateQueries({ queryKey: ['user_me'] });
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    });
};

export const useGetAdminArtistDetail = (short_id: string) => {
    return useQuery({
        queryKey: ['admin_artist_detail', short_id],
        queryFn: () => systemAdminApi.getArtistDetail(short_id),
        enabled: !!short_id,
    });
};

export const useAdminToggleArtist = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ short_id, data }: { short_id: string, data: { action?: string; block_reason?: number, block_note?: string } }) => 
            systemAdminApi.toggleArtistStatus(short_id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'artists_list'] });
            queryClient.invalidateQueries({ queryKey: ['admin_artist_detail', variables.short_id] });
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    });
};

export const useGetPendingVerifications = () => {
    return useQuery({
        queryKey: ['artist_application_list'],
        queryFn: () => systemAdminApi.getPendingVerifications(),
    });
}

export const useGetDetailPendingVerifications = (id: number) => {
    return useQuery({
        queryKey: ['artist_application_detail', id],
        queryFn: () => systemAdminApi.getPendingVerifications(),
        enabled: !!id
    });
}

export const useActionVerification = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({id, data} : {  id: number, data: { action: string, reject_reason?: number, reject_note?: string } }) => 
            systemAdminApi.actionVerification(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'artists_list'] });
            queryClient.invalidateQueries({ queryKey: ['artist_application_list'] });
            queryClient.invalidateQueries({ queryKey: ['artist_application_detail', variables.id] });
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    });
}