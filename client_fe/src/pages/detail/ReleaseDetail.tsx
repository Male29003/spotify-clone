import React from 'react';
import { useParams } from 'react-router-dom';
import DetailPageLayout from '../../layouts/detail/DetailLayout';
import TrackTable from '../../components/detail/TrackTable';
import { useAuthStore } from '../../stores/auth/authStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useReleaseDownload } from '../../hooks/release/useReleases';
import { useGetRelatedArtists } from '../../hooks/artist/useArtists';
import ArtistMiniCard from '../../components/shared/ui/ArtistMiniCard';
import { CustomToast } from '../../components/shared/feedback/CustomToast';
import { PlayArrow, FavoriteBorder, Favorite, Download, Cancel } from '@mui/icons-material';
import { useGetRelatedReleases, useGetReleaseDetail, useToggleFavouriteRelease } from '../../hooks/release/useReleases';
import MediaSection from '../../components/shared/media/MediaSection';
import { TrackTableSkeleton } from '../../components/skeleton/TrackTableSkeleton';
import { MediaSectionSkeleton } from '../../components/skeleton/MediaSectionSkeleton';
import { ArtistMiniCardSkeleton } from '../../components/skeleton/ArtistMiniCardSkeleton';

const ReleaseDetail: React.FC = () => {
    const { short_id } = useParams<{ short_id: string }>();
    const playTrack = usePlayerStore(state => state.playTrack);
    const { user, isAuthenticated }  = useAuthStore(state => state)

    // Lấy data
    const { data: releaseData, isLoading } = useGetReleaseDetail(short_id || '')
    const release = releaseData?.data || releaseData; 

    const { data: relatedReleasesData, isLoading: loadingRelatedRelease } = useGetRelatedReleases(release?.short_id || '');
    const { data: relatedArtistsData, isLoading: loadingRelatedArtist } = useGetRelatedArtists(release?.artist?.short_id || '');
    // Xứ lý chức năng
    const {mutate: toggleMutation} = useToggleFavouriteRelease()
    const { downloadRelease, isDownloading, cancelDownload } = useReleaseDownload()

    const handleFavourite= (e: React.MouseEvent) => {
        e.stopPropagation();
        if(!isAuthenticated){
            CustomToast.info("Please log in to use this function !");
            return
        }
        if(short_id) 
            toggleMutation(short_id)
    }
    // Xứ lý data
    if (!isLoading && !release) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center text-text-main mt-20 text-xl font-bold">
                    Release not found
                </div>
            </div>
        );
    }
    const relatedReleases = (relatedReleasesData as any)?.results || [];
    const relatedArtists = (relatedArtistsData as any)?.results || [];
    
    const tracks = release?.tracks || [];

    const ActionBtns = (
        <>
            <button 
                className="btn-neon-glow w-14 h-14 bg-highlight rounded-full flex items-center justify-center text-text-dark hover:scale-105 transition-transform shadow-xl"
                onClick={() => {
                    if (tracks.length > 0) playTrack(tracks[0], tracks);
                }}
            >
                <PlayArrow className="text-4xl!" />
            </button>
            {release?.is_favourite ? (
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
                        CustomToast.info('This function is for Premium users only!');
                        return
                    }

                    if (!isDownloading) {
                        downloadRelease(release); 
                    } else {
                        cancelDownload();
                    }
                }}
            >
                {isDownloading ?
                    <Cancel className="text-3xl!" />                    
                :
                    <Download className="text-3xl!" />
                }
            </div>
        </>
    )
    return (
        <DetailPageLayout 
            isLoading={isLoading}
            actionBtns={ActionBtns}
            item={release}
            type='Release'
            totalTracks={tracks.length}
            mainContent={
                isLoading ? <TrackTableSkeleton key={'skeleton-track-table'} rows={5} />
                :
                    <TrackTable
                        tracks={tracks}
                        playTrack={playTrack}
                    />
            }
            subContent={
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-text-main">About Artist</h3>
                    {isLoading ? (
                        <ArtistMiniCardSkeleton />
                    ) : (
                        <ArtistMiniCard artist={release.artist} />
                    )}
                </div>
            }
            children={
                <div className='flex flex-col gap-12 mt-4'>
                    {/* You may like - Releases */}
                    {loadingRelatedRelease ? <MediaSectionSkeleton key={'related_releases-skeleton'} title='' itemCount={8}/>
                    :
                        relatedReleases.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <h2 className="text-2xl font-bold text-text-main">You May Also Like (Albums)</h2>
                                <MediaSection 
                                    title=""
                                    items={relatedReleases.slice(0,8)}
                                    itemType='release'
                                />
                            </div>
                        )
                    }
                    {/* You may like - Artists */}
                    {loadingRelatedArtist ? <MediaSectionSkeleton key={'related_artists-skeleton'} title='' itemCount={8}  type='artist'/>
                    :    relatedArtists.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <h2 className="text-2xl font-bold text-text-main">Fans Also Like</h2>
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

export default ReleaseDetail;