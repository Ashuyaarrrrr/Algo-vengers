import { create } from 'zustand';

interface User {
  id: string;
  email?: string;
  role?: string;
  isProfileComplete?: boolean;
}

interface AuthState {
  user: User | null;
  isInitialized: boolean;
  setUser: (user: User) => void;
  logout: () => void;
  setInitialized: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isInitialized: false,

  setUser: (user) => set({ user, isInitialized: true }),

  logout: () => set({ user: null, isInitialized: true }),

  setInitialized: () => set({ isInitialized: true }),
}));