import { Users, Package, Handshake, TrendingUp, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDealsRealtime } from '@/hooks/use-deals-realtime';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '@/components/ui/stat-card';

const COLORS = ['hsl(var(--primary))', 'hsl(82 80% 60%)', 'hsl(var(--muted-foreground))', 'hsl(var(--destructive))'];

const AdminDashboard = () => {
  useDealsRealtime();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [bloggers, sellers, products, deals, finished] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'blogger'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'seller'),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('deals').select('id', { count: 'exact', head: true }),
        supabase.from('deals').select('id', { count: 'exact', head: true }).eq('status', 'finished'),
      ]);
      const totalDeals = deals.count || 0;
      const finishedDeals = finished.count || 0;
      return {
        bloggers: bloggers.count || 0,
        sellers: sellers.count || 0,
        products: products.count || 0,
        deals: totalDeals,
        conversion: totalDeals > 0 ? Math.round((finishedDeals / totalDeals) * 100) : 0,
      };
    },
  });

  const { data: dealsByStatus } = useQuery({
    queryKey: ['admin-deals-by-status'],
    queryFn: async () => {
      const { data } = await supabase.from('deals').select('status');
      if (!data) return [];
      const counts: Record<string, number> = {};
      data.forEach((d: any) => { counts[d.status] = (counts[d.status] || 0) + 1; });
      const labels: Record<string, string> = {
        requested: 'Заявки', approved: 'Одобрены', product_sent: 'Отправлены',
        received: 'Получены', content_created: 'Контент', finished: 'Завершены', cancelled: 'Отменены',
      };
      return Object.entries(counts).map(([k, v]) => ({ name: labels[k] || k, value: v }));
    },
  });

  const { data: dealsOverTime } = useQuery({
    queryKey: ['admin-deals-over-time'],
    queryFn: async () => {
      const { data } = await supabase.from('deals').select('created_at').order('created_at');
      if (!data || data.length === 0) return [];
      const byDay: Record<string, number> = {};
      data.forEach((d: any) => {
        const day = new Date(d.created_at).toLocaleDateString('ru', { day: '2-digit', month: '2-digit' });
        byDay[day] = (byDay[day] || 0) + 1;
      });
      return Object.entries(byDay).map(([date, count]) => ({ date, count }));
    },
  });

  return (
    <DashboardLayout title="Админ-панель">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard title="Блогеры" value={stats?.bloggers ?? 0} icon={Users} />
          <StatCard title="Селлеры" value={stats?.sellers ?? 0} icon={ShoppingBag} />
          <StatCard title="Товары" value={stats?.products ?? 0} icon={Package} />
          <StatCard title="Сделки" value={stats?.deals ?? 0} icon={Handshake} />
          <StatCard title="Конверсия" value={`${stats?.conversion ?? 0}%`} icon={TrendingUp} suffix="" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass-card card-hover-lift">
            <CardHeader>
              <CardTitle className="text-base font-display">Сделки по дням</CardTitle>
            </CardHeader>
            <CardContent>
              {dealsOverTime && dealsOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dealsOverTime}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Нет данных</p>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card card-hover-lift">
            <CardHeader>
              <CardTitle className="text-base font-display">Статусы сделок</CardTitle>
            </CardHeader>
            <CardContent>
              {dealsByStatus && dealsByStatus.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie data={dealsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                        {dealsByStatus.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1">
                    {dealsByStatus.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2 text-xs">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Нет данных</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
