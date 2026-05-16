import React from "react";
import { Block, CheckCircleOutlined, WarningOutlined } from "@mui/icons-material";
import { usePlayerStore } from "../../../../stores/usePlayerStore";
import { useAdminToggleRelease, useGetReleaseDetail } from "../../../../hooks/release/useReleases";
import Loader from "../../../../components/shared/ui/Loader";
import { CustomToast } from "../../../../components/shared/feedback/CustomToast";
import { useConfirmModalStore } from "../../../../stores/useConfirmModalStore";
import { useBlockModalStore } from "../../../../stores/useBlockModalStore";
import { useAdminUpdateTrackStatus } from "../../../../hooks/track/useTracks";
import Player from "../../../../layouts/player/Player";
import type { ITrack } from "../../../../types";
import ModalHeader from "../ModalHeader";
import ModalInfoSection from "../ModalInfoSection";
import PlayingAnimation from "../../../../components/shared/ui/PlayingAnimation";
import { BLOCKED_REASON } from "../../../../constants/constants";

interface AdminReleaseDetailModalProps {
    short_id: string;
    onClose: () => void;
}

const AdminReleaseDetailModal: React.FC<AdminReleaseDetailModalProps> = ({ short_id, onClose }) => {
    const { currentTrack, isPlaying, playTrack, setCurrentTrack, setQueue } = usePlayerStore();
    
    // lấy data
    const { data: detailData, isLoading, error } = useGetReleaseDetail(short_id, { enabled: !!short_id });
    const release = (detailData as any)?.results || detailData;
    const tracks = release?.tracks || [];

    // quản lý chức năng
    const { mutate: toggleBlockRelease, isPending: blockingRelease } = useAdminToggleRelease();
    const { mutate: adminUpdateTrack } = useAdminUpdateTrackStatus();
    const { showConfirm, closeModal, setLoading: setConfirmLoading } = useConfirmModalStore();
    const { openBlockModal, closeBlockModal, setLoading: setBlockLoading } = useBlockModalStore();

    // block - unblock release
    const handleAdminToggleStatus = () => {
        if (!short_id) return;

        if (release.is_blocked) {
            // gỡ block
            showConfirm('save', () => {
                setConfirmLoading(true);
                toggleBlockRelease({ 
                    short_id, 
                    data: { action: 'unblock' } 
                }, {
                    onSuccess: () => 
                        CustomToast.success("Successfully unblocked release!"),
                    onError: (error) => {
                        CustomToast.error("Failed to unblock release!");
                        console.error(`Error: ${error}`)
                    },
                    onSettled: () => { 
                        setConfirmLoading(false); 
                        closeModal(); 
                    }
                });
            }, { 
                title: "Unblock Release", 
                message: "Are you sure you want to restore this release?" 
            });
        } 
        // block
        else {
            openBlockModal((reasonId, note) => {
                setBlockLoading(true);
                toggleBlockRelease({ 
                    short_id, 
                    data: { 
                        action: 'block', 
                        block_reason: reasonId, 
                        block_note: note 
                    }
                }, {
                    onSuccess: () => {
                        CustomToast.success("Successfully blocked release!");
                        closeBlockModal();
                    },
                    onError: (error) => {
                        CustomToast.error("Failed to block release!");
                        console.error(`Error: ${error}`)
                    },
                    onSettled: () => setBlockLoading(false)
                });
            }, {
                title: "Block Release",
                itemName: release.title,
                reasons: BLOCKED_REASON,
                actionLabel: "Block"
            });
        }
    };

    // Block - Unblock bài hát lẻ
    const handleAdminBlockTrack = (track: ITrack) => {
        if (track.is_blocked) {
            showConfirm('save', () => {
                setConfirmLoading(true);
                adminUpdateTrack({ 
                    short_id: track.short_id, 
                    data: { action: 'unblock' } 
                }, {
                    onSuccess: () => CustomToast.success(`Successfully unblocked ${track.title}!`),
                    onError: (error) => {
                        CustomToast.error("Failed to block song!");
                        console.error(`Error: ${error}`)
                    },
                    onSettled: () => { setConfirmLoading(false); closeModal(); }
                });
            }, { 
                title: "Unblock Song", 
                message: `Unblock ${track.title}?` 
            });
        } else {
            openBlockModal((reasonId, note) => {
                setBlockLoading(true);
                adminUpdateTrack({ 
                    short_id: track.short_id, 
                    data: { 
                        action: 'block', 
                        block_reason: reasonId, 
                        block_note: note 
                    } 
                }, {
                    onSuccess: () => {
                        CustomToast.success(`Successfully blocked ${track.title}!`);
                        closeBlockModal();
                        if (tracks.length === 1) 
                            CustomToast.info("Release is hidden because its only track is blocked.");
                    },
                    onSettled: () => 
                        setBlockLoading(false)
                });
            }, {
                title: "Block Song",
                itemName: track.title,
                reasons: BLOCKED_REASON,
                actionLabel: "Block"
            });
        }
    };

    const handleClose = () => {
        setCurrentTrack(null);
        setQueue([]);
        onClose();
    };

    if (error) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/70 text-text-main">Failed to load release details.</div>;
    if (isLoading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/70"><Loader /></div>;
    if (!release) return null;

    const allTracksBlocked = tracks.length > 0 && tracks.every((t: any) => !t.is_active || t.is_blocked);

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-base/70 backdrop-blur-sm p-4">
            <div className="bg-panel w-full max-w-4xl h-[90vh] flex flex-col rounded-3xl border border-border shadow-2xl relative animate-fadeIn overflow-hidden">
                {blockingRelease && 
                    <div className="absolute inset-0 z-110 bg-base/50 flex justify-center items-center">
                        <Loader />
                    </div>
                }
                
                <ModalHeader 
                    isArtist={false}
                    release={release}
                    handleAdminToggleStatus={handleAdminToggleStatus}
                    handleClose={handleClose}
                />

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <ModalInfoSection 
                        isArtist={false} 
                        release={release}
                        onDataChange={() => {}}
                    />
                    
                    <div>
                        {allTracksBlocked && (
                            <div className="bg-error/10 border border-error/20 p-4 rounded-xl mt-5 text-error/95 text-sm">
                                <WarningOutlined fontSize="medium" className="mr-2"/> 
                                All tracks in this release are currently blocked or inactive.
                            </div>
                        )}
                        
                        <div className="mt-5 mb-10">
                            <h3 className="text-xl font-bold text-text-main mb-4">Tracks List</h3>
                            <div className="space-y-2">
                                {tracks.map((track: any, index: number) => {
                                    const isTrackUnavailable = !track.is_active || track.is_blocked;
                                    return (
                                        <div 
                                            key={track.short_id}
                                            onClick={() => !isTrackUnavailable && playTrack(track, tracks)}
                                            className={`flex items-center justify-between p-3 rounded-xl border transition-colors 
                                                ${isTrackUnavailable ? 'cursor-not-allowed bg-base/50' : 'hover:bg-hover cursor-pointer bg-search'}
                                                ${currentTrack?.short_id === track.short_id ? 'border-highlight bg-highlight/10' : 'border-transparent'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className={`w-4 text-center ${currentTrack?.short_id === track.short_id ? 'text-highlight' : 'text-text-sub'}`}>
                                                    {index + 1}
                                                </span>
                                                <div className="flex flex-col">
                                                    <span className={`font-medium ${currentTrack?.short_id === track.short_id ? 'text-highlight' : 'text-text-main'}`}>
                                                        {track.title}
                                                    </span>
                                                    {isTrackUnavailable && (
                                                        <span className="text-[10px] text-error/95 font-bold uppercase mt-0.5">
                                                            {track.is_blocked ? 'Blocked by Admin' : 'Deactivated'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-5 items-center justify-between">
                                                {currentTrack?.short_id === track.short_id && isPlaying && <PlayingAnimation />}
                                                <span className="text-text-sub text-xs">{track.duration}</span>
                                                
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAdminBlockTrack(track);
                                                    }}
                                                    className={`p-2 rounded-full hover:scale-105 transition-all ${isTrackUnavailable ? 'text-highlight hover:bg-highlight/10' : 'text-error hover:bg-error/10'} `}
                                                    title={isTrackUnavailable ? "Unblock this song" : "Block this song"}
                                                >
                                                    {isTrackUnavailable ? <CheckCircleOutlined /> : <Block />}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <Player />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReleaseDetailModal;