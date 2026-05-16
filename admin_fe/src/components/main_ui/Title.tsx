// src/components/main_ui/PageHeader.tsx
import React from "react";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    children?: React.ReactNode
}

const PageTitle: React.FC<PageHeaderProps> = ({ title, subtitle, children }) => {
    return (
        <div className="flex flex-row items-end justify-between gap-6 mb-8 mt-5 mx-8">
            <div className="flex-1">
                <h1 className='text-4xl font-black text-text-main tracking-tight'>{title}</h1>
                {subtitle && <p className="text-text-sub mt-2 text-sm font-medium">{subtitle}</p>}
            </div>
            {children && children}
        </div>
    )
}

export default PageTitle;