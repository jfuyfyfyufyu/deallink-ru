import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageSkeleton } from '@/components/ui/skeletons';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'admin' | 'blogger' | 'seller'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <PageSkeleton />;
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Profile still loading in background — show skeleton
  if (!profile) return <PageSkeleton />;

  const role = profile.role || 'blogger';
  if (!allowedRoles.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'seller') return <Navigate to="/seller" replace />;
    return <Navigate to="/blogger" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
