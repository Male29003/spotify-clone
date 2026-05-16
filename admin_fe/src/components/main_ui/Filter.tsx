import React from 'react';

interface FilterOption {
    id: string | number;
    label: string;
}

interface FilterProps {
    label?: string;
    options: FilterOption[];
    value: string | number;
    onChange: (value: string) => void;
}

const Filter: React.FC<FilterProps> = ({ label, options, value, onChange }) => {
    return (
        <div className="flex flex-col gap-1.5">
            {/* Label */}
            {label && (
                <span className="text-xs font-bold text-text-sub uppercase tracking-wider pl-2">
                    {label}
                </span>
            )}
            
            {/* Segmented Control - các option */}
            <div className="flex items-center bg-search p-1 rounded-xl w-fit border border-border shadow-inner">
                {options.map((opt) => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChange(String(opt.id))}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 ease-out
                            ${value === String(opt.id) 
                                ? 'bg-panel text-text-main shadow-md scale-100 border border-base/5'
                                : 'text-text-sub hover:text-text-main hover:bg-hover/50 scale-[0.98]'
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Filter;