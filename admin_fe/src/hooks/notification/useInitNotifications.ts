import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '../../stores/useNotificationStore';
import { api } from '../../api/axiosConfig';
import { useAuthStore } from '../../stores/auth/authStore';

export const useInitNotifications = () => {
    const { setInitial, addNewNotification } = useNotificationStore();
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuthStore(state => state)

    // lấy data noti
    useQuery({
        queryKey: ['my_notifications'],
        queryFn: async () => {
            const res = await api.get('/users/me/noti/');
            console.log(res)
            const notifs = res.data?.results || (res as any).results || res.data || [];
            const unread = res.data?.total_unread || (res as any).total_unread || 0
            setInitial(notifs, unread);
            return notifs;
        },
        enabled: isAuthenticated, 
        staleTime: Infinity, 
        refetchOnWindowFocus: false,
    });

    // mở kết nối websocket
    useEffect(() => {
        if (!isAuthenticated) return;

        const wsUrl = import.meta.env.DEV 
            ? 'ws://127.0.0.1:8000/ws/notifications/' 
            : 'wss://nk-music-stream.onrender.com/ws/notifications/';

        const ws = new WebSocket(wsUrl);
        
        ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                
                // thông báo cá nhân
                if (payload.type === 'notification') {
                    const newNotif = payload.data;
                    addNewNotification(newNotif);
                    
                    queryClient.setQueryData(['my_notifications'], (oldData: any) => {
                        const oldList = oldData?.results || oldData || [];
                        if (oldList.some((n: any) => n.id === newNotif.id)) 
                            return oldData;
                        return {
                            ...oldData,
                            total_unread: (oldData?.total_unread || 0) + 1,
                            results: [newNotif, ...oldList]
                        };
                    });
                }
                
                // Khi có thay đổi từ phía hệ thống ->  tự động reload data cho chính xác
                else if (payload.type === 'system_event') {
                    // Cứ có biến là tải lại các bảng danh sách cho cả Admin và Artist
                    queryClient.invalidateQueries({ queryKey: ['admin_tracks'] });
                    queryClient.invalidateQueries({ queryKey: ['admin_releases'] });
                    queryClient.invalidateQueries({ queryKey: ['my_tracks'] });
                    queryClient.invalidateQueries({ queryKey: ['my_releases'] });
                    queryClient.invalidateQueries({ queryKey: ['pendingReleases'] });
                }

            } catch (err) {
                console.error('Lỗi parse tin nhắn Socket:', err);
            }
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [isAuthenticated, addNewNotification, queryClient]);
};