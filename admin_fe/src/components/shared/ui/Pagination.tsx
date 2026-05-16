import { SkipNext, SkipPrevious } from '@mui/icons-material';
import React from 'react';

interface PaginationProps {
    page: number;
    limit: number;
    totalCount: number;
    onPageChange: (newPage: number) => void;
    onLimitChange: (newLimit: number) => void;
}

const getPaginationRange = (currentPage: number, totalPages: number) => {
    const DOTS = '...';
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const showLeftDots = currentPage > 4;
    const showRightDots = currentPage < totalPages - 3;

    if (!showLeftDots && showRightDots) {
        let leftItems = [1, 2, 3, 4, 5];
        return [...leftItems, DOTS, totalPages];
    }

    if (showLeftDots && !showRightDots) {
        let rightItems = [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, DOTS, ...rightItems];
    }

    if (showLeftDots && showRightDots) {
        let middleItems = [currentPage - 1, currentPage, currentPage + 1];
        return [1, DOTS, ...middleItems, DOTS, totalPages];
    }

    return [];
};

const Pagination: React.FC<PaginationProps> = ({ page=1, limit=5, totalCount, onPageChange, onLimitChange }) => {
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const paginationRange = getPaginationRange(page, totalPages);

    // Ktra mức thấp nhất hiện tại
    if (totalCount <= 5) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 px-2 w-full">
            <div className="flex items-center gap-4 text-sm text-text-sub">
                <div className="flex items-center gap-2">
                    <span>Viewing:</span>
                    <select 
                        value={limit} 
                        onChange={(e) => onLimitChange(Number(e.target.value))}
                        className="bg-search border border-border text-text-main rounded-md px-2 py-1 outline-none focus:border-highlight transition-colors cursor-pointer"
                    >
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center gap-1">
                    <button 
                        disabled={page === 1}
                        onClick={() => onPageChange(page - 1)}
                        className="px-3 py-1.5 min-w-[32px] rounded-md text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-hover hover:text-text-main transition-colors text-text-sub"
                    >
                        <SkipPrevious />
                    </button>

                    {paginationRange.map((item, index) => {
                        if (item === '...') {
                            return (
                                <span key={`dots-${index}`} className="px-2 py-1.5 text-text-sub tracking-widest">
                                    &#8230;
                                </span>
                            );
                        }

                        return (
                            <button
                                key={index}
                                onClick={() => onPageChange(item as number)}
                                className={`px-3 py-1.5 min-w-[32px] rounded-md text-sm font-bold transition-all ${
                                    page === item 
                                        ? 'bg-highlight text-text-dark shadow-md'
                                        : 'text-text-sub hover:bg-hover hover:text-text-main'
                                }`}
                            >
                                {item}
                            </button>
                        );
                    })}

                    <button 
                        disabled={page === totalPages}
                        onClick={() => onPageChange(page + 1)}
                        className="px-3 py-1.5 min-w-[32px] rounded-md text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-hover hover:text-text-main transition-colors text-text-sub"
                    >
                        <SkipNext />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Pagination;