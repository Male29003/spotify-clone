import React, { useState, useRef, useEffect } from 'react';
import { NotificationsNone, Circle, DoneAll, CloseOutlined } from '@mui/icons-material';
import { useMarkAsRead } from '../../../hooks/user/useUsers';
import { timeAgo } from '../../../utils/formatters';
import { useNotificationStore } from '../../../stores/useNotificationStore';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../api/axiosConfig';

const NotificationDropdown = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore()
    const navigate = useNavigate()
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { mutate: markAsReadAPI } = useMarkAsRead();

    // Click ra ngoài thì đóng dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => 
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const displayNotifs = [...notifications].sort((a, b) => {
        if (a.is_read === b.is_read) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return a.is_read ? 1 : -1;
    }).slice(0, 10);

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
            setIsOpen(false)
            navigate(`/${type}/${short_id}`)
        } 
        // nếu artist yêu thích ra release mới thì vào xem release đó
        else if (notif.title.toLowerCase().includes('new release')) {
            setIsOpen(false)
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

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full text-text-sub hover:text-text-main hover:bg-hover transition-colors"
            >
                <NotificationsNone fontSize="medium" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-panel"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-y-auto custom-scrollbar bg-panel border border-border rounded-2xl shadow-2xl z-100 animate-fadeIn">
                    <div className="p-4 border-b border-border sticky top-0 bg-panel z-20 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-text-main">Notifications</h3>
                    
                        {unreadCount > 0 && (
                            <button 
                                onClick={handleMarkAllAsRead}
                                title="Mark all as read"
                                className='flex items-center gap-1 text-xs font-semibold text-text-sub hover:text-highlight transition-colors group'
                            >
                                <DoneAll fontSize="small" className="group-hover:scale-110 transition-transform" />
                                <span>Mark all read</span>
                            </button>
                        )}
                    </div>
                    
                    {notifications.length === 0 ? (
                        <div className="p-6 text-center text-text-sub text-sm">No notifications yet.</div>
                    ) : (
                        <div className="flex flex-col">
                            {displayNotifs.map((notif: any) => (
                                <div 
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-4 border-b border-border/50 cursor-pointer hover:bg-search/50 transition-colors flex gap-3 
                                        ${!notif.is_read ? 'bg-highlight/5' : ''}`}
                                >
                                    <button 
                                        onClick={(e) => handleDelete(e, notif.id)}
                                        className="absolute top-2 right-2 p-1 rounded-full text-text-sub hover:text-error hover:bg-error/20 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete notification"
                                    >
                                        <CloseOutlined fontSize="small" />
                                    </button>
                                    {!notif.is_read && 
                                        <Circle className="text-highlight mt-1" style={{ fontSize: 10 }} />
                                    }
                                    <div className="flex-1">
                                        <p className={`text-sm ${!notif.is_read ? 'text-text-main font-bold' : 'text-text-sub'}`}>
                                            {notif.title}
                                        </p>
                                        <p className="text-xs text-text-sub mt-1 line-clamp-2">{notif.message}</p>
                                        <p className="text-[10px] text-text-sub/70 mt-2 font-mono">
                                            {timeAgo(notif.created_at)} ago
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="p-3 border-t border-border bg-panel text-center sticky bottom-0">
                        <button 
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/notifications');
                            }}
                            className="text-sm font-bold text-highlight hover:underline opacity-80 hover:opacity-100 transition-opacity"
                        >
                            View all notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;