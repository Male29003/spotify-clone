import React, { useState, useEffect, useMemo } from "react";
import { AddCircleOutline, CheckCircleOutlined, CloseRounded, DragIndicator, EditOutlined, ErrorOutline, FormatListBulletedOutlined, PublishOutlined, SaveOutlined, WarningOutlined } from "@mui/icons-material";
import { usePlayerStore } from "../../../../stores/usePlayerStore";
import { useGetMyReleaseDetail, useReorderReleaseTracks, useSumbmitRelease } from "../../../../hooks/release/useReleases";
import Loader from "../../../../components/shared/ui/Loader";
import { CustomToast } from "../../../../components/shared/feedback/CustomToast";
import { useConfirmModalStore } from "../../../../stores/useConfirmModalStore";
import { useGetUnassignedTracks, useUpdateMyTrack, useUploadTrack } from "../../../../hooks/track/useTracks";
import Player from "../../../../layouts/player/Player";
import DraggableList from "../../../../components/shared/ui/DraggableList";
import ModalHeader from "../ModalHeader";
import ModalInfoSection from "../ModalInfoSection";
import PlayingAnimation from "../../../../components/shared/ui/PlayingAnimation";
import { RELEASE_REJECTED_REASON, RELEASE_LIMITS } from "../../../../constants/constants";
import { useGetAllGenresForArtists } from "../../../../hooks/genre/useGenre";

interface StudioReleaseDetailModalProps {
    short_id: string;
    onClose: () => void;
}


