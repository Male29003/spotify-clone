import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import playlistApi from '../../api/playlist/api';
import { useAuthStore } from '../../stores/auth/authStore';

// GET
export const useAllPlaylists = () => {
    return useQuery({
        queryKey: ['playlists'],
        queryFn: () => playlistApi.get(),
    });
};

export const useMyPlaylists = () => {
    const { isAuthenticated, isLoaded } = useAuthStore(state => state)
    return useQuery({
        queryKey: ['my_created_playlists'],
        queryFn: () => playlistApi.getLibrary(),
        enabled: !!isAuthenticated && isLoaded,
    });
}

export const useGetPlaylistDetail = (slug: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['playlist_detail', slug],
        queryFn: () => playlistApi.getDetail(slug),
        enabled: enabled && !!slug, 
    });
};

export const useGetFavouritePlaylists = () => {
    return useQuery({
        queryKey: ['favourite_playlists'],
        queryFn: () => playlistApi.getFavourite(),
    })
}

// POST, PUT, PATCH
export const useCreatePlaylist = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (
            data:{
                title: string;
            }
        ) => playlistApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['my_created_playlists']
            })
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    })
}

export const useToggleTrackPlaylist = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ playlist_slug, track_id }: { playlist_slug: string, track_id: number }) => {
            return playlistApi.update(playlist_slug, {
                action: 'add_remove_track',
                track_id: track_id,
            });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({queryKey: ['playlist_detail', variables.playlist_slug]})
            queryClient.invalidateQueries({queryKey: ['my_created_playlists']})
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    });
}

export const useUpdatePlaylist = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({slug, data} : {slug: string, data: any}) => playlistApi.update(slug, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['playlist_detail', variables.slug]
            })
            queryClient.invalidateQueries({
                queryKey: ['my_created_playlists']
            })
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    })
}

export const useDeletePlaylist = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (slug: string) => playlistApi.delete(slug),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['my_created_playlists']
            })
            queryClient.invalidateQueries({
                queryKey: ['playlists']
            })
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    })
}
