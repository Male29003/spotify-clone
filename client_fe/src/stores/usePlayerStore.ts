import { create } from "zustand";
import type { ITrack } from "../types";
import { persist, createJSONStorage } from 'zustand/middleware';

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
    // chỉnh sửa volume, phát tới, lùi
    playTrack: (track: ITrack, newQueue?: ITrack[]) => void;
    nextTrack: () => void;
    previousTrack: () =>void;
    setVolume: (volume: number) => void;
    setCurrentTrack: (track: ITrack | null) => void;
    // quản lý chế độ phát
    togglePlay: () => void;
    pause: () => void;
    toggleShuffle: () => void;
    toggleRepeat: () => void;
    //quản lý danh sách phát
    addToQueue: (track: ITrack, action?: 'next' | 'last') => void;
    removeFromQueue: (indexToRemove: number) => void;
    reorderQueue: (newQueue: ITrack[]) => void;
    removeBlockedTrack: (shortId: string) => void;
    removeBlockedRelease: (shortId: string) => void;
    removeBlockedArtist: (shortId: string) => void;
}

export const usePlayerStore = create<PlayerState>()(
    persist(
        (set, get) => {
            // hàm dành riêng cho cấu trúc lại queu trong TH nhạc trong danh sách tồn tại bài trong diện bị block
            const handleRemoveFromSystem = (state: PlayerState, predicate: (t: ITrack) => boolean) => {
                // lọc bỏ các bài bị khóa khỏi Queue
                const newQueue = state.queue.filter(t => !predicate(t));
                
                // nếu danh sách ko còn bài nào sau khi lọc thì reset nó
                if (newQueue.length === 0) {
                    return { 
                        queue: [], 
                        currentTrack: null, 
                        currentIndex: -1, 
                        isPlaying: false 
                    };
                }

                // Kiểm tra xem bài đang phát có bị chặn ko
                const isCurrentRemoved = state.currentTrack ? predicate(state.currentTrack) : false;

                if (isCurrentRemoved) {
                    // Nếu bài đang phát bị khóa -> Tìm bài hợp lệ tiếp theo trong Queue gốc
                    let nextTrack = null;
                    for (let i = state.currentIndex + 1; i < state.queue.length; i++) {
                        if (!predicate(state.queue[i])) {
                            nextTrack = state.queue[i];
                            break;
                        }
                    }
                    if (!nextTrack) nextTrack = newQueue[0];

                    const newIndex = newQueue.findIndex(t => t.short_id === nextTrack!.short_id);
                    // tự động phát bài kế tiếp
                    return {
                        queue: newQueue,
                        currentTrack: nextTrack,
                        currentIndex: newIndex,
                        isPlaying: true
                    };
                } else {
                    // Nếu bài đang phát ko bị khóa -> cần cập nhật lại index
                    const newIndex = newQueue.findIndex(t => t.short_id === state.currentTrack?.short_id);
                    return {
                        queue: newQueue,
                        currentIndex: newIndex !== -1 ? newIndex : 0
                    };
                }
            };

            // init value cho player store
            return {
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

                // chỉnh sửa volume, phát tới, lùi
                playTrack: (track, newQueue) => {
                    let queue = newQueue ? newQueue : []
                    queue = queue.filter((item, index, self) =>
                        index === self.findIndex((t) => t.short_id === item.short_id)
                    )
                    let index= queue.findIndex(t => t.short_id === track.short_id)

                    if(index === -1){
                        queue.unshift(track)
                        index = 0
                    }
                    
                    set({
                        currentTrack: track,
                        queue: queue,
                        currentIndex: index,
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
                    // nếu shuffle thì random index bài hát
                    if(isShuffle){
                        nextIndex = Math.floor(Math.random() * queue.length)
                    } else if(nextIndex >= queue.length) {
                        if(repeatMode === 'all'){
                            nextIndex = 0
                        } 
                        else {
                            set({ 
                                isPlaying: false });
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
                
                // quản lý chế độ phát
                togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
                pause: () => set(() => ({ isPlaying: false })),
                toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })), 
                toggleRepeat: () => set((state) => {
                    // thứ tự điều chỉnh là : none -> all -> one
                    const nextMode = state.repeatMode === 'none' ? 'all' : state.repeatMode === 'all' ? 'one' : 'none'
                    return { repeatMode: nextMode }
                }),

                //quản lý danh sách phát
                    // thêm vào cuối danh sách hoặc phát kế tiếp
                addToQueue: (track, action = 'last') => set((state) => {
                    const isExist = state.queue.some(t => t.id === track.id); 
                    
                    if (isExist) {
                        return state; 
                    }

                    const newQueue = [...state.queue];
                    // nếu là phát kế tiếp thì index = max_length của queue + 1
                    // là last thì index = max_length của queue
                    let insertIndex = newQueue.length;
                    if(action === 'next' && state.currentIndex !== -1){
                        insertIndex = state.currentIndex + 1
                    }
                    newQueue.splice(insertIndex, 0, track);
                    
                    if (state.queue.length === 0) {
                        return { 
                            queue: newQueue, 
                            currentTrack: track, 
                            currentIndex: 0, 
                            isPlaying: true 
                        };
                    }
                    return { queue: newQueue };
                }),
                    // đổi ví trí bài hát - cho premium user 
                reorderQueue: (newQueue: ITrack[]) => set((state) => {
                    if (!state.currentTrack) return { queue: newQueue };
                    const newIndex = newQueue.findIndex(t => t.short_id === state.currentTrack!.short_id);
                    return { queue: newQueue, currentIndex: newIndex !== -1 ? newIndex : 0 };
                }),
                    // bỏ bài hát khỏi queue            
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
                        if (newIndex >= newQueue.length) newIndex = 0; 
                        return { queue: newQueue, currentIndex: newIndex, currentTrack: newQueue[newIndex], isPlaying: true };
                    }
                
                    return { queue: newQueue, currentIndex: newIndex };
                }),

                removeBlockedTrack: (shortId) => set(state => handleRemoveFromSystem(state, t => t.short_id === shortId)),
                removeBlockedRelease: (shortId) => set(state => handleRemoveFromSystem(state, t => t.release_short_id === shortId)),
                removeBlockedArtist: (shortId) => set(state => handleRemoveFromSystem(state, t => t.artist?.short_id === shortId)),
            }
        },
        {
            name: 'spotify-player-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                currentTrack: state.currentTrack,
                queue: state.queue,
                currentIndex: state.currentIndex,
                volume: state.volume,
                repeatMode: state.repeatMode,
                isShuffle: state.isShuffle
            })
        }
    )
);