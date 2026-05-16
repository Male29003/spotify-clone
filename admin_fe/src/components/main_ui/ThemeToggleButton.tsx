import React, { useState, useEffect } from 'react';
import { LightModeOutlined, DarkModeOutlined } from '@mui/icons-material';

const ThemeToggle: React.FC = () => {
    // State để biết đường đổi Icon (Sáng -> Trăng, Tối -> Trời)
    const [isDark, setIsDark] = useState(false);

    // Khi vừa render, check xem web đang ở theme nào
    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
    }, []);

    const handleToggle = () => {
        const root = document.documentElement;
        if (root.classList.contains('dark')) {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };

    return (
        <button 
            onClick={handleToggle} 
            className="p-2 rounded-full hover:bg-hover transition-colors text-text-sub flex items-center justify-center"
            title="Toggle Dark/Light Mode"
        >
            {isDark ? (
                <LightModeOutlined className="animate-spin-slow" /> 
            ) : (
                <DarkModeOutlined className="animate-bounce-short" />
            )}
        </button>
    );
};

export default ThemeToggle;