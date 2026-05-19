export const ArtistMiniCardSkeleton = () => {
    return (
        <div className="p-5 rounded-xl bg-card border border-border/50 flex flex-col gap-4 animate-pulse">
            <div className="flex items-center gap-4">
                {/* ảnh */}
                <div className="w-16 h-16 rounded-full bg-hover/50" />
                
                <div className="flex flex-col gap-2">
                    {/* Label*/}
                    <div className="w-12 h-3 bg-hover/50 rounded-full" />
                    {/* stage name */}
                    <div className="w-32 h-5 bg-hover/50 rounded-full" />
                </div>
            </div>
        </div>
    );
};