import React from 'react';

interface PlayerTrackInfoProps {
    currentTrack: any;
}

const PlayerTrackInfo: React.FC<PlayerTrackInfoProps> = ({ currentTrack }) => {
    if (!currentTrack) return <div className="w-[30%]" />;

    return (
        <div className="flex items-center w-[30%] gap-4">
            <img 
                src={currentTrack.image} 
                alt={currentTrack.title} 
                className="w-14 h-14 rounded shadow-md"
            />
            <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold truncate hover:underline cursor-pointer">
                    {currentTrack.title}
                </span>
                <span className="text-xs text-text-sub hover:underline cursor-pointer">
                    {currentTrack.artist_name}
                </span>
            </div>
        </div>
    );
};

export default PlayerTrackInfo;