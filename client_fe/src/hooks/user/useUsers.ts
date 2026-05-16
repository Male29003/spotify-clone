import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "../../api/user/api";
import { useAuthStore } from "../../stores/auth/authStore";

// ========================= For normal users =========================
// GET
export const useGetMe = () => {
    return useQuery({
        queryKey: ['user_me'],
        queryFn: () => userApi.getMe()
    })
}

export const useGetUserProfile = (username: string) => {
    return useQuery({
        queryKey: ['user_profile', username],
        queryFn: () => userApi.getUserProfile(username),
        enabled: !!username
    })
}

// POST, PUT, PATCH
export const useUpdateProfile = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: any) => userApi.updateMe(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user_me']})
            queryClient.invalidateQueries({ queryKey: ['user_profile']})
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    })
}

export const useChangePassword = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: any) => userApi.changePassword(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user_me']})
            queryClient.invalidateQueries({ queryKey: ['user_profile']})
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    })
}

export const useGetNotifications = () => {
    const { isAuthenticated } = useAuthStore(state => state)
    return useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const response = await userApi.getNotifications()
            return response.data
        },
        enabled: !!isAuthenticated,
        // mỗi 2 phút cập nhật thông báo 1 lần
        refetchInterval: 2000 * 60,
    })
}

export const useMarkAsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => userApi.readNotifications(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });
};