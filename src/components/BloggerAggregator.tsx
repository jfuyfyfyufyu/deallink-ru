import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Users, Star, MessageCircle, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

const NICHES = ['Бьюти', 'Еда', 'Фитнес', 'Мода', 'Технологии', 'Путешествия', 'Лайфстайл', 'Дом и уют', 'Дети', 'Авто'];
const FORMATS = ['Reels / Shorts', 'Stories', 'Полноценный обзор', 'Распаковка', 'Фотоотзыв'];

interface BloggerAggregatorProps {
  trigger?: React.ReactNode;
}

const BloggerAggregator = ({ trigger }: BloggerAggregatorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [niche, setNiche] = useState<string>('all');
  const [format, setFormat] = useState<string>('all');
  const [minSubs, setMinSubs] = useState<string>('');
  const [minRating, setMinRating] = useState<string>('');
  const [searchName, setSearchName] = useState('');
  const [proposeBlogger, setProposeBlogger] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('');

  const { data: bloggers, isLoading } = useQuery({
    queryKey: ['aggregator-bloggers', niche, format, minSubs, minRating, searchName],
    queryFn: async () => {
      let q = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'blogger')
        .order('trust_score', { ascending: false });
      if (niche && niche !== 'all') q = q.eq('niche', niche);
      if (format && format !== 'all') q = q.contains('content_formats', [format]);
      if (minSubs) q = q.gte('subscribers_count', Number(minSubs));
      if (minRating) q = q.gte('trust_score', Number(minRating));
      if (searchName) q = q.ilike('name', `%${searchName}%`);
      const { data } = await q;
      return data || [];
    },
    enabled: open,
  });

  const { data: myProducts } = useQuery({
    queryKey: ['my-active-products', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name').eq('seller_id', user!.id).eq('is_active', true);
      return data || [];
    },
    enabled: !!user && open,
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
      const productName = myProducts?.find(p => p.id === selectedProduct)?.name || 'товар';
      // Notify blogger via Telegram
      supabase.functions.invoke('telegram-notify', {
        body: {
          user_id: proposeBlogger.user_id,
          title: '📦 Новое предложение сотрудничества!',
          message: `Селлер предлагает вам сделку по товару «${productName}». Перейдите в раздел "Мои сделки" для просмотра.`,
        },
      }).catch(() => {});
      setProposeBlogger(null);
      setSelectedProduct('');
      queryClient.invalidateQueries({ queryKey: ['seller-deals'] });
    },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const resetFilters = () => {
    setNiche('all');
    setFormat('all');
    setMinSubs('');
    setMinRating('');
    setSearchName('');
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {trigger || (
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Подобрать блогера
            </Button>
          )}
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Подбор блогера
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Поиск по имени..." value={searchName} onChange={(e) => setSearchName(e.target.value)} className="pl-9" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Тематика</Label>
                <Select value={niche} onValueChange={setNiche}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Любая" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Любая</SelectItem>
                    {NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Формат обзора</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Любой" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Любой</SelectItem>
                    {FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Мин. подписчиков</Label>
                <Input type="number" placeholder="0" value={minSubs} onChange={(e) => setMinSubs(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Мин. рейтинг</Label>
                <Input type="number" placeholder="0" step="0.5" min="0" max="5" value={minRating} onChange={(e) => setMinRating(e.target.value)} className="mt-1" />
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">Сбросить фильтры</Button>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'Загрузка...' : `Найдено: ${bloggers?.length ?? 0}`}
              </p>

              {bloggers?.map((b) => (
                <Card key={b.id} className="glass-card">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={b.avatar_url || ''} />
                        <AvatarFallback>{(b.name || '?')[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{b.name || 'Без имени'}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          {(b as any).niche && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{(b as any).niche}</Badge>
                          )}
                          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-accent text-accent" />
                            {Number(b.trust_score || 0).toFixed(1)}
                          </span>
                          {(b as any).subscribers_count > 0 && (
                            <span className="text-xs text-muted-foreground">{(b as any).subscribers_count?.toLocaleString()} подп.</span>
                          )}
                        </div>
                        {(b as any).content_formats?.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {((b as any).content_formats as string[]).map((f) => (
                              <Badge key={f} variant="outline" className="text-[10px] px-1.5 py-0">{f}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => setProposeBlogger(b)}>
                          <Send className="h-3 w-3 mr-1" /> Сделка
                        </Button>
                        {b.telegram_id && (
                          <a href={`https://t.me/${b.telegram_id.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost" className="h-7 text-xs w-full">
                              <MessageCircle className="h-3 w-3 mr-1" /> TG
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {!isLoading && bloggers?.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-6">Блогеры не найдены. Попробуйте изменить фильтры.</p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Propose Deal Dialog */}
      <Dialog open={!!proposeBlogger} onOpenChange={(v) => { if (!v) { setProposeBlogger(null); setSelectedProduct(''); } }}>
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
                  {myProducts?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
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

export default BloggerAggregator;
