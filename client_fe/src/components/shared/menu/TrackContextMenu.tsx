import React from 'react';
import { QueuePlayNext, QueueMusic, Download, Person, ArrowRight, Cancel } from '@mui/icons-material';
import PlaylistSubMenu from './PlaylistSubMenu';
import { useNavigate } from 'react-router-dom';
import { useMenuStore } from '../../../stores/useToggleTPModalStore';
import { usePlayerStore } from '../../../stores/usePlayerStore';
import { useTrackDownload } from '../../../hooks/track/useTracks';
import { useAuthStore } from '../../../stores/auth/authStore';

const TrackContextMenu: React.FC = () => {
    const navigate = useNavigate();
    const {user} = useAuthStore(state => state)
    const { item, position, closeMenu } = useMenuStore();
    const { addToQueue } = usePlayerStore();

    const { downloadTrack, isDownloading, cancelDownload } = useTrackDownload()
    if (!item) return null;
    return (
        <>
            {/* Lớp Overlay */}
            <div 
                className="fixed inset-0 z-40" 
                onClick={closeMenu} 
                onContextMenu={(e) => {
                    e.preventDefault();
                    closeMenu();
                }}
            />
            
            {/* Box Menu chính */}
            <div 
                className="fixed z-50 bg-panel border border-border rounded-lg shadow-2xl p-1.5 w-64 flex flex-col text-text-main text-sm"
                style={{
                    top: position?.top, 
                    left: position?.left, 
                    right: position?.right, 
                    bottom: position?.bottom
                }}
            >
                {/* phát tiếp theo */}
                <button 
                    className="flex items-center gap-3 text-left w-full px-3 py-2 hover:bg-hover cursor-pointer rounded-md transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        addToQueue(item, 'next'); 
                        closeMenu();
                    }}
                >
                    <QueuePlayNext fontSize="small" />
                    <span>Play next</span>
                </button>
                {/* thêm vào cuối danh sách */}
                <button 
                    className="flex items-center gap-3 text-left w-full px-3 py-2 hover:bg-hover cursor-pointer rounded-md  transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        addToQueue(item, 'last');
                        closeMenu();
                    }}
                >
                    <QueueMusic fontSize="small" />
                    <span>Add to queue</span>
                </button>

                {/* Danh sách playlist */}
                <hr className="border-border my-1" />
                <PlaylistSubMenu 
                    track={item} 
                />

                <hr className="border-border my-1" />

                {/* nút tải nhạc */}
                <button 
                    title={!user?.is_premium ? "Premium only" : "Download"}
                    className={`flex items-center gap-3 text-left w-full px-3 py-2 rounded-md  transition-colors
                        ${!user?.is_premium ? 'opacity-50 ' : 'cursor-pointer hover:scale-110 hover:text-highlight'}
                    `}
                    onClick={(e) => {
                        e.stopPropagation();
                        if(!user?.is_premium) {
                            return
                        }

                        if (!isDownloading) {
                            downloadTrack(item); 
                        } else {
                            cancelDownload();
                            closeMenu(); 
                        }
                    }}
                >
                    {isDownloading ? 
                        <Cancel fontSize='small'/>                
                    :
                        <Download fontSize="small" />
                    }
                    <div className="flex items-center justify-between w-full">
                        <span>Download</span>
                        {!user?.is_premium && (
                            <span className="text-[10px] bg-hover text-text-main font-semibold px-1.5 py-0.5 rounded-sm group-hover:text-highlight transition-colors">
                                P
                            </span>
                        )}
                    </div>
                </button>
                
                <button 
                    className="flex items-center gap-3 text-left w-full px-3 py-2 hover:bg-hover cursor-pointer rounded-md transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (item.artist?.short_id) {
                            navigate(`/artist/${item.artist.short_id}`);
                        }
                        closeMenu();
                    }}
                >
                    <Person fontSize="small" />
                    <span>Artist</span>
                    <ArrowRight fontSize='small'/>
                </button>
            </div>
        </>
    );
};

export default TrackContextMenu;
