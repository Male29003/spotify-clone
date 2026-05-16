import React, { useRef, useState, useCallback } from 'react';
import CustomCard from '../../components/shared/media/CustomCard';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useNavigate } from 'react-router-dom';
import type { ItemType } from '../../types';

interface MediaSectionProps {
    title: string;
    items: any[];
    itemType: ItemType;
}

const MediaSection: React.FC<MediaSectionProps> = ({ title, items, itemType }) => {
    const sliderRef = useRef<HTMLDivElement>(null);
    
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const playTrack = usePlayerStore((state) => state.playTrack);

    const navigate = useNavigate()

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!sliderRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - sliderRef.current.offsetLeft);
        setScrollLeft(sliderRef.current.scrollLeft);
    }, []);

    const handleMouseLeave = useCallback(() => setIsDragging(false), []);
    const handleMouseUp = useCallback(() => setIsDragging(false), []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !sliderRef.current) return;
        e.preventDefault(); 
        const x = e.pageX - sliderRef.current.offsetLeft;
        const walk = (x - startX) * 1.2; 
        sliderRef.current.scrollLeft = scrollLeft - walk;
    }, [isDragging, startX, scrollLeft]);

    const slide = useCallback((direction: 'left' | 'right') => {
        if (!sliderRef.current) return;
        const scrollAmount = sliderRef.current.clientWidth * 0.8; 
        sliderRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    }, []);

    return (
        <section className="mb-8 relative group/section">
             <h2 className="ml-4 text-2xl font-bold text-text-main mb-4 cursor-pointer inline-block transition-transform duration-300 hover:underline hover:scale-105">
                {title}
            </h2>
            
            <div className="relative">
                <button 
                    onClick={() => slide('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-base/70 text-text-main rounded-full flex items-center justify-center 
                    opacity-0 -translate-x-4 transition-all duration-300 ease-out
                    group-hover/section:opacity-100 group-hover/section:translate-x-2 hover:bg-base hover:scale-110 shadow-lg ml-2"
                >
                    <ChevronLeft fontSize="large" />
                </button>

                <div 
                    ref={sliderRef}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    className={`flex overflow-x-auto gap-6 px-4 pb-2 custom-scrollbar select-none
                        ${isDragging ? 'cursor-grabbing snap-none' : 'cursor-grab snap-x'}
                    `}
                >
                    {items.map((item, index) => {
                        const uniqueKey = `fallback-${index}`;
                        const targetType = itemType === 'mixed' ? item.item_type : itemType
                        return (
                            <div key={uniqueKey} className="snap-start shrink-0">
                                <CustomCard
                                    item={item}
                                    type={targetType}
                                    onClick={() => {
                                        if(item.short_id)
                                            navigate(`/${targetType}/${item.short_id}`);
                                        else navigate(`/${targetType}/${item.slug}`)
                                    }}
                                    onPlay={() => {
                                        if (targetType === 'track') {
                                            playTrack(item, [item]);
                                        } else {
                                            const tracks = item.tracks || [];
                                            if (tracks.length > 0) {
                                                playTrack(tracks[0], tracks);
                                            }
                                        }
                                    }}
                                />
                            </div>
                        )}
                    )}
                </div>

                <button 
                    onClick={() => slide('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-base/70 text-text-main rounded-full flex items-center justify-center 
                    opacity-0 translate-x-4 transition-all duration-300 ease-out
                    group-hover/section:opacity-100 group-hover/section:-translate-x-2 hover:bg-base hover:scale-110 shadow-lg mr-2"
                >
                    <ChevronRight fontSize="large" />
                </button>
            </div>
        </section>
    );
};

export default MediaSection;