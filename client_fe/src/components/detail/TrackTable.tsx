import React, { useState } from "react";
import { Close } from "@mui/icons-material";
import TrackAction from "../shared/media/TrackActions";
import type { ITrack } from "../../types";

interface TrackTableProps {
    tracks: ITrack[];
    playTrack: (track: ITrack, queue: ITrack[]) => void;
    onRemoveTrack?: (track: ITrack) => void; 

    // ktra xem liệu result trả về có phải là phân trang hay ko
    isServerPaginated?: boolean
    // ktra để loadmore
    hasMoreServer?: boolean
    isLoadingMore?: boolean
    onLoadMore?: () => void
}

const TrackTable: React.FC<TrackTableProps> = ({ tracks, playTrack, onRemoveTrack, isServerPaginated = false, hasMoreServer = false, isLoadingMore = false, onLoadMore }) => {
    const gridLayout = "grid grid-cols-[30px_minmax(200px,0.8fr)_120px_100px] gap-4 px-4 py-3 items-center";
    
    const [displayCount, setDisplayCount] = useState(10);
    const visibleTracks = isServerPaginated ? tracks : tracks.slice(0, displayCount);
    const hasMoreClient = !isServerPaginated && displayCount < tracks.length;

    const handleLoadMore = () => {
        if (isServerPaginated && onLoadMore) {
            onLoadMore();
        } else {
            setDisplayCount(prev => prev + 10);
        }
    };
    return (
        <div className="pb-8 w-full">
            <div className="w-full overflow-x-auto custom-scrollbar">
                <div className="min-w-2xl">
                    <div className={`${gridLayout} text-text-main border-b border-border text-sm`}>
                        <span className="text-center">#</span>
                        <span>Title</span>
                        <span>Artist</span>
                        <span></span> 
                    </div>

                    <div className="flex flex-col">
                        {visibleTracks.map((track: any, index: number) => (
                            <div 
                                key={`${track.id}_${index}`}
                                onClick={() => playTrack(track, tracks)}
                                className={`${gridLayout} text-text-sub hover:bg-hover/50 rounded-lg cursor-pointer group transition-colors`}
                            >
                                <span className="text-center text-sm">{index + 1}</span>

                                {/* Title */}
                                <span className="text-text-main font-medium truncate">{track.title}</span>

                                {/* Artist */}
                                <span className="text-sm truncate group-hover:text-text-main transition-colors">
                                    {track.artist?.stage_name || track.artist_name || "Unknown Artist"}
                                </span>
                                
                                {/* Actions */}
                                <div className="flex items-center justify-end gap-1 md:gap-2">
                                    <TrackAction item={track} />
                                    {onRemoveTrack && (
                                        <Close 
                                            className="text-text-sub hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                            fontSize="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveTrack(track);
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* nutút  looad more */}
            {(hasMoreServer || hasMoreClient) && (
                <div className="flex justify-center mt-6">
                    <button 
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="px-6 py-2 rounded-full border border-border text-text-sub text-sm font-bold hover:text-text-main hover:border-highlight hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        {isLoadingMore ? 'Loading...' : 'Show More'}
                    </button>
                </div>
            )}
        </div>
    )
}

export default TrackTable;