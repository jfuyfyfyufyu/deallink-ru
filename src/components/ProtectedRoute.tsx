import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageSkeleton } from '@/components/ui/skeletons';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'admin' | 'blogger' | 'seller'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, role, authLoading } = useAuth();

  // Only block on auth loading — never on profile
  if (authLoading) return <PageSkeleton />;

  if (!user) return <Navigate to="/auth" replace />;

  // Use role from context (available before full profile loads)
  const effectiveRole = role || 'blogger';

  if (!allowedRoles.includes(effectiveRole)) {
    if (effectiveRole === 'admin') return <Navigate to="/admin" replace />;
    if (effectiveRole === 'seller') return <Navigate to="/seller" replace />;
    return <Navigate to="/blogger" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
