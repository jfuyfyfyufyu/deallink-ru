import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDealsRealtime } from '@/hooks/use-deals-realtime';
import { Button } from '@/components/ui/button';
import { Package, Handshake, Zap } from 'lucide-react';
import AutoRecommendations from '@/components/seller/AutoRecommendations';
import { useNavigate } from 'react-router-dom';
import StatCard from '@/components/ui/stat-card';

const SellerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  useDealsRealtime();

  const { data: productsCount } = useQuery({
    queryKey: ['seller-products-count', user?.id],
    queryFn: async () => {
      const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('seller_id', user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: dealsCount } = useQuery({
    queryKey: ['seller-deals-count', user?.id],
    queryFn: async () => {
      const { count } = await supabase.from('deals').select('id', { count: 'exact', head: true }).eq('seller_id', user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: activeDeals } = useQuery({
    queryKey: ['seller-active-deals', user?.id],
    queryFn: async () => {
      const { count } = await supabase.from('deals').select('id', { count: 'exact', head: true }).eq('seller_id', user!.id).not('status', 'in', '("finished","cancelled")');
      return count || 0;
    },
    enabled: !!user,
  });

  return (
    <DashboardLayout title="Кабинет селлера">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            title="Товары"
            value={productsCount ?? 0}
            icon={Package}
            onClick={() => navigate('/seller/products')}
          />
          <StatCard
            title="Сделки"
            value={dealsCount ?? 0}
            icon={Handshake}
          />
          <StatCard
            title="Активные"
            value={activeDeals ?? 0}
            icon={Zap}
          />
        </div>

        <AutoRecommendations />

        <div
          className="glass-card card-hover-lift cursor-pointer p-4 flex items-center gap-3"
          onClick={() => navigate('/seller/products')}
        >
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center icon-ring">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium font-display">Мои товары</p>
            <p className="text-sm text-muted-foreground">Управление товарами для бартера</p>
          </div>
          <Button variant="outline" size="sm" className="btn-shimmer">Перейти</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SellerDashboard;
