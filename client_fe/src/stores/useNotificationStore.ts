import { create } from 'zustand'

interface NotificationState {
    notifications: any[];
    unreadCount : number;
    setInitial: (notifs: any[], count: number) => void;
    addNewNotification: (notif: any) => void;
    markAsRead: (id: number) => void
    markAllAsRead: () => void;
    appendOldNotifications: (notifs: any[]) => void;
    deleteNotification: (id: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    unreadCount: 0,
    setInitial: (notifs, count) => set({
        notifications: notifs,
        unreadCount: count
    }),

    addNewNotification: (notif) =>set((state) => {
        const isExisted = state.notifications.some(n => n.id === notif.id);
        if(isExisted)
            return state;
        return {
            notifications: [notif, ...state.notifications],
            unreadCount: state.unreadCount + 1
        }
    }),
    markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: true} : n),
        unreadCount: Math.max(0, state.unreadCount - 1)
    })),

    markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
    })),

    appendOldNotifications: (oldNotifs) => set((state) => {
        const existingIds = new Set(state.notifications.map(n => n.id));
        const uniqueOld = oldNotifs.filter((n: any) => !existingIds.has(n.id));
        
        return {
            notifications: [...state.notifications, ...uniqueOld]
        }
    }),

    deleteNotification: (id) => set((state) => {
        const targetNotif = state.notifications.find(n => n.id === id);
        return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: (targetNotif && !targetNotif.is_read) ? Math.max(0, state.unreadCount - 1) : state.unreadCount
        };
    })
}))