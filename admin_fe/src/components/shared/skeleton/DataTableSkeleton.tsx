import React from 'react';

interface Props {
    columnCount: number;
    rowCount?: number;
}

const DataTableSkeleton: React.FC<Props> = ({ columnCount, rowCount = 8 }) => {
    return (
        <tbody className="divide-y divide-border">
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
                <tr key={rowIndex} className="animate-pulse">
                    {Array.from({ length: columnCount }).map((_, colIndex) => (
                        <td key={colIndex} className="p-4">
                            <div className={`bg-hover/60 rounded-xl ${
                                colIndex === 0 ? 'h-10 w-10' : 'h-4 w-full'
                            }`} />
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    );
};

export default DataTableSkeleton;