import { CardSkeleton } from "./CardSkeleton";
import { SkeletonBase } from "./SkeletonElements";

export const MediaSectionSkeleton = ({ title, itemCount = 10, type } : { title?: string, itemCount?: number, type?: string }) => (
    <section className="mb-8 px-4">
      <SkeletonBase className="h-8 w-48 mb-6 ml-4" /> 
      <div className="flex gap-6 overflow-hidden">
        <div className="relative flex overflow-x-auto gap-6 px-4 pb-2 custom-scrollbar select-none">
            {Array.from({ length: itemCount }).map((_, i) => (
                <CardSkeleton key={i} type={type}/>
            ))} 
        </div>
      </div>
    </section>
  );