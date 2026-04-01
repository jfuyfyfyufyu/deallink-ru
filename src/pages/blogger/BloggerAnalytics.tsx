import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Handshake, CheckCircle2, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const STATUS_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted-foreground))'];

const BloggerAnalytics = () => {
  const { user, profile } = useAuth();

  const { data: deals } = useQuery({
    queryKey: ['blogger-analytics-deals', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('deals')
        .select('id, status, created_at, updated_at, views_count, click_count, products(name), seller:profiles!deals_seller_id_fkey(name)')
        .eq('blogger_id', user!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: reviews } = useQuery({
    queryKey: ['blogger-analytics-reviews', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews')
        .select('rating, created_at, comment, reviewer:profiles!reviews_reviewer_id_fkey(name)')
        .eq('target_id', user!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const totalDeals = deals?.length || 0;
  const finishedDeals = deals?.filter((d: any) => d.status === 'finished').length || 0;
  const cancelledDeals = deals?.filter((d: any) => d.status === 'cancelled').length || 0;
  const activeDeals = totalDeals - finishedDeals - cancelledDeals;
  const avgRating = reviews?.length ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';
  const totalViews = deals?.reduce((s: number, d: any) => s + (d.views_count || 0), 0) || 0;
  const totalClicks = deals?.reduce((s: number, d: any) => s + (d.click_count || 0), 0) || 0;
  const conversionRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '—';

  // Monthly chart data
  const monthlyData = (() => {
    if (!deals?.length) return [];
    const months: Record<string, { month: string; deals: number; finished: number }> = {};
    deals.forEach((d: any) => {
      const date = new Date(d.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });
      if (!months[key]) months[key] = { month: label, deals: 0, finished: 0 };
      months[key].deals++;
      if (d.status === 'finished') months[key].finished++;
    });
    return Object.values(months).slice(-6);
  })();

  // Status pie data
  const pieData = [
    { name: 'Завершено', value: finishedDeals },
    { name: 'Активные', value: activeDeals },
    { name: 'Отменено', value: cancelledDeals },
  ].filter(d => d.value > 0);

  // Top sellers
  const topSellers = (() => {
    if (!deals?.length) return [];
    const sellers: Record<string, { name: string; count: number }> = {};
    deals.filter((d: any) => d.status === 'finished').forEach((d: any) => {
      const name = d.seller?.name || 'Неизвестный';
      if (!sellers[name]) sellers[name] = { name, count: 0 };
      sellers[name].count++;
    });
    return Object.values(sellers).sort((a, b) => b.count - a.count).slice(0, 5);
  })();

  return (
    <DashboardLayout title="Аналитика">
      <div className="space-y-4 animate-fade-in">
        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <Handshake className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{totalDeals}</p>
              <p className="text-[10px] text-muted-foreground">Всего сделок</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{finishedDeals}</p>
              <p className="text-[10px] text-muted-foreground">Завершено</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <Star className="h-4 w-4 mx-auto mb-1 text-accent fill-accent" />
              <p className="text-xl font-bold">{avgRating}</p>
              <p className="text-[10px] text-muted-foreground">Рейтинг</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{conversionRate}%</p>
              <p className="text-[10px] text-muted-foreground">Конверсия</p>
            </CardContent>
          </Card>
        </div>

        {/* Views & clicks summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold">{totalViews.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Просмотров</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold">{totalClicks.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Кликов по UTM</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly chart */}
        {monthlyData.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Сделки по месяцам</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="deals" name="Все" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="finished" name="Завершено" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Status distribution */}
        {pieData.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Распределение сделок</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={50} innerRadius={30}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                    <span>{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top sellers */}
        {topSellers.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Топ селлеров</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {topSellers.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] w-5 h-5 flex items-center justify-center p-0">{i + 1}</Badge>
                    <span className="text-sm">{s.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{s.count} сделок</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent reviews */}
        {reviews && reviews.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Последние отзывы</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {reviews.slice(0, 5).map((r: any, i: number) => (
                <div key={i} className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{r.reviewer?.name || 'Селлер'}</p>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'text-accent fill-accent' : 'text-muted'}`} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-xs text-muted-foreground mt-1">{r.comment}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {totalDeals === 0 && (
          <p className="text-center text-muted-foreground py-8">Пока нет данных для аналитики</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BloggerAnalytics;
