export const ReleaseDetailSkeleton = () => (
    <div className="bg-panel w-full h-[90vh] flex flex-col rounded-3xl border border-border shadow-2xl relative animate-pulse overflow-hidden overflow-y-auto custom-scrollbar">
        {/* header */}
        <div className="p-6 border-b border-border flex items-start bg-base/50">
            <div className="w-32 h-32 bg-hover/60 rounded-lg shadow-lg border border-border" />
            <div className="min-w-[100px] min-h-[20px] space-y-5 mt-10">
                <div className="h-4 w-3/4 bg-hover rounded-full mx-auto" />
                <div className="h-4 w-1/2 bg-hover rounded-full mx-auto" />
                <div className="h-2 w-1/2 bg-hover rounded-full mx-auto" />
            </div>
        </div>
        {/* content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            {/* info */}
            <div className="flex flex-col w-full">
                <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start">
                    <div className="w-48 md:w-64 h-48 md:h-64 rounded-lg bg-hover/60"/>
                    <div className="flex-1 w-full space-y-5 min-h-48 ">
                        <div className="h-12 w-3/4 bg-hover rounded-full mx-auto" />
                        <div className="h-24 w-3/4 bg-hover rounded-full mx-auto" />
                        <div className="h-12 w-3/4 bg-hover rounded-full mx-auto" />
                    </div>
                </div>
            </div>
            {/* track list */}
            <div className="mt-15 mb-10">
                <div className="h-12 w-3/4 bg-hover rounded-full mx-auto" />
                <div className="space-y-2 mt-5">
                    {[1, 2, 3].map(i => <div key={i} className="h-10 w-full bg-hover/40 rounded-lg" />)}                        
                </div>
            </div>
        </div>
    </div>
)