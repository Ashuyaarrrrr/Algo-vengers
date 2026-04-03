import { create } from 'zustand';
import { DemoUser, DEMO_USERS } from './demo-data';

interface AuthState {
  user: DemoUser | null;
  isAuthenticated: boolean;
  login: (userId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (userId: string) => {
    const user = DEMO_USERS.find((u) => u.id === userId) ?? null;
    set({ user, isAuthenticated: !!user });
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));
