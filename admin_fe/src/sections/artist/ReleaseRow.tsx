import React, { useState } from 'react';
import { Block, SettingsBackupRestore, KeyboardArrowUp, KeyboardArrowDown, MusicNote } from '@mui/icons-material';
import { useConfirmModalStore } from '../../stores/useConfirmModalStore';
import { CustomToast } from '../../components/shared/feedback/CustomToast';
import { useAdminUpdateTrackStatus } from '../../hooks/track/useTracks';
import { useAdminToggleRelease } from '../../hooks/release/useReleases';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useBlockModalStore } from '../../stores/useBlockModalStore';
import { BLOCKED_REASON } from '../../constants/constants';

const ReleaseRow = ({ release }: { release: any }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { playTrack, currentTrack } = usePlayerStore()

    // quản lý chức năng
    const { showConfirm, closeModal, setLoading: setConfirmLoading } = useConfirmModalStore();
    const { openBlockModal, closeBlockModal, setLoading: setBlockLoading } = useBlockModalStore();
    const { mutate: toggleRelease, isPending: isTogglingRelease } = useAdminToggleRelease();
    const { mutate: toggleTrack, isPending: isTogglingTrack } = useAdminUpdateTrackStatus();

    // Xử lý Block/Unblock release
    const handleToggleReleaseStatus = (e: React.MouseEvent, currentRelease: any) => {
        e.stopPropagation();
        
        if (currentRelease.is_blocked) {
            // gỡ block
            showConfirm('warning', () => {
                setConfirmLoading(true);
                toggleRelease({ short_id: currentRelease.short_id, data: { action: 'unblock' } }, {
                    onSuccess: () => 
                        CustomToast.success(`Successfully unblocked release!`),
                    onError: (error) => {
                        CustomToast.error(`Failed to unblock release!`)
                        console.error(`Error: ${error}`)
                    },
                    onSettled: () => { 
                        setConfirmLoading(false); 
                        closeModal(); 
                    }
                });
            }, {
                title: `Confirm Unblock Release`,
                message: `Are you sure you want to unblock release "${currentRelease.title}"?`
            });
        } else {
            // block
            openBlockModal((reasonId, note) => {
                setBlockLoading(true);
                toggleRelease({ 
                    short_id: currentRelease.short_id, 
                    data: { 
                        action: 'block', 
                        block_reason: reasonId, 
                        block_note: note 
                    }
                }, {
                    onSuccess: () => {
                        CustomToast.success(`Successfully blocked release!`);
                        closeBlockModal();
                    },
                    onError: (error) => {
                        CustomToast.error(`Failed to block release!`)
                        console.error(`Error: ${error}`)
                    },
                    onSettled: () => setBlockLoading(false)
                });
            }, {
                title: "Block Release",
                itemName: currentRelease.title,
                reasons: BLOCKED_REASON,
                actionLabel: "Block"
            });
        }
    };

    // Xử lý Block/Unblock bài hát
    const handleToggleTrackStatus = (e: React.MouseEvent, track: any) => {
        e.stopPropagation();

        if (track.is_blocked) {
            // gỡ block
            showConfirm('warning', () => {
                setConfirmLoading(true);
                toggleTrack({ short_id: track.short_id, data: { action: 'unblock' } }, {
                    onSuccess: () => 
                        CustomToast.success(`Successfully unblocked track!`),
                    onError: (error) => {
                        CustomToast.error(`Failed to unblock track!`)
                        console.error(`Error: ${error}`)
                    },
                    onSettled: () => { 
                        setConfirmLoading(false); 
                        closeModal(); }
                });
            }, {
                title: `Confirm Unblock Track`,
                message: `Are you sure you want to unblock track "${track.title}"?`
            });
        } else {
            // block
            openBlockModal((reasonId, note) => {
                setBlockLoading(true);
                toggleTrack({
                    short_id: track.short_id,
                    data: { 
                        action: 'block', 
                        block_reason: reasonId,
                        block_note: note 
                    }
                }, {
                    onSuccess: () => {
                        CustomToast.success(`Successfully blocked track!`);
                        closeBlockModal();
                    },
                    onError: () => 
                        CustomToast.error(`Failed to block track!`),
                    onSettled: () => setBlockLoading(false)
                });
            }, {
                title: "Block Track",
                itemName: track.title,
                reasons: BLOCKED_REASON,
                actionLabel: "Block"
            });
        }
    };

    return (
        <>
            {/* 1 item release */}
            <tr 
                onClick={() => setIsExpanded(!isExpanded)}
                className={`border-b border-border/50 hover:bg-search/40 cursor-pointer transition-colors ${isExpanded ? 'bg-search/60' : ''}`}
            >
                <td className="py-3 pl-3 w-10">
                    {isExpanded ? <KeyboardArrowUp className="text-text-sub" /> : <KeyboardArrowDown className="text-text-sub" />}
                </td>
                <td className="py-3 flex items-center gap-3">
                    <img src={release.image} alt={release.title} className="w-12 h-12 rounded object-cover" />
                    <div className="flex flex-col">
                        <span className="text-text-main font-bold flex items-center gap-2">
                            {release.title}
                        </span>
                        <span className="text-xs text-text-sub capitalize">
                            {release.release_type} • {release.total_tracks} tracks
                            {release.is_blocked && <span className="text-[10px] bg-error/20 text-error px-2 py-0.5 ml-5 rounded-sm">BLOCKED</span>}
                        </span>
                    </div>
                </td>
                <td className="text-text-sub">{release.total_listens || 0}</td>
                <td className="text-right pr-4">
                    <button 
                        onClick={(e) => handleToggleReleaseStatus(e, release)}
                        disabled={isTogglingRelease}
                        className={`p-2 rounded-full transition-all ${release.is_blocked ? 'text-highlight hover:bg-highlight/20' : 'text-error hover:bg-error/20'}`}
                        title={release.is_blocked ? "Unblock Release" : "Block Release"}
                    >
                        {release.is_blocked ? <SettingsBackupRestore fontSize="medium" /> : <Block fontSize="medium" />}
                    </button>
                </td>
            </tr>

            {/* dropdown hiển thị track */}
            {isExpanded && (
                <tr>
                    <td colSpan={4} className="p-0 border-b border-border">
                        <div className="bg-card pl-16 pr-6 py-3 shadow-inner">
                            {release.tracks && release.tracks.length > 0 ? (
                                <table className="w-full text-sm">
                                    <tbody>
                                        {release.tracks.map((track: any, index: number) => {
                                            const isPlaying = currentTrack?.short_id === track.short_id
                                            return (
                                            <tr 
                                                key={track.short_id} 
                                                className={`border-b border-border/10 last:border-0 hover:bg-hover/40 rounded-2xl cursor-pointer`}
                                                onClick={() => playTrack(track, release.tracks)}
                                            >
                                                <td className={`p-2.5 w-8 font-mono 
                                                    ${isPlaying ? 'text-highlight' : 'text-text-sub'}`}
                                                >
                                                    {index + 1}
                                                </td>
                                                <td className={`p-2.5 flex items-center gap-2
                                                    ${isPlaying ? 'text-highlight' : 'text-text-sub'}`}
                                                >
                                                    <MusicNote fontSize="small" />
                                                    <span className={`font-medium 
                                                        ${track.is_blocked ? 'text-error/95 line-through' : ''}`}
                                                    >
                                                        {track.title}
                                                    </span>
                                                    {track.is_blocked && <span className="text-[10px] bg-error/20 text-error px-1.5 py-0.5 rounded-sm">BLOCKED</span>}
                                                </td>
                                                <td className={`py-2.5 text-right w-24 pr-4
                                                        ${isPlaying ? 'text-highlight' : 'text-text-sub'}`}
                                                >
                                                    {track.listens || 0} {track.listens > 2 ? 'plays' : 'play'}
                                                </td>
                                                <td className="py-2.5 text-right w-24">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleToggleTrackStatus(e, track)
                                                        }}
                                                        disabled={isTogglingTrack}
                                                        className={`text-xs px-3 py-1.5 font-bold rounded-md transition-all ${track.is_blocked ? 'bg-highlight/10 text-highlight hover:bg-highlight hover:text-text-dark' : 'bg-error/10 text-error hover:bg-error hover:text-text-dark'}`}
                                                    >
                                                        {track.is_blocked ? "Unblock" : "Block"}
                                                    </button>
                                                </td>
                                            </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-text-sub text-sm italic py-2">No tracks found in this release.</p>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

export default ReleaseRow;