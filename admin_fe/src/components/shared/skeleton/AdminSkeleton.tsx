import React from "react";

// skeleton cho các stats card trang dashbord
export const StatsCardSkeleton = () => (
    <div className="p-6 rounded-2xl bg-panel border border-border animate-pulse flex flex-col gap-3">
        <div className="w-12 h-12 rounded-xl bg-hover/60" /> {/* icon */}
        <div className="w-24 h-4 bg-hover/60 rounded-full" /> {/* label */}
        <div className="w-16 h-8 bg-hover/60 rounded-lg" /> {/* value */}
    </div>
);

// skeleton cho Table Row
export const TableRowSkeleton = ({ cols = 5 }: { cols?: number }) => (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-border animate-pulse">
        {Array.from({ length: cols }).map((_, i) => (
            <div 
                key={i} 
                className={`h-5 bg-hover/60 rounded-full ${i === 0 ? 'w-10' : 'flex-1'}`} 
            />
        ))}
        <div className="w-20 h-8 bg-hover/60 rounded-lg" /> {/* buttons */}
    </div>
);

export const AdminFormSkeleton = () => (
    <div className="p-8 bg-panel rounded-2xl border border-border space-y-8 animate-pulse">
        <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-hover/60" /> {/* ảnh */}
            <div className="space-y-3">
                <div className="w-48 h-6 bg-hover/60 rounded-full" />
                <div className="w-32 h-4 bg-hover/60 rounded-full" />
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                    <div className="w-20 h-4 bg-hover/60 rounded-full" />
                    <div className="w-full h-12 bg-hover/60 rounded-xl" />
                </div>
            ))}
        </div>
    </div>
);