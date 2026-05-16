import React from 'react';
// IMPORT THÊM RepeatOne
import { PlayCircleFilled, SkipNext, SkipPrevious, Repeat, RepeatOne, Shuffle, PauseCircleFilled } from '@mui/icons-material';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useShallow } from 'zustand/react/shallow'
import { useAuthStore } from '../../stores/auth/authStore';

interface PlayerControlsProps {
    progress: {
        playedSeconds: number;
        duration: number;
        playedSecondsText: string;
    },
    seekHandlers: {
        onMouseDown: () => void;
        onMouseUp: () => void;
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    };
    onSkipNext: () => void
    onSkipPrevious: () => void
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
    progress,
    seekHandlers,
    onSkipNext,
    onSkipPrevious
}) => {
    const { user } = useAuthStore(state => state)
    const { currentTrack, isPlaying, isShuffle, repeatMode, toggleShuffle, toggleRepeat, togglePlay, queue, currentIndex } = usePlayerStore(
        useShallow((state) => ({
            currentTrack: state.currentTrack,
            isPlaying: state.isPlaying,
            isShuffle: state.isShuffle,
            repeatMode: state.repeatMode,
            togglePlay: state.togglePlay,
            toggleShuffle: state.toggleShuffle,
            toggleRepeat: state.toggleRepeat,
            queue: state.queue,
            currentIndex: state.currentIndex
        }))
    );

    const isPrevDisabled = queue.length <= 1 || currentIndex <= 0;
    const isNextDisabled = queue.length <= 1 || currentIndex >= queue.length - 1;
    const progressPercentage = progress.duration ? (progress.playedSeconds / progress.duration) * 100 : 0;

    return (
        <div className="flex flex-col items-center max-w-[40%] w-full gap-2">
                <div className="flex items-center gap-6 text-text-sub">
                    <Shuffle 
                        className={`cursor-pointer text-sm hover:text-text-main transition-colors
                            ${isShuffle ? 'text-highlight' : 'opacity-60'}`} 
                        onClick={toggleShuffle}
                    />
                    
                    <SkipPrevious 
                        className={`text-3xl ${isPrevDisabled ? 'opacity-30 pointer-events-none' : 'cursor-pointer hover:text-text-main transition-colors'}`} 
                        onClick={onSkipPrevious}
                    />
                    
                    <div onClick={togglePlay} className={`hover:scale-110 transition-transform ${queue.length === 0 && 'pointer-events-none'}`}>
                        {isPlaying ? 
                            <PauseCircleFilled className="text-text-main !text-3xl" /> 
                            : 
                            <PlayCircleFilled className={`text-text-main !text-3xl ${queue.length === 0 ? 'opacity-30' : 'opacity-100 transition-colors'}`}/>
                        }
                    </div>
                    
                    <SkipNext 
                        className={`text-3xl ${isNextDisabled && repeatMode !== 'all' ? 'opacity-30 pointer-events-none' : 'cursor-pointer hover:text-text-main transition-colors'}`} 
                        onClick={onSkipNext}
                    />
                    
                    <div onClick={toggleRepeat} className="cursor-pointer">
                        {repeatMode === 'one' ? (
                            <RepeatOne className="text-highlight text-sm hover:text-text-main transition-colors" />
                        ) : (
                            <Repeat className={`text-sm hover:text-text-main transition-colors ${repeatMode === 'all' ? 'text-highlight' : 'opacity-60'}`} />
                        )}
                    </div>
                </div>
                
                <div className="flex items-center w-full gap-2 text-xs text-text-sub">
                    <span className='min-w-10 text-right'>{progress.playedSecondsText}</span>
                    <input 
                        type="range" 
                        min={0} 
                        max={progress.duration || 0}
                        step="0.1"
                        value={progress.playedSeconds || 0} 
                        onMouseDown={seekHandlers.onMouseDown}
                        onMouseUp={seekHandlers.onMouseUp}
                        onTouchStart={seekHandlers.onMouseDown}
                        onTouchEnd={seekHandlers.onMouseUp}
                        onChange={seekHandlers.onChange}
                        className="flex-1 h-1 rounded-full appearance-none cursor-pointer text-highlight hover:accent-green-500"
                        style={{
                            background: `linear-gradient(to right, #1db954 ${progressPercentage}%, #4d4d4d ${progressPercentage}%)`,
                            accentColor: '#ffffff'
                        }}
                    />
                    <span className="min-w-10 text-left">
                        {!currentTrack?.is_premium_only ?
                            (currentTrack as any)?.duration.slice(3)
                            :
                            !user?.is_premium ?
                            '00:30'
                            :
                            (currentTrack as any)?.duration.slice(3)
                        }
                    </span>
                </div>
            </div>
    )
}
export default PlayerControls;