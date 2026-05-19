import React, { useEffect, useRef, useState } from "react";
import { Block, CheckCircleOutlined, Close, Pause, PlayArrow, WarningOutlined } from "@mui/icons-material";
import type { ITrack } from "../../types";
import { formatDuration, formatNumber } from "../../utils/formatters";
import { useStreamAudio, useAdminUpdateTrackStatus } from "../../hooks/track/useTracks";
import { useConfirmModalStore } from "../../stores/useConfirmModalStore";
import { useBlockModalStore } from "../../stores/useBlockModalStore";
import { CustomToast } from "../../components/shared/feedback/CustomToast";
import { BLOCKED_REASON } from "../../constants/constants";

interface TrackDetailModalProps {
    track: ITrack | any;
    onClose: () => void;
}

const InfoField = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <div className="grid grid-cols-[80px_1fr] items-center gap-3">
        <span className="text-sm font-semibold text-text-main">{label}</span>
        <div className="bg-search px-4 py-2 rounded-full text-sm text-text-sub truncate border border-transparent">
            {value || "---"}
        </div>
    </div>
);

// Hàm dịch ID thành Text hiển thị cho Admin xem
const getReasonText = (reasonId: number, note: string) => {
    if (reasonId === 4) 
        return `${note}`;
    return BLOCKED_REASON.find(r => r.id === reasonId)?.label || "Violated terms of service";
};

