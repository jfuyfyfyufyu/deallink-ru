import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/components/ui/skeletons';

const LandingPage = lazy(() => import('./LandingPage'));

const Index = () => {
  const { user, profile, loading } = useAuth();

  if (loading) return <PageSkeleton />;
  if (!user) return <Suspense fallback={<PageSkeleton />}><LandingPage /></Suspense>;

  const role = profile?.role || 'blogger';
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'seller') return <Navigate to="/seller" replace />;
  return <Navigate to="/blogger" replace />;
};

export default Index;
