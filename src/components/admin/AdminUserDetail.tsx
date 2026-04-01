import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Star, Handshake, Ban, CheckCircle, Save, ChevronDown, Plus } from 'lucide-react';

interface AdminUserDetailProps {
  user: any;
  open: boolean;
  onClose: () => void;
}

const statusLabels: Record<string, string> = {
  requested: 'Заявка', approved: 'Одобрена', ordered: 'Заказан', in_pvz: 'В ПВЗ',
  picked_up: 'Забран', filming: 'Съёмка', review_posted: 'Опубликовано',
  finished: 'Завершена', cancelled: 'Отменена',
};

export default function AdminUserDetail({ user, open, onClose }: AdminUserDetailProps) {
  const { toast } = useToast();
  const { user: adminUser } = useAuth();
  const queryClient = useQueryClient();
  const [editName, setEditName] = useState('');
  const [editTelegram, setEditTelegram] = useState('');
  const [editTrustScore, setEditTrustScore] = useState('');
  const [qForm, setQForm] = useState<any>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditTelegram(user.telegram_id || '');
      setEditTrustScore(String(user.trust_score || 0));
    }
  }, [user]);

  const { data: deals } = useQuery({
    queryKey: ['admin-user-deals', user?.user_id],
    enabled: !!user?.user_id && open,
    queryFn: async () => {
      const field = user.role === 'seller' ? 'seller_id' : 'blogger_id';
      const { data } = await supabase
        .from('deals').select('id, status, created_at, product_id')
        .eq(field, user.user_id).order('created_at', { ascending: false }).limit(20);
      if (!data || data.length === 0) return [];
      const pIds = [...new Set(data.map(d => d.product_id))];
      const { data: products } = await supabase.from('products').select('id, name').in('id', pIds);
      const pm: Record<string, string> = {};
      (products || []).forEach(p => { pm[p.id] = p.name; });
      return data.map(d => ({ ...d, product_name: pm[d.product_id] || '—' }));
    },
  });

  const { data: questionnaire, refetch: refetchQ } = useQuery({
    queryKey: ['admin-user-questionnaire', user?.user_id],
    enabled: !!user?.user_id && user?.role === 'blogger' && open,
    queryFn: async () => {
      const { data } = await supabase
        .from('blogger_questionnaires').select('*')
        .eq('user_id', user.user_id).maybeSingle();
      return data as any;
    },
  });

  const { data: reviews, refetch: refetchReviews } = useQuery({
    queryKey: ['admin-user-reviews', user?.user_id],
    enabled: !!user?.user_id && user?.role === 'blogger' && open,
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews').select('*, reviewer:profiles!reviews_reviewer_id_fkey(name)')
        .eq('target_id', user.user_id).order('created_at', { ascending: false });
      return data || [];
    },
  });

  useEffect(() => {
    if (questionnaire) setQForm({ ...questionnaire });
  }, [questionnaire]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-bloggers'] });
    queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
    queryClient.invalidateQueries({ queryKey: ['admin-all-questionnaires'] });
  };

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('profiles')
        .update({ name: editName, telegram_id: editTelegram || null, trust_score: parseFloat(editTrustScore) || 0 } as any)
        .eq('user_id', user.user_id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast({ title: 'Профиль обновлён' }); },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const blockUser = useMutation({
    mutationFn: async (blocked: boolean) => {
      const res = await supabase.functions.invoke('admin-block-user', { body: { user_id: user.user_id, blocked } });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
    },
    onSuccess: () => { invalidateAll(); toast({ title: user.is_blocked ? 'Разблокирован' : 'Заблокирован' }); onClose(); },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const saveQuestionnaire = useMutation({
    mutationFn: async () => {
      if (!qForm) return;
      const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = qForm;
      const { error } = await supabase.from('blogger_questionnaires')
        .update(rest as any).eq('user_id', user.user_id);
      if (error) throw error;
    },
    onSuccess: () => { refetchQ(); invalidateAll(); toast({ title: 'Анкета сохранена' }); },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const moderateQuestionnaire = useMutation({
    mutationFn: async (status: string) => {
      const note = (status === 'rejected' || status === 'revision') ? rejectNote : null;
      const { error } = await supabase.from('blogger_questionnaires')
        .update({ moderation_status: status, moderation_note: note } as any)
        .eq('user_id', user.user_id);
      if (error) throw error;
    },
    onSuccess: () => { refetchQ(); invalidateAll(); toast({ title: 'Статус модерации обновлён' }); setRejectNote(''); },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const addReview = useMutation({
    mutationFn: async () => {
      // Need a deal_id — pick latest finished deal or any deal
      const { data: latestDeal } = await supabase.from('deals')
        .select('id').eq('blogger_id', user.user_id)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (!latestDeal) throw new Error('У блогера нет сделок для отзыва');
      const { error } = await supabase.from('reviews').insert({
        reviewer_id: adminUser!.id,
        target_id: user.user_id,
        deal_id: latestDeal.id,
        rating: reviewRating,
        comment: reviewComment || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      refetchReviews();
      invalidateAll();
      setReviewComment('');
      setReviewRating(5);
      toast({ title: 'Отзыв добавлен' });
    },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  if (!user) return null;

  const dealStats = {
    total: deals?.length || 0,
    finished: deals?.filter(d => d.status === 'finished').length || 0,
  };

  const qField = (label: string, key: string, type: 'text' | 'number' | 'switch' | 'select' = 'text', options?: string[]) => {
    if (!qForm) return null;
    if (type === 'switch') {
      return (
        <div className="flex items-center justify-between">
          <Label className="text-xs">{label}</Label>
          <Switch checked={!!qForm[key]} onCheckedChange={v => setQForm((p: any) => ({ ...p, [key]: v }))} />
        </div>
      );
    }
    if (type === 'select' && options) {
      return (
        <div>
          <Label className="text-xs">{label}</Label>
          <Select value={qForm[key] || ''} onValueChange={v => setQForm((p: any) => ({ ...p, [key]: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      );
    }
    return (
      <div>
        <Label className="text-xs">{label}</Label>
        <Input
          className="h-8 text-xs"
          type={type}
          value={qForm[key] ?? ''}
          onChange={e => setQForm((p: any) => ({ ...p, [key]: type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value }))}
        />
      </div>
    );
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Collapsible>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded hover:bg-muted/50 text-sm font-medium">
        {title}
        <ChevronDown className="h-4 w-4" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 px-2 pb-2">{children}</CollapsibleContent>
    </Collapsible>
  );

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {(user.name || '?')[0].toUpperCase()}
            </div>
            <div>
              <span>{user.name || 'Без имени'}</span>
              {user.is_blocked && <Badge variant="destructive" className="ml-2 text-[10px]">Заблокирован</Badge>}
            </div>
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="profile" className="mt-4">
          <TabsList className={`grid w-full ${user.role === 'blogger' ? 'grid-cols-4' : 'grid-cols-2'}`}>
            <TabsTrigger value="profile">Профиль</TabsTrigger>
            <TabsTrigger value="deals">Сделки</TabsTrigger>
            {user.role === 'blogger' && <TabsTrigger value="questionnaire">Анкета</TabsTrigger>}
            {user.role === 'blogger' && <TabsTrigger value="reviews">Отзывы</TabsTrigger>}
          </TabsList>

          {/* ===== PROFILE TAB ===== */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-2">
              <Card><CardContent className="p-3 text-center">
                <p className="text-xl font-bold">{dealStats.total}</p>
                <p className="text-[10px] text-muted-foreground">Сделок</p>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <p className="text-xl font-bold">{dealStats.finished}</p>
                <p className="text-[10px] text-muted-foreground">Завершено</p>
              </CardContent></Card>
              <Card><CardContent className="p-3 text-center">
                <p className="text-xl font-bold flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 text-accent fill-accent" />
                  {Number(user.trust_score || 0).toFixed(1)}
                </p>
                <p className="text-[10px] text-muted-foreground">Рейтинг</p>
              </CardContent></Card>
            </div>

            <div className="space-y-3">
              <div><Label>Имя</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
              <div><Label>Telegram</Label><Input value={editTelegram} onChange={e => setEditTelegram(e.target.value)} placeholder="@username" /></div>
              <div><Label>Рейтинг (вручную)</Label><Input type="number" step="0.1" min="0" max="5" value={editTrustScore} onChange={e => setEditTrustScore(e.target.value)} /></div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Роль: <Badge variant="secondary" className="text-[10px]">{user.role}</Badge></p>
                <p>Регистрация: {new Date(user.created_at).toLocaleDateString('ru')}</p>
              </div>
              <Button className="w-full" size="sm" onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
                <Save className="h-4 w-4 mr-2" />{updateProfile.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>

            <div className="pt-4 border-t border-border">
              {user.is_blocked ? (
                <Button variant="outline" className="w-full" onClick={() => blockUser.mutate(false)} disabled={blockUser.isPending}>
                  <CheckCircle className="h-4 w-4 mr-2" />{blockUser.isPending ? 'Обработка...' : 'Разблокировать'}
                </Button>
              ) : (
                <Button variant="destructive" className="w-full" onClick={() => blockUser.mutate(true)} disabled={blockUser.isPending}>
                  <Ban className="h-4 w-4 mr-2" />{blockUser.isPending ? 'Обработка...' : 'Заблокировать'}
                </Button>
              )}
            </div>
          </TabsContent>

          {/* ===== DEALS TAB ===== */}
          <TabsContent value="deals" className="space-y-2 mt-4">
            {deals?.length === 0 && <p className="text-muted-foreground text-center py-8">Нет сделок</p>}
            {deals?.map(d => (
              <Card key={d.id} className="glass-card">
                <CardContent className="p-3 flex items-center gap-3">
                  <Handshake className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.product_name}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleDateString('ru')}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{statusLabels[d.status] || d.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ===== QUESTIONNAIRE TAB ===== */}
          {user.role === 'blogger' && (
            <TabsContent value="questionnaire" className="mt-4">
              {!questionnaire ? (
                <p className="text-muted-foreground text-center py-8">Анкета не заполнена</p>
              ) : !qForm ? null : (
                <div className="space-y-3">
                  {/* Moderation status */}
                  <Card>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Статус модерации</span>
                        <Badge variant={
                          qForm.moderation_status === 'approved' ? 'default' :
                          qForm.moderation_status === 'rejected' ? 'destructive' :
                          qForm.moderation_status === 'pending' ? 'secondary' :
                          qForm.moderation_status === 'revision' ? 'secondary' : 'outline'
                        }>
                          {qForm.moderation_status === 'approved' ? '✅ Одобрена' :
                           qForm.moderation_status === 'rejected' ? '❌ Отклонена' :
                           qForm.moderation_status === 'pending' ? '⏳ Ожидает' :
                           qForm.moderation_status === 'revision' ? '✏️ На доработке' : '📝 Черновик'}
                        </Badge>
                      </div>
                      {(qForm.moderation_status === 'pending' || qForm.moderation_status === 'revision') && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1" onClick={() => moderateQuestionnaire.mutate('approved')}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Одобрить
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                              const note = prompt('Что нужно исправить:');
                              if (note !== null) {
                                setRejectNote(note);
                                moderateQuestionnaire.mutate('revision');
                              }
                            }}>
                              ✏️ Доработать
                            </Button>
                          </div>
                          <div className="space-y-1">
                            <Input placeholder="Причина отклонения" value={rejectNote} onChange={e => setRejectNote(e.target.value)} className="h-8 text-xs" />
                            <Button size="sm" variant="destructive" className="w-full" onClick={() => moderateQuestionnaire.mutate('rejected')}>
                              Отклонить
                            </Button>
                          </div>
                        </div>
                      )}
                      {qForm.moderation_status === 'approved' && (
                        <Button size="sm" variant="outline" className="w-full" onClick={() => moderateQuestionnaire.mutate('pending')}>
                          Вернуть на модерацию
                        </Button>
                      )}
                      {qForm.moderation_note && (
                        <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">💬 {qForm.moderation_note}</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Editable sections */}
                  <Section title="📝 Базовая информация">
                    {qField('Полное имя', 'full_name')}
                    {qField('Возраст', 'age', 'number')}
                    {qField('Страна', 'country')}
                    {qField('Город', 'city')}
                  </Section>

                  <Section title="📊 Аналитика">
                    {qField('Просмотры shorts', 'avg_shorts_views', 'number')}
                    {qField('Просмотры reels', 'avg_reels_views', 'number')}
                    {qField('Просмотры stories', 'avg_stories_views', 'number')}
                    {qField('Просмотры видео', 'avg_video_views', 'number')}
                    {qField('Просмотры постов', 'avg_post_views', 'number')}
                    {qField('Лучшее видео URL', 'best_video_url')}
                    {qField('Тренд просмотров', 'views_trend', 'select', ['growing', 'stable', 'declining'])}
                  </Section>

                  <Section title="👥 Аудитория">
                    {qField('Муж. аудитория %', 'audience_gender_male', 'number')}
                    {qField('Возраст аудитории', 'audience_age', 'select', ['13-17', '18-24', '25-34', '35-44', '45+'])}
                    {qField('География', 'audience_geo')}
                    {qField('Покупательная способность', 'purchasing_power', 'select', ['low', 'medium', 'high'])}
                  </Section>

                  <Section title="🎬 Контент">
                    {qField('Снимает видео', 'does_video', 'switch')}
                    {qField('Снимает фото', 'does_photo', 'switch')}
                    {qField('Формат Instagram', 'instagram_format')}
                    {qField('Тип обзора', 'review_type', 'select', ['text_photo', 'video', 'shorts', 'stories', 'mixed'])}
                  </Section>

                  <Section title="💼 Опыт">
                    {qField('Опыт сделок', 'deals_experience', 'select', ['0-5', '5-20', '20-50', '50+'])}
                    {qField('Результаты', 'experience_results')}
                  </Section>

                  <Section title="⚙️ Условия работы">
                    {qField('Готов покупать', 'ready_to_buy', 'switch')}
                    {qField('Готов к ТЗ', 'ready_for_tz', 'switch')}
                    {qField('Обзор WB', 'ready_for_wb_review', 'switch')}
                    {qField('Фото-обзор', 'ready_for_photo_review', 'switch')}
                    {qField('Видео-обзор', 'ready_for_video_review', 'switch')}
                    {qField('Shorts', 'ready_for_shorts', 'switch')}
                    {qField('Скорость (дни)', 'speed_days', 'number')}
                    {qField('Частота сообщений', 'check_messages_frequency', 'select', ['hourly', 'daily', '2-3_days'])}
                    {qField('Были задержки', 'had_delays', 'switch')}
                    {qField('ПВЗ рядом', 'has_pvz_nearby', 'switch')}
                    {qField('Скорость забора', 'pickup_speed', 'select', ['same_day', '1-2_days', '3-5_days'])}
                    {qField('Мин. цена товара', 'min_product_price', 'number')}
                    {qField('Макс. цена товара', 'max_product_price', 'number')}
                    {qField('Товаров в месяц', 'products_per_month', 'select', ['1-2', '3-5', '5-10', '10+'])}
                    {qField('Тип оплаты', 'pricing_type', 'select', ['barter', 'paid', 'mixed'])}
                    {qField('Своя цена', 'custom_price', 'number')}
                  </Section>

                  <Section title="🧑 О себе">
                    {qField('Стиль работы', 'work_style', 'select', ['balance', 'quality', 'speed'])}
                    {qField('Есть дети', 'has_children', 'switch')}
                    {qField('Возраст детей', 'children_ages')}
                    {qField('Есть партнёр', 'has_partner', 'switch')}
                    {qField('Самооценка надёжность', 'self_reliability', 'number')}
                    {qField('Самооценка скорость', 'self_speed', 'number')}
                    {qField('Самооценка качество', 'self_quality', 'number')}
                  </Section>

                  <Section title="📈 Индексы (вычисляемые)">
                    {qField('Надёжность', 'reliability_index', 'number')}
                    {qField('Скорость', 'speed_index', 'number')}
                    {qField('Качество', 'quality_index', 'number')}
                    {qField('Дисциплина', 'discipline_index', 'number')}
                    {qField('Вероятность завершения %', 'completion_probability', 'number')}
                  </Section>

                  <Section title="📄 Дополнительно">
                    <div>
                      <Label className="text-xs">Пример обзора</Label>
                      <Textarea className="text-xs" rows={3} value={qForm.sample_review || ''} onChange={e => setQForm((p: any) => ({ ...p, sample_review: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs">Дополнительная информация</Label>
                      <Textarea className="text-xs" rows={3} value={qForm.additional_info || ''} onChange={e => setQForm((p: any) => ({ ...p, additional_info: e.target.value }))} />
                    </div>
                  </Section>

                  <Button className="w-full" onClick={() => saveQuestionnaire.mutate()} disabled={saveQuestionnaire.isPending}>
                    <Save className="h-4 w-4 mr-2" />{saveQuestionnaire.isPending ? 'Сохранение...' : 'Сохранить анкету'}
                  </Button>
                </div>
              )}
            </TabsContent>
          )}

          {/* ===== REVIEWS TAB ===== */}
          {user.role === 'blogger' && (
            <TabsContent value="reviews" className="mt-4 space-y-4">
              {/* Add review */}
              <Card>
                <CardHeader className="p-3 pb-1"><CardTitle className="text-sm">Добавить отзыв</CardTitle></CardHeader>
                <CardContent className="p-3 pt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs shrink-0">Оценка:</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setReviewRating(n)} className="p-0.5">
                          <Star className={`h-5 w-5 ${n <= reviewRating ? 'text-accent fill-accent' : 'text-muted-foreground'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea placeholder="Комментарий..." rows={2} value={reviewComment} onChange={e => setReviewComment(e.target.value)} className="text-xs" />
                  <Button size="sm" className="w-full" onClick={() => addReview.mutate()} disabled={addReview.isPending}>
                    <Plus className="h-4 w-4 mr-1" />{addReview.isPending ? 'Добавление...' : 'Добавить'}
                  </Button>
                </CardContent>
              </Card>

              {/* Reviews list */}
              {reviews?.length === 0 && <p className="text-muted-foreground text-center text-sm py-4">Нет отзывов</p>}
              {reviews?.map((r: any) => (
                <Card key={r.id} className="glass-card">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{r.reviewer?.name || 'Админ'}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{new Date(r.created_at).toLocaleDateString('ru')}</span>
                    </div>
                    {r.comment && <p className="text-sm">{r.comment}</p>}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
