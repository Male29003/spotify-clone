import React from 'react';
import { VolumeUp, QueueMusic, MicOutlined } from '@mui/icons-material';
import { usePlayerStore } from '../../stores/usePlayerStore';

interface PlayerVolumeProps {
    showLyrics: boolean;
    onToggleLyrics: () => void;
}

const PlayerVolume: React.FC<PlayerVolumeProps> = ({ showLyrics, onToggleLyrics }) => {
    const volume = usePlayerStore((state) => state.volume);
    const setVolume = usePlayerStore((state) => state.setVolume);

    const isQueueVisible = usePlayerStore((state) => state.openQueue);
    const toggleQueue = usePlayerStore((state) => state.toggleQueue);
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVolume(parseFloat(e.target.value));
    };

    return (
        <div className="flex items-center justify-end w-[30%] gap-3 text-text-sub">
            <MicOutlined 
                className={`cursor-pointer transition-colors ${showLyrics ? 'text-highlight' : 'hover:text-text-main'}`}
                onClick={onToggleLyrics}
                titleAccess="Lyrics"
            />
            
            <QueueMusic 
                className={`cursor-pointer transition-colors ${isQueueVisible ? 'text-highlight' : 'hover:text-text-main'}`}
                onClick={toggleQueue}
            />

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
                className="w-24 h-1 bg-progress rounded-full appearance-none cursor-pointer hover:accent-green-500"
                style={{
                    background: `linear-gradient(to right, #1db954 ${volume*100}%, #4d4d4d ${volume*100}%)`,
                    accentColor: '#ffffff'
                }}
            />
        </div>
    );
};

export default PlayerVolume;