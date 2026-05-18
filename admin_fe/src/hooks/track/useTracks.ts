import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { studioMusicApi, adminApi as systemAdminApi, sharedApi  } from '../../api/music/api';
import { useEffect, useRef, useState } from 'react';

export const useStreamAudio = (shortId: string | undefined, isPlaying: boolean) => {
    const [audioUrl, setAudioUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const lastUrl = useRef<string>('');
    const fetchId = useRef<string>('')

    useEffect(() => {
        let ignore = false;

        if (!shortId) {
            setAudioUrl('');
            fetchId.current = '';
            return;
        }

        if(fetchId.current === shortId) return;
        if(!isPlaying) return

        fetchId.current = shortId;
        setAudioUrl('')
        setIsLoading(true)

        const fetchStream = async () => {
            try {
                const response = await sharedApi.stream(shortId);
                // Nếu đang fetch nhạc mà user bấm bài mới thì trả về
                if(ignore) return;

                const blob = response.data || response;
                const newUrl = URL.createObjectURL(blob);
                setAudioUrl(newUrl);

                if (lastUrl.current) {
                    URL.revokeObjectURL(lastUrl.current);
                }
                lastUrl.current = newUrl;

            } catch (error) {
                if(ignore) return;

                console.error("Error stream bài hát:", error);
                setAudioUrl('');
                fetchId.current = ''
            } finally {
                if(!ignore){
                    setIsLoading(false);
                }
            }
        };
        fetchStream();

        // Khi short_id thay đổi thì ignore bài đang gọi dở dang
        return () => {
            ignore = true;
        }
    }, [shortId, isPlaying]);

    return { audioUrl, isLoading };
};

// ============================ For admin  ============================
export const useGetTracks = (
    params: { search?: string, page?: number, limit?: number, status?: string, genre?: number },
    isEnabled: boolean = true
) => {
    return useQuery({
        queryKey: ['admin_tracks', params],
        queryFn: () => systemAdminApi.get(params),
        placeholderData: keepPreviousData,
        enabled: isEnabled
    })
}

export const useGetTrackDetail = (short_id: string) => {
    return useQuery({
        queryKey: ['track-detail', short_id],
        queryFn: () => systemAdminApi.getDetail(short_id),
        placeholderData: keepPreviousData,
    })
}

export const useAdminUpdateTrackStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ short_id, data }: { short_id: string, data: { action?: string; block_reason?: number, block_note?: string } }) => 
            systemAdminApi.blockTrack(short_id, data), 
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin_release_detail'] });
            queryClient.invalidateQueries({ queryKey: ['admin_tracks'] });
            queryClient.invalidateQueries({ queryKey: ['track-detail', variables.short_id] });
            queryClient.invalidateQueries({ queryKey: ['admin_artist_detail'] });
            // artsit
            queryClient.invalidateQueries({ queryKey: ['my_tracks'] });
            queryClient.invalidateQueries({ queryKey: ['my_release_detail'] })
            queryClient.invalidateQueries({ queryKey: ['track_detail', variables.short_id] });
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    });
};

// ============================ For artist ============================
// upload trực tiếp 1 bài lẻ vào release
export const useUploadTrack = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (formData: FormData) => studioMusicApi.upload(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my_tracks'] });
            queryClient.invalidateQueries({ queryKey: ['my_release_detail'] })
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    });
};

export const useGetMyTracks = (params: { search?: string; page?: number; limit?: number }, isEnabled: boolean = true) => {
    return useQuery({ 
        queryKey: ['my_tracks', params], 
        queryFn: () => studioMusicApi.get(params),
        enabled: isEnabled,
        placeholderData: keepPreviousData
    });
};

export const useUpdateMyTrack = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ short_id, data }: { short_id: string, data: any }) => studioMusicApi.patch(short_id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['my_tracks'] });
            queryClient.invalidateQueries({ queryKey: ['track_detail', variables.short_id] });
            queryClient.invalidateQueries({ queryKey: ['unassigned_tracks'] });
            queryClient.invalidateQueries({ queryKey: ['my_release_detail'] }); 
            // admin
            queryClient.invalidateQueries({ queryKey: ['admin_artist_detail'] });
            queryClient.invalidateQueries({ queryKey: ['track-detail', variables.short_id] });
            queryClient.invalidateQueries({ queryKey: ['admin_tracks'] });
            queryClient.invalidateQueries({ queryKey: ['admin_release_detail'] });
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    });
};
//
//  Lấy nhạc lẻ ( ko có release )
export const useGetUnassignedTracks = () => {
    return useQuery({
        queryKey: ['unassigned_tracks'],
        queryFn: async () => {
            const response = await studioMusicApi.getUnassigned();
            return response?.data ?? response ?? [];
        }
    });
};
