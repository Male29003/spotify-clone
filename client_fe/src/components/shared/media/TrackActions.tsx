import React, { useState, useEffect } from "react";
import { Favorite, FavoriteBorder, InsertEmoticon, MoreHoriz } from "@mui/icons-material";
import { useAuthStore } from "../../../stores/auth/authStore";
import { useMenuStore } from "../../../stores/useToggleTPModalStore";
import { useToggleFavouriteTrack } from "../../../hooks/track/useTracks";
import { CustomToast } from "../feedback/CustomToast";
import { useToggleFavouriteArtist } from "../../../hooks/artist/useArtists";
import { useToggleFavouriteRelease } from "../../../hooks/release/useReleases";
import { useShallow } from "zustand/react/shallow";
import type { ItemType } from "../../../types";

interface TrackActionProps { 
    item: any 
    type?: ItemType
}

const TrackAction: React.FC<TrackActionProps> = ({ item, type = 'track' }) => {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    // Lấy nút thả tim
    const [isLiked, setIsLiked] = useState(item.is_favourite);
    useEffect(() => { 
        setIsLiked(item.is_favourite); 
    }, [item.is_favourite]);

    // Xử lý yêu thích
    const {mutate: toggleFavouriteTrack} = useToggleFavouriteTrack()
    const {mutate: toggleFavouriteArtist} = useToggleFavouriteArtist()
    const {mutate: toggleFavouriteRelease} = useToggleFavouriteRelease()

    const handleFavourite = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuthenticated) 
            return CustomToast.info('Please log in to use this function!');
        setIsLiked(!isLiked);

        if(type === 'artist') toggleFavouriteArtist(item.short_id)
        else if(type === 'track') toggleFavouriteTrack(item.short_id)
        else if (type === 'release') toggleFavouriteRelease(item.short_id)
    };

    // Quản lý bài hát hiện tại
    const { activeItem, openMenu, closeMenu } = useMenuStore(
        useShallow(state => ({
            activeItem: state.item,
            openMenu: state.openMenu,
            closeMenu: state.closeMenu,
        }))
    )
    const isMenuOpen = activeItem?.id === item.id && activeItem?.type === type;
    // Quán lý mở menu
    const visibilityClass = isMenuOpen 
        ? "!opacity-100 text-text-main" 
        : "opacity-0 group-hover:opacity-100 text-text-sub hover:text-text-main";
    const handleOpenMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        const itemToStore = { ...item, type: type}
        if (!isAuthenticated) 
            return CustomToast.info('Please log in to use this function!');
        if (isMenuOpen) {
            closeMenu();
            return;
        }
        const xRatio = e.clientX / window.innerWidth;
        const yRatio = e.clientY / window.innerHeight;
        const position: any = {};
        if (xRatio > 0.5) position.right = window.innerWidth - e.clientX;
        else position.left = e.clientX;

        if (yRatio > 0.6) position.bottom = window.innerHeight - e.clientY;
        else position.top = e.clientY;
        
        openMenu(itemToStore, position);
    };

    return (
        <div className={`flex justify-center items-center gap-3 relative`}>
           {isLiked ? (
                <Favorite 
                    className={`text-highlight text-[20px] cursor-pointer hover:scale-110 transition-transform `} 
                    onClick={handleFavourite} 
                />
            ) : (
                <FavoriteBorder 
                    className={`text-text-sub hover:text-text-main text-[20px] cursor-pointer transition-colors`} 
                    onClick={handleFavourite} 
                />
            )}
            {type === 'track' && (
                <MoreHoriz 
                    className={`text-[20px] cursor-pointer transition-colors ${visibilityClass}`}
                    onClick={handleOpenMenu}
                />
            )}
        </div>
    );
};

export default TrackAction;