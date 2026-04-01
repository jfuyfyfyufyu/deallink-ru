import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/components/ui/skeletons';

const LandingPage = lazy(() => import('./LandingPage'));

const Index = () => {
  const { user, role, authLoading } = useAuth();

  if (authLoading) return <PageSkeleton />;
  if (!user) return <Suspense fallback={<PageSkeleton />}><LandingPage /></Suspense>;

  // Route by role — no dependency on profile object
  const effectiveRole = role || 'blogger';
  if (effectiveRole === 'admin') return <Navigate to="/admin" replace />;
  if (effectiveRole === 'seller') return <Navigate to="/seller" replace />;
  return <Navigate to="/blogger" replace />;
};

export default Index;
