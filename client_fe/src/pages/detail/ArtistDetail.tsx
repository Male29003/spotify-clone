import React from 'react';
import {  useNavigate, useParams } from 'react-router-dom';
import { TrackTableSkeleton } from '../../components/shared/skeleton/TrackTableSkeleton';
import { PlayArrow } from '@mui/icons-material';
import { usePlayerStore } from '../../stores/usePlayerStore';
import TrackTable from '../../components/detail/TrackTable';
import { useAuthStore } from '../../stores/auth/authStore';
import { useGetArtistDetail, useGetRelatedArtists, useToggleFavouriteArtist } from '../../hooks/artist/useArtists';
import { CustomToast } from '../../components/shared/feedback/CustomToast';
import DetailPageLayout from '../../layouts/detail/DetailLayout';
import MediaSection from '../../components/shared/media/MediaSection';
import { MediaSectionSkeleton } from '../../components/shared/skeleton/MediaSectionSkeleton';

const ArtistDetail: React.FC = () => {
    const navigate = useNavigate()
    const { short_id } = useParams<{ short_id: string }>();
    const playTrack = usePlayerStore(state => state.playTrack);
    const isAuthenticated = useAuthStore(state => state.isAuthenticated)

    const { data: artistData, isLoading } = useGetArtistDetail(short_id || '')
    const artist = artistData?.data || artistData; 

    const { data: relatedArtistsData, isLoading: loadingRelatedArtist } = useGetRelatedArtists(artist?.short_id || '')
    const { mutate: toggleFollow } = useToggleFavouriteArtist()

    const handleFollow = () => {
        if (!isAuthenticated) {
            CustomToast.info("Please log in to use this function !");
            return;
        }
        if(short_id)
            toggleFollow(short_id);
    };

    const releases = artist?.releases || [];
    const tracks = artist?.releases.map((r: any) => r.tracks).flat();
    const latestRelease = releases?.length > 0 ? releases[0] : null;
    const relatedArtists = (relatedArtistsData as any)?.results || []

    if (!isLoading && !artist) return <div className="text-center text-text-main mt-20">Artist not found.</div>;

    const ActionBtns = (
        <>
            <button 
                className="btn-neon-glow w-14 h-14 bg-highlight rounded-full flex items-center justify-center text-text-dark hover:scale-105 transition-transform shadow-xl"
                onClick={() => {
                    if (tracks?.length > 0) playTrack(tracks[0], tracks);
                }}
            >
                <PlayArrow className="text-4xl!" />
            </button>
            <button 
                onClick={handleFollow}
                className={`btn-neon-glow px-4 py-1.5 border rounded-full text-sm font-bold transition-all
                    ${artist?.is_favourite 
                        ? 'bg-highlight text-text-dark border-main hover:bg-panel hover:text-text-main hover:border-highlight' 
                        : 'border-hover text-text-main hover:scale-105 hover:border-highlight'
                    }
                `}
            >
                {artist?.is_favourite ? 'Following' : 'Follow +'}
            </button>
        </>
    )

    return (
        <DetailPageLayout 
            isLoading={isLoading}
            item={artist}
            type='Artist'
            actionBtns={ActionBtns}
            totalTracks={tracks?.length}
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
                    <h3 className="text-lg font-bold text-text-main">Most Popular Release</h3>
                    {latestRelease ? (
                        <div 
                            onClick={() => navigate(`/release/${latestRelease?.short_id}`)}
                            className="bg-card hover:bg-hover p-4 rounded-xl cursor-pointer transition-all flex items-center gap-4 border border-border/50 shadow-md group"
                        >
                            <img 
                                src={latestRelease?.image} 
                                alt={latestRelease?.title}
                                className="w-20 h-20 rounded-md object-cover shadow-md group-hover:scale-105 transition-transform" 
                            />
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-text-main font-bold truncate">
                                    {latestRelease?.title}
                                </span>
                                <span className="text-text-sub text-sm capitalize mt-1">
                                    {latestRelease?.type || 'Release'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <span className="text-text-sub text-sm">No releases yet.</span>
                    )}
                </div>
            }
            children={
                <div className="flex flex-col gap-12 mt-4">
                    {/* Dicography */}
                    {isLoading ? <MediaSectionSkeleton key={'dicography-skeleton'} title='Discography' itemCount={10} />
                    :
                        releases?.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-text-main hover:underline cursor-pointer">Discography</h2>
                                    {/* Nút xem tất cả */}
                                    {releases.length > 7 && (
                                        <span 
                                            onClick={() => navigate(`/artist/${artist.short_id}/discography`)}
                                            className="text-sm font-bold text-text-sub hover:text-text-main cursor-pointer"
                                        >
                                            Show all
                                        </span>
                                    )}
                                </div>
                                <MediaSection 
                                    title=""
                                    items={releases.slice(0,10)}
                                    itemType='release'
                                />
                            </div>
                        )
                    }

                    {/* You may like - Artists */}
                    {loadingRelatedArtist ? <MediaSectionSkeleton key={'related_releases-skeleton'} title='' type='artist' />
                    :
                        relatedArtists?.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <h2 className="text-2xl font-bold text-text-main">Artists You May Like</h2>
                                <MediaSection 
                                    title=""
                                    items={relatedArtists}
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

export default ArtistDetail;