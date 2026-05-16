import React, { useState } from 'react';
import { Add, Remove, PlaylistAdd, KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';
import { useMyPlaylists, useToggleTrackPlaylist } from '../../../hooks/playlist/usePlaylists';
import { CustomToast } from '../feedback/CustomToast';

interface PlaylistSubMenuProps {
    track: any;
}

const PlaylistSubMenu: React.FC<PlaylistSubMenuProps> = ({ track }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Lấy danh sách Playlist của user đang đăng nhập
    const { data: myPlaylists, isLoading } = useMyPlaylists();
    const playlists = (myPlaylists as any)?.results || myPlaylists || [];

    // Thêm / bỏ khỏi playlist
    const { mutate } = useToggleTrackPlaylist();
    const handleToggleTrack = (e: React.MouseEvent, playlist: any, isAdded: boolean) => {
        e.stopPropagation(); 
        
        mutate({ playlist_slug: playlist.slug, track_id: track.id }, {
            onSuccess: () => {
                if (isAdded) {
                    CustomToast.success(`Removed from ${playlist.title}`);
                } else {
                    CustomToast.success(`Added to ${playlist.title}`);
                }
            },
            onError: () => {
                CustomToast.error(`Failed to update ${playlist.title}`);
            }
        });
    };

    return (
        <div className="flex flex-col w-full">
            {/* Nút Trigger Xổ xuống */}
            <button 
                className="flex items-center justify-between text-left w-full px-3 py-2 hover:bg-hover cursor-pointer rounded-md text-sm text-text-main transition-colors"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsOpen(!isOpen);
                }}
            >
                <div className="flex items-center gap-3">
                    <PlaylistAdd fontSize="small" />
                    <span>Add to playlist</span>
                </div>
                {isOpen ? <KeyboardArrowDown fontSize="small" className="text-text-sub" /> : <KeyboardArrowRight fontSize="small" className="text-text-sub" />}
            </button>

            {/* Khung danh sách Playlist */}
            {isOpen && (
                <div className="flex flex-col mt-1 mb-1 ml-6 border-l border-border pl-1 max-h-40 overflow-y-auto custom-scrollbar">
                    {isLoading && <div className="p-2 text-xs text-text-sub">Loading...</div>}
                    {!isLoading && playlists.length === 0 && <div className="p-2 text-xs text-text-sub">No playlists available.</div>}
                    
                    {!isLoading && playlists.map((playlist: any) => {
                        const isAdded = playlist.tracks?.some((t: any) => t.short_id === track.short_id) 
                                     || playlist.track_ids?.includes(track.short_id);
                        return (
                            <div 
                                key={`fallback-${playlist.id}`} 
                                className="flex justify-between items-center px-3 py-2 hover:bg-hover cursor-pointer rounded-md transition-colors group"
                                onClick={(e) => handleToggleTrack(e, playlist, isAdded)}
                            >
                                <span className={`text-sm truncate ${isAdded ? 'text-highlight' : 'text-text-sub group-hover:text-text-main'}`}>
                                    {playlist.title}
                                </span>
                                
                                {isAdded ? (
                                    <Remove className="text-highlight text-[16px]!" />
                                ) : (
                                    <Add className="text-text-sub group-hover:text-text-main text-[16px]!" />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PlaylistSubMenu;
