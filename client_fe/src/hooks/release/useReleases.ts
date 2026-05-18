import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth/authStore';
import { listenerReleaseApi } from '../../api/release/api';
import { CustomToast } from '../../components/shared/feedback/CustomToast';
import { useRef, useState } from 'react';
import axios from 'axios';

// ======================= For normal users ======================= 
// GET
export const useGetReleases = (search: string = '', page: number = 1, limit: number = 10) => {
    return useQuery({
        queryKey: ['releases', search, page, limit],
        queryFn: () => listenerReleaseApi.get({ search, page, limit }),
        placeholderData: keepPreviousData,
    });
};

export const useGetFavouriteReleases = () => {
    const { isAuthenticated, isLoaded } = useAuthStore(state => state)
    return useQuery({
        queryKey: ['favourite_releases'],
        queryFn: () => listenerReleaseApi.getFavourite(),
        enabled: !!isAuthenticated && isLoaded,
    });
};

export const useGetTrendingReleases = () => {
    return useQuery({
        queryKey: ['trending_releases'],
        queryFn: () => listenerReleaseApi.getTrending(),
    })
}

export const useGetReleaseDetail = (short_id: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['release_detail', short_id],
        queryFn: () => listenerReleaseApi.getDetail(short_id),
        enabled: enabled && !!short_id,
    });
};

export const useGetRecommended = () => {
    const { isAuthenticated, isLoaded } = useAuthStore(state => state)
    return useQuery({
        queryKey: ['recommended-releases'],
        queryFn: () => listenerReleaseApi.getRecommended(),
        enabled: !!isAuthenticated && isLoaded
    })
}

export const useGetRecent = () => {
    const { isAuthenticated, isLoaded } = useAuthStore(state => state)
    return useQuery({
        queryKey: ['recent-releases'],
        queryFn: () => listenerReleaseApi.getRecent(),
        enabled: !!isAuthenticated && isLoaded
    })
}

// lấy danh sách release của 1 artist cụ thể
export const useGetArtistRelease = (short_id: string) => {
    return useQuery({
        queryKey: ['recent-releases'],
        queryFn: () => listenerReleaseApi.getRecent(),
    })
}

// POST, PUT, PATCH
export const useToggleFavouriteRelease = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (short_id: string) => listenerReleaseApi.toggleFavourite(short_id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['release_detail'] }); 
            queryClient.invalidateQueries({ queryKey: ['artist_detail'] });
            queryClient.invalidateQueries({ queryKey: ['favourite_releases'] });
            queryClient.invalidateQueries({ queryKey: ['recommended-releases'] });
            queryClient.invalidateQueries({ queryKey: ['recent-releases'] });
            queryClient.invalidateQueries({ queryKey: ['trending_releases'] });
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    })
}

export const useReleaseDownload = () => {
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    
    const downloadRelease = async (item: any) => {
        if (isDownloading) return;

        try {
            setIsDownloading(true);
            CustomToast.success(`Downloading release ${item.title}...`);

            // tạo "Remote" -> lưu vào Ref
            const controller = new AbortController();
            abortControllerRef.current = controller;

            //  Gắn signal vào API
            const response = await listenerReleaseApi.download(item.short_id, {
                signal: controller.signal
            });
            
            const blobData = response.data ? response.data : response;
            const url = window.URL.createObjectURL(new Blob([blobData]));
            
            const link = document.createElement('a');
            link.href = url;
            
            let fileName = `${item.title}.zip`; 

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
            
            link.remove();
            window.URL.revokeObjectURL(url);
            
        } catch (error: any) {
            // Phân biệt lỗi ngưng tải và lỗi khác
            if (axios.isCancel(error) || error.name === 'CanceledError' || error.name === 'AbortError') {
                CustomToast.info("cancel downloading!");
            } else {
                console.error("Download Error:", error);
                CustomToast.error("Cannot download release!");
            }
        } finally {
            setIsDownloading(false);
            abortControllerRef.current = null;
        }
    };

    // hủy tải
    const cancelDownload = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    return { downloadRelease, isDownloading, cancelDownload };
};

/********************************************************************* */
export const useGetRelatedReleases = (short_id: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['related_releases', short_id],
        queryFn: () => listenerReleaseApi.getRelated(short_id),
        enabled: !!short_id && enabled,
    });
};