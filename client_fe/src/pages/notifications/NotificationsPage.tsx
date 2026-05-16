import { useState, useEffect } from 'react';
import { useNotificationStore } from '../../stores/useNotificationStore';
import { api } from '../../api/axiosConfig';
import { useMarkAsRead } from '../../hooks/user/useUsers';
import { useNavigate } from 'react-router-dom';
import { CloseOutlined, DoneAll } from '@mui/icons-material';

const NotificationsPage = () => {
    const navigate = useNavigate()
    const { notifications, unreadCount, appendOldNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();
    const { mutate: markAsReadAPI } = useMarkAsRead();

    const [filter, setFilter] = useState<'all' | 'unread'>('unread');
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
    // xử lý đọc noti
    const handleNotificationClick = (notif: any) => {
        const { type, short_id } = notif.metadata || {}
        if (!notif.is_read) {
            // cập nhật UI
            markAsRead(notif.id);
            // cập nhật ở db -> gửi api
            markAsReadAPI(notif.id); 
        }

        // nếu dc gỡ block thì qua trang release / artist đó mà user đã yêu thích trước đó
        // những TH sau đây thì bỏ qua:
            // Artist / Release yêu thích bị block
        if (notif.title.toLowerCase().includes('unblocked')){
            navigate(`/${type}/${short_id}`)
        } 
        // nếu artist yêu thích ra release mới thì vào xem release đó
        else if (notif.title.toLowerCase().includes('new release')) {
            navigate(`/${type}/${short_id}`)
        }
    };
    const handleMarkAllAsRead = (e: React.MouseEvent) => {
        e.preventDefault()
        markAllAsRead()
        notifications.map(n => markAsReadAPI(n.id))
    }

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation(); 
        deleteNotification(id); 
        try {
            await api.delete(`/users/me/noti/${id}/`); 
        } catch (error) {
            console.error("Error:", error);
        }
    }

    const displayNotifs = [...notifications]
                            .filter(n => filter === 'all' || !n.is_read)
                            .sort((a, b) => {
                                if (a.is_read === b.is_read) {
                                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                                }
                                return a.is_read ? 1 : -1;
                            });

    return (
        <div className="max-w-3xl mx-auto py-10 px-4">
            {/* Tabs */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-4">Notifications</h1>
                    <div className="flex gap-2 bg-panel p-1 rounded-lg border border-border w-fit">
                        <button 
                            onClick={() => setFilter('unread')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all duration-300 ${filter === 'unread' ? 'bg-highlight text-text-dark shadow-sm' : 'text-text-sub hover:text-text-main'}`}
                        >
                            Unread
                        </button>
                        <button 
                            onClick={() => setFilter('all')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all duration-300 ${filter === 'all' ? 'bg-highlight text-text-dark shadow-sm' : 'text-text-sub hover:text-text-main'}`}
                        >
                            All
                        </button>
                    </div>
                </div>

                {unreadCount > 0 &&
                    <button 
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-1 text-sm font-semibold text-text-sub hover:text-highlight transition-colors mb-1"
                    >
                        <DoneAll fontSize="small" /> Mark all read
                    </button>
                }
            </div>

            <div className="flex flex-col gap-3">
                {displayNotifs.map((notif) => (
                    <div 
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer hover:scale-105 hover:border-highlight/80 ${
                            notif.is_read 
                            ? 'bg-panel border-border' 
                            : 'bg-highlight/5 border-highlight/30 shadow-sm'
                        }`}
                    >
                        <button 
                            onClick={(e) => handleDelete(e, notif.id)}
                            className="absolute top-4 right-4 p-1.5 rounded-full text-text-sub hover:text-error hover:bg-error/20 opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete"
                        >
                            <CloseOutlined fontSize="small" />
                        </button>
                        <div className="flex justify-between items-start mb-2 truncate">
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

            {hasMore && filter === 'all' && (
                <div className="mt-10 text-center">
                    <button 
                        onClick={handleLoadMore}
                        disabled={isLoading}
                        className="px-8 py-3 bg-search hover:bg-hover rounded-full text-sm font-bold transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Loading older messages...' : 'Load More'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;