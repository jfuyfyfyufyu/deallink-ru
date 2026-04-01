import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Star, Users, Send } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface RecommendedBlogger {
  user_id: string;
  name: string;
  niche: string | null;
  trust_score: number | null;
  subscribers_count: number | null;
  avatar_url: string | null;
  matchReason: string;
}

const AutoRecommendations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [proposeBlogger, setProposeBlogger] = useState<RecommendedBlogger | null>(null);
  const [selectedProduct, setSelectedProduct] = useState('');

  const { data: products } = useQuery({
    queryKey: ['seller-active-products', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name, target_audience, min_views').eq('seller_id', user!.id).eq('is_active', true);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['auto-recommendations', user?.id],
    queryFn: async () => {
      // Get seller's products for matching
      const { data: sellerProducts } = await supabase.from('products').select('target_audience, min_views').eq('seller_id', user!.id).eq('is_active', true);
      
      // Get existing deals to exclude bloggers already in deals
      const { data: existingDeals } = await supabase.from('deals').select('blogger_id').eq('seller_id', user!.id).not('status', 'in', '("finished","cancelled")');
      const excludeIds = new Set((existingDeals || []).map(d => d.blogger_id));

      // Get only approved questionnaires first, then fetch matching profiles
      const { data: questionnaires } = await supabase
        .from('blogger_questionnaires')
        .select('user_id, completion_probability, reliability_index, speed_index, pricing_type, avg_shorts_views, avg_reels_views')
        .eq('completed', true)
        .eq('moderation_status', 'approved');

      if (!questionnaires?.length) return [];

      const approvedIds = questionnaires.map(q => q.user_id);
      const { data: bloggers } = await supabase
        .from('profiles')
        .select('user_id, name, niche, trust_score, subscribers_count, avatar_url')
        .eq('role', 'blogger')
        .in('user_id', approvedIds)
        .order('trust_score', { ascending: false })
        .limit(50);

      if (!bloggers) return [];
      const bloggerIds = bloggers.map(b => b.user_id);

      const qMap = new Map((questionnaires || []).map(q => [q.user_id, q]));

      // Get review counts
      const { data: reviews } = await supabase
        .from('reviews')
        .select('target_id, rating')
        .in('target_id', bloggerIds);

      const reviewMap = new Map<string, { count: number; avg: number }>();
      (reviews || []).forEach(r => {
        const existing = reviewMap.get(r.target_id) || { count: 0, avg: 0 };
        existing.avg = (existing.avg * existing.count + r.rating) / (existing.count + 1);
        existing.count++;
        reviewMap.set(r.target_id, existing);
      });

      const minViews = sellerProducts?.reduce((max, p) => Math.max(max, p.min_views || 0), 0) || 0;

      return bloggers
        .filter(b => !excludeIds.has(b.user_id))
        .map(b => {
          const q = qMap.get(b.user_id);
          const r = reviewMap.get(b.user_id);
          let score = 0;
          const reasons: string[] = [];

          // Trust score
          if ((b.trust_score || 0) >= 4) { score += 3; reasons.push('Высокий рейтинг'); }
          else if ((b.trust_score || 0) >= 3) { score += 1; }

          // Completion probability
          if (q?.completion_probability && q.completion_probability >= 80) { score += 2; reasons.push('Надёжный'); }

          // Speed
          if (q?.speed_index && q.speed_index >= 4) { score += 1; reasons.push('Быстрый'); }

          // Views match
          const views = (q?.avg_shorts_views || 0) + (q?.avg_reels_views || 0);
          if (minViews > 0 && views >= minViews) { score += 2; reasons.push(`${views} просм.`); }

          // Barter-friendly
          if (q?.pricing_type === 'barter') { score += 1; reasons.push('Бартер'); }

          // Has positive reviews
          if (r && r.count >= 2 && r.avg >= 4) { score += 2; reasons.push(`★${r.avg.toFixed(1)}`); }

          return {
            ...b,
            matchReason: reasons.slice(0, 3).join(' · ') || 'Подходит',
            _score: score,
          };
        })
        .filter(b => b._score >= 2)
        .sort((a, b) => b._score - a._score)
        .slice(0, 6) as RecommendedBlogger[];
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const createDeal = useMutation({
    mutationFn: async () => {
      if (!selectedProduct || !proposeBlogger) return;
      const { error } = await supabase.from('deals').insert({
        product_id: selectedProduct,
        blogger_id: proposeBlogger.user_id,
        seller_id: user!.id,
        status: 'requested',
        initiated_by: 'seller',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Сделка создана!' });
      setProposeBlogger(null);
      setSelectedProduct('');
      queryClient.invalidateQueries({ queryKey: ['seller-deals', 'auto-recommendations'] });
    },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  if (isLoading || !recommendations?.length) return null;

  return (
    <>
      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Рекомендуемые блогеры
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recommendations.map(b => (
            <div key={b.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              {b.avatar_url ? (
                <img src={b.avatar_url} alt={b.name} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{b.name}</p>
                <p className="text-[10px] text-muted-foreground">{b.matchReason}</p>
              </div>
              <div className="flex items-center gap-1">
                {b.trust_score && b.trust_score > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5">
                    <Star className="h-2.5 w-2.5 mr-0.5 fill-accent text-accent" />
                    {Number(b.trust_score).toFixed(1)}
                  </Badge>
                )}
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setProposeBlogger(b)}>
                  <Send className="h-3.5 w-3.5 text-primary" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!proposeBlogger} onOpenChange={v => { if (!v) { setProposeBlogger(null); setSelectedProduct(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Предложить сделку</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Блогер: <span className="font-medium text-foreground">{proposeBlogger?.name}</span>
            </p>
            <div>
              <Label>Выберите товар</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Товар..." /></SelectTrigger>
                <SelectContent>
                  {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" disabled={!selectedProduct || createDeal.isPending} onClick={() => createDeal.mutate()}>
              {createDeal.isPending ? 'Создание...' : 'Создать сделку'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AutoRecommendations;
