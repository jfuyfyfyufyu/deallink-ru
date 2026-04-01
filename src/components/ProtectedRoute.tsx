import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'admin' | 'blogger' | 'seller'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const role = profile?.role || 'blogger';
  if (!allowedRoles.includes(role)) {
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'seller') return <Navigate to="/seller" replace />;
    return <Navigate to="/blogger" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
