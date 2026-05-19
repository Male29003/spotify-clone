export const MostPopularSkeleton = () => {
    return (
        <div className="bg-card p-4 rounded-xl flex items-center gap-4 border border-border/50 animate-pulse">
            {/* ảnh */}
            <div className="w-20 h-20 rounded-md bg-hover/50 shrink-0" />
            <div className="flex flex-col gap-2 flex-1 overflow-hidden">
                {/*  Title */}
                <div className="w-3/4 h-5 bg-hover/50 rounded-full" />
                {/* Single/Album */}
                <div className="w-1/3 h-3 bg-hover/50 rounded-full" />
            </div>
        </div>
    );
};