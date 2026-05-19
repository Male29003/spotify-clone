export const AdminDashboardSkeleton = () => (
    <div className="p-6 bg-base min-h-screen animate-pulse">
        {/* header */}
        <div className="flex flex-col sm:flex-row min-h-20 w-full justify-between items-start sm:items-end gap-4 border-b border-border pb-4">
            <div className="min-w-50 h-10 rounded-md bg-hover/60"/>
            <div className="min-w-20 h-10 rounded-lg bg-hover/60"/>
        </div>

        {/* tổng quan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-5">
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

        {/* biểu đồ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col gap-2 h-90 bg-panel/70 p-6 rounded-xl shadow-sm border border-border">
                <h3 className="h-8 bg-hover/80 w-20 rounded-md"/>
                <div className="bg-hover/80 h-72 w-full rounded-lg" />
            </div>
            <div className="flex flex-col gap-2 h-90 bg-panel/70 p-6 rounded-xl shadow-sm border border-border">
                <h3 className="h-8 bg-hover/80 w-20 rounded-md"/>
                <div className="bg-hover/80 h-72 w-full rounded-lg" />
            </div>
            <div className="flex flex-col gap-2 h-90 bg-panel/70 p-6 rounded-xl shadow-sm border border-border">
                <h3 className="h-8 bg-hover/80 w-20 rounded-md"/>
                <div className="bg-hover/80 h-72 w-full rounded-lg" />
            </div>
        </div>

        {/* bxh */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col gap-2 h-112 bg-panel/70 p-6 rounded-xl shadow-sm border border-border">
                <h3 className="h-8 bg-hover/80 w-20 rounded-md"/>
                <div className="bg-hover/80 h-90 w-full rounded-lg" />
            </div>
            <div className="flex flex-col gap-2 h-112 bg-panel/70 p-6 rounded-xl shadow-sm border border-border">
                <h3 className="h-8 bg-hover/80 w-20 rounded-md"/>
                <div className="bg-hover/80 h-90 w-full rounded-lg" />
            </div>
            <div className="flex flex-col gap-2 h-112 bg-panel/70 p-6 rounded-xl shadow-sm border border-border">
                <h3 className="h-8 bg-hover/80 w-20 rounded-md"/>
                <div className="bg-hover/80 h-90 w-full rounded-lg" />
            </div>
        </div>
    </div>
)