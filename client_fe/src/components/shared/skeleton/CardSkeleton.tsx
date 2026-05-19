import React from "react"
import { SkeletonBase, SkeletonImage } from "./SkeletonElements"

// skeleton cho CustomCard
export const CardSkeleton = ({ type='track' } : { type?: string }) => {
    return (
        <div className="w-36 shrink-0 p-2 flex-col gap-3">
            <SkeletonImage 
                type={type === 'artist' ? 'circle' : 'square'}
                className="w-full"
            />
            {/* title */}
            <SkeletonBase className="h-4 w-3/4"/>
            {/* subtitle */}
            <SkeletonBase className="h-3 w-1/2"/>
        </div>
    )
}