const TrackDetailModal: React.FC<TrackDetailModalProps> = ({ track, onClose }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const { audioUrl, isLoading } = useStreamAudio(track?.short_id, isPlaying);
    const audioRef = useRef<HTMLAudioElement>(null);

    const [duration, setDuration] = useState(0);
    const [playedSeconds, setPlayedSeconds] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);

    // Setup tính năng Block/Unblock
    const { mutate: toggleTrackStatus } = useAdminUpdateTrackStatus();
    const { showConfirm, closeModal, setLoading: setConfirmLoading } = useConfirmModalStore();
    const { openBlockModal, closeBlockModal, setLoading: setBlockLoading } = useBlockModalStore();

    const handleToggleStatus = () => {
        if (!track) return;
        
        if (track.is_blocked) {
            showConfirm('save', () => {
                setConfirmLoading(true);
                toggleTrackStatus({ 
                    short_id: track.short_id, 
                    data: { action: 'unblock' } 
                }, {
                    onSuccess: () => {
                        CustomToast.success(`Successfully unblocked ${track.title}.`);
                        onClose();
                    },
                    onError: () => CustomToast.error(`Failed to unblock!`),
                    onSettled: () => { setConfirmLoading(false); closeModal(); }
                });
            }, {
                 title: "Unblock Song", 
                 message: `Restore song "${track.title}"?` 
            });
        } else {
            openBlockModal((reasonId, note) => {
                setBlockLoading(true);
                toggleTrackStatus({ 
                    short_id: track.short_id, 
                    data: { 
                        action: 'block', 
                        block_reason: reasonId, 
                        block_note: note 
                    } 
                }, {
                    onSuccess: () => {
                        CustomToast.success(`Successfully blocked ${track.title}.`);
                        closeBlockModal();
                        onClose();
                    },
                    onError: () => CustomToast.error(`Failed to block!`),
                    onSettled: () => setBlockLoading(false)
                });
            }, { 
                title: "Block Song", 
                itemName: track.title, 
                reasons: BLOCKED_REASON, 
                actionLabel: "Block" 
            });
        }
    };

    // Xử lý Phát/Dừng
    const togglePlay = () => setIsPlaying(!isPlaying);

    // Đồng bộ state với thẻ audio
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying && audioUrl) audioRef.current.play().catch(e => console.error("Error phát nhạc:", e));
            else audioRef.current.pause();
        }
    }, [isPlaying, audioUrl]);

    // Xử lý kéo thanh thời gian
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setPlayedSeconds(time);
        if (audioRef.current) audioRef.current.currentTime = time;
    };

    if (!track) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-base/70 backdrop-blur-sm p-4 ">
            <div className="bg-panel w-full max-w-4xl p-8 rounded-3xl border border-border shadow-2xl relative animate-fadeIn custom-scrollbar overflow-y-auto max-h-[90vh]">
                <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 text-text-sub hover:text-text-main hover:bg-hover p-2 rounded-full transition-colors"
                >
                    <Close />
                </button>

                {/* Header Tiêu đề & Nút Action */}
                <div className="flex items-center gap-4 mb-6 ml-2">
                    <h2 className="text-2xl font-bold text-text-main">Song Detail</h2>
                    
                    {/* Nút Block/Unblock */}
                    <button
                        onClick={handleToggleStatus}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm
                            ${track.is_blocked 
                                ? 'bg-highlight/10 text-highlight hover:bg-highlight hover:text-text-dark' 
                                : 'bg-error/10 text-error hover:bg-error hover:text-text-dark'}`}
                    >
                        {track.is_blocked ? <CheckCircleOutlined fontSize="small" /> : <Block fontSize="small" />}
                        {track.is_blocked ? "Unblock Song" : "Block Song"}
                    </button>
                </div>

                {/* Cảnh báo khoá */}
                {track.is_blocked && (
                    <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-xl">
                        <h4 className="text-error font-bold flex items-center gap-2 mb-1 text-sm">
                            <WarningOutlined fontSize="small" /> Content Blocked by Admin
                        </h4>
                        <p className="text-error/95 text-sm">
                            Reason: 
                            <span className="font-bold">
                                {getReasonText(track.block_reason, track.block_note)}
                            </span>                        
                        </p>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-10">
                    {/* Ảnh */}
                    <div className="flex flex-col items-center gap-6 w-full md:w-60 shrink-0">
                        <div className="w-48 h-48 rounded-2xl overflow-hidden bg-search shadow-inner border border-border">
                            {track.image ? (
                                <img src={track.image} alt={track.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-text-sub">No Image</div>
                            )}
                        </div>
                    </div>
                    <div className="hidden md:block w-px bg-border self-stretch"></div>

                    {/* thông tin chi tiết*/}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 content-start mt-2">
                        <InfoField 
                            label="Title" 
                            value={track.title} 
                        />
                        <InfoField 
                            label="Artist" 
                            value={track.artist?.stage_name || (track as any).artist_name} 
                        />
                        <InfoField 
                            label="Genre" 
                            value={track.genre} 
                        />
                        <InfoField 
                            label="Release" 
                            value={track.release_title} 
                        />
                        <InfoField 
                            label="Listens" 
                            value={formatNumber(track.listens)} 
                        />
                        <InfoField 
                            label="Downloads" 
                            value={formatNumber(track.downloads)} 
                        />
                    </div>
                </div>

                {/* thanh nghe nhạc */}
                <div className="pt-6 mt-6 border-t border-border flex justify-center">
                    <div className="w-full max-w-xl flex items-center gap-5">
                        <audio
                            ref={audioRef}
                            src={audioUrl || undefined}
                            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                            onTimeUpdate={(e) => {
                                if (!isSeeking) setPlayedSeconds(e.currentTarget.currentTime);
                            }}
                            loop={true}
                        />

                        {/* Play/Pause */}
                        <button 
                            onClick={togglePlay}
                            disabled={isLoading && isPlaying}
                            className={`w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 transition-transform shrink-0 shadow-md bg-highlight text-text-main disabled:opacity-50'`}
                        >
                            {isLoading && isPlaying ? (
                                <div className="w-5 h-5 border-2 border-base border-t-transparent rounded-full animate-spin"></div>
                            ) : isPlaying ? <Pause /> : <PlayArrow />}
                        </button>

                        <div className="flex-1 flex flex-col justify-center gap-1">
                            <div className="flex justify-between items-center text-xs font-semibold text-text-sub">
                                <span className={track.is_blocked ? "text-text-sub" : "text-highlight"}>
                                    {formatDuration(playedSeconds)}
                                </span>
                                <span>{formatDuration(duration)}</span>
                            </div>

                            <div className={`relative flex items-center group h-4 w-full cursor-pointer`}>
                                <div className="absolute w-full h-1.5 bg-border rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-colors ${track.is_blocked ? 'bg-text-sub' : 'bg-highlight group-hover:bg-highlight/80'}`}
                                        style={{ width: `${(playedSeconds / (duration || 1)) * 100}%` }}
                                    ></div>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" max={duration || 100} step="0.1"
                                    value={playedSeconds} 
                                    onChange={handleSeek}
                                    onMouseDown={() => setIsSeeking(true)}
                                    onMouseUp={() => setIsSeeking(false)}
                                    className="absolute w-full h-full opacity-0 cursor-pointer"
                                    disabled={track.is_blocked}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackDetailModal;