import React from 'react';
import type { ItemType } from '../../../types';
import { useNavigate } from 'react-router-dom';
import PlaylistCover from '../../../sections/library/PLaylistCover';

interface LibraryItemProps {
    item: any,
    type: ItemType;
    isExpanded: boolean;
}

const LibraryItem: React.FC<LibraryItemProps> = ({ isExpanded = false, item, type }) => {
    const isArtist = item.type?.toLowerCase() === 'artist';
    const navigate = useNavigate()

    return (
        <div 
            onClick={() => navigate(`/${type}/${type !== 'playlist' ? item.short_id : item.slug}`) }
            className={`flex items-center p-2 rounded-md cursor-pointer transition-colors duration-200
                ${item.isActive ? 'bg-search' : 'hover:bg-hover'}
            `}
        >
            
            <div className={`relative shrink-0 flex items-center justify-center transition-all duration-300
                ${isExpanded ? 'w-14 h-14' : 'w-full aspect-square'}
            `}>
                {type === 'playlist' ? 
                    <PlaylistCover 
                        playlist={item}
                    />
                :
                    <img 
                        src={item.image} 
                        alt={item.title} 
                        loading="lazy" 
                        className={`w-full h-full object-cover
                            ${isArtist ? 'rounded-full' : 'rounded-md shadow-sm'}
                        `}
                    />
                }
            </div>
            
            <div className={`flex flex-col overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap
                    ${isExpanded ?
                        'w-full opacity-100 translate-x-0 ml-3' :
                        'w-0 opacity-0 -translate-x-4 ml-0'
                     }
                `}>
                <span className={`text-sm truncate ${item.isActive ? 'text-highlight font-bold' : 'text-text-main font-semibold'}`}>
                    {item.title || item.stage_name}
                </span>
                <span className="text-xs text-text-sub truncate mt-0.5 capitalize">
                    {item.subtitle}
                </span>
            </div>
            
        </div>
    );
};

export default LibraryItem;