const StudioReleaseDetailModal: React.FC<StudioReleaseDetailModalProps> = ({ short_id, onClose }) => {
    const { currentTrack, isPlaying, playTrack, setCurrentTrack, setQueue } = usePlayerStore();
    
    // lấy data
    const { data: detailData, isLoading, error } = useGetMyReleaseDetail(short_id, { enabled: !!short_id });
    const { data: unassignedData } = useGetUnassignedTracks()
    const { data: genresData } = useGetAllGenresForArtists()

    const release = (detailData as any)?.results || detailData;
    const tracks = release?.tracks || [];
    const unassignedTracks = (unassignedData as any)?.results || unassignedData || [];
    const genres = genresData?.data || (genresData as any)?.results || genresData || []

    // quản lý data đang thao tác
    const [localTracks, setLocalTracks] = useState<any[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showAddTrackMenu, setShowAddTrackMenu] = useState(false);
    // State cho Form Upload Track Mới
    const [newTrackTitle, setNewTrackTitle] = useState('');
    const [newTrackGenre, setNewTrackGenre] = useState('');
    const [newTrackFile, setNewTrackFile] = useState<File | null>(null);
    // State cho việc Sửa Track hiện tại (Inline Edit)
    const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
    const [editTrackTitle, setEditTrackTitle] = useState('');
    const [editTrackGenre, setEditTrackGenre] = useState('');

    useEffect(() => {
        if(tracks.length > 0) setLocalTracks(tracks);
    }, [tracks]);

    const { showConfirm, closeModal, setLoading } = useConfirmModalStore();
    const { mutate: updateTrack, isPending: isUpdatingTrack } = useUpdateMyTrack();
    const { mutate: uploadTrack, isPending: isUploadingTrack } = useUploadTrack()
    const { mutate: reorderTracks, isPending: isReordering } = useReorderReleaseTracks();
    const { mutate: submitRelease, isPending: isSubmitting } = useSumbmitRelease();

    // ============================ validate điểu kiện ============================ 
    const validateReleaseType = (action: 'add' | 'remove') => {
        const type = release?.release_type?.toLowerCase() || 'single';
        const currentCount = localTracks.length;
        const newCount = action === 'add' ? currentCount + 1 : currentCount - 1;
        const limits = RELEASE_LIMITS[type as keyof typeof RELEASE_LIMITS];

        if (action === 'add' && newCount > limits.max) {
            CustomToast.error(`A ${type.toUpperCase()} can only have up to ${limits.max} tracks. Change release type first.`);
            return false;
        }
        if (action === 'remove' && newCount < limits.min && newCount > 0) { 
            CustomToast.error(`A ${type.toUpperCase()} must have at least ${limits.min} tracks. Change release type first.`);
            return false;
        }
        return true;
    };
    
    // ============================ Xóa bài hát khỏi release ============================  
    const handleRemoveTrackFromRelease = (trackShort_id: string) => {
        if (!validateReleaseType('remove')) return;

        const isLastTrack = tracks.length === 1;
        const message = isLastTrack 
            ? 'This is the last track. Removing it will make the release empty. Are you sure?' 
            : 'Are you sure you want to remove this track from this release?';

        showConfirm('delete', () => {
            setLoading(true);
            updateTrack({ 
                short_id: trackShort_id, 
                data: { 
                    release: null 
                }
            }, {
                onSuccess: () => {
                    CustomToast.success(`Successfully removed track!`);
                    setLocalTracks(prev => prev.filter(t => t.short_id !== trackShort_id))
                    if (isLastTrack) onClose();
                },
                onError: () => CustomToast.error(`Failed to remove track!`),
                onSettled: () => { setLoading(false); closeModal(); }
            });
        }, { 
            title: 'Remove Track', 
            message: message 
        });
    };

    // ============================ Them bài hát vào release (bài hát có sẵn) ============================  
    const handleAddTrack = (track: any) => {
        if (!validateReleaseType('add')) return;

        setLoading(true)
        updateTrack({
            short_id: track.short_id,
            data:{ release: release.id }
        }, {
            onSuccess: () => {
                CustomToast.success(`Added "${track.title}" successfully!`);
                setShowAddTrackMenu(false);
            },
            onError: () => CustomToast.error("Failed to add track!"),
            onSettled: () => setLoading(false)
        })
    }
    // upload 1 bài hát mới vào luôn
    const handleUploadNewTrack = () => {
        if (!validateReleaseType('add')) 
            return;
        
        if (!newTrackTitle.trim() || !newTrackGenre || !newTrackFile) {
            return CustomToast.error("Please fill in Title, Genre, and select a file!");
        }

        const formData = new FormData()
        formData.append('title', newTrackTitle.trim());
        formData.append('genre', newTrackGenre);
        formData.append('file_url', newTrackFile);
        formData.append('release', release.short_id);
        
        setLoading(true);
        uploadTrack(formData, {
            onSuccess: () => {
                CustomToast.success("Track uploaded and added to release!");
                setShowAddTrackMenu(false);
                setNewTrackTitle('');
                setNewTrackGenre('');
                setNewTrackFile(null);
            },
            onSettled: () => setLoading(false)
        });
    };

    // ============================ Sửa thông tin bài hát ============================  
    const startEditTrack = (track: any) => {
        setEditingTrackId(track.short_id);
        setEditTrackTitle(track.title);
        setEditTrackGenre(track.genre?.id?.toString() || '');
    };

    const handleSaveTrackEdit = (trackShort_id: string) => {
        if (!editTrackTitle.trim() || !editTrackGenre) {
            return CustomToast.error("Title and Genre are required!");
        }

        setLoading(true);
        updateTrack({ 
            short_id: trackShort_id, 
            data: { title: editTrackTitle.trim(), genre: editTrackGenre } 
        }, {
            onSuccess: () => {
                CustomToast.success("Track updated successfully!");
                setEditingTrackId(null);
            },
            onError: () => CustomToast.error("Failed to update track!"),
            onSettled: () => setLoading(false)
        });
    };
    
    // ============================ Thay đổi thứ tự bài hát release ============================  
    const handleSaveOrder = () => {
        setLoading(true)
        const trackIds = localTracks.map(t => t.short_id)
        reorderTracks({
            short_id: release.short_id,
            track_ids: trackIds
        }, {
            onSuccess: () => CustomToast.success("Track order saved successfully!"),
            onError: () => CustomToast.error("Failed to update track order"),
            onSettled: () =>setLoading(false)
        })
    }

    // ============================ Submit release nào draft -> pending ============================  
    const handleSubmitForReview = () => {
        if(localTracks.length === 0) {
            CustomToast.error("Cannot submit! Release must have at least 1 song.")
            return;
        }
        
        // Kiểm tra xem số bài hát đã đạt yêu cầu tối thiểu chưa
        const type = release?.release_type?.toLowerCase() || 'single';
        const minRequired = RELEASE_LIMITS[type as keyof typeof RELEASE_LIMITS].min;
        if (localTracks.length < minRequired) {
            CustomToast.error(`Cannot submit! A ${type.toUpperCase()} requires at least ${minRequired} tracks.`);
            return;
        }

        showConfirm('save', () => {
            setLoading(true)
            submitRelease(short_id, {
                onSuccess: () =>{ 
                    CustomToast.success("Release submitted for Admin to review successfully!")
                    closeModal()
                    onClose()
                },
                onError: () => CustomToast.error("Failed to submit release."),
                onSettled: () => setLoading(false)
            })
        }, {
            title: 'Submit For Review',
            message: "Are you sure you want to submit this release? Admin will review it before publishing to platform."
        })
    }
    
    const isOrderChanged = useMemo(() => {
        if(!tracks || !localTracks || tracks.length !== localTracks.length) return false
        return tracks.some((track: any, index: number) => track.short_id !== localTracks[index]?.short_id)
    }, [tracks, localTracks])

    const handleClose = () => {
        if (hasUnsavedChanges || isOrderChanged) {
            showConfirm('unsaved', () => {
                closeModal();
                setCurrentTrack(null);
                setQueue([]);
                onClose();
            }, {
                title: 'Unsaved Changes',
                message: 'Are you sure you want to leave? Your changes will not be saved.'
            });
            return;
        }
        setCurrentTrack(null);
        setQueue([]);
        onClose();
    };

    if (error) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/70 text-text-main">Failed to load release details.</div>;
    if (isLoading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/70"><Loader /></div>;
    if (!release) return null;

    const allTracksBlocked = tracks.length > 0 && tracks.every((t: any) => !t.is_active || t.is_blocked);
    const isDraft = !release.is_pending && !release.is_published && !release.is_blocked
    const isBlocked = release.is_blocked
    const rejectReasonText = release.reject_reason 
        ? RELEASE_REJECTED_REASON.find(r => r.id === release.reject_reason)?.label 
        : "Violation of community standards";

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-base/70 backdrop-blur-sm p-4">
            <div className="bg-panel w-full max-w-4xl h-[90vh] flex flex-col rounded-3xl border border-border shadow-2xl relative animate-fadeIn overflow-hidden">
                
                {/* Header */}
                <ModalHeader 
                    isArtist={true} 
                    release={release}
                    handleAdminToggleStatus={() => {}}
                    handleClose={handleClose}
                />

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {/* Báo lỗi Reject */}
                    {release.reject_reason && (
                        <div className="bg-error/10 border border-error/20 p-5 rounded-2xl mb-6">
                            <h4 className="text-error font-bold text-lg flex items-center gap-2 mb-2">
                                <ErrorOutline /> Action Required: Release Rejected
                            </h4>
                            <div className="text-text-main text-sm space-y-2 mt-3">
                                <p><span className="text-text-sub font-bold">Reason:</span> {rejectReasonText}</p>
                                {release.reject_note && (
                                    <p><span className="text-text-sub font-bold">Admin Note:</span> {release.reject_note}</p>
                                )}
                            </div>
                            <p className="text-xs text-text-sub mt-4 italic">
                                * Please update your release details or tracks according to the feedback, then submit it for review again.
                            </p>
                        </div>
                    )}
                    
                    {/* Thông tin cơ bản - Artist có thể sửa */}
                    <ModalInfoSection 
                        isArtist={true}
                        release={release}
                        onDataChange={setHasUnsavedChanges}
                    />

                    {/* Tracks List section */}
                    <div>
                        {allTracksBlocked && (
                            <div className="bg-error/10 border border-error/20 p-4 rounded-xl mt-5 text-error/95 text-sm">
                                <WarningOutlined fontSize="medium" className="mr-2"/> 
                                All tracks in this release are currently blocked or inactive.
                            </div>
                        )}
                        
                        <div className={`mt-8 mb-10 `}>
                            {/* Thanh công cụ: Submit / Add Track / Save Order */}
                            <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-bold text-text-main">
                                        Tracks <span className="text-sm font-normal text-text-sub">({localTracks.length})</span>
                                    </h3>
                                    
                                    {isDraft && (
                                        <button 
                                            disabled={isSubmitting}
                                            onClick={handleSubmitForReview}
                                            className="ml-2 bg-highlight text-panel px-4 py-1.5 rounded-lg font-bold text-sm hover:scale-105 transition-transform shadow-md flex items-center gap-1"
                                        >
                                            <PublishOutlined fontSize="small" /> Submit for Review
                                        </button>
                                    )}
                                </div>
                                
                                <div className="flex gap-2 relative">
                                    {isOrderChanged && (
                                        <button 
                                            onClick={handleSaveOrder}
                                            disabled={isReordering}
                                            className="flex items-center gap-1 bg-highlight text-text-dark px-3 py-1.5 rounded-lg font-bold text-sm hover:bg-highlight transition-colors shadow-md"
                                        >
                                            <SaveOutlined fontSize="small" /> Save Order
                                        </button>
                                    )}

                                    {isDraft && (
                                        <div>
                                            <button 
                                                onClick={() => setShowAddTrackMenu(!showAddTrackMenu)}
                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-sm transition-colors border ${
                                                    showAddTrackMenu ? 'bg-panel text-text-sub border-border' : 'bg-highlight/10 text-highlight border-transparent hover:bg-highlight hover:text-panel'
                                                }`}
                                            >
                                                {showAddTrackMenu ? <CloseRounded fontSize="small" /> : <AddCircleOutline fontSize="small" />}
                                                {showAddTrackMenu ? 'Cancel' : 'Add Track'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bảng chọn bài hát */}
                            {showAddTrackMenu && (
                                <div className="mb-6 bg-base p-5 rounded-2xl border border-border animate-slideDown shadow-inner">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        
                                        {/* upload bài mới luôn */}
                                        <div className="bg-panel border border-border p-5 rounded-xl flex flex-col gap-4">
                                            <h4 className="font-bold text-text-main text-lg border-b border-border pb-2">Upload New Track</h4>
                                            
                                            <input 
                                                type="text" placeholder="Track Title *" 
                                                value={newTrackTitle} onChange={e => setNewTrackTitle(e.target.value)}
                                                className="bg-search p-3 rounded-lg text-text-main text-sm outline-none border border-transparent focus:border-highlight"
                                            />
                                            
                                            <select 
                                                value={newTrackGenre} onChange={e => setNewTrackGenre(e.target.value)}
                                                className="bg-search p-3 rounded-lg text-text-main text-sm outline-none border border-transparent focus:border-highlight cursor-pointer"
                                            >
                                                <option value="" disabled>Select Genre *</option>
                                                {genres.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                                            </select>

                                            <label className="bg-search p-3 rounded-lg text-text-sub text-sm border border-dashed border-border hover:border-highlight cursor-pointer text-center transition-colors truncate">
                                                {newTrackFile ? newTrackFile.name : "Select Audio File (.mp3, .wav) *"}
                                                <input 
                                                    type="file" className="hidden" accept="audio/mpeg, audio/wav, audio/x-wav"
                                                    onChange={e => {
                                                        const file = e.target.files?.[0];
                                                        if(file && file.size > 20 * 1024 * 1024) return CustomToast.error("Max 20MB");
                                                        setNewTrackFile(file || null);
                                                    }}
                                                />
                                            </label>

                                            <button 
                                                onClick={handleUploadNewTrack} disabled={isUploadingTrack}
                                                className={`mt-2 bg-highlight text-panel font-bold px-4 py-2.5 rounded-xl transition-transform text-sm 
                                                    ${isUploadingTrack ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                                            >
                                                {isUploadingTrack ? 'Uploading...' : 'Upload & Add'}
                                            </button>
                                        </div>

                                        {/* chọn nhạc bị unassigned */}
                                        <div className="bg-panel border border-border p-5 rounded-xl flex flex-col">
                                            <h4 className="font-bold text-text-main text-lg border-b border-border pb-2 mb-4 flex items-center gap-2">
                                                <FormatListBulletedOutlined fontSize="small" /> Choose Existing
                                            </h4>
                                            
                                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-base rounded-lg border border-border/50 p-2 h-[220px]">
                                                {unassignedTracks.length === 0 ? (
                                                    <p className="text-xs text-center text-text-sub mt-4">No unassigned tracks available.</p>
                                                ) : (
                                                    <div className="space-y-1">
                                                        {unassignedTracks.map((t: any) => (
                                                            <div key={t.short_id} className="flex justify-between items-center p-3 hover:bg-panel rounded-lg group border border-transparent hover:border-border transition-colors">
                                                                <div className="flex flex-col truncate pr-2">
                                                                    <span className="text-sm font-bold text-text-main truncate">{t.title}</span>
                                                                    <span className="text-xs text-text-sub">{t.genre?.name || 'No genre'}</span>
                                                                </div>
                                                                <button 
                                                                    disabled={isUpdatingTrack} onClick={() => handleAddTrack(t)}
                                                                    className="text-xs bg-highlight/10 text-highlight px-3 py-1.5 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-highlight hover:text-panel"
                                                                >+ Add</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Danh sách bài hát */}
                            <div className="space-y-2 mt-2">
                                {localTracks.length === 0 && 
                                    <p className="text-center text-text-sub py-6">No tracks in this release yet.</p>
                                }
                                
                                <DraggableList 
                                    items={localTracks}
                                    isEditable={isDraft && editingTrackId === null}
                                    onReorder={setLocalTracks}
                                    keyExtractor={(track) => track.short_id || track.id.toString()}
                                    renderItem={(track, index, dragHandleProps) => {
                                        const isTrackUnavailable = !track.is_active || track.is_blocked || isBlocked;
                                        
                                        // ================= edit nhạc =================
                                        if (editingTrackId === track.short_id) {
                                            return (
                                                <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-highlight bg-highlight/5 animate-fadeIn">
                                                    <span className="w-4 text-center text-text-sub font-bold">{index + 1}</span>
                                                    <div className="flex-1 flex gap-4">
                                                        <input 
                                                            type="text" value={editTrackTitle} 
                                                            onChange={e => setEditTrackTitle(e.target.value)}
                                                            className="flex-1 bg-panel p-2 rounded-md text-sm text-text-main border border-border focus:border-highlight outline-none"
                                                            placeholder="Track Title"
                                                        />
                                                        <select 
                                                            value={editTrackGenre} 
                                                            onChange={e => setEditTrackGenre(e.target.value)}
                                                            className="w-40 bg-panel p-2 rounded-md text-sm text-text-main border border-border focus:border-highlight outline-none"
                                                        >
                                                            <option value="" disabled>Genre</option>
                                                            {genres.map((g: any) => 
                                                                <option key={g.id} value={g.id}>{g.name}</option>
                                                            )}
                                                        </select>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => setEditingTrackId(null)} 
                                                            className="text-xs font-bold text-text-sub hover:text-text-main px-3 py-2"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button 
                                                            onClick={() => handleSaveTrackEdit(track.short_id)} 
                                                            className="text-xs font-bold bg-highlight text-panel px-4 py-2 rounded-lg hover:scale-105 transition-transform flex items-center gap-1"
                                                        >
                                                            <CheckCircleOutlined fontSize="small"/> Save
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div 
                                                onClick={() => !isTrackUnavailable && playTrack(track, localTracks)}
                                                className={`flex items-center justify-between p-3 rounded-xl border transition-colors group
                                                    ${isTrackUnavailable ? 'opacity-50 grayscale cursor-not-allowed bg-base/20' : 'hover:bg-hover cursor-pointer bg-search'}
                                                    ${currentTrack?.short_id === track.short_id ? 'border-highlight bg-highlight/10' : 'border-transparent'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    {isDraft && (
                                                        <div 
                                                            {...dragHandleProps} 
                                                            onClick={e => e.stopPropagation()} 
                                                            className="cursor-grab hover:text-highlight text-text-sub px-1 transition-colors active:cursor-grabbing"
                                                        >
                                                            <DragIndicator fontSize="small" />
                                                        </div>
                                                    )}
                                                    <span className={`w-4 text-center ${currentTrack?.short_id === track.short_id ? 'text-highlight' : 'text-text-sub'}`}>
                                                        {index + 1}
                                                    </span>
                                                    <div className="flex flex-col">
                                                        <span className={`font-medium ${currentTrack?.short_id === track.short_id ? 'text-highlight' : 'text-text-main'}`}>
                                                            {track.title}
                                                        </span>
                                                        {isTrackUnavailable ? (
                                                            <span className="text-[10px] text-error/95 font-bold uppercase mt-0.5">{track.is_blocked ? 'Blocked' : 'Deactivated'}</span>
                                                        ) : (
                                                            <span className="text-[11px] text-text-sub mt-0.5">{track.genre?.name || 'No genre'}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex gap-5 items-center justify-between">
                                                    {currentTrack?.short_id === track.short_id && isPlaying && <PlayingAnimation />}
                                                    <span className="text-text-sub text-xs">{track.duration}</span>
                                                    
                                                    {/* Nút Edit & Remove chỉ hiện khi là Draft */}
                                                    {isDraft && (
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    startEditTrack(track); 
                                                                }}
                                                                className="text-text-sub flex items-center hover:text-highlight p-1.5 rounded-full hover:bg-highlight/10 transition-colors"
                                                                title="Edit track details"
                                                            >
                                                                <EditOutlined fontSize="small" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    handleRemoveTrackFromRelease(track.short_id); 
                                                                }}
                                                                className="text-error flex items-cente p-1.5 rounded-full hover:bg-error/10 transition-colors"
                                                                title="Remove track"
                                                            >
                                                                <CloseRounded fontSize="small" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                            </div>
                        </div>
                        {!isBlocked && 
                            <Player />
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudioReleaseDetailModal;