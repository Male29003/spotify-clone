// src/layouts/Sider.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ViewSidebarOutlined, AddOutlined } from '@mui/icons-material';
import  LibraryList  from '../../sections/library/LibraryList';
import { useAuthStore } from '../../stores/auth/authStore';
import { useMyPlaylists, useCreatePlaylist } from '../../hooks/playlist/usePlaylists';
import { useGetFavouriteReleases } from '../../hooks/release/useReleases';
import { useGetFavouriteTracks } from '../../hooks/track/useTracks';
import { useFavouriteArtists } from '../../hooks/artist/useArtists';
import type { LibraryItems } from '../../types';
import { CustomToast } from '../../components/shared/feedback/CustomToast';
import { useSidebar } from '../../hooks/useSidebar';
import Loader from '../../components/shared/ui/Loader';

const CustomSider = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    // Quản lý kéo dãn sider
    const { isVisuallyExpanded, logicalWidth, handleDrag, toggleSidebar } = useSidebar();
    // Nếu đang thu nhỏ, fix cứng 80px.
    const currentRenderWidth = isVisuallyExpanded ? logicalWidth : 80;
    // Chỉ giữ lại mảng UI/Events
    const isResizing = useRef(false);

    const startResizing = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
    }, []);

    const stopResizing = React.useCallback(() => {
        if(isResizing.current){
            isResizing.current = false;
            document.body.style.cursor = 'default';
        }
    }, []);

    const resize = React.useCallback((mouseEvent: MouseEvent) => {
        if(isResizing.current) {
            handleDrag(mouseEvent.clientX); // Đẩy logic tính toán cho Hook
        }
    }, [handleDrag]);

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        }
    }, [resize, stopResizing]);
    // Lấy data
    const { data: myPlaylists, isLoading: gettingPlaylist } = useMyPlaylists();
    const { data: favouriteReleases, isLoading: gettingFavReleases } = useGetFavouriteReleases();
    const { data: favouriteTracks, isLoading: gettingFavTracks } = useGetFavouriteTracks();
    const { data: favouriteArtists, isLoading: gettingFavArtists } = useFavouriteArtists();

    // Xử lý tạo playlist
    const [ isCreating, setIsCreating ] = useState(false)
    const [ playlistName, setPlaylistName ] = useState("")
    const createPlaylistMutation = useCreatePlaylist()

    const handleCreatePlaylist = (e: React.FormEvent) => {
        e.preventDefault()
        if(!playlistName.trim()) return

        createPlaylistMutation.mutate(
            {
                title: playlistName,
            },
            {
                onSuccess: () => {
                    setIsCreating(false)
                    setPlaylistName("")
                    CustomToast.success("Playlist is successfully created!");
                },
                onError: () => {
                    CustomToast.error("Can not create playlist !!!");
                }
            }
        )
    }
    // xử lý kéo giãn sider
    useEffect(() => {
        window.addEventListener('mousemove', resize)
        window.addEventListener('mouseup', stopResizing)
        return () => {
            window.removeEventListener('mousemove', resize)
            window.removeEventListener('mouseup', stopResizing)
        }
    }, [resize, stopResizing])
    // Lọc data
    const likedSongs = useMemo(() => {
        const responseData = (favouriteTracks as any)?.data || favouriteTracks;
        const tracks = responseData?.results || responseData || [];
        
        return {
            data: tracks, 
            count: responseData?.count
        };
    }, [favouriteTracks]);

    const libraryItems = useMemo(() => {
        if (!isAuthenticated) return [];
        const mPlaylists: LibraryItems ={
            type: 'playlist',
            data: ((myPlaylists as any)?.results || myPlaylists || [])
        }
        const favReleases: LibraryItems = {
            type: 'release',
            data: ((favouriteReleases as any)?.results || favouriteReleases || []).map((i: any) => i.release || i)
        }
        const favArtists: LibraryItems = {
            type: 'artist',
            data: ((favouriteArtists as any)?.results || favouriteArtists || []).map((i: any) => i.artist || i)
        }
        return [mPlaylists, favArtists, favReleases ];
    }, [myPlaylists, favouriteArtists, favouriteReleases, isAuthenticated]);

    const isLoading = gettingPlaylist || gettingFavArtists || gettingFavReleases || gettingFavTracks
    if(isLoading) return <Loader />

    return (
        <div 
            className={`relative flex flex-col bg-panel h-full rounded-lg overflow-hidden transition-all 
                ${isResizing.current ? 'transition-none' : 'transition-all duration-300 ease-in-out'}`}
            style={{ width: `${currentRenderWidth}px`, minWidth: `${currentRenderWidth}px`}}
        >
            {/* Thanh kéo giãn */}
            <div
                className='absolute top-0 right-0 w-2 h-full cursor-col-resize z-50 group flex justify-end'
                onMouseDown={startResizing}
            >
                <div className='w-[2px] h-full bg-border opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
            </div>
            {/* Header sider */}
            <div className="p-4 flex items-center justify-between text-text-sub shadow-sm z-10 shrink-0">
                <button 
                    className="flex items-center gap-4 hover:text-text-main transition-colors cursor-pointer"
                    onClick={toggleSidebar}
                >
                    <ViewSidebarOutlined className="text-2xl!" />
                    {isVisuallyExpanded && 
                        <span className="font-bold text-sm whitespace-nowrap capitalize">Library</span>
                    }
                </button>
                {isAuthenticated && isVisuallyExpanded && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="group flex items-center p-1.5 text-text-sub rounded-2xl hover:text-text-main hover:bg-hover transition-all duration-300 ease-out"
                    >
                        <AddOutlined className="text-xl! shrink-0" />
                        <span className='max-w-0 overflow-hidden text-sm font-semibold whitespace-nowrap transition-all duration-300 ease-out 
                            group-hover:max-w-30 group-hover:pr-1 group-hover:ml-1.5'>
                                Create Playlist
                        </span>
                    </button>
                )}
            </div>
            
            {/* Khung tạo playlist */}
            {isAuthenticated && isCreating && isVisuallyExpanded && (
                <div className='px-4 pb-2'>
                    <form onSubmit={handleCreatePlaylist}>
                        <input 
                            autoFocus
                            placeholder="Name ..."
                            type="text"
                            value={playlistName}
                            onChange={(e) => setPlaylistName(e.target.value)}
                            className='w-full bg-search text-sm text-text-main p-1 rounded border border-transparent outline-none hover:border-green'
                        />
                        <div className='flex justify-end gap-2 mt-1'>
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="text-xs text-text-sub hover:text-text-main p-2"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createPlaylistMutation.isPending}
                                className={`text-xs bg-highlight text-text-dark rounded-full font-bold px-3 py-1
                                        ${createPlaylistMutation.isPending ? 'opacity-50' : 'hover:scale-105'} `}
                            >
                                {createPlaylistMutation.isPending ? "Creating ..." : "Save"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Khung items */}
            {isAuthenticated ? 
                <div className='flex flex-1 flex-col overflow-hidden min-h-0'>
                    <LibraryList 
                        isExpanded={isVisuallyExpanded} 
                        items={libraryItems} 
                        likedSongs={likedSongs}
                    />
                </div>
                :
                <div className="flex w-full h-full items-center justify-center p-4 text-text-sub overflow-hidden">
                    {!isVisuallyExpanded ? (
                        <ViewSidebarOutlined className="opacity-50" /> 
                    ) : (
                        <span className="text-sm text-center whitespace-nowrap animate-fadeIn">
                            Please sign in to have your own library
                        </span>
                    )}
                </div>
            }
        </div>
    );
};

export default CustomSider;