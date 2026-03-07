import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
}

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    user: User | null;
    isAuthenticated: boolean;
    setTokens: (access: string, refresh: string) => void;
    setUser: (user: User) => void;
    login: (access: string, refresh: string, user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false,

            setTokens: (access, refresh) =>
                set({ accessToken: access, refreshToken: refresh, isAuthenticated: true }),

            setUser: (user) => set({ user }),

            login: (access, refresh, user) =>
                set({ accessToken: access, refreshToken: refresh, user, isAuthenticated: true }),

            logout: () =>
                set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
        }),
        {
            name: 'auth-storage', // Key strictly used in localStorage
            storage: createJSONStorage(() => localStorage),
        }
    )
);
