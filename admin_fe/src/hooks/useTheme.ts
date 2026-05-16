import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useAutoTheme = () => {
    const location = useLocation();

    useEffect(() => {
        const root = document.documentElement;
        
        // Đọc theme từ localStorage
        const currentTheme = localStorage.getItem('theme');

        // Mặc định (khi chưa có gì trong localStorage) là light theme
        if (currentTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        
    }, [location.pathname]); 
};