import { create } from 'zustand';

interface User {
  id: string;
  email?: string;
  isProfileComplete?: boolean;
}

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  // ✅ THIS IS IMPORTANT
  setUser: (user) => set({ user }),

  logout: () => set({ user: null }),
}));