import React from 'react';

interface PlayerTrackInfoProps {
    currentTrack: any;
}

const PlayerTrackInfo: React.FC<PlayerTrackInfoProps> = ({ currentTrack }) => {
    if (!currentTrack) return <div className="w-[30%]" />;

    return (
        <div className="flex items-center w-[30%] gap-4">
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