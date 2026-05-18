import { api } from '../../api/axiosConfig';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../stores/useNotificationStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { CustomToast } from '../../components/shared/feedback/CustomToast';
import { useAuthStore } from '../../stores/auth/authStore';

export const useSystemWebSocket = () => {
    const { setInitial, addNewNotification } = useNotificationStore(state => state)
    const queryClient = useQueryClient();
    const navigate = useNavigate()
    const { isAuthenticated, isLoaded } = useAuthStore(state => state)

    useQuery({
        queryKey: ['my_notifications_init'],
        queryFn: async () => {
            const res = await api.get('/users/me/noti/');
            const notifs = res.data?.results || (res as any).results || res.data || [];
            const unread = res.data?.total_unread || (res as any).total_unread || 0;
            setInitial(notifs, unread);
            return notifs;
        },
        enabled: isAuthenticated && isLoaded, 
        staleTime: Infinity,
    });

    useEffect(() => {
        if (!isAuthenticated) return;
        
        const wsUrl = import.meta.env.DEV 
            ? 'ws://127.0.0.1:8000/ws/notifications/' 
            : 'wss://nk-music-stream.onrender.com/ws/notifications/';

        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
            console.log("🔥 Nhận tin từ WS:", event.data);
            const data = JSON.parse(event.data);

            // nếu data cập nhật phía admin -> update data ngay
            if (data.type === 'system_event') {
                const { action, payload } = data;
                
                if (action === 'CONTENT_BLOCKED' || action === 'CONTENT_UNBLOCKED') {
                    const playerState = usePlayerStore.getState()
                    const currentPath = window.location.pathname

                    if (payload.type === 'track') {
                        queryClient.invalidateQueries({ queryKey: ['music'] });
                        queryClient.invalidateQueries({ queryKey: ['track_detail', payload.short_id] });
                        queryClient.invalidateQueries({ queryKey: ['trending_tracks'] });
                        queryClient.invalidateQueries({ queryKey: ['favourite_tracks'] }); 
                        queryClient.invalidateQueries({ queryKey: ['recent_tracks'] }); 
                        queryClient.invalidateQueries({ queryKey: ['playlists'] }); 
                        queryClient.invalidateQueries({ queryKey: ['playlist_detail'] }); 
                        queryClient.invalidateQueries({ queryKey: ['artist_detail'] }); 
                        queryClient.invalidateQueries({ queryKey: ['recent_tracks'] }); 
                        queryClient.invalidateQueries({ queryKey: ['recommended_tracks'] }); 
                        // ngắt phát nhạc
                        const isPlayingTarget = playerState.currentTrack?.short_id === payload.short_id;
                        const isInQueue = playerState.queue.some(t => t.short_id === payload.short_id);
                        if(isPlayingTarget) {
                            CustomToast.error('Playing song is now blocked. We are so sorry for this inconvenience.')
                        } else if (isInQueue) {
                            CustomToast.error('One song in playing queue is now blocked. We are so sorry for this inconvenience.')
                        }
                        playerState.removeBlockedTrack(payload.short_id);
                        if(currentPath == `/track/${payload.short_id}`){
                            navigate('/')
                            CustomToast.error('This content is more longer available on this platform.')
                        }

                    } 
                    else if (payload.type === 'release') {
                        queryClient.invalidateQueries({ queryKey: ['releases'] });
                        queryClient.invalidateQueries({ queryKey: ['release_detail', payload.short_id] });
                        queryClient.invalidateQueries({ queryKey: ['trending_releases'] });
                        queryClient.invalidateQueries({ queryKey: ['favourite_releases'] });
                        queryClient.invalidateQueries({ queryKey: ['recent-releases'] });
                        queryClient.invalidateQueries({ queryKey: ['recommended-releases'] });
                        queryClient.invalidateQueries({ queryKey: ['artist_detail'] }); 
                        queryClient.invalidateQueries({ queryKey: ['playlists'] }); 
                        queryClient.invalidateQueries({ queryKey: ['playlist_detail'] }); 
                        
                        // ngắt phát nhạc
                        const isPlayingTarget = playerState.currentTrack?.release_short_id === payload.short_id;
                        const isInQueue = playerState.queue.some(t => t.release?.short_id === payload.short_id);
                        if(isPlayingTarget) {
                            CustomToast.error('Playing Album / EP is now blocked.')
                        } else if (isInQueue) {
                            CustomToast.error('A few songs in playing queue is now blocked.')
                        }
                        playerState.removeBlockedRelease(payload.short_id);

                        if(currentPath == `/release/${payload.short_id}`){
                            navigate('/')
                            CustomToast.error('This content is more longer available on this platform.')
                        }

                    }
                }
                else if (action === 'ARTIST_BLOCKED' || action === 'ARTIST_UNBLOCKED') {
                    queryClient.invalidateQueries({ queryKey: ['music'] });
                    queryClient.invalidateQueries({ queryKey: ['releases'] });
                    queryClient.invalidateQueries({ queryKey: ['playlist_detail'] }); 
                    queryClient.invalidateQueries({ queryKey: ['playlists'] }); 

                    const playerState = usePlayerStore.getState();
                    const currentPath = window.location.pathname;

                    // ngắt phát nhạc
                    const isPlayingTarget = playerState.currentTrack?.artist?.short_id === payload.short_id;
                    if (isPlayingTarget) {
                        CustomToast.error(`Music from ${playerState.currentTrack?.artist?.stage_name} is no longer available in our platform`);
                    }
                    playerState.removeBlockedArtist(payload.short_id);
                    
                    if (currentPath === `/artist/${payload.short_id}`) {
                        navigate('/');
                        CustomToast.error(`Artist ${playerState.currentTrack?.artist?.stage_name} is no longer availble in our platform.`);
                    }
                }
                else if (action === 'NEW_RELEASE') {
                    queryClient.invalidateQueries({ queryKey: ['releases'] });
                    queryClient.invalidateQueries({ queryKey: ['recent-releases'] });
                    queryClient.invalidateQueries({ queryKey: ['trending_releases'] });
                }
            }
            
            // thông báo cá nhân của user
            if (data.type === 'notification') {
                const newNotif = data.data;
                addNewNotification(newNotif);
                
            }
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [isAuthenticated, queryClient, navigate, addNewNotification]);
};