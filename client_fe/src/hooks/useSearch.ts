import { useQuery } from '@tanstack/react-query';
import { listenerMusicApi } from '../api/music/api';
import { listenerReleaseApi } from '../api/release/api';
import { listenerArtistApi } from '../api/artist/api';

export const useSearchTracks = (query: string) => {
    return useQuery({
        queryKey: ['search_tracks', query],
        queryFn: () => listenerMusicApi.get({search: query}),
        enabled: !!query,
    });
};

export const useSearchReleases = (query: string) => {
    return useQuery({
        queryKey: ['search_releases', query],
        queryFn: () => listenerReleaseApi.get({search: query}),
        enabled: !!query,
    });
};

export const useSearchArtists = (query: string) => {
    return useQuery({
        queryKey: ['search_artists', query],
        queryFn: () => listenerArtistApi.get({search: query}),
        enabled: !!query,
    });
};