import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import { lazy, Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeletons";

// Eager: landing & auth (small, always needed)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy: auth page
const AuthPage = lazy(() => import("./pages/AuthPage"));

// Lazy: heavy dashboard pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminBloggers = lazy(() => import("./pages/admin/AdminBloggers"));
const AdminSellers = lazy(() => import("./pages/admin/AdminSellers"));
const AdminDeals = lazy(() => import("./pages/admin/AdminDeals"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

const SellerDashboard = lazy(() => import("./pages/seller/SellerDashboard"));
const SellerProducts = lazy(() => import("./pages/seller/SellerProducts"));
const SellerApplications = lazy(() => import("./pages/seller/SellerApplications"));
const SellerDeals = lazy(() => import("./pages/seller/SellerDeals"));
const SellerReviews = lazy(() => import("./pages/seller/SellerReviews"));
const SellerProfile = lazy(() => import("./pages/seller/SellerProfile"));
const SellerAnalytics = lazy(() => import("./pages/seller/SellerAnalytics"));

const BloggerFeed = lazy(() => import("./pages/blogger/BloggerFeed"));
const BloggerDeals = lazy(() => import("./pages/blogger/BloggerDeals"));
const BloggerProfile = lazy(() => import("./pages/blogger/BloggerProfile"));
const BloggerOnboarding = lazy(() => import("./pages/blogger/BloggerOnboarding"));
const BloggerAnalytics = lazy(() => import("./pages/blogger/BloggerAnalytics"));

const TrackingPage = lazy(() => import("./pages/TrackingPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 300_000,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => <PageSkeleton />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Admin */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/bloggers" element={<ProtectedRoute allowedRoles={['admin']}><AdminBloggers /></ProtectedRoute>} />
              <Route path="/admin/sellers" element={<ProtectedRoute allowedRoles={['admin']}><AdminSellers /></ProtectedRoute>} />
              <Route path="/admin/deals" element={<ProtectedRoute allowedRoles={['admin']}><AdminDeals /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />

              {/* Seller */}
              <Route path="/seller" element={<ProtectedRoute allowedRoles={['seller']}><SellerDashboard /></ProtectedRoute>} />
              <Route path="/seller/products" element={<ProtectedRoute allowedRoles={['seller']}><SellerProducts /></ProtectedRoute>} />
              <Route path="/seller/applications" element={<ProtectedRoute allowedRoles={['seller']}><SellerApplications /></ProtectedRoute>} />
              <Route path="/seller/deals" element={<ProtectedRoute allowedRoles={['seller']}><SellerDeals /></ProtectedRoute>} />
              <Route path="/seller/reviews" element={<ProtectedRoute allowedRoles={['seller']}><SellerReviews /></ProtectedRoute>} />
              <Route path="/seller/analytics" element={<ProtectedRoute allowedRoles={['seller']}><SellerAnalytics /></ProtectedRoute>} />
              <Route path="/seller/profile" element={<ProtectedRoute allowedRoles={['seller']}><SellerProfile /></ProtectedRoute>} />

              {/* Blogger */}
              <Route path="/blogger" element={<ProtectedRoute allowedRoles={['blogger']}><BloggerFeed /></ProtectedRoute>} />
              <Route path="/blogger/deals" element={<ProtectedRoute allowedRoles={['blogger']}><BloggerDeals /></ProtectedRoute>} />
              <Route path="/blogger/profile" element={<ProtectedRoute allowedRoles={['blogger']}><BloggerProfile /></ProtectedRoute>} />
              <Route path="/blogger/onboarding" element={<ProtectedRoute allowedRoles={['blogger']}><BloggerOnboarding /></ProtectedRoute>} />
              <Route path="/blogger/analytics" element={<ProtectedRoute allowedRoles={['blogger']}><BloggerAnalytics /></ProtectedRoute>} />

              {/* Anonymous tracking */}
              <Route path="/track/:token" element={<TrackingPage />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;