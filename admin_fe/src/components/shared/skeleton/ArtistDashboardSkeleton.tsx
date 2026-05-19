export const ArtistDashboardSkeleton = () => (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 pb-10 animate-pulse">
        {/* header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border pb-4">
            <div className="min-w-50 h-16 rounded-lg bg-hover/60"/>
            <div className="min-w-20 h-10 rounded-lg bg-hover/60"/>
        </div>

        {/* tổng quan */}
        <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex flex-col gap-2 h-22 bg-panel/70 p-2 rounded-xl shadow-sm border border-border">
                    <h3 className="h-8 bg-hover/80 w-20 rounded-md"/>
                    <p className="bg-hover/80 h-10 w-full rounded-lg"/>
                </div>
                <div className="flex flex-col gap-2 h-22 bg-panel/70 p-2 rounded-xl shadow-sm border border-border">
                    <h3 className="h-8 bg-hover/80 w-20 rounded-md"/>
                    <p className="bg-hover/80 h-10 w-full rounded-lg"/>
                </div>
                <div className="flex flex-col gap-2 h-22 bg-panel/70 p-2 rounded-xl shadow-sm border border-border">
                    <h3 className="h-8 bg-hover/80 w-20 rounded-md"/>
                    <p className="bg-hover/80 h-10 w-full rounded-lg"/>
                </div>
                <div className="flex flex-col gap-2 h-22 bg-panel/70 p-2 rounded-xl shadow-sm border border-border">
                    <h3 className="h-8 bg-hover/80 w-20 rounded-md"/>
                    <p className="bg-hover/80 h-10 w-full rounded-lg"/>
                </div>
            </div>
        </div>

        {/* biểu đồ */}
        <div className="w-full pb-2">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 ">
                <div className="lg:col-span-2 h-90 bg-panel p-5 rounded-2xl border border-border shadow-sm flex flex-col sm:min-w-[400px]">
                    <h3 className="h-8 bg-hover/80 w-20 rounded-md mb-5"/>
                    <div className="bg-hover/80 h-70 w-full rounded-lg" />
                </div>
                <div className="lg:col-span-1 min-h-70 max-h-90 bg-panel p-6 rounded-2xl border border-border shadow-sm flex flex-col sm:min-w-[250px]">
                    <div className="bg-hover/80 h-full w-full rounded-lg" />
                </div>
            </div>
        </div>

        {/* bxh */}
        <div className="w-full pb-2">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:min-w-[350px] mb-8">
                <div className="lg:col-span-1 bg-panel p-6 rounded-2xl border border-border shadow-sm flex flex-col gap-3">
                    <h3 className="h-8 bg-hover/80 w-20 rounded-md"/>
                    <div className="bg-hover/80 h-12 w-full rounded-lg" />
                    <div className="bg-hover/80 h-12 w-full rounded-lg" />
                    <div className="bg-hover/80 h-12 w-full rounded-lg" />
                    <div className="bg-hover/80 h-12 w-full rounded-lg" />
                    <div className="bg-hover/80 h-12 w-full rounded-lg" />
                </div>
            </div>
        </div>
    </div>
)