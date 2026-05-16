import React from 'react';
import { useParams } from 'react-router-dom';
import Loader from '../../components/shared/ui/Loader';
import { PlayArrow } from '@mui/icons-material';
import { usePlayerStore } from '../../stores/usePlayerStore';
import DetailBanner from '../../components/detail/DetailBanner';
import TrackTable from '../../components/detail/TrackTable';
import { useGetGenreDetail } from '../../hooks/genre/useGenre';

const GenreDetail: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const playTrack = usePlayerStore(state => state.playTrack);

    // Gọi API lấy chi tiết thể loại (kèm danh sách bài hát)
    const { data: genreData, isLoading } = useGetGenreDetail(slug || '');

    if (isLoading) return <Loader />;
    
    const genre = genreData?.data || genreData; 
    if (!genre) return <div className="text-center text-text-main mt-20">Genre not found</div>;

    // Giả sử API trả về mảng tracks bên trong object genre
    const tracks = genre.releases.map((r: any) => r.tracks).flat();

    return (
        <div className="relative w-full h-full pb-24">
            <DetailBanner 
                item={genre}
                totalTracks={tracks.length}
                type='Genre'
            />

            <div className="flex items-center gap-6 p-6 bg-panel/50 backdrop-blur-md sticky top-0 z-10">
                <button 
                    className="btn-neon-glow w-14 h-14 bg-highlight rounded-full flex items-center justify-center text-text-dark hover:scale-105 transition-transform shadow-xl"
                    onClick={() => {
                        if (tracks.length > 0) playTrack(tracks[0], tracks);
                    }}
                >
                    <PlayArrow className="text-4xl!" />
                </button>
            </div>

            {tracks.length > 0 ? (
                <TrackTable
                    tracks={tracks}
                    playTrack={playTrack}
                />
            ) : (
                <div className="text-center text-text-sub mt-10">
                    There are no tracks in this genre yet.
                </div>
            )}
        </div>
    );
};

export default GenreDetail;