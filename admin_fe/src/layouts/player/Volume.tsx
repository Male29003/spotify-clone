import React from 'react';
import { VolumeUp } from '@mui/icons-material';
import { usePlayerStore } from '../../stores/usePlayerStore';

const PlayerVolume = () => {
    const volume = usePlayerStore((state) => state.volume);
    const setVolume = usePlayerStore((state) => state.setVolume);

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVolume(parseFloat(e.target.value));
    };
    
    return (
        <div className="flex items-center justify-end w-30 md:w-[30%] gap-3 text-text-sub">
            <VolumeUp 
                className="cursor-pointer hover:text-text-main"
                onClick={() => setVolume(volume === 0 ? 1 : 0)}    
            />
            <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={handleVolumeChange}
                className="w-full md:w-32 h-1 bg-progress rounded-full appearance-none cursor-pointer hover:accent-highlight accent-text-main"
                style={{
                    background: `linear-gradient(to right, #1db954 ${volume*100}%, #4d4d4d ${volume*100}%)`,
                }}
            />
        </div>
    );
};

export default PlayerVolume;