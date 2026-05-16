import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminSiderState {
    isExpanded: boolean;
    toggleSider: () => void;
    setExpanded: (value: boolean) => void;
}

export const useAdminSiderStore = create<AdminSiderState>()(
    persist(
        (set) => ({
            isExpanded: true,
            toggleSider: () => set((state) => ({ isExpanded: !state.isExpanded })),
            setExpanded: (value) => set({ isExpanded: value }),
        }),
        {
            name: 'sider_expanded',
        }
    )
);