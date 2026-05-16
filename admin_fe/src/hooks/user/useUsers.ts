import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { adminApi, userApi } from "../../api/user/api";
import { useAuthStore } from "../../stores/auth/authStore";
import { CustomToast } from "../../components/shared/feedback/CustomToast";

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
        onSuccess: () => queryClient.invalidateQueries({ 
            queryKey: ['user_me']
        }),
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
            queryClient.invalidateQueries({ 
                queryKey: ['user_me']
            })
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
        initialData: [],
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

// ========================= For admin =========================
export const useGetUsers = (
    params: { search?: string, page?: number, limit?: number, is_active: boolean, is_staff: boolean },
    isEnabled: boolean = true
) => {
    return useQuery({
        queryKey: ['users', params],
        queryFn: () => adminApi.get(params),
        placeholderData: keepPreviousData,
        enabled: isEnabled
    })
}

export const useGetStaff = (params: { search?: string, page?: number, limit?: number}) => {
    return useQuery({
        queryKey: ['staffs', params],
        queryFn: () => adminApi.getStaff(params),
        placeholderData: keepPreviousData
    })
}

export const useGetDetailStaff = (id: number) => {
    return useQuery({
        queryKey: ['staff_detail'],
        queryFn: () => adminApi.getStaffDetail(id),
        placeholderData: keepPreviousData
    })
}

export const useCreatedStaff = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: FormData) => adminApi.createStaff(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staffs'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    })
}

export const useUpdateStaff = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => adminApi.updateStaff(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staffs'] }),
        onError: (error: any) => CustomToast.error(error.response?.data?.detail || "Lỗi cập nhật!")
    });
};

export const useDeleteStaff = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => adminApi.deleteStaff(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staffs'] }),
        onError: (error: any) => CustomToast.error(error.response?.data?.detail || "Lỗi xóa nhân viên!")
    });
};

export const useGetUserDetail = (id: number) => {
    return useQuery({
        queryKey: ['user_detail', id],
        queryFn: () => adminApi.getDetail(id),
    })
}

export const useUpdateUserRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({id, type} : {id: number, type: string}) => 
            adminApi.updateUserRole(id, {type}),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user_detail', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['user_me', variables.id] });
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    });
};

// Khóa / Mở khóa tài khoản
export const useToggleUserStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({id, data}: {id: number, data: { is_active: boolean, block_note?: string, block_reason?: number}}) => 
            adminApi.toggleUserStatus(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['users']});
            queryClient.invalidateQueries({ queryKey: ['staffs']});
            queryClient.invalidateQueries({ queryKey: ['user_detail', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'artists_list'] });
            queryClient.invalidateQueries({ queryKey: ['admin_artist_detail', variables.id]});
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    });
};
