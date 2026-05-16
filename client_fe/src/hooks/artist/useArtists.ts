import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listenerArtistApi } from '../../api/artist/api';
import { useAuthStore } from '../../stores/auth/authStore';

// GET
export const useGetArists = (search: string = '', page: number = 1, limit: number = 10) => {
    return useQuery({
        queryKey: ['artists', search, page, limit],
        queryFn: () => listenerArtistApi.get({ search, page, limit }),
        placeholderData: keepPreviousData,
    });
}

export const useGetArtistDetail = (short_id: string) => {
    return useQuery({
        queryKey: ['artist_detail', short_id],
        queryFn: () => listenerArtistApi.getDetail(short_id!),
        enabled: !!short_id,
    });
}

export const useFavouriteArtists = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    return useQuery({
        queryKey: ['favourite_artists'],
        queryFn: () => listenerArtistApi.getFavourite(),
        enabled: !!isAuthenticated,
    });
};

export const useTrendingArtists = () => {
    return useQuery({
        queryKey: ['trending_artists'],
        queryFn: () => listenerArtistApi.getTrending(),
    })
}

export const useToggleFavouriteArtist = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (short_id: string) => listenerArtistApi.toggleFavourite(short_id),
        onSuccess: (_) => {
            queryClient.invalidateQueries({ queryKey: ['artist_detail'] });
            queryClient.invalidateQueries({ queryKey: ['track_detail'] });
            queryClient.invalidateQueries({ queryKey: ['release_detail'] });
            
            // (Các key cũ của sếp)
            queryClient.invalidateQueries({ queryKey: ['trending_artists'] });
            queryClient.invalidateQueries({ queryKey: ['favourite_artists'] });
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    });
};

export const useApplyArtist = () => {
    return useMutation({
        mutationFn: (data: FormData) => listenerArtistApi.apply(data),
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    });
};

/************************************ */
export const useGetRelatedArtists = (short_id: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['related_artists', short_id],
        queryFn: () => listenerArtistApi.getRelated(short_id),
        enabled: !!short_id && enabled,
    });
};

export const useGetArtistDiscography = (short_id: string, type?: string) => {
    return useQuery({
        queryKey: ['artist_discography', short_id, type],
        queryFn: () => listenerArtistApi.getDiscography(short_id, type),
        enabled: !!short_id
    });
};