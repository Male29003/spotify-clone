import React from 'react';
import Loader from '../../components/shared/ui/Loader';
import { useSearchTracks, useSearchReleases, useSearchArtists } from '../../hooks/useSearch';
import { useDebounce } from '../../hooks/useDebounce';
import LibraryItem from '../../components/shared/media/CustomItem';

interface SearchDropdownProps {
    query: string;
    isOpen: boolean;
    onClose: () => void;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({ query, isOpen, onClose }) => {
    // Debounce cái query truyền xuống
    const debouncedQuery = useDebounce(query, 700); 

    const { data: tracksData, isLoading: loadingTracks } = useSearchTracks(debouncedQuery);
    const { data: releasesData, isLoading: loadingReleases } = useSearchReleases(debouncedQuery);
    const { data: artistsData, isLoading: loadingArtists } = useSearchArtists(debouncedQuery);

    if (!isOpen || !query.trim()) return null;

    const isLoading = loadingTracks || loadingReleases || loadingArtists;
    const tracks = ((tracksData as any)?.results || tracksData || []).slice(2);
    const releases = (releasesData as any)?.results || releasesData || [];
    const artists = (artistsData as any)?.results || artistsData || [];

    return (
        <>
            <div className="fixed inset-0 z-50" onClick={onClose}></div>

            {/* Dropdown kết quả */}
            <div className="absolute top-full mt-2 w-full max-h-[75vh] bg-panel border border-border rounded-xl shadow-2xl z-50 overflow-y-auto p-4 space-y-6">
                {isLoading ? (
                    <div className="py-6 flex justify-center"><Loader /></div>
                ) : (
                    <div onClick={onClose} className="space-y-6">
                        {tracks.length > 0 && (
                            <div>
                                <h2 className='text-text-main text-2xl font-bold capitalize'>
                                    Songs
                                </h2>
                            {tracks.map((t: any) => (
                                <LibraryItem 
                                    key={t.short_id}
                                    isExpanded={true}
                                    item={t}
                                    type='track'
                                />
                            ))}
                            </div>
                        )}

                        {artists.length > 0 && (
                            <div>
                                <h2 className='text-text-main text-2xl font-bold capitalize'>
                                    Artist
                                </h2>
                            {artists.map((a: any) => (
                                <LibraryItem 
                                    key={a.short_id}
                                    isExpanded={true}
                                    item={a}
                                    type='artist'
                                />
                            ))}
                            </div>
                        )}
                        
                        {releases.length > 0 && (
                            <div>
                                <h2 className='text-text-main text-2xl font-bold capitalize'>
                                    Release
                                </h2>
                                {releases.map((r: any) => (
                                    <LibraryItem 
                                        key={r.short_id}
                                        isExpanded={true}
                                        item={r}
                                        type='release'
                                    />
                                ))}
                            </div>
                        )}
                        
                        {tracks.length === 0 && artists.length === 0 && releases.length === 0 && (
                            <div className="text-center text-text-sub py-6 text-sm">
                                No results found for "{debouncedQuery}"
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default SearchDropdown;