import React, { useState, useRef, useEffect } from 'react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useShallow } from 'zustand/react/shallow'
import PlayerVolume from './Volume';
import PlayerControls from './PlayerControls';
import { useStreamAudio } from '../../hooks/track/useTracks';
import { formatDuration } from '../../utils/formatters';

const Player = () => {
    // Quản lý các thông tin trong player
    const { queueLength, currentTrack, isPlaying, volume, playNext, playPrevious, repeatMode } = usePlayerStore(
        useShallow((state) => ({
            currentTrack: state.currentTrack,
            isPlaying: state.isPlaying,
            volume: state.volume,
            playNext: state.nextTrack,
            playPrevious: state.previousTrack,
            repeatMode: state.repeatMode,
            queueLength: state.queue.length
        }))
    );
    const { audioUrl, isLoading } = useStreamAudio(currentTrack?.short_id, isPlaying);
    const audioRef = useRef<HTMLAudioElement>(null);
    // Quản lý thông tin nhạc
    const [duration, setDuration] = useState(0);
    const [playedSeconds, setPlayedSeconds] = useState(0);
    // Quản lý duration và tgain phát
    useEffect(() => {
        setPlayedSeconds(0);
        setDuration(0);
    }, [currentTrack?.short_id]);
    // Ktra phát nhạc
    const [isSeeking, setIsSeeking] = useState(false);
    useEffect(() => {
        if(audioRef.current){
            isPlaying ? audioRef.current.play()
                        .catch((error) => {
                            console.error("Trình duyệt chặn trình phát nhạc !!!", error)
                        })
                    : audioRef.current.pause()
        }
    }, [isPlaying, currentTrack])
    useEffect(() => {
        if(audioRef.current) {
            audioRef.current.volume = volume
        }
    }, [volume])

    // Ktra link nhạc trả về
    useEffect(() => {
        if(audioRef.current) {
            // Nếu đang tải bài mới -> pause
            if (isLoading || !audioUrl) {
                audioRef.current.pause();
            } 
            // Nếu đã sẵn sàng phát -> play
            else if (isPlaying && audioUrl) {
                audioRef.current.play()
                    .catch((error) => {
                        console.error("Trình duyệt chặn phát nhạc:", error);
                    });
            } 
            else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, audioUrl, isLoading]);

    // Xử lý điều chỉnh thanh nghe nhac
    const handleSeekMouseDown = () => {
        setIsSeeking(true);
    };
    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPlayedSeconds(parseFloat(e.target.value));
    };
    const handleSeekMouseUp = () => {
        setIsSeeking(false);
        if (audioRef.current) {
            audioRef.current.currentTime = playedSeconds;
        }
    };

    const handleFinishedSong = async () => {
        playNext()
    }

    const handleManualNext = () => {
        if (queueLength === 1 && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.error(e));
        } else {
            playNext();
        }
    };

    const handleManualPrevious = () => {
        if (queueLength === 1 && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.error(e));
        } else {
            playPrevious();
        }
    };
    
    return (
        <div className="flex items-center sm:justify-end-safe justify-between h-full md:px-4 gap-8">
            <PlayerControls 
                progress={{
                    playedSeconds: playedSeconds,
                    duration: duration,          
                    playedSecondsText: formatDuration(playedSeconds),
                }}
                seekHandlers={{
                    onChange: handleSeekChange, 
                    onMouseDown: handleSeekMouseDown, 
                    onMouseUp: handleSeekMouseUp
                }}
                onSkipNext={handleManualNext}
                onSkipPrevious={handleManualPrevious}
            />

            <audio
                key={currentTrack?.short_id}
                ref={audioRef}
                src={audioUrl || undefined}  
                className="hidden"
                loop={repeatMode === 'one' || (repeatMode === 'all' && queueLength === 1)}
                onLoadedMetadata={(e) => 
                    setDuration(e.currentTarget.duration)
                }
                onTimeUpdate={(e) => {
                    if (!isSeeking) {
                        setPlayedSeconds(e.currentTarget.currentTime);
                        if (!duration || isNaN(duration)) {
                            setDuration(e.currentTarget.duration);
                        }
                    }
                }}
                onEnded={handleFinishedSong}
                autoPlay={isPlaying}
            />

            <PlayerVolume />
        </div>
    );
};

export default Player;