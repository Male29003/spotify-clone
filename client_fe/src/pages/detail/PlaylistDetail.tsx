import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PlayArrow, BorderColor } from '@mui/icons-material';
import { usePlayerStore } from '../../stores/usePlayerStore';
import TrackTable from '../../components/detail/TrackTable';
import { useAuthStore } from '../../stores/auth/authStore';
import { useGetPlaylistDetail, useToggleTrackPlaylist, useUpdatePlaylist } from '../../hooks/playlist/usePlaylists';
import type { ITrack } from '../../types';
import { useConfirmModalStore } from '../../stores/useConfirmModalStore';
import DetailPageLayout from '../../layouts/detail/DetailLayout';
import { CustomToast } from '../../components/shared/feedback/CustomToast';
import { LIKED_SONGS_BASE } from '../../constants/constants';
import { useGetFavouriteTracks } from '../../hooks/track/useTracks';
import { api } from '../../api/axiosConfig';
import { TrackTableSkeleton } from '../../components/shared/skeleton/TrackTableSkeleton';

const PlaylistDetail: React.FC = () => {
    // Lấy slug
    const { slug } = useParams<{ slug: string }>();
    const { user } = useAuthStore(state => state);
    // Quản lý các state
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '' });
    
    // Quản lý ảnh
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    // quản lý chức năng
    const playTrack = usePlayerStore(state => state.playTrack);
    const { mutate: updatePlaylist } = useUpdatePlaylist();
    const { mutate: toggleTrackPlaylist } = useToggleTrackPlaylist();
    const { showConfirm, closeModal, setLoading } = useConfirmModalStore();

    // Kiểm tra để lấy data
    const isLikedSongs = slug === 'collection-tracks'
    const { data: normalPlaylistData, isLoading: loadingNormalPlaylist } = useGetPlaylistDetail(slug || '', !isLikedSongs );
    const { data: favTracksData, isLoading: loadingFavTracks } = useGetFavouriteTracks() 
    const currentLoading = isLikedSongs ? loadingFavTracks : loadingNormalPlaylist;

    // ==================================================================================================================================================
    // quản lý load more cho danh sách yêu thích
    const [likedTracks, setLikedTracks] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    useEffect(() => {
        if (isLikedSongs && favTracksData && page === 1) {
            const responseData = (favTracksData as any)?.data || favTracksData;
            if (responseData?.results) {
                setLikedTracks(responseData.results.map((item: any) => item.track || item));
                setHasMore(!!responseData.next);
            }
        }
    }, [isLikedSongs, favTracksData, page]);
    
    const handleLoadMoreLikedSongs = async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            const nextPage = page + 1;
            const res = await api.get(`/music/me/favourite/`, {
                params: {
                    page: nextPage
                }
            });
            const newData = (res as any).results || res.data?.results || [];
            
            if (newData.length > 0) {
                const newTracks = newData.map((item: any) => item.track || item);
                setLikedTracks(prev => [...prev, ...newTracks]);
                setPage(nextPage);
                setHasMore(!!(res as any).next);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const playlist = isLikedSongs ? {
        ...LIKED_SONGS_BASE,
        user_id: user?.id,
        user: user,
        tracks: likedTracks,
        is_private: false
    } : (normalPlaylistData?.data || normalPlaylistData);

    const tracks = playlist?.tracks || [];
    const isOwner = user?.id && (playlist?.user_id === user.id || playlist?.user?.id === user.id);
    const canEdit = isOwner && !isLikedSongs;
    
    // bỏ bài hát ra khỏi playlist
    const handleRemoveTrack = (track: ITrack) => {
        showConfirm('delete', () => {
            setLoading(true)
            toggleTrackPlaylist({playlist_slug: playlist.slug, track_id: track.id}, {
                onSettled: () => {
                    closeModal()
                }
            })
        })
    }

    // Kích hoạt Edit
    const handleEditClick = () => {
        setFormData({ title: playlist?.title || '', description: playlist?.description || '' });
        setImagePreview(playlist?.image || null);
        setImageFile(null);
        setIsEditing(true);
    };

    // Hủy Edit
    const handleCancelEdit = () => {
        setIsEditing(false);
        setImageFile(null);
        setImagePreview(null);
    };

    const handleImageRemove = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        setImageFile(null);
        setImagePreview(''); 
    };

    // Khi chọn ảnh ẩn
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(file) {
            if(!file.type.startsWith('image/')) return CustomToast.error('Please upload an image file!');
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // Lưu
    const handleSave = (e: React.MouseEvent) => {
        e.preventDefault();
        if(slug && !isLikedSongs) {
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            
            if (imageFile) {
                submitData.append('image', imageFile);
            } else if (imagePreview === '' && playlist?.image) {
                submitData.append('image', ''); 
            }

            updatePlaylist({ slug, data: submitData }, {
                onSuccess: () => {
                    CustomToast.success("Updated Playlist!");
                    setIsEditing(false);
                },
                onError: () => CustomToast.error(`Failed to update playlist!`),
            });
        }
    }

    if (!currentLoading && !playlist) return <div className="text-center text-text-main mt-20">Not found playlist</div>;
    
    const ActionBtns = isEditing ? (
        <div className="flex items-center gap-4 animate-fadeIn">
            <button 
                onClick={handleCancelEdit} 
                className="px-6 py-2 rounded-full font-bold text-text-sub hover:text-text-main transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={handleSave} 
                className="bg-highlight text-text-dark px-8 py-2 rounded-full font-bold hover:scale-105 transition-transform shadow-lg"
            >
                Save Changes
            </button>
        </div>
    ) : (
        <>
            <button 
                className="btn-neon-glow w-14 h-14 bg-highlight rounded-full flex items-center justify-center text-text-dark hover:scale-105 transition-transform shadow-xl"
                onClick={() => { if (tracks.length > 0) playTrack(tracks[0], tracks); }}
            >
                <PlayArrow className="text-4xl!" />
            </button>
            {/* Nút Edit */}
            {canEdit && 
                <BorderColor 
                    titleAccess='Edit playlist'
                    className="text-text-sub text-2xl! cursor-pointer hover:text-text-main ml-2" 
                    onClick={handleEditClick} 
                />
            }
        </>
    );

    return (
        <>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageChange} 
            />

            <DetailPageLayout 
                isLoading={currentLoading}
                actionBtns={ActionBtns}
                item={playlist}
                type='Playlist'
                totalTracks={tracks.length}
                mainContent={
                    (currentLoading) ? 
                        <TrackTableSkeleton key={'playlist-skeleton'} rows={5}/>
                    :
                        <TrackTable
                            tracks={tracks}
                            playTrack={playTrack}
                            onRemoveTrack={isOwner ? handleRemoveTrack : undefined}
                            isServerPaginated={isLikedSongs}
                            hasMoreServer={hasMore}
                            isLoadingMore={isLoadingMore}
                            onLoadMore={handleLoadMoreLikedSongs}
                        />
                }
                editConfig={isEditing ? {
                    isEditing: true,
                    data: formData,
                    imagePreview: imagePreview,
                    onChange: (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value })),
                    onImageClick: () => fileInputRef.current?.click(),
                    onImageRemove: handleImageRemove,
                } : undefined}
            />
        </>
    );
};

export default PlaylistDetail;