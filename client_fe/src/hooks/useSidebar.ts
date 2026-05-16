import { useState, useEffect, useCallback } from 'react';

//  maxRatio (VD: 0.3 là 30% màn hình)
export const useSidebar = (maxRatio: number = 0.3) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(() => {
        const saved = localStorage.getItem('sidebar_expanded');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [width, setWidth] = useState<number>(() => {
        const saved = localStorage.getItem('siderWidth');
        return saved !== null ? parseInt(saved) : 280;
    });

    const isVisuallyExpanded = isExpanded && width >= 120;

    useEffect(() => {
        localStorage.setItem('sidebar_expanded', JSON.stringify(isExpanded));
    }, [isExpanded]);

    useEffect(() => {
        localStorage.setItem('siderWidth', width.toString());
    }, [width]);

    // Lắng nghe sự kiện kéo thả chuột
    const handleDrag = useCallback((newWidth: number) => {
        // TÍNH TOÁN ĐỘ RỘNG MAX LÚC KÉO (VD: 30% màn hình hiện tại)
        const maxWidth = window.innerWidth * maxRatio;
        const minWidth = 80;

        if (newWidth >= minWidth && newWidth <= maxWidth) {
            setWidth(newWidth);
            if (newWidth >= 120 && !isExpanded) {
                setIsExpanded(true);
            }
        } else if (newWidth > maxWidth) {
            // Nếu cố kéo lố, ép nó về mức Max
            setWidth(maxWidth);
        }
    }, [isExpanded, maxRatio]);

    // ==========================================
    // TỰ ĐỘNG BÓP SIDEBAR KHI THU NHỎ TRÌNH DUYỆT
    // ==========================================
    useEffect(() => {
        const handleResize = () => {
            const currentMaxWidth = window.innerWidth * maxRatio;
            // Nếu trình duyệt bị thu nhỏ làm width hiện tại > 30% màn hình
            // -> Ép width nhỏ lại
            if (width > currentMaxWidth) {
                setWidth(currentMaxWidth);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [width, maxRatio]);

    const toggleSidebar = useCallback(() => {
        if (isVisuallyExpanded) {
            setIsExpanded(false); 
        } else {
            setIsExpanded(true);
            const defaultWidth = 280;
            const maxWidth = window.innerWidth * maxRatio;
            // Tránh việc mở ra mà nó bự hơn màn hình
            setWidth(Math.min(defaultWidth, maxWidth));
        }
    }, [isVisuallyExpanded, width, maxRatio]);

    return { 
        isVisuallyExpanded, 
        logicalWidth: width, 
        handleDrag, 
        toggleSidebar 
    };
};