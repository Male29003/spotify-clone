import React from 'react';
import MediaSection from '../../sections/home/MediaSection';
import Loader from '../../components/shared/ui/Loader';
import { useGetTrendingReleases, useGetRecent, useGetRecommended } from '../../hooks/release/useReleases';
import { useTrendingArtists } from '../../hooks/artist/useArtists';
import { useMyPlaylists } from '../../hooks/playlist/usePlaylists';
import { useRandomGenreMix } from '../../hooks/genre/useGenre';
import { useRecommendedTracks } from '../../hooks/track/useTracks';
import { useAuthStore } from '../../stores/auth/authStore';

const HomePage: React.FC = () => {
    const { isAuthenticated, user } = useAuthStore(state => state);

    const { data: artistsData, isLoading: loadingArtists } = useTrendingArtists();
    const { data: releasesData, isLoading: loadingReleases } = useGetTrendingReleases();
    const { data: randomGenreMix, isLoading: loadingGenres } = useRandomGenreMix();
    
    const { data: myPlaylistData, isLoading: loadingPlaylists } = useMyPlaylists();
    const { data: recommendTracks, isLoading: loadingRecommendedTracks } = useRecommendedTracks();
    const { data: recentReleases, isLoading: loadingRecentReleases } = useGetRecent();
    const { data: recommendReleases, isLoading: loadingRecommendedReleases } = useGetRecommended();
    
    if (loadingArtists || loadingReleases || loadingGenres) {
        return <Loader />;
    }
    
    const artists = (artistsData as any)?.results || artistsData || [];
    const releases = (releasesData as any)?.results || releasesData || [];
    const genreMix = (randomGenreMix as any)?.results || randomGenreMix || [];
    
    const playlists = (myPlaylistData as any)?.results || myPlaylistData || [];
    const recentRel = (recentReleases as any)?.results || recentReleases || [];

    const rawRcmRel = (recommendReleases as any)?.results || recommendReleases || [];
    const rcmRel = rawRcmRel.map((item: any) => ({ ...item, item_type: 'release' }));

    const rawRcmT = (recommendTracks as any)?.results || recommendTracks || [];
    const rcmT = rawRcmT.map((item: any) => ({ ...item, item_type: 'track' }));

    const rcmItems = [...rcmRel, ...rcmT];

    return (
        <div className="space-y-10 pb-8 pt-4">
            {isAuthenticated && (
                <>
                    {recentRel.length > 0 && (
                        <MediaSection title="Recent releases" items={recentRel} itemType="release" />
                    )}
                    {rcmItems.length > 0 && (
                        <MediaSection title="Recommend for you" items={rcmItems} itemType="mixed" />
                    )}
                    {playlists.length > 0 && (
                        <MediaSection title="Enjoy your playlists" items={playlists} itemType="playlist" />
                    )}
                </>
            )}

            {releases.length > 0 && (
                <MediaSection title="Popular albums and singles" items={releases} itemType="release" />
            )}
            
            {artists.length > 0 && (
                <MediaSection title="Trending artists" items={artists} itemType="artist" />
            )}
            
            {genreMix && genreMix.top_tracks && genreMix.top_tracks.length > 0 && (
                <MediaSection title={`${genreMix.name} Mix`} items={genreMix.top_tracks} itemType="track" />
            )}
            
        </div>
    );
};

export default HomePage;
