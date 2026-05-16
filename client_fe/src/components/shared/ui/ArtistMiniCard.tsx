import React from 'react';
import { useNavigate } from 'react-router-dom';

const ArtistMiniCard = ({ artist }: { artist: any }) => {
    const navigate = useNavigate();
    if (!artist) return null;

    return (
        <div 
            onClick={() => navigate(`/artist/${artist.short_id}`)}
            className="p-5 rounded-xl bg-card hover:bg-hover/50 cursor-pointer transition-colors border border-border/50 flex flex-col gap-4"
        >
            <div className="flex items-center gap-4">
                <img 
                    src={artist.image || '/default-avatar.png'} 
                    alt={artist.stage_name} 
                    className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-text-sub uppercase">Artist</span>
                    <span className="text-lg font-bold text-text-main hover:underline">
                        {artist.stage_name}
                    </span>
                </div>
            </div>
        </div>
    );
}
export default ArtistMiniCard;