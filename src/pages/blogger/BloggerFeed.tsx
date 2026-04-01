import DashboardLayout from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, ExternalLink, Check, Search, SlidersHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDealsRealtime } from '@/hooks/use-deals-realtime';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import WelcomeDialog from '@/components/blogger-onboarding/WelcomeDialog';

const BloggerFeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'views'>('newest');

  // Check if onboarding is completed
  const { data: questionnaire } = useQuery({
    queryKey: ['blogger-questionnaire-check', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('blogger_questionnaires')
        .select('completed, moderation_status, moderation_note')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data as any;
    },
    enabled: !!user,
  });

  const showWelcome = questionnaire !== undefined && (questionnaire === null || questionnaire.completed === false);
  const moderationStatus = questionnaire?.moderation_status;
  const _canApply = moderationStatus === 'approved';

  useDealsRealtime();

  const { data: products, isLoading } = useQuery({
    queryKey: ['blogger-feed'],
    queryFn: async () => {
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (!prods || prods.length === 0) return [];
      // Fetch seller names separately since there's no FK
      const sellerIds = [...new Set(prods.map((p: any) => p.seller_id))];
      const { data: sellers } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', sellerIds);
      const sellerMap = new Map((sellers || []).map((s: any) => [s.user_id, s.name]));
      return prods.map((p: any) => ({ ...p, seller: { name: sellerMap.get(p.seller_id) || 'Селлер' } }));
    },
  });

  const { data: myDeals } = useQuery({
    queryKey: ['blogger-my-deals', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('deals').select('product_id, status').eq('blogger_id', user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const appliedProducts = new Set(
    myDeals?.filter((d: any) => d.status !== 'cancelled').map((d: any) => d.product_id) || []
  );

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = products.filter((p: any) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.requirements || '').toLowerCase().includes(q) ||
        (p.seller?.name || '').toLowerCase().includes(q);
    });
    if (sortBy === 'views') {
      result = [...result].sort((a: any, b: any) => (b.min_views || 0) - (a.min_views || 0));
    }
    return result;
  }, [products, search, sortBy]);

  const apply = useMutation({
    mutationFn: async (product: any) => {
      const { error } = await supabase.from('deals').insert({
        product_id: product.id,
        blogger_id: user!.id,
        seller_id: product.seller_id,
        initiated_by: 'blogger',
      });
      if (error) throw error;
    },
    onSuccess: (_, product) => {
      queryClient.invalidateQueries({ queryKey: ['blogger-feed'] });
      queryClient.invalidateQueries({ queryKey: ['blogger-my-deals'] });
      toast({ title: 'Заявка отправлена!' });
      // Notify seller via Telegram
      supabase.functions.invoke('telegram-notify', {
        body: {
          user_id: product.seller_id,
          title: '📩 Новая заявка от блогера!',
          message: `Блогер подал заявку на товар «${product.name}». Перейдите в раздел "Заявки" для рассмотрения.`,
        },
      }).catch(() => {});
    },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  return (
    <DashboardLayout title="Доступные товары">
      <WelcomeDialog open={showWelcome && questionnaire === null} onStart={() => navigate('/blogger/onboarding')} />
      <div className="space-y-4 animate-fade-in">
        {/* Moderation banners */}
        {moderationStatus === 'pending' && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-center">
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">⏳ Ваша анкета на проверке</p>
            <p className="text-xs text-muted-foreground mt-1">Вы сможете подавать заявки после одобрения модератором</p>
          </div>
        )}
        {moderationStatus === 'rejected' && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
            <p className="text-sm font-medium text-destructive">❌ Анкета отклонена</p>
            {questionnaire?.moderation_note && (
              <p className="text-xs text-muted-foreground mt-1">{questionnaire.moderation_note}</p>
            )}
            <Button size="sm" variant="outline" className="mt-2" onClick={() => navigate('/blogger/onboarding')}>
              Редактировать анкету
            </Button>
          </div>
        )}
        {/* Search & Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск товаров..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-[140px]">
              <SlidersHorizontal className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Новые</SelectItem>
              <SelectItem value="views">По просмотрам</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading && <p className="text-muted-foreground">Загрузка...</p>}
        {filteredProducts.map((p: any) => {
          const applied = appliedProducts.has(p.id);
          return (
            <Card key={p.id} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-14 w-14 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{p.name}</p>
                      {p.marketplace_url && (
                        <a href={p.marketplace_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                    {p.requirements && (
                      <p className="text-xs text-muted-foreground mt-1">📋 {p.requirements}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">{p.seller?.name || 'Селлер'}</Badge>
                      {p.min_views > 0 && <Badge variant="outline" className="text-xs">Мин. {p.min_views} просм.</Badge>}
                    </div>
                  </div>
                </div>
                {applied ? (
                  <Button className="w-full mt-3" size="sm" variant="secondary" disabled>
                    <Check className="h-4 w-4 mr-1" /> Заявка отправлена
                  </Button>
                ) : moderationStatus !== 'approved' ? (
                  <Button className="w-full mt-3" size="sm" variant="outline" disabled>
                    Подача заявок недоступна
                  </Button>
                ) : (
                  <Button className="w-full mt-3" size="sm" onClick={() => apply.mutate(p)} disabled={apply.isPending}>
                    Подать заявку
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        {!isLoading && filteredProducts.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            {search ? 'Ничего не найдено' : 'Нет доступных товаров'}
          </p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BloggerFeed;
