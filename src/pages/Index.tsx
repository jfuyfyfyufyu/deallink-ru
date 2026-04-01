import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';

const Index = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!user) return <LandingPage />;

  const role = profile?.role || 'blogger';
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'seller') return <Navigate to="/seller" replace />;
  return <Navigate to="/blogger" replace />;
};

export default Index;
