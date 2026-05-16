export const formatCurrency = (value: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(value);
};

export const formatNumber = (num?: number) => {
    if (!num) return '0';
    return num.toLocaleString('en-US');
};

export const formatDuration = (seconds: number) => {
    if (!seconds) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

export const formatDate = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) return 'N/A';
    
    const date = new Date(dateInput);
    
    // Trả về chuỗi dạng "10 May 2026" giống hệt 'dd MMM yyyy'
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(date);
};

export const timeAgo = (dateInput: string | Date): string => {
    const date = new Date(dateInput);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    
    const years = Math.floor(days / 365);
    return `${years}y ago`;
};

// định dạng lại data user đăng nhập vào
export const formatUserProfile = (userData: any, artistData?: any) => {
    const { profile_picture, id, ...restUserData } = userData;
    
    // profile init
    let profileData: any = {
        ...restUserData,
        user_id: id,
        image: profile_picture
    };

    // nếu là artist thì lọc data chung, data riêng và image là artist.image chứ ko là profile_picture nữa
    if (artistData) {
        const { 
            short_id: artist_short_id, 
            image: artist_image, 
            ...restArtistData 
        } = artistData;

        // lọc lấy id của artist và ảnh -> vì update user và artist là riêng biệt
        profileData = {
            ...profileData,
            ...restArtistData,
            artist_short_id: artist_short_id,
            image: artist_image
        };
    }

    return profileData;
};