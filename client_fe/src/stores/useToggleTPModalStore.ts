import { create } from "zustand";

interface MenuState {
    item: any | null;
    position: { top?: number; bottom?: number; left?: number; right?: number } | null;
    openMenu: (track: any, position: { top?: number; bottom?: number; left?: number; right?: number }) => void;
    closeMenu: () => void;
}

export const useMenuStore = create<MenuState>((set) => ({
    item: null,
    position: null,
    openMenu: (item, position) => set({ item, position }),
    closeMenu: () => set({ item: null, position: null }),
}));