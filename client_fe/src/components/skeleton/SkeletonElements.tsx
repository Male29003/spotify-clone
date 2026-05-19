import React from "react"

// pulsing component base dùng chung
export const SkeletonBase = ({ className } : { className?: string }) => {
    return <div className={`animate-pulse bg-hover/50 rounded ${className}`}></div>
} 

// khung ảnh
export const SkeletonImage = ({ type='square', className='' } : { type?: 'square' | 'circle' , className?: string }) => {
    return <div className={`animate-pulse bg-hover/50 aspect-square ${type === 'circle' ? 'rounded-full' : 'rounded-md'} ${className}`}></div>
}