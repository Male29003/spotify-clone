import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
    bgColor: string;
    textColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp, bgColor, textColor }) => {
    return (
        <div className="bg-panel p-6 rounded-2xl border border-border shadow-lg flex justify-between items-center transition-transform hover:scale-[1.02]">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${bgColor} ${textColor}`}>
                {icon}
            </div>
            <div>
                <p className="text-text-sub text-sm font-semibold mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-text-main">{value}</h3>
                {trend && (
                    <p className={`text-xs mt-2 font-medium ${trendUp ? 'text-highlight' : 'text-error'}`}>
                        {trendUp ? '↑' : '↓'} {trend} over last month.
                    </p>
                )}
            </div>
        </div>

    );
};

export default StatCard;