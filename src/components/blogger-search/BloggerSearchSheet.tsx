import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBloggerSearch } from './use-blogger-stats';
import PredictionDashboard from './PredictionDashboard';
import SmartMatchingForm from './SmartMatchingForm';
import BloggerCard from './BloggerCard';
import QuickFilters from './QuickFilters';
import BatchPanel from './BatchPanel';
import { scoreAndRankBloggers, type ScoredBlogger } from './recommendation-engine';
import type { SearchStep, MatchingParams, QuickFilter, EnrichedBlogger } from './types';

interface Props {
  trigger?: React.ReactNode;
}

const BloggerSearchSheet = ({ trigger }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<SearchStep>('prediction');
  const [matchParams, setMatchParams] = useState<MatchingParams | null>(null);
  const [quickFilter, setQuickFilter] = useState<QuickFilter | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [proposeBlogger, setProposeBlogger] = useState<ScoredBlogger | EnrichedBlogger | null>(null);
  const [selectedProduct, setSelectedProduct] = useState('');

  const { data: bloggers = [], isLoading } = useBloggerSearch(open);

  const { data: myProducts } = useQuery({
    queryKey: ['my-active-products', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name').eq('seller_id', user!.id).eq('is_active', true);
      return data || [];
    },
    enabled: !!user && open,
  });

  // Score & rank bloggers using recommendation engine
  const scoredBloggers = useMemo((): ScoredBlogger[] => {
    if (!matchParams) return [];

    return scoreAndRankBloggers(bloggers, {
      category: matchParams.category,
      productPrice: Number(matchParams.price) || 0,
      targetGender: matchParams.targetGender,
      targetAgeRange: matchParams.targetAgeRange,
      targetGeo: matchParams.targetGeo,
      platforms: matchParams.platforms,
      minReach: Number(matchParams.minReach) || 0,
      reachMode: matchParams.reachMode,
      cooperationType: matchParams.priceType,
      speed: matchParams.speed,
      familyRelevant: matchParams.familyRelevant,
      weights: matchParams.weights,
    });
  }, [bloggers, matchParams]);

  // Apply quick filter on top of scored results
  const filteredBloggers = useMemo(() => {
    let list = [...scoredBloggers];

    // Min risk score hard filter
    if (matchParams?.minRiskScore && matchParams.minRiskScore > 0) {
      list = list.filter(b => b.stats.riskScore >= matchParams.minRiskScore);
    }

    // Quick filter re-sort
    if (quickFilter === 'reviews') list.sort((a, b) => b.stats.reviewRate - a.stats.reviewRate);
    if (quickFilter === 'fast') list.sort((a, b) => a.stats.avgDaysToReview - b.stats.avgDaysToReview);
    if (quickFilter === 'ugc') list.sort((a, b) => b.stats.ugcRate - a.stats.ugcRate);
    if (quickFilter === 'reliable') list.sort((a, b) => b.stats.completionRate - a.stats.completionRate);

    return list;
  }, [scoredBloggers, quickFilter, matchParams?.minRiskScore]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const autoSelect = (count: number) => {
    const safe = filteredBloggers.filter(b => b.tier !== 'weak');
    setSelectedIds(safe.slice(0, count).map(b => b.user_id));
  };

  const massLaunch = useMutation({
    mutationFn: async () => {
      if (!selectedProduct || selectedIds.length === 0) return;
      const inserts = selectedIds.map(blogger_id => ({
        product_id: selectedProduct,
        blogger_id,
        seller_id: user!.id,
        status: 'requested',
        initiated_by: 'seller',
      }));
      const { error } = await supabase.from('deals').insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: `Создано ${selectedIds.length} сделок!` });
      setSelectedIds([]);
      setProposeBlogger(null);
      setSelectedProduct('');
      queryClient.invalidateQueries({ queryKey: ['seller-deals'] });
    },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
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
      queryClient.invalidateQueries({ queryKey: ['seller-deals'] });
    },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const handleMatchSubmit = (params: MatchingParams) => {
    setMatchParams(params);
    setStep('results');
  };

  const resetFlow = () => {
    setStep('prediction');
    setMatchParams(null);
    setQuickFilter(null);
    setSelectedIds([]);
  };

  // Count tiers
  const tierCounts = useMemo(() => {
    const r = filteredBloggers.filter(b => b.tier === 'recommended').length;
    const s = filteredBloggers.filter(b => b.tier === 'suitable').length;
    const w = filteredBloggers.filter(b => b.tier === 'weak').length;
    return { recommended: r, suitable: s, weak: w };
  }, [filteredBloggers]);

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetFlow(); }}>
        <SheetTrigger asChild>
          {trigger || (
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Найти блогера
            </Button>
          )}
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-4">
          <SheetHeader className="pb-2">
            <SheetTitle className="flex items-center gap-2">
              {step !== 'prediction' && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStep(step === 'results' ? 'matching' : 'prediction')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <Search className="h-5 w-5" />
              {step === 'prediction' && 'Найти блогера'}
              {step === 'matching' && 'Параметры подбора'}
              {step === 'results' && `Блогеры (${filteredBloggers.length})`}
            </SheetTitle>
          </SheetHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Загрузка данных...</p>
            </div>
          ) : (
            <>
              {step === 'prediction' && (
                <PredictionDashboard bloggers={bloggers} onNext={() => setStep('matching')} />
              )}

              {step === 'matching' && (
                <SmartMatchingForm onSubmit={handleMatchSubmit} />
              )}

              {step === 'results' && (
                <div className="space-y-3 mt-2">
                  {/* Tier summary */}
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 rounded-full bg-green-500/15 text-green-700">
                      ✓ {tierCounts.recommended} рекомендуем
                    </span>
                    <span className="px-2 py-1 rounded-full bg-yellow-500/15 text-yellow-700">
                      ~ {tierCounts.suitable} подходят
                    </span>
                    {tierCounts.weak > 0 && (
                      <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        {tierCounts.weak} слабые
                      </span>
                    )}
                  </div>

                  <QuickFilters active={quickFilter} onChange={setQuickFilter} />

                  {selectedIds.length > 0 && (
                    <div>
                      <Label className="text-xs">Товар для офферов</Label>
                      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Выберите товар..." /></SelectTrigger>
                        <SelectContent>
                          {myProducts?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <BatchPanel
                    bloggers={filteredBloggers}
                    selected={selectedIds}
                    onAutoSelect={autoSelect}
                    onLaunch={() => massLaunch.mutate()}
                    launching={massLaunch.isPending}
                  />

                  <div className="space-y-2">
                    {filteredBloggers.map(b => (
                      <BloggerCard
                        key={b.id}
                        blogger={b}
                        selected={selectedIds.includes(b.user_id)}
                        onToggle={toggleSelect}
                        onPropose={setProposeBlogger}
                      />
                    ))}
                    {filteredBloggers.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-6">Блогеры не найдены</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!proposeBlogger} onOpenChange={(v) => { if (!v) { setProposeBlogger(null); setSelectedProduct(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Предложить сделку</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Блогер: <span className="font-medium text-foreground">{proposeBlogger?.name}</span>
              {'score' in (proposeBlogger || {}) && (
                <span className="ml-2 text-xs text-primary font-bold">
                  {(proposeBlogger as ScoredBlogger).score}/100
                </span>
              )}
            </p>
            <div>
              <Label>Выберите товар</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Товар..." /></SelectTrigger>
                <SelectContent>
                  {myProducts?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
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

export default BloggerSearchSheet;
