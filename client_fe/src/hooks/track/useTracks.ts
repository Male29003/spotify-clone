import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { listenerMusicApi  } from '../../api/music/api';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useAuthStore } from '../../stores/auth/authStore';
import { CustomToast } from '../../components/shared/feedback/CustomToast';
import axios from 'axios';

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
                const response = await listenerMusicApi.stream(shortId);
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
// GET
export const useGetTracks = (search: string = '', page: number = 1, limit: number = 10) => {
    return useQuery({
        queryKey: ['music', search, page, limit], 
        queryFn: () => listenerMusicApi.get({ search, page, limit }),
        placeholderData: keepPreviousData,
    });
};

export const useGetTrackDetail = (short_id: string) => {
    return useQuery({
        queryKey: ['track_detail', short_id],
        queryFn: () => listenerMusicApi.getDetail(short_id),
        enabled: !!short_id
    });
}

export const useGetFavouriteTracks = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    return useQuery({
        queryKey: ['favourite_tracks'],
        queryFn: () => listenerMusicApi.getFavourite(),
        enabled: !!isAuthenticated,
    });
};

export const useGetTrendingTracks = () => {
    return useQuery({
        queryKey: ['trending_tracks'],
        queryFn: () => listenerMusicApi.getTrending(),
    })
}

export const useGetRecentTracks = () => {
    return useQuery({
        queryKey: ['recent_tracks'],
        queryFn: () => listenerMusicApi.getRecent(),
    })
}

export const useToggleFavouriteTrack = () =>{
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (short_id: string) => listenerMusicApi.toggleFavourite(short_id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['track_detail'] });
            queryClient.invalidateQueries({ queryKey: ['playlist_detail'] });
            queryClient.invalidateQueries({ queryKey: ['artist_detail'] }); 
            queryClient.invalidateQueries({ queryKey: ['release_detail'] });
            queryClient.invalidateQueries({ queryKey: ['favourite_tracks'] });
            queryClient.invalidateQueries({ queryKey: ['trending_tracks'] });
            queryClient.invalidateQueries({ queryKey: ['recent_tracks'] });
            queryClient.invalidateQueries({ queryKey: ['recommended_tracks'] });
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    })
}

export const useRecommendedTracks = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    return useQuery({
        queryKey: ['recommended_tracks'],
        queryFn: () => listenerMusicApi.getRecommended(),
        enabled: !!isAuthenticated
    })
}

export const useRecordHistory = () => {
    return useMutation({
        mutationFn: (short_id: string) => listenerMusicApi.recordHistory(short_id)
    })
}

export const useListenerPlayer = () => {
    const playTrackBase = usePlayerStore((state) => state.playTrack);
    const playAndRecord = async (track: any, newQueue: any) => {
        playTrackBase(track, newQueue);
        try {
            await listenerMusicApi.recordHistory(track.short_id);
        } catch (error) {
            console.error("Error khi lưu lịch sử nghe nhạc:", error);
        }
    };
    return { playAndRecord };
};


export const useTrackDownload = () => {
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const abortControllerRef = useRef<AbortController | null>(null)

    const downloadTrack = async (item: any) => {
        if (isDownloading) return;

        try {
            setIsDownloading(true);

            const controller = new AbortController()
            abortControllerRef.current = controller;

            const response = await listenerMusicApi.download(item.short_id, {
                signal: controller.signal
            });
            
            const blobData = response.data ? response.data : response;
            const url = window.URL.createObjectURL(new Blob([blobData]));
            
            const link = document.createElement('a');
            link.href = url;
            
            let fileName = `${item.title}.mp3`;

            // Lấy header an toàn 
            const headers = response.headers || {};
            const contentDisposition = headers['content-disposition'];
            
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (fileNameMatch && fileNameMatch.length === 2) {
                    fileName = fileNameMatch[1];
                }
            }
            
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            
            // Dọn dẹp RAM
            link.remove();
            window.URL.revokeObjectURL(url);
            
        } catch (error: any) {
            if(axios.isCancel(error) || error.name === 'CanceledError' || error.name === 'AbortError'){
                console.log("cancel downloading:", item.title);
            } else {
                console.error("Download Error:", error);
            }
            console.error("Download Error:", error);
            CustomToast.error(`Cannot download song: ${item.title}!`);
        } finally {
            setIsDownloading(false);
            abortControllerRef.current = null
        }
    };

    const cancelDownload = () => {
        if(abortControllerRef.current){
            abortControllerRef.current.abort();
        }
    }

    return { downloadTrack, isDownloading, cancelDownload };
};

/*********************************************** */
export const useGetRelatedTracks = (short_id: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['related_tracks', short_id],
        queryFn: () =>listenerMusicApi.getRelated(short_id),
        enabled: enabled
    });
};