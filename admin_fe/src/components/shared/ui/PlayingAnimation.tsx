import { useShallow } from "zustand/react/shallow"
import { usePlayerStore } from "../../../stores/usePlayerStore";

const PlayingAnimation = () => {
    const { isPlaying } = usePlayerStore(
            useShallow(state => ({
                isPlaying: state.isPlaying,
            }))
        );
    return (
        <div className="flex gap-0.5 items-end h-3.5 w-4 justify-center">
            <div className={`w-0.5 bg-highlight h-full origin-bottom animate-music-bar-1 rounded-sm ${!isPlaying ? 'animation-paused' : ''}`}></div>
            <div className={`w-0.5 bg-highlight h-full origin-bottom animate-music-bar-2 rounded-sm ${!isPlaying ? 'animation-paused' : ''}`}></div>
            <div className={`w-0.5 bg-highlight h-full origin-bottom animate-music-bar-3 rounded-sm ${!isPlaying ? 'animation-paused' : ''}`}></div>
            <div className={`w-0.5 bg-highlight h-full origin-bottom animate-music-bar-4 rounded-sm ${!isPlaying ? 'animation-paused' : ''}`}></div>
        </div>
    )
}

export default PlayingAnimation;