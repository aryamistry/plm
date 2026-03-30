import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function RoleGuard({ roles, children }) {
  const { user } = useAuthStore();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
