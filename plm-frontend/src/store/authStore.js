import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      login: ({ user, accessToken, refreshToken }) => {
        set({ user, accessToken, refreshToken });
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null });
        localStorage.removeItem('plm-auth');
      },

      setAccessToken: (token) => {
        set({ accessToken: token });
      },

      isAuthenticated: () => !!get().accessToken,

      hasRole: (...roles) => {
        const user = get().user;
        return user && roles.includes(user.role);
      },
    }),
    {
      name: 'plm-auth',
    }
  )
);

export default useAuthStore;
