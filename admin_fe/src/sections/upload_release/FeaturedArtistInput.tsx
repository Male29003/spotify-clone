import { Delete, VerifiedOutlined } from "@mui/icons-material";
import React, { useState } from "react";
import { useGetFeaturedArtists } from "../../hooks/release/useReleases";
import { useDebounce } from "../../hooks/useDebounce";
import Loader from "../../components/shared/ui/Loader";

export interface FeaturedArtistItem {
    id?: number | string;
    name: string;
}

const FeaturedArtistInput = ({ selectedArtists, onChange }: { 
    selectedArtists: FeaturedArtistItem[], 
    onChange: (artists: FeaturedArtistItem[]) => void 
}) => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const debouncedQuery = useDebounce<string>(query, 500);
    const { data, isLoading } = useGetFeaturedArtists(debouncedQuery);

    const results = (data as any)?.results || data?.data || [];
    
    if(isLoading) return <Loader />

    const handleAdd = (artist: FeaturedArtistItem) => {
        if (!selectedArtists.find(a => a.name === artist.name)) {
            onChange([...selectedArtists, artist]);
        }
        setQuery('');
    };

    const handleRemove = (nameToRemove: string) => {
        onChange(selectedArtists.filter(a => a.name !== nameToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && query.trim()) {
            e.preventDefault();
            handleAdd({ name: query.trim() });
        }
    };

    return (
        <div className="flex flex-col gap-2 mt-1 bg-panel/50 p-3 rounded-lg border border-border/50 relative">
            <label className="text-xs font-bold text-text-sub uppercase tracking-wider">
                Featured Artists (Optional)
            </label>
            
            {/* Vùng hiển thị Tag */}
            {selectedArtists.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedArtists.map((artist, i) => (
                        <span key={i} className="bg-search border border-border text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <span className={`font-semibold ${artist.id ? 'text-highlight' : 'text-text-main'}`}>
                                {artist.name} {artist.id ? <VerifiedOutlined /> : ''}
                            </span>
                            <button 
                                type="button" onClick={() => handleRemove(artist.name)}
                                className="text-text-sub hover:text-error rounded-full"
                            >
                                <Delete style={{ fontSize: 14 }}/>
                            </button>
                        </span>
                    ))}
                </div>
            )}
            
            {/* Ô Input Search */}
            <div className="relative">
                <input 
                    type="text" value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    placeholder="Search artist or type a new name & press Enter..."
                    className="bg-panel text-sm text-text-main px-3 py-2 rounded-lg outline-none border border-border focus:border-highlight transition-colors w-full"
                />

                {/* Dropdown Kết quả tìm kiếm */}
                {isFocused && query.trim().length > 1 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-panel border border-border rounded-lg shadow-xl overflow-hidden z-50">
                        {results.length > 0 ? (
                            results.map((artist: any) => (
                                <div 
                                    key={artist.id}
                                    onClick={() => handleAdd({ id: artist.id, name: artist.stage_name })}
                                    className="px-4 py-2 hover:bg-hover cursor-pointer text-sm font-semibold text-text-main border-b border-border/50 last:border-0"
                                >
                                    {artist.stage_name}
                                </div>
                            ))
                        ) : (
                            <div 
                                onClick={() => handleAdd({ name: query.trim() })}
                                className="px-4 py-2 hover:bg-highlight hover:text-text-dark cursor-pointer text-sm text-text-sub flex justify-between"
                            >
                                <span>"{query}" not found.</span>
                                <span className="font-bold">
                                    Add
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default FeaturedArtistInput;