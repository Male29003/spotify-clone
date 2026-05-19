import React from 'react';
import MediaSection from '../../components/shared/media/MediaSection';
import { MediaSectionSkeleton } from '../../components/skeleton/MediaSectionSkeleton';
import Loader from '../../components/shared/ui/Loader';
import { useGetTrendingReleases, useGetRecent, useGetRecommended } from '../../hooks/release/useReleases';
import { useTrendingArtists } from '../../hooks/artist/useArtists';
import { useMyPlaylists } from '../../hooks/playlist/usePlaylists';
import { useRandomGenreMix } from '../../hooks/genre/useGenre';
import { useRecommendedTracks } from '../../hooks/track/useTracks';
import { useAuthStore } from '../../stores/auth/authStore';

const HomePage: React.FC = () => {
    const { isAuthenticated } = useAuthStore(state => state);

    const { data: artistsData, isLoading: loadingArtists } = useTrendingArtists();
    const { data: releasesData, isLoading: loadingReleases } = useGetTrendingReleases();
    const { data: randomGenreMix, isLoading: loadingGenres } = useRandomGenreMix();
    
    const { data: myPlaylistData, isLoading: loadingPlaylists } = useMyPlaylists();
    const { data: recommendTracks, isLoading: loadingRecommendedTracks } = useRecommendedTracks();
    const { data: recentReleases, isLoading: loadingRecentReleases } = useGetRecent();
    const { data: recommendReleases, isLoading: loadingRecommendedReleases } = useGetRecommended();
    
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
                    {loadingRecentReleases ? <MediaSectionSkeleton title="Recent releases"/> 
                    : 
                        recentRel.length > 0 && 
                            <MediaSection title="Recent releases" items={recentRel} itemType="release" />
                    }
                    {loadingRecommendedTracks || loadingRecommendedReleases ? <MediaSectionSkeleton title="Recommend for you" /> 
                    :
                        rcmItems.length > 0 && 
                            <MediaSection title="Recommend for you" items={rcmItems} itemType="mixed" />
                    }
                </>
            )}

            {loadingReleases ? <MediaSectionSkeleton title="Popular albums and singles" itemCount={10}/>
            :
                releases.length > 0 && (
                    <MediaSection title="Popular albums and singles" items={releases} itemType="release" />
                )
            }
            
            {loadingArtists ? <MediaSectionSkeleton title="Trending artists" itemCount={10}/>
            :
                artists.length > 0 && (
                    <MediaSection title="Trending artists" items={artists} itemType="artist" />
                )
            }
            
            {loadingGenres ? <MediaSectionSkeleton title="Genre Mix" itemCount={10}/>
            :   
                genreMix && genreMix.top_tracks && genreMix.top_tracks.length > 0 && (
                    <MediaSection title={`${genreMix.name} Mix`} items={genreMix.top_tracks} itemType="track" />
                )
            }

            {isAuthenticated && (
                <>
                    {loadingPlaylists ? <MediaSectionSkeleton title="Enjoy your playlists" /> 
                    :
                        playlists.length > 0 &&
                            <MediaSection title="Enjoy your playlists" items={playlists} itemType="playlist" />
                    }
                </>
            )}
        </div>
    );
};

export default HomePage;
