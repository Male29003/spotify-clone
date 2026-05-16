import { create } from "zustand";

type ModalType = 'delete' | 'unsaved' | 'save' | 'warning' | 'info'

interface ConfirmOptions {
    title?: string;
    message?: string;
    confirmBtn?: string;
    cancelBtn?: string;
}

interface ConfirmState {
    isOpen: boolean;
    type: ModalType;
    isLoading: boolean;
    options?: ConfirmOptions; // Chứa text custom
    onConfirm: () => void;
    
    // Actions
    showConfirm: (type: ModalType, onConfirmAction: () => void, options?: ConfirmOptions) => void;
    closeModal: () => void;
    setLoading: (status: boolean) => void;
}

export const useConfirmModalStore = create<ConfirmState>((set) => ({
    isOpen: false,
    type: 'delete',
    isLoading: false,
    options: undefined,
    onConfirm: () => {}, 
    
    showConfirm: (type, onConfirmAction, options) => set({ 
        isOpen: true, 
        type: type, 
        onConfirm: onConfirmAction,
        options: options, // Lưu text custom vào state
        isLoading: false 
    }),
    closeModal: () => set({ 
        isOpen: false, 
        isLoading: false
    }),
    setLoading: (status) => set({ isLoading: status })
}));