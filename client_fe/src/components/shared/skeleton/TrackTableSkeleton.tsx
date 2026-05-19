import { SkeletonBase } from "./SkeletonElements";

export const TrackTableSkeleton = ({ rows = 5 }) => (
    <div className="w-full px-4">
      {/* header */}
      <div className="grid grid-cols-[30px_minmax(200px,0.8fr)_120px_100px] gap-4 py-3 border-b border-border/20">
         <SkeletonBase className="h-4 w-4" />
         <SkeletonBase className="h-4 w-32" />
         <SkeletonBase className="h-4 w-24" />
         <SkeletonBase className="h-4 w-10 justify-self-end" />
      </div>
      {/* row */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-[30px_minmax(200px,0.8fr)_120px_100px] gap-4 py-4 items-center">
          <div className="h-4 w-4" /> {/* nndex */}
          <SkeletonBase className="h-5 w-full max-w-[250px]" />
          <SkeletonBase className="h-4 w-32" />
          <SkeletonBase className="h-8 w-8 rounded-full justify-self-end" />
        </div>
      ))}
    </div>
  );