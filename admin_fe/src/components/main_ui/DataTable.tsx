import React from 'react';

export interface Column {
    key: string;
    header: string;
    width?: string;
    className?: string;
    render: (item: any, index: number) => React.ReactNode;
}

interface DataTableProps {
    columns: Column[];
    data: any[];
    isLoading?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({ columns, data, isLoading }) => {
    if (isLoading) return <div className="p-8 text-center text-text-sub">Loading...</div>;
    if (data.length === 0) return <div className="p-8 text-center text-text-sub">No data found.</div>;

    return (
        <div className="w-full overflow-x-auto custom-scrollbar">
            <div className='min-w-4xl bg-panel rounded-2xl border border-border overflow-hidden shadow-2xl'>
                <table className='w-full text-left border-collapse custom-scrollbar scroll-m-0 table-fixed'>
                    <thead>
                        <tr className="bg-search text-text-sub text-sm uppercase tracking-wider border-b border-border">
                            {columns.map((col) => (
                                <th 
                                    key={col.key} 
                                    className={`p-4 font-semibold ${col.className || ''}`}
                                    style={{ width: col.width }}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-border'>
                        {data.map((row, rowIndex) => (
                            <tr key={row.id || rowIndex} className='hover:bg-hover transition-colors'>
                                {columns.map(col => (
                                    <td 
                                        key={col.key} 
                                        className={`p-4 ${col.className || ''}`}
                                        style={{ width: col.width }}
                                    >
                                        {col.render(row, rowIndex)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataTable;