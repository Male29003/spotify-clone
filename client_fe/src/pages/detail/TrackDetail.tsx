import React from 'react';
import { useParams } from 'react-router-dom';
import { Favorite, FavoriteBorder, PlayArrow } from '@mui/icons-material';
import { usePlayerStore } from '../../stores/usePlayerStore';
import TrackTable from '../../components/detail/TrackTable';
import { useGetRelatedTracks, useGetTrackDetail, useToggleFavouriteTrack, useTrackDownload } from '../../hooks/track/useTracks';
import { useAuthStore } from '../../stores/auth/authStore';
import { CustomToast } from '../../components/shared/feedback/CustomToast';
import DetailPageLayout from '../../layouts/detail/DetailLayout';
import ArtistMiniCard from '../../components/shared/ui/ArtistMiniCard';
import { useGetRelatedReleases } from '../../hooks/release/useReleases';
import { useGetRelatedArtists } from '../../hooks/artist/useArtists';
import MediaSection from '../../components/shared/media/MediaSection';
import { TrackTableSkeleton } from '../../components/shared/skeleton/TrackTableSkeleton';
import { MediaSectionSkeleton } from '../../components/shared/skeleton/MediaSectionSkeleton';
import { ArtistMiniCardSkeleton } from '../../components/shared/skeleton/ArtistMiniCardSkeleton';

const TrackDetail: React.FC = () => {
    const{ user, isAuthenticated } = useAuthStore(state => state)
    const { short_id } = useParams<{ short_id: string }>();
    const playTrack = usePlayerStore(state => state.playTrack);

    // Lấy data
    const { data: trackData, isLoading } = useGetTrackDetail(short_id || '')
    const track = trackData?.data || trackData; 
    const { data: relatedReleasesData, isLoading: loadingRelatedRelease } = useGetRelatedReleases(track.release_short_id || '');
    const { data: relatedTracksData, isLoading: loadingRelatedTrack } = useGetRelatedTracks(track?.short_id || '')
    const { data: relatedArtistsData, isLoading: loadingRelatedArtist } = useGetRelatedArtists(track?.artist?.short_id || '');
    // Xứ lý chức năng
    const { downloadTrack, isDownloading, cancelDownload } = useTrackDownload()
    const {mutate: toggleMutation} = useToggleFavouriteTrack()
    
    const handleFavourite= (e: React.MouseEvent) => {
        e.stopPropagation();
        if(!isAuthenticated){
            CustomToast.info("Please log in to use this function !");
            return
        }
        if(short_id) 
            toggleMutation(short_id)
    }

    if (!isLoading && !track) return <div className="text-center text-text-main mt-20">Song not found</div>;

    const trackItem = {
        ...track,
        type: 'track'
    }

    const relatedReleases = (relatedReleasesData as any)?.results || [];
    const relatedArtists = (relatedArtistsData as any)?.results || [];
    const relatedTracks = (relatedTracksData as any)?.results || [];

    const ActionBtns = (
        <>
            <button 
                className="btn-neon-glow w-14 h-14 bg-highlight rounded-full flex items-center justify-center text-text-dark hover:scale-105 transition-transform shadow-xl"
                onClick={() => {
                    playTrack(track, [track]);
                }}
            >
                <PlayArrow className="text-4xl!" />
            </button>
            {track?.is_favourite ? (
                    <Favorite 
                        className="text-highlight text-4xl! cursor-pointer hover:scale-110 transition-transform" 
                        onClick={handleFavourite}    
                    />

                ) : (
                    <FavoriteBorder 
                        className="text-text-sub text-4xl! cursor-pointer hover:text-text-main transition-colors"
                        onClick={handleFavourite}    
                    />
                )
            }
            <div
                title={!user?.is_premium ? "Premium only" : "Download"}
                className={`rounded-full md:w-12 md:h-12 shadow-md flex items-center justify-center transition-all duration-200
                    ${!user?.is_premium ? 'opacity-50'
                        : 
                        'bg-hover/40 text-text-sub hover:bg-hover cursor-pointer hover:scale-110 hover:text-highlight '
                    }`}
                onClick={(e) => {
                    e.stopPropagation();
                    if(!user?.is_premium) {
                        return
                    }

                    if (!isDownloading) {
                        downloadTrack(track); 
                    } else {
                        cancelDownload();
                    }
                }}
            />
        </>
    )
    
    return (
        <DetailPageLayout 
            isLoading={isLoading}
            actionBtns={ActionBtns}
            item={track}
            type='Track'
            totalTracks={1}
            mainContent={
                isLoading ? <TrackTableSkeleton key={'skeleton-track-table'} rows={1} />
                :
                    <TrackTable
                        tracks={[trackItem]}
                        playTrack={playTrack}
                    />
            }
            subContent={
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-text-main">About Artist</h3>
                    {isLoading ? (
                        <ArtistMiniCardSkeleton />
                    ) : (
                        <ArtistMiniCard artist={track.artist} />
                    )}
                </div>
            }
            children={
                <div className='flex flex-col gap-12 mt-4'>
                    {/* You may like - Tracks */}
                    {loadingRelatedTrack ? <MediaSectionSkeleton key={'related_tracks-skeleton'} title='Songs You May Also Like' />
                    : 
                        relatedTracks?.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <h2 className="text-2xl font-bold text-text-main">Songs You May Also Like</h2>
                                <MediaSection 
                                    title=""
                                    items={relatedTracks.slice(0,8)}
                                    itemType='track'
                                />
                            </div>
                        )
                    }
                    {/* You may like - Releases */}
                    {loadingRelatedRelease ? <MediaSectionSkeleton key={'related_releases-skeleton'} title='Releases You May Also Like' />
                    :
                        relatedReleases?.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <h2 className="text-2xl font-bold text-text-main">Releases You May Also Like</h2>
                                <MediaSection 
                                    title=""
                                    items={relatedReleases.slice(0,8)}
                                    itemType='release'
                                />
                            </div>
                        )
                    }
                    {/* You may like - Artists */}
                    {loadingRelatedArtist ? <MediaSectionSkeleton key={'related_artists-skeleton'} title='Artists You May Like'  type='artist' />
                    :  
                        relatedArtists?.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <h2 className="text-2xl font-bold text-text-main">Artists You May Like</h2>
                                <MediaSection 
                                    title=""
                                    items={relatedArtists.slice(0,8)}
                                    itemType='artist'
                                />
                            </div>
                        )
                    }
                </div>
            }
        />
    );
};

export default TrackDetail;