import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Handshake, CheckCircle2, TrendingUp, MousePointerClick, Eye, Clock, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ExportCSV from '@/components/seller/ExportCSV';

const STATUS_LABELS: Record<string, string> = {
  requested: 'Заявка', approved: 'Одобрено', ordered: 'Заказано',
  in_pvz: 'В ПВЗ', picked_up: 'Забрал', filming: 'Снимает',
  review_posted: 'Отзыв опубл.', finished: 'Завершено', cancelled: 'Отмена',
};

const COLORS = [
  'hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted-foreground))',
  'hsl(0, 72%, 51%)', 'hsl(200, 70%, 50%)', 'hsl(142, 71%, 45%)', 'hsl(265, 60%, 55%)',
];

const SellerAnalytics = () => {
  const { user } = useAuth();

  const { data: deals } = useQuery({
    queryKey: ['seller-analytics-deals', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('deals')
        .select('id, status, created_at, updated_at, blogger_id, product_id, views_count, click_count, is_overdue, products(name)')
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: topBloggers } = useQuery({
    queryKey: ['seller-top-bloggers', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('deals')
        .select('blogger_id, blogger:profiles!deals_blogger_id_fkey(name, trust_score)')
        .eq('seller_id', user!.id)
        .eq('status', 'finished');
      const counts: Record<string, { name: string; score: number; count: number }> = {};
      (data || []).forEach((d: any) => {
        const id = d.blogger_id;
        if (!counts[id]) counts[id] = { name: d.blogger?.name || '?', score: d.blogger?.trust_score || 0, count: 0 };
        counts[id].count++;
      });
      return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
    },
    enabled: !!user,
  });

  const { data: reviews } = useQuery({
    queryKey: ['seller-analytics-reviews', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews')
        .select('rating, comment, created_at, target:profiles!reviews_target_id_fkey(name)')
        .eq('reviewer_id', user!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const total = deals?.length || 0;
  const finished = deals?.filter(d => d.status === 'finished').length || 0;
  const cancelled = deals?.filter(d => d.status === 'cancelled').length || 0;
  const active = total - finished - cancelled;
  const overdue = deals?.filter(d => d.is_overdue).length || 0;
  const conversion = total > 0 ? ((finished / total) * 100).toFixed(0) : '0';
  const totalViews = deals?.reduce((s, d: any) => s + (d.views_count || 0), 0) || 0;
  const totalClicks = deals?.reduce((s, d: any) => s + (d.click_count || 0), 0) || 0;
  const utmConversion = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '—';
  const avgRating = reviews?.length ? (reviews.reduce((s, r: any) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';

  // Status pie
  const statusData = (() => {
    if (!deals) return [];
    const counts: Record<string, number> = {};
    deals.forEach(d => { counts[d.status] = (counts[d.status] || 0) + 1; });
    return Object.entries(counts)
      .map(([status, count]) => ({ name: STATUS_LABELS[status] || status, value: count }))
      .filter(d => d.value > 0);
  })();

  // Monthly chart
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

  // Top products by deals
  const topProducts = (() => {
    if (!deals?.length) return [];
    const products: Record<string, { name: string; count: number; views: number; clicks: number }> = {};
    deals.forEach((d: any) => {
      const name = d.products?.name || 'Без названия';
      if (!products[name]) products[name] = { name, count: 0, views: 0, clicks: 0 };
      products[name].count++;
      products[name].views += d.views_count || 0;
      products[name].clicks += d.click_count || 0;
    });
    return Object.values(products).sort((a, b) => b.count - a.count).slice(0, 5);
  })();

  return (
    <DashboardLayout title="Аналитика">
      <div className="space-y-4 animate-fade-in">
        <div className="flex justify-end">
          <ExportCSV />
        </div>
        {/* KPI row 1 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <Handshake className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{total}</p>
              <p className="text-[10px] text-muted-foreground">Всего сделок</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{finished}</p>
              <p className="text-[10px] text-muted-foreground">Завершено</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{conversion}%</p>
              <p className="text-[10px] text-muted-foreground">Конверсия сделок</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-destructive" />
              <p className="text-xl font-bold">{overdue}</p>
              <p className="text-[10px] text-muted-foreground">Просрочено</p>
            </CardContent>
          </Card>
        </div>

        {/* KPI row 2: UTM */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <Eye className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{totalViews.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Просмотров</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <MousePointerClick className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{totalClicks.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Кликов UTM</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-4 w-4 mx-auto mb-1 text-accent" />
              <p className="text-xl font-bold">{utmConversion}%</p>
              <p className="text-[10px] text-muted-foreground">Конверсия UTM</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <Star className="h-4 w-4 mx-auto mb-1 text-accent fill-accent" />
              <p className="text-xl font-bold">{avgRating}</p>
              <p className="text-[10px] text-muted-foreground">Средний рейтинг</p>
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
        {statusData.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Распределение сделок</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" cx="50%" cy="50%" outerRadius={50} innerRadius={30}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1">
                {statusData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span>{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top products */}
        {topProducts.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Топ товаров</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] w-5 h-5 flex items-center justify-center p-0">{i + 1}</Badge>
                    <span className="text-sm truncate max-w-[150px]">{p.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-2">
                    <span>{p.count} сделок</span>
                    {p.views > 0 && <span>· {p.views} просм.</span>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Top bloggers */}
        {topBloggers && topBloggers.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Топ блогеров</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {topBloggers.map((b, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] w-5 h-5 flex items-center justify-center p-0">{i + 1}</Badge>
                    <span className="text-sm">{b.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{b.count} сделок · ★ {Number(b.score).toFixed(1)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent reviews given */}
        {reviews && reviews.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Ваши отзывы</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {reviews.slice(0, 5).map((r: any, i: number) => (
                <div key={i} className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{r.target?.name || 'Блогер'}</p>
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

        {total === 0 && (
          <p className="text-center text-muted-foreground py-8">Пока нет данных для аналитики</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SellerAnalytics;
