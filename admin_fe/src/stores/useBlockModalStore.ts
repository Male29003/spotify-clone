import { create } from "zustand";

interface Reason {
    id: number;
    label: string;
}

interface BlockModalConfig {
    title?: string;
    itemName?: string;
    reasons: Reason[];
    actionLabel?: string;
}

interface BlockModalState {
    isOpen: boolean;
    isLoading: boolean;
    options: BlockModalConfig;
    onConfirm: (reasonId: number, note: string) => void;
    
    // Actions
    openBlockModal: (onConfirmAction: (reasonId: number, note: string) => void, options: BlockModalConfig) => void;
    closeBlockModal: () => void;
    setLoading: (status: boolean) => void;
}

export const useBlockModalStore = create<BlockModalState>((set) => ({
    isOpen: false,
    isLoading: false,
    options: { reasons: [] },
    onConfirm: () => {}, 
    
    openBlockModal: (onConfirmAction, options) => set({ 
        isOpen: true, 
        onConfirm: onConfirmAction,
        options: options,
        isLoading: false 
    }),
    closeBlockModal: () => set({ 
        isOpen: false, 
        isLoading: false
    }),
    setLoading: (status) => set({ isLoading: status })
}));