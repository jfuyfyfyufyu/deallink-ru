import DashboardLayout from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDealsRealtime } from '@/hooks/use-deals-realtime';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Star, Search, Archive } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import DealCard from '@/components/deals/DealCard';
import DealChat from '@/components/deals/DealChat';
import DealContentReviewDialog from '@/components/deals/DealContentReviewDialog';
import DealTimeline from '@/components/deals/DealTimeline';
import { HUMAN_STATUS } from '@/components/deals/deal-utils';

const SellerDeals = () => {
  const { user } = useAuth();
  useDealsRealtime();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showArchive, setShowArchive] = useState(false);
  const [chatDeal, setChatDeal] = useState<any>(null);
  const [bloggerDetailDeal, setBloggerDetailDeal] = useState<any>(null);
  const [reviewDeal, setReviewDeal] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [detailDeal, setDetailDeal] = useState<any>(null);
  const [reviewDialogDeal, setReviewDialogDeal] = useState<any>(null);

  const { data: deals } = useQuery({
    queryKey: ['seller-deals', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('deals')
        .select('*, products(name, marketplace_url, requirements, description)')
        .eq('seller_id', user!.id)
        .order('updated_at', { ascending: false });
      if (!data || data.length === 0) return [];
      // Fetch blogger profiles separately
      const bloggerIds = [...new Set(data.map((d: any) => d.blogger_id))];
      const { data: bloggers } = await supabase
        .from('profiles')
        .select('user_id, name, telegram_id, niche, subscribers_count, trust_score, avatar_url')
        .in('user_id', bloggerIds);
      const bloggerMap = new Map((bloggers || []).map((b: any) => [b.user_id, b]));
      // Load counter-proposals for counter_proposed deals
      const counterIds = data.filter((d: any) => d.status === 'counter_proposed').map((d: any) => d.id);
      let counterMap: Record<string, any[]> = {};
      if (counterIds.length > 0) {
        const { data: msgs } = await supabase.from('deal_messages')
          .select('*').in('deal_id', counterIds).eq('message_type', 'counter_proposal')
          .order('created_at', { ascending: false });
        (msgs || []).forEach((m: any) => {
          if (!counterMap[m.deal_id]) counterMap[m.deal_id] = [];
          counterMap[m.deal_id].push(m);
        });
      }
      return data.map((d: any) => ({ ...d, blogger: bloggerMap.get(d.blogger_id) || null, _counterProposals: counterMap[d.id] || [] }));
    },
    enabled: !!user,
  });

  const { data: archivedIds } = useQuery({
    queryKey: ['seller-deal-archives', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('deal_archives').select('deal_id').eq('user_id', user!.id);
      return new Set((data || []).map((r: any) => r.deal_id));
    },
    enabled: !!user,
  });

  const archiveDeal = useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await supabase.from('deal_archives').insert({ deal_id: dealId, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['seller-deal-archives'] }); toast({ title: 'Сделка в архиве' }); },
  });

  const unarchiveDeal = useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await supabase.from('deal_archives').delete().eq('deal_id', dealId).eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['seller-deal-archives'] }); toast({ title: 'Сделка восстановлена' }); },
  });

  const { data: existingReviews } = useQuery({
    queryKey: ['seller-existing-reviews', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('reviews').select('deal_id').eq('reviewer_id', user!.id);
      return new Set((data || []).map((r: any) => r.deal_id));
    },
    enabled: !!user,
  });

  const { data: bloggerQuestionnaire } = useQuery({
    queryKey: ['blogger-questionnaire-detail', bloggerDetailDeal?.blogger?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from('blogger_questionnaires')
        .select('*').eq('user_id', bloggerDetailDeal.blogger.user_id).eq('completed', true).maybeSingle();
      return data;
    },
    enabled: !!bloggerDetailDeal?.blogger?.user_id,
  });

  const filteredDeals = useMemo(() => {
    if (!deals) return [];
    return deals.filter((d: any) => {
      if (d.status === 'requested' && d.initiated_by === 'blogger') return false;
      const isArchived = archivedIds?.has(d.id);
      if (showArchive) return !!isArchived;
      if (isArchived) return false;
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (d.products?.name || '').toLowerCase().includes(q) ||
          (d.blogger?.name || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [deals, statusFilter, search, archivedIds, showArchive]);

  const advanceDeal = useMutation({
    mutationFn: async ({ id, status, updates }: { id: string; status: string; updates?: Record<string, any> }) => {
      const { error } = await supabase.from('deals').update({ status, ...updates }).eq('id', id);
      if (error) throw error;
      return { id, status };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['seller-deals'] });
      toast({ title: 'Статус обновлён!' });
      // Notify blogger about status change
      const deal = deals?.find((d: any) => d.id === vars.id);
      if (deal) {
        const statusLabels: Record<string, string> = {
          approved: '✅ Сделка одобрена',
          cancelled: '❌ Сделка отменена',
          finished: '🎉 Сделка завершена',
        };
        const title = statusLabels[vars.status] || `Статус обновлён: ${vars.status}`;
        supabase.functions.invoke('telegram-notify', {
          body: {
            user_id: deal.blogger_id,
            title,
            message: `Товар: «${deal.products?.name || ''}»`,
            inline_keyboard: [[{ text: '📋 Открыть сделки', url: `${window.location.origin}/blogger/deals` }]],
          },
        }).catch(() => {});
      }
    },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const generateUtm = useMutation({
    mutationFn: async (deal: any) => {
      const baseUrl = deal.products?.marketplace_url || 'https://example.com';
      const sep = baseUrl.includes('?') ? '&' : '?';
      const utm = `${baseUrl}${sep}utm_source=barter&utm_medium=blogger&utm_campaign=deal_${deal.id.slice(0, 8)}`;
      const { error } = await supabase.from('deals').update({ utm_url: utm }).eq('id', deal.id);
      if (error) throw error;
      return utm;
    },
    onSuccess: (utm) => {
      qc.invalidateQueries({ queryKey: ['seller-deals'] });
      navigator.clipboard.writeText(utm);
      toast({ title: 'UTM создана и скопирована!' });
    },
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('reviews').upsert({
        deal_id: reviewDeal.id, reviewer_id: user!.id,
        target_id: reviewDeal.blogger?.user_id, rating, comment: comment || null,
      }, { onConflict: 'deal_id,reviewer_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-existing-reviews'] });
      setReviewDeal(null); setComment(''); setRating(5);
      toast({ title: 'Отзыв оставлен!' });
    },
  });

  const handleWorkAgain = async (deal: any) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('deals').insert({
        product_id: deal.product_id, blogger_id: deal.blogger?.user_id, seller_id: user.id, status: 'requested', initiated_by: 'seller',
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['seller-deals'] });
      toast({ title: 'Новая сделка создана!' });
      // Notify blogger
      supabase.functions.invoke('telegram-notify', {
        body: {
          user_id: deal.blogger?.user_id,
          title: '📦 Новое предложение сотрудничества!',
          message: `Селлер предлагает вам новую сделку по товару «${deal.products?.name || ''}». Перейдите в раздел "Мои сделки" для просмотра.`,
          inline_keyboard: [[{ text: '📋 Открыть сделки', url: `${window.location.origin}/blogger/deals` }]],
        },
      }).catch(() => {});
    } catch (e: any) {
      toast({ title: 'Ошибка', description: e.message, variant: 'destructive' });
    }
  };

  const handleAction = (deal: any, action: string) => {
    switch (action) {
      case 'approve': advanceDeal.mutate({ id: deal.id, status: 'approved' }); break;
      case 'reject': advanceDeal.mutate({ id: deal.id, status: 'cancelled' }); break;
      case 'cancel':
        if (confirm('Вы уверены, что хотите отменить сделку?')) {
          advanceDeal.mutate({ id: deal.id, status: 'cancelled' });
        }
        break;
      case 'finish': advanceDeal.mutate({ id: deal.id, status: 'finished' }); break;
      case 'review_content':
      case 'review_review':
        setReviewDialogDeal(deal); break;
      case 'pay': setDetailDeal(deal); break;
      case 'generate_utm': generateUtm.mutate(deal); break;
      case 'view_blogger': setBloggerDetailDeal(deal); break;
      case 'view_counter': setDetailDeal(deal); break;
      case 'leave_review': setReviewDeal(deal); setRating(5); setComment(''); break;
      case 'work_again': handleWorkAgain(deal); break;
      case 'archive': archiveDeal.mutate(deal.id); break;
      case 'unarchive': unarchiveDeal.mutate(deal.id); break;
    }
  };

  return (
    <DashboardLayout title="Сделки">
      <div className="space-y-4 animate-fade-in">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Статус" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              {Object.entries(HUMAN_STATUS).filter(([k]) => k !== 'in_pvz').map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant={showArchive ? 'default' : 'outline'} size="sm" onClick={() => setShowArchive(!showArchive)} className="whitespace-nowrap">
            <Archive className="h-4 w-4 mr-1" /> {showArchive ? 'Активные' : 'Архив'}
          </Button>
        </div>

        {/* Deal cards */}
        <div className="space-y-3">
          {filteredDeals.map((deal: any) => (
            <DealCard
              key={deal.id}
              deal={deal}
              isSeller={true}
              userId={user!.id}
              onAction={handleAction}
              onOpenDetail={(d) => setDetailDeal(d)}
              onChat={setChatDeal}
              existingReview={existingReviews?.has(deal.id)}
              isArchived={archivedIds?.has(deal.id)}
            />
          ))}
          {filteredDeals.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              {search || statusFilter !== 'all' ? 'Ничего не найдено' : 'Нет сделок'}
            </p>
          )}
        </div>
      </div>

      {/* Detail dialog with content/review approval */}
      <Dialog open={!!detailDeal} onOpenChange={v => { if (!v) setDetailDeal(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailDeal?.products?.name}</DialogTitle>
          </DialogHeader>
          {detailDeal && (
            <div className="space-y-4">
              {/* Pending approval indicator */}
              {(detailDeal.content_status === 'submitted' || detailDeal.review_status === 'submitted') && (
                <Button
                  variant="outline"
                  className="w-full border-amber-500/50 text-amber-600 dark:text-amber-400"
                  onClick={() => { setReviewDialogDeal(detailDeal); }}
                >
                  {detailDeal.content_status === 'submitted' && detailDeal.review_status === 'submitted'
                    ? 'Контент и отзыв ждут согласования'
                    : detailDeal.content_status === 'submitted'
                    ? 'Контент ждёт согласования'
                    : 'Отзыв ждёт согласования'}
                </Button>
              )}

              {/* Counter-proposals from blogger */}
              {detailDeal._counterProposals?.length > 0 && (
                <div className="bg-amber-500/10 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium">Правки от блогера</p>
                  {detailDeal._counterProposals.map((cp: any) => (
                    <div key={cp.id} className="text-sm bg-muted rounded p-2 whitespace-pre-wrap">{cp.message}</div>
                  ))}
                  <Button size="sm" className="w-full" onClick={async () => {
                    const lastCp = detailDeal._counterProposals[detailDeal._counterProposals.length - 1];
                    const msg = lastCp?.message || '';
                    const deadlineMatch = msg.match(/дедлайн:\s*(\d{2})\.(\d{2})\.(\d{4})/i);
                    const updates: Record<string, any> = {};
                    if (deadlineMatch) {
                      updates.deadline_final = new Date(`${deadlineMatch[3]}-${deadlineMatch[2]}-${deadlineMatch[1]}`).toISOString();
                    }
                    const tzMatch = msg.match(/Контрпредложение:\n([\s\S]*?)(?:\n\nПредложенный дедлайн|$)/);
                    if (tzMatch?.[1]?.trim()) {
                      await supabase.from('products').update({ requirements: tzMatch[1].trim() }).eq('id', detailDeal.product_id).then(null, () => {});
                    }
                    advanceDeal.mutate({ id: detailDeal.id, status: ['requested', 'counter_proposed'].includes(detailDeal.status) ? 'approved' : detailDeal.status, updates });
                    await supabase.from('deal_messages').insert({
                      deal_id: detailDeal.id, sender_id: user!.id,
                      message: 'Селлер принял правки блогера', message_type: 'system',
                    });
                    supabase.functions.invoke('telegram-notify', {
                      body: { user_id: detailDeal.blogger_id, title: 'Правки приняты', message: `Селлер принял ваши правки по товару «${detailDeal.products?.name || ''}»`,
                        inline_keyboard: [[{ text: '📋 Открыть сделки', url: `${window.location.origin}/blogger/deals` }]] },
                    }).catch(() => {});
                    toast({ title: 'Правки приняты!' });
                    setDetailDeal(null);
                  }} disabled={advanceDeal.isPending}>
                    Принять правки
                  </Button>
                </div>
              )}

              {/* Product requirements (ТЗ) */}
              {detailDeal.products?.requirements && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <p className="text-sm font-medium">Техническое задание</p>
                  <p className="text-sm whitespace-pre-wrap">{detailDeal.products.requirements}</p>
                </div>
              )}

              {/* Info */}
              <div className="text-sm space-y-2">
                <p><span className="text-muted-foreground">Блогер:</span> {detailDeal.blogger?.name}</p>
                {detailDeal.blogger?.telegram_id && (
                  <a href={`https://t.me/${String(detailDeal.blogger.telegram_id).replace('@', '')}`} target="_blank" className="text-primary text-xs hover:underline">@{detailDeal.blogger.telegram_id}</a>
                )}
              {['review_posted', 'finished'].includes(detailDeal.status) && (() => {
                const links = detailDeal.social_links as Record<string, string> | null;
                const hasLinks = links && Object.values(links).some(v => v);
                return hasLinks ? (
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-sm">Публикации:</span>
                    {Object.entries(links!).filter(([, v]) => v).map(([platform, url]) => (
                      <a key={platform} href={url} target="_blank" className="flex items-center gap-2 text-sm text-primary hover:underline break-all">
                        <span className="capitalize font-medium">{platform}</span> — {url}
                      </a>
                    ))}
                  </div>
                ) : detailDeal.utm_url ? (
                  <p>
                    <span className="text-muted-foreground">Публикация:</span>{' '}
                    <a href={detailDeal.utm_url} target="_blank" className="text-primary hover:underline break-all">{detailDeal.utm_url}</a>
                  </p>
                ) : null;
              })()}
              {detailDeal.order_number && <p><span className="text-muted-foreground">Заказ:</span> {detailDeal.order_number}</p>}
                {detailDeal.order_screenshot_url && (
                  <div>
                    <span className="text-muted-foreground">Скриншот заказа:</span>
                    <img src={detailDeal.order_screenshot_url} alt="" className="mt-1 rounded max-h-24 object-cover cursor-pointer" onClick={() => window.open(detailDeal.order_screenshot_url, '_blank')} />
                  </div>
                )}
                {detailDeal.pickup_proof_url && (
                  <div>
                    <span className="text-muted-foreground">Фото получения:</span>
                    <img src={detailDeal.pickup_proof_url} alt="" className="mt-1 rounded max-h-24 object-cover cursor-pointer" onClick={() => window.open(detailDeal.pickup_proof_url, '_blank')} />
                  </div>
                )}
              </div>

              {/* Timeline */}
              {detailDeal.status_history && (detailDeal.status_history as any[]).length > 0 && (
                <DealTimeline
                  statusHistory={detailDeal.status_history as any[]}
                  deadlinePickup={detailDeal.deadline_pickup}
                  deadlineContent={detailDeal.deadline_content}
                  deadlineReview={detailDeal.deadline_review}
                  currentStatus={detailDeal.status}
                />
              )}

              {/* Chat inline */}
              <div className="border rounded-lg overflow-hidden">
                <DealChat dealId={detailDeal.id} currentUserId={user!.id} bloggerId={detailDeal.blogger_id} sellerId={detailDeal.seller_id} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat dialog */}
      <Dialog open={!!chatDeal} onOpenChange={v => { if (!v) setChatDeal(null); }}>
        <DialogContent className="max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-0"><DialogTitle>Чат — {chatDeal?.products?.name}</DialogTitle></DialogHeader>
          {chatDeal && user && <DealChat dealId={chatDeal.id} currentUserId={user.id} bloggerId={chatDeal.blogger_id} sellerId={chatDeal.seller_id} />}
        </DialogContent>
      </Dialog>

      {/* Blogger detail */}
      <Dialog open={!!bloggerDetailDeal} onOpenChange={v => { if (!v) setBloggerDetailDeal(null); }}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{bloggerDetailDeal?.blogger?.name || 'Блогер'}</DialogTitle></DialogHeader>
          {bloggerDetailDeal?.blogger && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {bloggerDetailDeal.blogger.avatar_url && <img src={bloggerDetailDeal.blogger.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />}
                <div>
                  <p className="font-medium">{bloggerDetailDeal.blogger.name}</p>
                  <p className="text-sm text-muted-foreground">{bloggerDetailDeal.blogger.niche || 'Без ниши'}</p>
                  <p className="text-xs text-muted-foreground">{bloggerDetailDeal.blogger.subscribers_count || 0} подписчиков • {bloggerDetailDeal.blogger.trust_score || 0}</p>
                </div>
              </div>
              {bloggerQuestionnaire && (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    {bloggerQuestionnaire.city && <div className="bg-muted/50 rounded-lg p-2"><span className="text-muted-foreground text-xs">Город</span><p className="font-medium">{bloggerQuestionnaire.city}</p></div>}
                    {bloggerQuestionnaire.age && <div className="bg-muted/50 rounded-lg p-2"><span className="text-muted-foreground text-xs">Возраст</span><p className="font-medium">{bloggerQuestionnaire.age} лет</p></div>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted/50 rounded-lg p-2"><span className="text-muted-foreground">Shorts</span><p className="font-medium">{bloggerQuestionnaire.avg_shorts_views || 0}</p></div>
                    <div className="bg-muted/50 rounded-lg p-2"><span className="text-muted-foreground">Reels</span><p className="font-medium">{bloggerQuestionnaire.avg_reels_views || 0}</p></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review dialog */}
      <Dialog open={!!reviewDeal} onOpenChange={v => { if (!v) setReviewDeal(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Отзыв о блогере</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Оценка</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <button key={i} type="button" onClick={() => setRating(i)}>
                    <Star className={`h-6 w-6 transition-colors ${i <= rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Комментарий</Label>
              <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Как прошло сотрудничество..." />
            </div>
            <Button className="w-full" onClick={() => submitReview.mutate()} disabled={submitReview.isPending}>
              {submitReview.isPending ? 'Отправка...' : 'Отправить отзыв'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Content/Review approval dialog */}
      <DealContentReviewDialog
        deal={reviewDialogDeal}
        userId={user!.id}
        open={!!reviewDialogDeal}
        onClose={() => setReviewDialogDeal(null)}
      />
    </DashboardLayout>
  );
};

export default SellerDeals;
