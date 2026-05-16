import { create } from "zustand";
import type { IUser } from "../../types";
import { createJSONStorage, persist } from 'zustand/middleware'

interface AuthState {
  isLoaded: boolean;
  isAuthenticated: boolean;
  user: IUser | null;
  setIsLoaded: (isLoaded: boolean) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setUser: (user: IUser | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist((set) => ({
    isLoaded: false,
    isAuthenticated: false,
    user: null,
    setIsLoaded: (isLoaded) => set({ isLoaded }),
    setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    clearUser: () => {
      set({
        user: null,
        isAuthenticated: false
      })
    }
  }),
  {
    name: 'spotify-auth-storage',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated
    })
  }

))