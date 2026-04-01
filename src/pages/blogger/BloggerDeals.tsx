import DashboardLayout from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDealsRealtime } from '@/hooks/use-deals-realtime';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Star, Upload, ExternalLink, CalendarIcon, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState, useRef, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import DealCard from '@/components/deals/DealCard';
import DealChat from '@/components/deals/DealChat';
import { getPaymentStatus } from '@/components/deals/deal-utils';

const BloggerDeals = () => {
  const { user } = useAuth();
  useDealsRealtime();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [chatDeal, setChatDeal] = useState<any>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeDeal, setActiveDeal] = useState<any>(null);
  const [dialogType, setDialogType] = useState<string>('');
  const [orderNumber, setOrderNumber] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [pickupProofUrl, setPickupProofUrl] = useState<string | null>(null);
  const [reviewScreenshotUrl, setReviewScreenshotUrl] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({ youtube: '', instagram: '', tiktok: '', telegram: '' });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pickupFileRef = useRef<HTMLInputElement>(null);
  const reviewFileRef = useRef<HTMLInputElement>(null);
  const contentFileRef = useRef<HTMLInputElement>(null);
  const [reviewDeal, setReviewDeal] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [detailDeal, setDetailDeal] = useState<any>(null);
  const [counterMode, setCounterMode] = useState(false);
  const [counterText, setCounterText] = useState('');
  const [counterDeadline, setCounterDeadline] = useState<Date | undefined>(undefined);

  const { data: deals } = useQuery({
    queryKey: ['blogger-deals', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('deals')
        .select('*, products(name, marketplace_url, description, image_url, requirements, deadline_days)')
        .eq('blogger_id', user!.id)
        .order('updated_at', { ascending: false });
      if (!data || data.length === 0) return [];
      // Fetch seller profiles separately
      const sellerIds = [...new Set(data.map((d: any) => d.seller_id))];
      const { data: sellers } = await supabase
        .from('profiles')
        .select('user_id, name, telegram_id')
        .in('user_id', sellerIds);
      const sellerMap = new Map((sellers || []).map((s: any) => [s.user_id, s]));
      return data.map((d: any) => ({ ...d, seller: sellerMap.get(d.seller_id) || null }));
    },
    enabled: !!user,
  });

  const { data: archivedIds } = useQuery({
    queryKey: ['blogger-deal-archives', user?.id],
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blogger-deal-archives'] }); toast({ title: 'Сделка в архиве' }); },
  });

  const unarchiveDeal = useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await supabase.from('deal_archives').delete().eq('deal_id', dealId).eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blogger-deal-archives'] }); toast({ title: 'Сделка восстановлена' }); },
  });

  const { data: existingReviews } = useQuery({
    queryKey: ['blogger-existing-reviews', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('reviews').select('deal_id').eq('reviewer_id', user!.id);
      return new Set((data || []).map((r: any) => r.deal_id));
    },
    enabled: !!user,
  });

  const updateDeal = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from('deals').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blogger-deals'] });
      setActiveDeal(null);
      toast({ title: 'Обновлено!' });
    },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const notifyTg = (targetUserId: string, title: string, message: string, inline_keyboard?: any[]) => {
    supabase.functions.invoke('telegram-notify', {
      body: { user_id: targetUserId, title, message, inline_keyboard },
    }).catch(() => {});
  };

  const submitContent = useMutation({
    mutationFn: async ({ dealId, url, sellerId, pName }: { dealId: string; url: string; sellerId: string; pName: string }) => {
      const { error } = await supabase.from('deals').update({ content_url: url, content_status: 'submitted' }).eq('id', dealId);
      if (error) throw error;
      await supabase.from('deal_messages').insert({
        deal_id: dealId, sender_id: user!.id,
        message: `Контент на согласование: ${url}`, message_type: 'content_submission',
      });
      // Notify seller with inline buttons
      const bloggerName = user?.user_metadata?.name || 'Блогер';
      notifyTg(sellerId, '🎬 Контент на согласование',
        `Блогер ${bloggerName} отправил контент по товару «${pName}». Ждёт вашего согласования.`,
        [[
          { text: '✅ Согласовать', url: `${window.location.origin}/seller/deals` },
          { text: '✏️ Правки', url: `${window.location.origin}/seller/deals` },
        ]]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blogger-deals'] });
      setActiveDeal(null);
      toast({ title: 'Контент отправлен!' });
    },
  });

  const submitReviewForApproval = useMutation({
    mutationFn: async ({ dealId, text, mediaUrls, sellerId, pName }: { dealId: string; text: string; mediaUrls: string[]; sellerId: string; pName: string }) => {
      const { error } = await supabase.from('deals').update({
        review_text: text, review_media_urls: mediaUrls, review_status: 'submitted',
      }).eq('id', dealId);
      if (error) throw error;
      await supabase.from('deal_messages').insert({
        deal_id: dealId, sender_id: user!.id,
        message: `Отзыв на согласование:\n${text}`, message_type: 'review_submission',
      });
      const bloggerName = user?.user_metadata?.name || 'Блогер';
      notifyTg(sellerId, '📝 Отзыв на согласование',
        `Блогер ${bloggerName} отправил отзыв по товару «${pName}». Ждёт вашего согласования.`,
        [[
          { text: '✅ Согласовать', url: `${window.location.origin}/seller/deals` },
          { text: '✏️ Правки', url: `${window.location.origin}/seller/deals` },
        ]]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blogger-deals'] });
      setActiveDeal(null);
      toast({ title: 'Отзыв отправлен!' });
    },
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('reviews').insert({
        deal_id: reviewDeal.id, reviewer_id: user!.id,
        target_id: reviewDeal.seller?.user_id, rating, comment: reviewComment || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blogger-existing-reviews'] });
      setReviewDeal(null);
      toast({ title: 'Отзыв оставлен!' });
    },
  });

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${user!.id}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('proofs').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('proofs').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFileUpload = async (file: File, setter: (url: string) => void, folder: string) => {
    setUploading(true);
    try { setter(await uploadFile(file, folder)); }
    catch (e: any) { toast({ title: 'Ошибка загрузки', description: e.message, variant: 'destructive' }); }
    finally { setUploading(false); }
  };

  const resetForm = () => {
    setOrderNumber(''); setContentUrl(''); setReviewText('');
    setScreenshotUrl(null); setPickupProofUrl(null); setReviewScreenshotUrl(null);
    setSocialLinks({ youtube: '', instagram: '', tiktok: '', telegram: '' });
  };

  const openActionDialog = (deal: any, type: string) => {
    resetForm();
    setDialogType(type);
    setActiveDeal(deal);
  };

  const handleAction = (deal: any, action: string) => {
    switch (action) {
      case 'review_offer':
      case 'accept_reject': setDetailDeal(deal); setCounterMode(false); setCounterText(''); setCounterDeadline(undefined); break;
      case 'order': openActionDialog(deal, 'order'); break;
      case 'in_pvz': updateDeal.mutate({ id: deal.id, updates: { status: 'in_pvz' } }); break;
      case 'pickup': openActionDialog(deal, 'pickup'); break;
      case 'start_filming': updateDeal.mutate({ id: deal.id, updates: { status: 'filming' } }); break;
      case 'submit_content': openActionDialog(deal, 'content'); break;
      case 'submit_review': openActionDialog(deal, 'review'); break;
      case 'publish': openActionDialog(deal, 'publish'); break;
      case 'send_details': break; // handled by DealPaymentFlow
      case 'confirm_payment': break; // handled by DealPaymentFlow
      case 'leave_review': setReviewDeal(deal); setRating(5); setReviewComment(''); break;
      case 'cancel':
        if (confirm('Вы уверены, что хотите отменить сделку?')) {
          updateDeal.mutate({ id: deal.id, updates: { status: 'cancelled' } });
          const bloggerName = user?.user_metadata?.name || 'Блогер';
          notifyTg(deal.seller_id, '❌ Сделка отменена блогером', `Блогер ${bloggerName} отменил сделку по товару «${deal.products?.name || 'товар'}»`);
        }
        break;
      case 'archive': archiveDeal.mutate(deal.id); break;
      case 'unarchive': unarchiveDeal.mutate(deal.id); break;
    }
  };

  const canReviewOffer = detailDeal && detailDeal.initiated_by !== 'blogger' && (
    detailDeal.status === 'requested' ||
    (detailDeal.status === 'approved' && getPaymentStatus(detailDeal) === 'none')
  ) && detailDeal.status !== 'counter_proposed';

  const filteredDeals = useMemo(() => {
    return (deals || []).filter((d: any) => {
      const isArchived = archivedIds?.has(d.id);
      if (showArchive) return !!isArchived;
      if (isArchived) return false;
      if (statusFilter === 'all') return true;
      if (statusFilter === 'active') return !['finished', 'cancelled', 'requested', 'counter_proposed'].includes(d.status);
      if (statusFilter === 'requested') return ['requested', 'counter_proposed'].includes(d.status);
      return d.status === statusFilter;
    });
  }, [deals, archivedIds, showArchive, statusFilter]);

  return (
    <DashboardLayout title="Мои сделки">
      <div className="space-y-3 animate-fade-in">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="active">В работе</SelectItem>
              <SelectItem value="requested">Новые заявки</SelectItem>
              <SelectItem value="approved">Ждём оплату</SelectItem>
              <SelectItem value="ordered">Заказано</SelectItem>
              <SelectItem value="filming">Съёмка</SelectItem>
              <SelectItem value="finished">Завершённые</SelectItem>
              <SelectItem value="cancelled">Отменённые</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto">
            <Button variant={showArchive ? 'default' : 'outline'} size="sm" onClick={() => setShowArchive(!showArchive)}>
              <Archive className="h-4 w-4 mr-1" /> {showArchive ? 'Активные' : 'Архив'}
            </Button>
          </div>
        </div>
        {filteredDeals.map((deal: any) => (
          <DealCard
            key={deal.id}
            deal={deal}
            isSeller={false}
            userId={user!.id}
            onAction={handleAction}
            onOpenDetail={(d) => {
              const canReview = d.initiated_by !== 'blogger' && (d.status === 'requested' || (d.status === 'approved' && getPaymentStatus(d) === 'none'));
              if (canReview) {
                setDetailDeal(d);
                setCounterMode(false);
                setCounterText('');
                setCounterDeadline(undefined);
              } else {
                setChatDeal(d);
              }
            }}
            onChat={setChatDeal}
            existingReview={existingReviews?.has(deal.id)}
            isArchived={archivedIds?.has(deal.id)}
          />
        ))}
        {filteredDeals.length === 0 && <p className="text-muted-foreground text-center py-8">{showArchive ? 'Архив пуст' : 'У вас пока нет сделок'}</p>}
      </div>

      {/* Detail dialog — review offer (no chat here) */}
      <Dialog open={!!detailDeal} onOpenChange={v => { if (!v) { setDetailDeal(null); setCounterMode(false); } }}>
        <DialogContent className="max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2"><DialogTitle>{detailDeal?.products?.name}</DialogTitle></DialogHeader>
          {detailDeal && (
            <>
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-2">
                {/* Block 1: Technical Assignment */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">Техническое задание</h3>
                  {counterMode ? (
                    <Textarea
                      value={counterText}
                      onChange={e => setCounterText(e.target.value)}
                      placeholder="Отредактируйте ТЗ или опишите правки..."
                      rows={4}
                    />
                  ) : detailDeal.products?.requirements ? (
                    <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-md p-3">{detailDeal.products.requirements}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Селлер не указал ТЗ</p>
                  )}
                  {detailDeal.products?.marketplace_url && (
                    <a href={detailDeal.products.marketplace_url} target="_blank" className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <ExternalLink className="h-4 w-4" /> Открыть товар на маркетплейсе
                    </a>
                  )}
                  {!counterMode && detailDeal.products?.description && (
                    <p className="text-xs text-muted-foreground">{detailDeal.products.description}</p>
                  )}
                </div>

                {/* Block 2: Execution Deadline */}
                <div className="border rounded-lg p-4 space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">Срок выполнения</h3>
                  {counterMode ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !counterDeadline && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {counterDeadline ? format(counterDeadline, 'dd.MM.yyyy') : detailDeal.deadline_final ? format(new Date(detailDeal.deadline_final), 'dd.MM.yyyy') : 'Выберите дату'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={counterDeadline} onSelect={setCounterDeadline} disabled={(date) => date < new Date()} initialFocus className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  ) : detailDeal.deadline_final ? (() => {
                    const daysLeft = Math.ceil((new Date(detailDeal.deadline_final).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{format(new Date(detailDeal.deadline_final), 'dd.MM.yyyy')}</p>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", daysLeft > 3 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : daysLeft > 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400")}>
                          {daysLeft > 0 ? `осталось ${daysLeft} дн.` : 'просрочено'}
                        </span>
                      </div>
                    );
                  })() : (detailDeal.products as any)?.deadline_days ? (
                    <p className="text-sm text-muted-foreground">{(detailDeal.products as any).deadline_days} дней на выполнение</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Дедлайн не установлен</p>
                  )}
                </div>

                {/* Seller info */}
                <div className="text-sm space-y-1 px-1">
                  <p><span className="text-muted-foreground">Селлер:</span> {detailDeal.seller?.name}</p>
                  {detailDeal.seller?.telegram_id && (
                    <a href={`https://t.me/${String(detailDeal.seller.telegram_id).replace('@', '')}`} target="_blank" className="text-primary text-xs hover:underline">@{detailDeal.seller.telegram_id}</a>
                  )}
                </div>
              </div>

              {/* Sticky bottom buttons */}
              <div className="border-t p-4 space-y-2">
                {canReviewOffer && !counterMode && (
                  <>
                    <Button className="w-full" onClick={async () => {
                      const productName = detailDeal.products?.name || 'товар';
                      await supabase.from('deal_messages').insert({
                        deal_id: detailDeal.id, sender_id: user!.id,
                        message: 'Блогер принял задание', message_type: 'system',
                      });
                      updateDeal.mutate({
                        id: detailDeal.id,
                        updates: { status: detailDeal.status === 'requested' ? 'approved' : detailDeal.status },
                      });
                      supabase.functions.invoke('telegram-notify', {
                        body: { user_id: detailDeal.seller_id, title: 'Задание принято', message: `Блогер ${user?.user_metadata?.name || ''} принял задание по товару «${productName}»` },
                      }).catch(() => {});
                      setDetailDeal(null);
                    }}>Принять задание</Button>
                    <Button variant="outline" className="w-full" onClick={() => {
                      setCounterMode(true);
                      setCounterText(detailDeal.products?.requirements || '');
                      setCounterDeadline(detailDeal.deadline_final ? new Date(detailDeal.deadline_final) : undefined);
                    }}>
                      Предложить правки
                    </Button>
                    <Button variant="destructive" className="w-full" onClick={async () => {
                      const productName = detailDeal.products?.name || 'товар';
                      await supabase.from('deal_messages').insert({
                        deal_id: detailDeal.id, sender_id: user!.id,
                        message: 'Блогер отказался от задания', message_type: 'system',
                      });
                      updateDeal.mutate({ id: detailDeal.id, updates: { status: 'cancelled' } });
                      supabase.functions.invoke('telegram-notify', {
                        body: { user_id: detailDeal.seller_id, title: 'Задание отклонено', message: `Блогер ${user?.user_metadata?.name || ''} отказался от задания на товар «${productName}»` },
                      }).catch(() => {});
                      setDetailDeal(null);
                    }}>Отказаться от задания</Button>
                  </>
                )}

                {canReviewOffer && counterMode && (
                  <div className="flex gap-2">
                    <Button className="flex-1" disabled={!counterText.trim()} onClick={async () => {
                      const productName = detailDeal.products?.name || 'товар';
                      const msg = counterDeadline
                        ? `Контрпредложение:\n${counterText}\n\nПредложенный дедлайн: ${format(counterDeadline, 'dd.MM.yyyy')}`
                        : `Контрпредложение:\n${counterText}`;
                      await supabase.from('deal_messages').insert({
                        deal_id: detailDeal.id, sender_id: user!.id,
                        message: msg, message_type: 'counter_proposal',
                      });
                      // Change status to counter_proposed so blogger sees "Ожидаем подтверждения правок"
                      await supabase.from('deals').update({ status: 'counter_proposed' }).eq('id', detailDeal.id);
                      await supabase.from('notifications').insert({
                        user_id: detailDeal.seller_id,
                        title: 'Блогер предложил правки',
                        message: `Блогер предложил правки по товару «${productName}»`,
                        deal_id: detailDeal.id,
                      });
                      supabase.functions.invoke('telegram-notify', {
                        body: { user_id: detailDeal.seller_id, title: 'Блогер предложил правки', message: `Блогер предложил правки по товару «${productName}»` },
                      }).catch(() => {});
                      toast({ title: 'Правки отправлены селлеру!' });
                      setCounterMode(false);
                      setDetailDeal(null);
                      qc.invalidateQueries({ queryKey: ['blogger-deals'] });
                    }}>
                      Сохранить правки
                    </Button>
                    <Button variant="ghost" onClick={() => setCounterMode(false)}>Отмена</Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Action dialog */}
      <Dialog open={!!activeDeal} onOpenChange={v => { if (!v) setActiveDeal(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'order' && 'Оформить заказ'}
              {dialogType === 'pickup' && 'Подтверждение получения'}
              {dialogType === 'content' && 'Отправить контент'}
              {dialogType === 'review' && 'Отправить отзыв'}
              {dialogType === 'publish' && 'Скриншот публикации'}
            </DialogTitle>
          </DialogHeader>

          {/* Order */}
          {dialogType === 'order' && (
            <div className="space-y-3">
              {activeDeal?.products?.marketplace_url && (
                <a href={activeDeal.products.marketplace_url} target="_blank" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <ExternalLink className="h-4 w-4" /> Открыть на маркетплейсе
                </a>
              )}
              <div>
                <Label>Скриншот заказа</Label>
                <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, setScreenshotUrl, 'screenshots'); }} />
                <Button variant="outline" className="w-full mt-1" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" />{screenshotUrl ? 'Загружено ✓' : uploading ? 'Загрузка...' : 'Загрузить'}
                </Button>
                {screenshotUrl && <img src={screenshotUrl} alt="" className="mt-2 rounded-lg max-h-32 w-full object-cover" />}
              </div>
              <Button className="w-full" disabled={!screenshotUrl || updateDeal.isPending} onClick={() => {
                const pName = activeDeal.products?.name || 'товар';
                const bloggerName = user?.user_metadata?.name || 'Блогер';
                updateDeal.mutate({ id: activeDeal.id, updates: { status: 'ordered', order_screenshot_url: screenshotUrl } }, {
                  onSuccess: () => {
                    qc.invalidateQueries({ queryKey: ['blogger-deals'] });
                    setActiveDeal(null);
                    toast({ title: 'Обновлено!' });
                    notifyTg(activeDeal.seller_id, '📦 Заказ оформлен', `Блогер ${bloggerName} оформил заказ по товару «${pName}»`);
                  },
                });
              }}>
                {updateDeal.isPending ? 'Сохранение...' : 'Заказ оформлен'}
              </Button>
            </div>
          )}

          {/* Pickup */}
          {dialogType === 'pickup' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Загрузите фото подтверждения получения</p>
              <input type="file" ref={pickupFileRef} accept="image/*,video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, setPickupProofUrl, 'pickup-proofs'); }} />
              <Button variant="outline" className="w-full" onClick={() => pickupFileRef.current?.click()} disabled={uploading}>
                <Upload className="h-4 w-4 mr-2" />{pickupProofUrl ? 'Загружено ✓' : uploading ? 'Загрузка...' : 'Загрузить'}
              </Button>
              {pickupProofUrl && <img src={pickupProofUrl} alt="" className="mt-2 rounded-lg max-h-32 w-full object-cover" />}
              <Button className="w-full" disabled={!pickupProofUrl || updateDeal.isPending} onClick={async () => {
                const pName = activeDeal.products?.name || 'товар';
                const bloggerName = user?.user_metadata?.name || 'Блогер';
                await supabase.from('deal_messages').insert({
                  deal_id: activeDeal.id, sender_id: user!.id,
                  message: 'Подтверждение получения', attachment_url: pickupProofUrl, message_type: 'pickup_proof',
                });
                updateDeal.mutate({ id: activeDeal.id, updates: { status: 'picked_up', pickup_proof_url: pickupProofUrl } }, {
                  onSuccess: () => {
                    qc.invalidateQueries({ queryKey: ['blogger-deals'] });
                    setActiveDeal(null);
                    toast({ title: 'Обновлено!' });
                    notifyTg(activeDeal.seller_id, '📬 Посылка забрана', `Блогер ${bloggerName} забрал заказ по товару «${pName}»`);
                  },
                });
              }}>
                {updateDeal.isPending ? 'Сохранение...' : 'Забрал посылку'}
              </Button>
            </div>
          )}

          {/* Content */}
          {dialogType === 'content' && (
            <div className="space-y-3">
              {activeDeal?.content_status === 'rejected' && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-2 text-sm">Контент отклонён — отправьте исправленную версию</div>
              )}
              <div>
                <Label>Загрузите видео/фото контента</Label>
                <input type="file" ref={contentFileRef} accept="video/*,image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, setContentUrl, 'content-videos'); }} />
                <Button variant="outline" className="w-full mt-1" onClick={() => contentFileRef.current?.click()} disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" />{contentUrl ? 'Загружено ✓' : uploading ? 'Загрузка...' : 'Загрузить файл'}
                </Button>
                {contentUrl && <p className="text-xs text-muted-foreground truncate">Файл загружен</p>}
              </div>
              <Button className="w-full" disabled={!contentUrl || submitContent.isPending} onClick={() =>
                submitContent.mutate({ dealId: activeDeal.id, url: contentUrl, sellerId: activeDeal.seller_id, pName: activeDeal.products?.name || 'товар' })
              }>
                {submitContent.isPending ? 'Отправка...' : 'Отправить на согласование'}
              </Button>
            </div>
          )}

          {/* Review */}
          {dialogType === 'review' && (
            <div className="space-y-3">
              {activeDeal?.review_status === 'rejected' && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-2 text-sm">Отзыв отклонён — отправьте исправленную версию</div>
              )}
              <div><Label>Текст отзыва</Label><Textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Текст отзыва..." rows={4} /></div>
              <div>
                <Label>Фото/видео</Label>
                <input type="file" ref={reviewFileRef} accept="image/*,video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, setReviewScreenshotUrl, 'review-media'); }} />
                <Button variant="outline" className="w-full mt-1" onClick={() => reviewFileRef.current?.click()} disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" />{reviewScreenshotUrl ? 'Загружено ✓' : uploading ? 'Загрузка...' : 'Загрузить'}
                </Button>
              </div>
              <Button className="w-full" disabled={!reviewText || submitReviewForApproval.isPending} onClick={() =>
                submitReviewForApproval.mutate({ dealId: activeDeal.id, text: reviewText, mediaUrls: reviewScreenshotUrl ? [reviewScreenshotUrl] : [], sellerId: activeDeal.seller_id, pName: activeDeal.products?.name || 'товар' })
              }>
                {submitReviewForApproval.isPending ? 'Отправка...' : 'Отправить на согласование'}
              </Button>
            </div>
          )}

          {/* Publish */}
          {dialogType === 'publish' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Отзыв одобрен! Прикрепите ссылки на публикации в соцсетях и скриншот.</p>
              
              {[
                { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/watch?v=...' },
                { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/reel/...' },
                { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@.../video/...' },
                { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/channel/...' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input
                    value={socialLinks[key]}
                    onChange={e => setSocialLinks(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="mt-1"
                  />
                </div>
              ))}

              <div>
                <Label>Скриншот публикации</Label>
                <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, setScreenshotUrl, 'review-screenshots'); }} />
                <Button variant="outline" className="w-full mt-1" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" />{screenshotUrl ? 'Загружено' : uploading ? 'Загрузка...' : 'Загрузить'}
                </Button>
                {screenshotUrl && <img src={screenshotUrl} alt="" className="mt-2 rounded-lg max-h-32 w-full object-cover" />}
              </div>
              <Button className="w-full" disabled={!screenshotUrl || !Object.values(socialLinks).some(v => v.trim()) || updateDeal.isPending} onClick={async () => {
                const pName = activeDeal.products?.name || 'товар';
                const bloggerName = user?.user_metadata?.name || 'Блогер';
                const filledLinks = Object.entries(socialLinks).filter(([, v]) => v.trim());
                const linksText = filledLinks.map(([k, v]) => `${k}: ${v.trim()}`).join('\n');
                const linksObj = Object.fromEntries(filledLinks.map(([k, v]) => [k, v.trim()]));
                await supabase.from('deal_messages').insert({
                  deal_id: activeDeal.id, sender_id: user!.id,
                  message: `Публикации:\n${linksText}`, attachment_url: screenshotUrl, message_type: 'text',
                });
                updateDeal.mutate({ id: activeDeal.id, updates: { status: 'review_posted', social_links: linksObj as any, utm_url: filledLinks[0]?.[1]?.trim() || null } }, {
                  onSuccess: () => {
                    qc.invalidateQueries({ queryKey: ['blogger-deals'] });
                    setActiveDeal(null);
                    toast({ title: 'Обновлено!' });
                    notifyTg(activeDeal.seller_id, 'Контент опубликован', `Блогер ${bloggerName} опубликовал контент по товару «${pName}»`);
                  },
                });
              }}>
                {updateDeal.isPending ? 'Сохранение...' : 'Опубликовано'}
              </Button>
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

      {/* Review about seller */}
      <Dialog open={!!reviewDeal} onOpenChange={v => { if (!v) setReviewDeal(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Отзыв о селлере</DialogTitle></DialogHeader>
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
              <Textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Как прошло сотрудничество..." />
            </div>
            <Button className="w-full" onClick={() => submitReview.mutate()} disabled={submitReview.isPending}>
              {submitReview.isPending ? 'Отправка...' : 'Отправить отзыв'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default BloggerDeals;
