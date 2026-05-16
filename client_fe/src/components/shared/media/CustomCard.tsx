import React from 'react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TrackAction from './TrackActions';
import { useMenuStore } from '../../../stores/useToggleTPModalStore';
import { useNavigate } from 'react-router-dom';
import type { ItemType } from '../../../types';
import { DEFAULT_PLAYLIST_ICON } from '../../../constants/constants';

interface CustomCardProps {
    item: any; 
    type?: ItemType;
    onClick?: () => void;
    onPlay?: (e: React.MouseEvent) => void
}

const CustomCard: React.FC<CustomCardProps> = ({ item, type, onClick, onPlay}) => {
    const navigate = useNavigate()
    const activeItem = useMenuStore(state => state.item);

    const displaySubtitle = item?.description ? item?.description : item.stage_name;
    const displayTitle = item?.title ? item?.title : item?.stage_name;
    
    return (
        <div 
            onClick={onClick}
            className="w-36 shrink-0 p-2 rounded-md hover:bg-hover transition-all duration-300 group cursor-pointer flex flex-col"
        >
            <div className="relative mb-4 w-full aspect-square">
                <img 
                    src={item.image || DEFAULT_PLAYLIST_ICON} 
                    alt={displayTitle} 
                    className={`w-full h-full object-cover shadow-lg ${type?.toLowerCase() === 'artist' ? 'rounded-full' : 'rounded-md'}`} 
                />
                {type !== 'playlist' && (
                    <div className={`absolute top-2 right-2 group-hover:opacity-100 transition-opacity z-10 bg-base/40 rounded-full p-1 backdrop-blur-sm
                        ${activeItem?.id === item.id && activeItem?.type === type ? 'opacity-100' : 'opacity-0'}
                    `}>
                        <TrackAction item={item} type={type} />
                    </div>
                )}
                {type !== 'artist' && 
                    <button 
                        className="btn-neon-glow absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center opacity-0  shadow-xl translate-y-2 transition-all duration-300 
                            group-hover:opacity-100 group-hover:translate-y-0 hover:scale-110"
                        onClick={(e) => {
                            e.stopPropagation()
                            if(onPlay) onPlay(e)
                        }}
                    >
                            <PlayArrowIcon className="text-text-dark text-3xl! bg-highlight rounded-full" />
                    </button>
                }
            </div>
            
            <h3 className="text-text-main font-bold text-md truncate hover:underline transition-all duration-300">
                {displayTitle}
            </h3>
            
            <div className="text-xs text-text-sub mt-1 line-clamp-2">
                {(type === 'release' || type === 'track') && item.artist ? (
                    <span 
                        onClick={(e) => {
                            e.stopPropagation(); 
                            const artistId = item.artist.short_id || item.artist.slug;
                            if (artistId) {
                                navigate(`/artist/${artistId}`);
                            }
                        }}
                        className="hover:underline hover:text-text-main transition-colors duration-300 relative z-10"
                    >
                        {item.artist.stage_name}
                    </span>
                ) : (
                    <span className="hover:underline transition-all duration-300">
                        {type?.toLowerCase() === 'artist' ? '' : displaySubtitle}
                    </span>
                )}
            </div>
        </div>
    );
};

export default CustomCard;