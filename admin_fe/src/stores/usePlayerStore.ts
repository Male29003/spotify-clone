import { create } from "zustand";
import type { ITrack } from "../types";

interface PlayerState {
    currentTrack: ITrack | null;
    queue: ITrack[];
    currentIndex: number;
    isPlaying: boolean;
    isShuffle: boolean;
    repeatMode: 'none' | 'all' | 'one';
    openQueue: boolean;
    volume: number;
    toggleQueue: () => void;
    setQueue: (newQueue: ITrack[]) => void;

    playTrack: (track: ITrack, newQueue?: ITrack[]) => void;
    nextTrack: () => void;
    previousTrack: () =>void;
    setVolume: (volume: number) => void;
    setCurrentTrack: (track: ITrack | null) => void;
    
    togglePlay: () => void;
    toggleShuffle: () => void;
    toggleRepeat: () => void;
    addToQueue: (track: ITrack) => void;
    removeFromQueue: (indexToRemove: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    currentTrack: null,
    queue: [],
    currentIndex: -1,
    isPlaying: false,
    isShuffle: false,
    repeatMode: 'none',
    openQueue: false,
    volume: 0.5,
    toggleQueue: () => set((state) => ({ openQueue: !state.openQueue })),
    setQueue: (newQueue) => set({queue: newQueue}),
    playTrack: (track, newQueue) => {
        const queue = newQueue ? newQueue : []
        const index= queue.findIndex(t => t.id === track.id)
        set({
            currentTrack: track,
            queue: queue,
            currentIndex: index !== -1 ? index : 0,
            isPlaying: true
        })
    },
    nextTrack: () => {
        const { queue, currentIndex, repeatMode, isShuffle } = get()
        if(queue.length === 0)
            return;
        if (currentIndex >= queue.length - 1 && repeatMode === 'none' && !isShuffle) {
            set({ isPlaying: false });
            return;
        }

        let nextIndex = currentIndex + 1
        if(isShuffle){
            nextIndex = Math.floor(Math.random() * queue.length)
        } else if(nextIndex >= queue.length) {
            if(repeatMode === 'all'){
                nextIndex = 0
            } 
            else {
                set({ isPlaying: false });
                return;
            }
        }
        set({
            currentTrack: queue[nextIndex],
            currentIndex: nextIndex,
            isPlaying: true
        })
    },
    previousTrack: () => {
        const { queue, currentIndex } = get()
        if(queue.length === 0 || currentIndex <= 0) return;
        const prevIndex = (currentIndex - 1)
        set({
            currentTrack: queue[prevIndex],
            currentIndex: prevIndex,
            isPlaying: true
        })
    },
    setVolume: (volume) => set({ volume }),
    setCurrentTrack: (track) => set({ currentTrack: track }),

    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })), 
    toggleRepeat: () => set((state) => {
        const nextMode = state.repeatMode === 'none' ? 'all' : state.repeatMode === 'all' ? 'one' : 'none'
        return { repeatMode: nextMode }
    }),

    addToQueue: (track) => set((state) => {
        const newQueue = [...state.queue];
        const insertIndex = state.currentIndex !== -1 ? state.currentIndex + 1 : newQueue.length;
        newQueue.splice(insertIndex, 0, track);
        
        // Nếu queue đang rỗng, tự động play luôn bài đó
        if (state.queue.length === 0) {
            return { queue: newQueue, currentTrack: track, currentIndex: 0, isPlaying: true };
        }
        return { queue: newQueue };
    }),
    
    removeFromQueue: (indexToRemove) => set((state) => {
        const newQueue = state.queue.filter((_, idx) => idx !== indexToRemove);
        let newIndex = state.currentIndex;
    
        if (indexToRemove < state.currentIndex) {
            newIndex -= 1;
        } 
        // Nếu xóa bài dang9 phát, tự động nhảy sang bài tiếp theo
        else if (indexToRemove === state.currentIndex) {
            if (newQueue.length === 0) {
                return { queue: [], currentTrack: null, currentIndex: -1, isPlaying: false };
            }
            // Gán  vị trí của bài hiện tại cho bài tiếp theo
            // Cần đảm bảo newIndex không vượt quá mảng
            if (newIndex >= newQueue.length) newIndex = 0; 
            return { queue: newQueue, currentIndex: newIndex, currentTrack: newQueue[newIndex], isPlaying: true };
        }
    
        return { queue: newQueue, currentIndex: newIndex };
    }),
}));