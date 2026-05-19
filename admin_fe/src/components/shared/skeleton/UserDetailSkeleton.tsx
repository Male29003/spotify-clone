export const UserDetailSkeleton = () => (
    <div className="bg-panel w-[70vw] lg:w-[60vw] h-[80vh] rounded-2xl border border-border flex flex-col overflow-hidden relative shadow-2xl animate-pulse">
        {/* header */}
        <div className="flex justify-between -top-5 relative p-6 pt-10 z-50 flex-1 border-b border-border max-h-[150px]">
            <div className="flex justify-between items-end">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-hover/60" /> {/* Avatar */}
                <div className="min-w-[250px] space-y-3">
                    <div className="h-6 w-3/4 bg-hover rounded-full mx-auto" />
                    <div className="h-4 w-1/2 bg-hover rounded-full mx-auto" />
                </div>
            </div>
            <div className="pt-2 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-10 w-full bg-hover/40 rounded-lg" />)}
            </div>
        </div>
        
        {/* content */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-panel">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-16 w-full bg-hover/30 rounded-xl" />)}
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-16 w-full bg-hover/30 rounded-xl" />)}
                </div>
            </div>
        </div>
    </div>
);