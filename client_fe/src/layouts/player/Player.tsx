import React, { useState, useRef, useEffect } from 'react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useShallow } from 'zustand/react/shallow'
import PlayerVolume from './Volume';
import PlayerTrackInfo from './TrackInfo';
import PlayerControls from './PlayerControls';
import { useRecordHistory, useStreamAudio } from '../../hooks/track/useTracks';
import { formatDuration } from '../../utils/formatters'
import LyricsWindow from '../../components/shared/ui/LyricsSide';
import { createPortal } from 'react-dom'

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
            queueLength: state.queue.length,
        }))
    );
    const { audioUrl, isLoading } = useStreamAudio(currentTrack?.short_id, isPlaying);
    const audioRef = useRef<HTMLAudioElement>(null);
    // quản lý chức năng record listen
    const [ hasRecorded, setHasRecorded ] = useState(false)
    const { mutate: recordHistory, isPending } = useRecordHistory()
    const actualPlayedRef = useRef(0)
    const lastTimeRef = useRef(0)

    // state hiện cửa sổ lời nhạc
    const [ showLyrics, setShowLyrics ] = useState(false)
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    useEffect(() => {
        // Chỉ chạy 1 lần khi Player được mount vào DOM
        setPortalTarget(document.getElementById('lyrics-portal-target'));
    }, []);
    useEffect(() => {
        setHasRecorded(false)
    }, [currentTrack])

    // ktra thời gian phát để cập nhật chính xác record listen
    const handleAudioTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
        const audioElement = e.currentTarget;
        const currentTime = audioElement.currentTime;
        const audioDuration = audioElement.duration;

        // tgian nghe thực tế dc tính bằng cộng dồn 
        // theo dự đoán nếu user ko tua -> dif < 1.5
        const diff = currentTime - lastTimeRef.current
        if(diff > 0 && diff < 1.5){
            actualPlayedRef.current += diff
        }
        // nếu là lặp bài 
        if(diff < -1){
            // nếu tgian cập nhật độ ngột từ cuối bài -> đầu bài -> đang loop -> tính tgian lại 
            if(currentTime < 1 && lastTimeRef.current > audioDuration - 2){
                actualPlayedRef.current = 0
                setHasRecorded(false)
            }
        }
        // cập nhật tgian nghe cuối cùng
        lastTimeRef.current = currentTime

        if (!isSeeking) {
            setPlayedSeconds(currentTime);
            if (!duration || isNaN(duration)) {
                setDuration(audioDuration);
            }
        }

        if (!hasRecorded && audioDuration > 0 && currentTrack) {
            // tính lượt nghe khi nghe đủ 45s hoặc
            // nghe 80% bài hát nếu bài đó hơi ngắn
            const targetTime = Math.min(45, audioDuration * 0.8);

            if (actualPlayedRef.current >= targetTime && !isPending) {
                setHasRecorded(true);
                recordHistory(currentTrack.short_id);
            }
        }
    };

    // Quản lý thông tin nhạc
    const [duration, setDuration] = useState(0);
    const [playedSeconds, setPlayedSeconds] = useState(0);
    // Quản lý duration và tgain phát
    useEffect(() => {
        setHasRecorded(false);
        actualPlayedRef.current = 0;
        lastTimeRef.current = 0;
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
        if (!audioRef.current) return;

        if (isLoading || !audioUrl) {
            audioRef.current.pause();
        } 
        else if (isPlaying && audioUrl) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    if (error.name !== 'AbortError') {
                        console.error("Trình duyệt chặn phát nhạc:", error);
                    }
                });
            }
        } 
        else {
            audioRef.current.pause();
        }
    }, [isPlaying, audioUrl, isLoading, currentTrack]);

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

    // điểu chỉnh theo lời nhạc
    const handleSeekFromLyrics = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setPlayedSeconds(time);
        }
    };

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
        <>
            {portalTarget && createPortal(
                <div 
                    className={`absolute inset-0 z-80 bg-base transition-transform duration-500 ease-in-out transform ${
                        showLyrics ? 'translate-y-0' : 'translate-y-full'
                    }`}
                >
                    <LyricsWindow 
                        isOpen={showLyrics}
                        lyricsUrl={currentTrack?.lyrics_file || null}
                        currentTime={playedSeconds}
                        onSeek={handleSeekFromLyrics}
                    />
                </div>,
                portalTarget
            )}
            
            <div className="flex items-center justify-between h-full px-4 border-t border-border bg-panel"><PlayerTrackInfo currentTrack={currentTrack} />

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
                    onTimeUpdate={handleAudioTimeUpdate}
                    onEnded={handleFinishedSong}
                    autoPlay={isPlaying}
                />

                <PlayerVolume 
                    showLyrics={showLyrics}
                    onToggleLyrics={() => setShowLyrics(!showLyrics)}
                />
            </div>
        </>
    );
};

export default Player;