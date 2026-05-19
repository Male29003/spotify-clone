import React from "react";

interface DetailBannerSkeletonProps {
    type: 'Playlist' | 'Release' | 'Artist' | 'Genre' | 'Track';
}

const DetailBannerSkeleton: React.FC<DetailBannerSkeletonProps> = ({ type }) => {
    const isArtist = type === 'Artist';

    // dành cho nghệ sĩ
    if (isArtist) {
        return (
            <div className="relative h-[40vh] md:h-[50vh] min-h-[300px] w-full flex items-center p-6 md:p-10 z-0 animate-pulse">
                <div className="absolute inset-0 bg-neutral-800/50 -z-20" />
                <div className="relative z-10 flex flex-col gap-4">
                    {/* Label Verified */}
                    <div className="w-32 h-4 bg-neutral-700 rounded-full" />
                    {/* Big Title (Stage Name) */}
                    <div className="w-64 md:w-[400px] h-16 md:h-24 bg-neutral-700 rounded-lg" />
                    {/* Listeners count */}
                    <div className="w-40 h-4 bg-neutral-700 rounded-full" />
                </div>
            </div>
        );
    }
    // dành cho các loại còn lại
    return (
        <div className="relative flex flex-col sm:flex-row items-center gap-6 md:gap-8 p-6 md:p-10 pt-24 md:pt-32 z-0 border-b border-text-main/5 animate-pulse">
            {/* Khung ảnh bìa vuông */}
            <div className="w-48 h-48 md:w-60 md:h-60 shrink-0 rounded-xl bg-neutral-800 shadow-2xl" />
            
            <div className="flex flex-col justify-center gap-4 flex-1 w-full">
                {/* Type Label */}
                <div className="w-20 h-3 bg-neutral-800 rounded-full" />
                {/* Big Title */}
                <div className="w-3/4 h-12 bg-neutral-800 rounded-lg" />
                {/* Description lines */}
                <div className="space-y-2">
                    <div className="w-full h-3 bg-neutral-800 rounded-full" />
                    <div className="w-2/3 h-3 bg-neutral-800 rounded-full" />
                </div>
                {/* Metadata (Owner, Year, etc) */}
                <div className="flex gap-2 mt-2">
                    <div className="w-20 h-4 bg-neutral-800 rounded-full" />
                    <div className="w-16 h-4 bg-neutral-800 rounded-full" />
                </div>
            </div>
        </div>
    );
};

export default DetailBannerSkeleton;