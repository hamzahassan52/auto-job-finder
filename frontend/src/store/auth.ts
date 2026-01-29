import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setToken: (token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
        set({ token, isAuthenticated: true });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
