import { useEffect, useState } from 'react';
import { useNotificationStore } from '../../stores/useNotificationStore';
import { api } from '../../api/axiosConfig';
import { useMarkAsRead } from '../../hooks/user/useUsers';
import { useAuthStore } from '../../stores/auth/authStore';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
    const { user } = useAuthStore()
    const navigate = useNavigate()
    const { notifications, appendOldNotifications, markAsRead, markAllAsRead } = useNotificationStore();
    const { mutate: markAsReadAPI } = useMarkAsRead();
    
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // ktra còn noti nào ko để load thêm
    useEffect(() => {
        if (notifications.length > 0 && notifications.length < 10) {
            setHasMore(false);
        }
    }, [notifications.length]);

    const handleLoadMore = async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);
        try {
            const nextPage = page + 1;
            const res = await api.get(`/users/me/noti/?page=${nextPage}`);
            
            const oldData = res.data?.results || (res as any).results || [];
            const nextUrl = res.data?.next || (res as any).next;
            
            if (oldData.length > 0) {
                appendOldNotifications(oldData);
                setPage(nextPage);
                if (!nextUrl) setHasMore(false);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotificationClick = (notif: any) => {
        const { type, status } = notif.metadata || {}
        if (!notif.is_read) {
            // cập nhật UI
            markAsRead(notif.id);
            // cập nhật ở db -> gửi api
            markAsReadAPI(notif.id); 
        }
        // admin
        if(user?.is_staff){
            // nếu là dky làm artist
            // hoặc đăng release mới thì qua trang chờ duyệt
           if(status === 'pending'){
            navigate('/admin/approvals')
           }
        }
        // nếu là artist
        else {
            if (type === 'release') {
                // bị block hay reject
                if(status === 'blocked' || status === 'rejected'){
                    navigate('/studio/content-management?status=blocked')
                } 
                // gỡ block hay approve release mới
                else if (status === 'restored' || status === 'approved') {
                    navigate('/studio/content-management?status=published')
                }
            }
        }
    };
    const handleMarkAllAsRead = (e: React.MouseEvent) => {
        e.preventDefault()
        markAllAsRead()
        notifications.map(n => markAsReadAPI(n.id))
    }


    return (
        <div className="max-w-3xl mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">All Notifications</h1>
                <button 
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-highlight hover:underline"
                >
                    Mark all as read
                </button>
            </div>

            <div className="flex flex-col gap-3">
                {notifications.map((notif) => (
                    <div 
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-5 rounded-2xl border transition-all ${
                            notif.is_read 
                            ? 'bg-panel border-border' 
                            : 'bg-highlight/5 border-highlight/30 shadow-sm'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h4 className={`font-bold ${notif.is_read ? 'text-text-sub' : 'text-text-main'}`}>
                                {notif.title}
                            </h4>
                            <span className="text-[10px] text-text-sub font-mono">
                                {new Date(notif.created_at).toLocaleString()}
                            </span>
                        </div>
                        <p className="text-sm text-text-sub leading-relaxed">
                            {notif.message}
                        </p>
                    </div>
                ))}
            </div>

            {hasMore && (
                <div className="mt-10 text-center">
                    <button 
                        onClick={handleLoadMore}
                        disabled={isLoading}
                        className="px-8 py-3 bg-search hover:bg-hover rounded-full text-sm font-bold transition-colors"
                    >
                        {isLoading ? 'Loading older messages...' : 'Load More'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;