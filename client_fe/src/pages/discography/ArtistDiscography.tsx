import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetArtistDiscography } from '../../hooks/artist/useArtists';
import { useGetArtistDetail } from '../../hooks/artist/useArtists';
import CustomCard from '../../components/shared/media/CustomCard';
import Loader from '../../components/shared/ui/Loader';
import { ArrowBackIosNew, PlayArrow } from '@mui/icons-material';
import { usePlayerStore } from '../../stores/usePlayerStore';

const STATUS_FILTER = [
    { label: 'All', value: '' },
    { label: 'Albums', value: 'album' },
    { label: 'Singles & EPs', value: 'single' },
]

const ArtistDiscography: React.FC = () => {
    const { playTrack } = usePlayerStore(state => state)
    const { short_id } = useParams<{ short_id: string }>();
    const navigate = useNavigate();
    
    // State quản lý filter
    const [filter, setFilter] = useState<string>('');

    // Lấy thông tin nghệ sĩ để hiện cái tên cho oai
    const { data: artistData } = useGetArtistDetail(short_id || '');
    const artist = artistData?.data || artistData;

    // Lấy danh sách discography
    const { data: discoData, isLoading } = useGetArtistDiscography(short_id || '', filter);
    const releases = (discoData as any)?.results || discoData || [];

    if (isLoading) return <Loader />;

    return (
        <div className="w-full min-h-full p-6 md:p-8">
            {/* header */}
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-panel/50 flex items-center justify-center hover:bg-hover transition-colors"
                >
                    <ArrowBackIosNew fontSize="small" />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-2xl md:text-3xl font-bold text-text-main">
                        {artist?.stage_name}'s Discography
                    </h1>
                </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 custom-scrollbar">
                {STATUS_FILTER.map((opt) => (
                    <button
                        key={opt.label}
                        onClick={() => setFilter(opt.value)}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap
                            ${filter === opt.value 
                                ? 'bg-highlight text-text-dark' 
                                : 'bg-panel text-text-main hover:bg-hover'
                            }
                        `}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* danh sách */}
            {releases.length > 0 ? (
                <div className="flex flex-col gap-2 w-full max-w-6xl animate-fadeIn">
                    {releases.map((release: any) => (
                        <div 
                            key={release.id}
                            onClick={() => navigate(`/release/${release.short_id}`)}
                            className="group flex items-center gap-4 md:gap-6 p-3 md:p-4 hover:bg-hover rounded-md cursor-pointer transition-colors"
                        >
                            {/* Ảnh bìa + Nút Play Hover */}
                            <div className="relative w-20 h-20 md:w-32 md:h-32 shrink-0 bg-panel shadow-lg rounded-md overflow-hidden">
                                <img 
                                    src={release.image || '/default-release.png'} 
                                    alt={release.title} 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button 
                                        className="btn-neon-glow w-10 h-10 md:w-12 md:h-12 bg-highlight rounded-full flex items-center justify-center text-black shadow-xl hover:scale-105 transition-transform"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            playTrack(release.tracks[0], release.tracks)
                                        }}
                                    >
                                        <PlayArrow fontSize="medium" />
                                    </button>
                                </div>
                            </div>

                            {/* Thông tin Album dàn ngang */}
                            <div className="flex flex-col justify-center flex-1 overflow-hidden">
                                <h2 className="text-lg md:text-2xl font-bold text-text-main truncate group-hover:underline">
                                    {release.title}
                                </h2>
                                
                                <div className="flex flex-wrap items-center text-sm md:text-text-main text-text-sub mt-2 gap-2">
                                    {/* Loại hình */}
                                    <span className="capitalize font-medium">
                                        {release.release_type || release.type || 'Release'} ({release.tracks.length} song{release.tracks.length > 1 ? 's' : ''})
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <p className="text-lg text-text-sub">No releases found for this category.</p>
                </div>
            )}
        </div>
    );
};

export default ArtistDiscography;