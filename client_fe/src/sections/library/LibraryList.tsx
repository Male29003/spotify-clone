import React, { useState } from 'react';
import LibraryItem from '../../components/shared/media/CustomItem';
import type { LibraryItems, ItemType } from '../../types'; 
import { useLocation } from 'react-router-dom';
import { Search } from '@mui/icons-material';
import { LIKED_SONGS_BASE } from '../../constants/constants';

interface LibraryListProps {
    isExpanded: boolean;
    items: LibraryItems[];
    likedSongs: any
}

const LibraryList: React.FC<LibraryListProps> = ({ isExpanded, likedSongs, items }) => {
    const [activeFilter, setActiveFilter] = useState<'all' | ItemType>('all');
    const [searchQuery, setSearchQuery] = useState('')
    const location = useLocation()

    const likedSongsItem = {
        ...LIKED_SONGS_BASE,
        subtitle: `${likedSongs?.count || 0} songs`,
        isActive: location.pathname === '/collection-tracks'
    };

    const showLikedSongs = 
        (activeFilter === 'all' || activeFilter === 'playlist') &&
        (!searchQuery || 'liked songs'.includes(searchQuery.toLowerCase()));
    
    const filteredItems = items.filter(item => 
        activeFilter === 'all' ? true : item.type === activeFilter
    );


    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div
                className={`transition-all duration-300 shrink-0 px-4 overflow-hidden
                    ${isExpanded ? 
                        'opacity-100 max-h-20 mb-2' :
                        'opacity-0 max-h-0 mb-0 px-0'
                    }
                    `}
            >
                <div className="flex gap-2 px-4 py-2 overflow-x-auto custom-scrollbar">
                    {['all', 'playlist', 'artist', 'release'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter as any)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap
                                ${activeFilter === filter 
                                    ? 'bg-hover text-text-main font-bold' 
                                    : 'bg-card/80 text-text-sub hover:bg-hover' 
                                }`}
                        >
                            {filter === 'all' ? 'All' : 
                                filter === 'playlist' ? 'Playlist' :
                                filter === 'artist' ? 'Artist' : 'Release'}
                        </button>
                    ))}
                </div>
                <div className={`flex items-center bg-search rounded-md px-2 py-1.5 text-text-sub focus-within:text-text-main border-[1px]
                        hover:border-highlight
                    `}>
                    <Search fontSize="small" />
                    <input 
                        type="text" 
                        placeholder="Search in Your Library" 
                        className="bg-transparent border-none outline-none text-xs w-full ml-2 text-text-main"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4 space-y-1 custom-scrollbar">
                {showLikedSongs && (
                    <LibraryItem 
                        item={likedSongsItem}
                        type='playlist'
                        isExpanded={isExpanded}
                    />
                )}
                {filteredItems.map((group) => (
                    group.data.map((rawItem: any, index) => {
                        const itemType = group.type
                        const expectedPath = `/${itemType}/${rawItem.short_id}`
                        const isActive = location.pathname === expectedPath
                        const displayItem = {
                            id: rawItem.id,
                            type: group.type,
                            title: itemType === 'artist' ? rawItem.stage_name : rawItem.title,
                            slug: rawItem.slug,
                            subtitle: itemType === 'playlist' ? 'Playlist' : itemType === 'release' ? rawItem.release_type : '',
                            image: rawItem.image,
                            short_id: rawItem.short_id,
                            isActive: isActive,
                        };

                        if (searchQuery && !displayItem.title.toLowerCase().includes(searchQuery.toLowerCase())) {
                            return null;
                        }
                        const uniqueId = rawItem.id || rawItem.short_id || rawItem.slug || index;

                        return (
                            <LibraryItem
                                key={`${group.type}-${uniqueId}`}
                                item={displayItem}
                                type={group.type}
                                isExpanded={isExpanded}
                            />
                        );
                    })
                ))}
            </div>
        </div>
    );
};

export default LibraryList;