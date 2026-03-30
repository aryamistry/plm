import useAuthStore from '../store/authStore';

export const useAuth = () => {
  const { user, accessToken, refreshToken, login, logout, setAccessToken, isAuthenticated, hasRole } = useAuthStore();
  return { user, accessToken, refreshToken, login, logout, setAccessToken, isAuthenticated: !!accessToken, hasRole };
};
