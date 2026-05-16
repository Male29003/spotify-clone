import React from "react";
import { usePlayerStore } from "../../stores/usePlayerStore";
import { useShallow } from "zustand/react/shallow";
import { Close, DragIndicator } from "@mui/icons-material";
import PlayingAnimation from "../../components/shared/ui/PlayingAnimation";
import DraggableList from "../../components/shared/ui/DraggableList";
import { useAuthStore } from "../../stores/auth/authStore";

const TrackQueueSider: React.FC = () => {
    const { user } = useAuthStore(state => state)
    const { openQueue, currentTrack, queue, currentIndex, playTrack, removeFromQueue, reorderQueue } = usePlayerStore(
        useShallow(state => ({
            openQueue: state.openQueue,
            currentTrack: state.currentTrack,
            queue: state.queue,
            currentIndex: state.currentIndex,
            playTrack: state.playTrack,
            addToQueue: state.addToQueue,
            removeFromQueue: state.removeFromQueue,
            reorderQueue: state.reorderQueue
        }))
    );

    if (!currentTrack || queue.length === 0) return (
        <div 
            className={`bg-panel rounded-lg transition-all duration-300 ease-in-out overflow-hidden flex flex-col shrink-0
                ${openQueue ? 'w-[250px] md:w-[350px] opacity-100 ml-2' : 'w-0 opacity-0 ml-0'}`}
        >
            <div className="w-[250px] md:w-[350px] p-4 flex justify-center items-center h-full">
                <span className="text-text-sub">No songs in queue.</span>
            </div>
        </div>
    );

    return (
        <div className={`bg-panel rounded-lg opacity-100 overflow-hidden custom-scrollbar shrink-0 transition-all ease-in-out duration-500
                        ${openQueue ? 'w-[250px] md:w-[350px] opacity-50' : 'w-0 opacity-100 ml-0'}`}>
            <div className="w-[250px] md:w-[350px] h-full p-4 flex flex-col overflow-y-auto custom-scrollbar">
                
                <h2 className="font-bold text-text-main text-2xl py-3 px-1 shrink-0">Playing: </h2>
                <div className="flex items-center justify-start mb-6 gap-5 shrink-0">
                    <img 
                        src={currentTrack.image} 
                        alt={currentTrack.title}
                        className="w-20 aspect-square rounded-lg shadow-2xl object-cover" 
                    />
                    <div className="overflow-hidden">
                        <h3 className="text-lg font-bold text-text-main hover:underline cursor-pointer truncate">{currentTrack.title}</h3>
                        <p className="text-text-sub text-xs hover:underline cursor-pointer truncate">
                            {currentTrack.artist?.stage_name || "Unknown Artist"}
                        </p>
                    </div>
                </div>
                
                <div className="bg-card p-3 rounded-lg border border-hover flex-1 min-h-0 flex flex-col">
                    <h3 className="font-bold text-text-main mb-3 text-xl shrink-0">Queue:</h3>
                    
                    <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                        <DraggableList 
                            items={queue}
                            isEditable={user?.is_premium || false}
                            onReorder={(newQueue) => reorderQueue(newQueue)}
                            keyExtractor={(track) => track.short_id}
                            renderItem={(track, idx, dragHandleDrops) => (
                                <div 
                                    key={`${track.short_id}`} 
                                    className={`flex items-center gap-0 hover:bg-hover p-2 rounded-md cursor-pointer group transition-colors shrink-0
                                        ${idx === currentIndex ? 'bg-hover' : ''}`}
                                    onClick={() => playTrack(track, queue)}
                                >
                                    {user?.is_premium && (
                                        <div 
                                            {...dragHandleDrops}
                                            onClick={e => e.stopPropagation()}
                                            className="cursor-grab p-0 m-0 text-text-sub hover:text-text-main active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"    
                                        >
                                            <DragIndicator fontSize="small"/>
                                        </div>
                                    )}
                                    {idx === currentIndex && (
                                        <PlayingAnimation />
                                    )}
                                    <div className="flex flex-col flex-1 overflow-hidden ml-2">
                                        <span className={`text-sm font-semibold truncate 
                                            ${idx === currentIndex ? 'text-highlight' : 'group-hover:text-highlight transition-colors'}`}>
                                            {track.title}
                                        </span>
                                        <span className="text-text-sub text-xs truncate">
                                            {track.artist?.stage_name || "Unknown"}
                                        </span>
                                    </div>
                                    <button
                                        className="text-error opacity-0 group-hover:opacity-100 transition-opacity p-1 shrink-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFromQueue(idx);
                                        }}
                                        title="Remove from queue"
                                    >
                                        <Close fontSize="small"/>
                                    </button>
                                </div>
                            )}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TrackQueueSider;