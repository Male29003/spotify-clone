import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Loader from '../../../../../admin_fe/src/components/shared/ui/Loader';
import { parseLrc, type LyricLine } from '../../../utils/lyricsParser';

interface LyricsViewProps {
    isOpen: boolean;
    lyricsUrl: string | null;
    currentTime: number;
    onSeek: (time: number) => void
}

const LyricsWindow: React.FC<LyricsViewProps> = ({ isOpen, lyricsUrl, currentTime, onSeek }) => {
    const [lyrics, setLyrics] = useState<LyricLine[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const activeLineRef = useRef<HTMLDivElement>(null);

    const [isUserScrolling, setIsUserScrolling] = useState(false);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleUserScroll = () => {
        setIsUserScrolling(true);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        // Nếu ngưng cuộn 3 giây, cho phép tự động cuộn trở lại
        scrollTimeoutRef.current = setTimeout(() => {
            setIsUserScrolling(false);
        }, 3000);
    };

    useEffect(() => {
        if (!lyricsUrl) {
            setLyrics([]);
            return;
        }

        const fetchLyrics = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(lyricsUrl);
                const parsed = parseLrc(response.data);
                setLyrics(parsed);
            } catch (error) {
                console.error("Error lấy lyrics", error);
                setLyrics([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLyrics();
    }, [lyricsUrl]);

    let activeIndex = -1;
    for (let i = 0; i < lyrics.length; i++) {
        if (currentTime + 0.3 >= lyrics[i].time) {
            activeIndex = i;
        } else {
            break;
        }
    }
    // chỉ cho phép cuộn riêng thôi -> cửa số này mở thì cuộn mỗi nó
    // còn các trang khác thì là cuộn của riêng trang đó
    // tránh bị chồng chéo
    useEffect(() => {
        if (isOpen && !isUserScrolling && activeLineRef.current && containerRef.current) {
            activeLineRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center', 
            });
        }
    }, [activeIndex, isOpen, isUserScrolling]); 

    if (!lyricsUrl) return <div className="text-text-sub flex h-full items-center justify-center font-bold text-xl">No Lyrics Available</div>;
    if (isLoading) return <div className="flex h-full items-center justify-center"><Loader /></div>;

    return (
        <div 
            ref={containerRef}
            onWheel={handleUserScroll}       
            onTouchMove={handleUserScroll}  
            className="h-full w-full overflow-y-auto custom-scrollbar p-8 bg-gradient-to-b from-highlight/10 to-base"
        >
            <div className="flex flex-col gap-6 py-40 text-center md:text-left">
                {lyrics.map((line, index) => {
                    const isActive = index === activeIndex;
                    const isPassed = index < activeIndex;

                    return (
                        <div 
                            key={index}
                            ref={(el) => {
                                if (isActive && el) {
                                    activeLineRef.current = el;
                                }
                            }}
                            className={`text-2xl md:text-4xl font-bold transition-all duration-300 cursor-pointer origin-left
                                ${isActive ? 'text-text-main scale-105' : 
                                  isPassed ? 'text-text-main/50 hover:text-text-main/80' : 'text-text-sub/30 hover:text-text-main/70'}`}
                            onClick={() => onSeek(line.time)}
                        >
                            {line.text}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LyricsWindow;