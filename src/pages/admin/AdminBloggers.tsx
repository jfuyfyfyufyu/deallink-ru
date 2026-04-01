import DashboardLayout from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Star, Handshake, UserPlus, Search, Ban, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import AdminUserDetail from '@/components/admin/AdminUserDetail';

const AdminBloggers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', telegram_id: '' });
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [tab, setTab] = useState('pending');

  const { data: bloggers, isLoading } = useQuery({
    queryKey: ['admin-bloggers'],
    queryFn: async () => {
      const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'blogger').order('trust_score', { ascending: false });
      if (!profiles) return [];
      const ids = profiles.map(p => p.user_id);
      const { data: deals } = await supabase.from('deals').select('blogger_id, status').in('blogger_id', ids);
      const dealMap: Record<string, { total: number; finished: number }> = {};
      (deals || []).forEach((d: any) => {
        if (!dealMap[d.blogger_id]) dealMap[d.blogger_id] = { total: 0, finished: 0 };
        dealMap[d.blogger_id].total++;
        if (d.status === 'finished') dealMap[d.blogger_id].finished++;
      });
      return profiles.map(p => ({ ...p, deals: dealMap[p.user_id] || { total: 0, finished: 0 } }));
    },
  });

  const { data: pendingQuestionnaires } = useQuery({
    queryKey: ['admin-pending-questionnaires'],
    queryFn: async () => {
      const { data } = await supabase
        .from('blogger_questionnaires')
        .select('*')
        .order('updated_at', { ascending: false });
      return ((data || []) as any[]).filter((q: any) => q.moderation_status === 'pending');
    },
  });

  const moderateQuestionnaire = useMutation({
    mutationFn: async ({ userId, status, note }: { userId: string; status: string; note?: string }) => {
      const { error } = await supabase
        .from('blogger_questionnaires')
        .update({ moderation_status: status, moderation_note: note || null } as any)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-questionnaires'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bloggers'] });
      toast({ title: 'Статус модерации обновлён' });
    },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const createUser = useMutation({
    mutationFn: async () => {
      const res = await supabase.functions.invoke('admin-create-user', {
        body: { ...form, role: 'blogger' },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bloggers'] });
      setShowCreate(false);
      setForm({ email: '', password: '', name: '', telegram_id: '' });
      toast({ title: 'Блогер создан!' });
    },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const filtered = bloggers?.filter((b: any) =>
    !search || b.name?.toLowerCase().includes(search.toLowerCase()) || b.telegram_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Блогеры">
      <div className="space-y-4 animate-fade-in">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={() => setShowCreate(true)}><UserPlus className="h-4 w-4 mr-2" />Добавить</Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="gap-1">
              <Clock className="h-3.5 w-3.5" />
              На модерации ({pendingQuestionnaires?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="all">Все блогеры</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3 mt-4">
            {pendingQuestionnaires?.length === 0 && (
              <p className="text-muted-foreground text-center py-8">Нет анкет на модерации</p>
            )}
            {pendingQuestionnaires?.map((q: any) => (
              <Card key={q.id} className="glass-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {(q.full_name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{q.full_name || 'Без имени'}</p>
                      <p className="text-xs text-muted-foreground">
                        {[q.city, q.country].filter(Boolean).join(', ')} · {q.age ? `${q.age} лет` : ''}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Ожидает</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="font-medium">{q.avg_video_views || 0}</p>
                      <p className="text-muted-foreground">Видео</p>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="font-medium">{q.avg_shorts_views || 0}</p>
                      <p className="text-muted-foreground">Shorts</p>
                    </div>
                    <div className="text-center p-2 rounded bg-muted/50">
                      <p className="font-medium">{q.avg_reels_views || 0}</p>
                      <p className="text-muted-foreground">Reels</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => moderateQuestionnaire.mutate({ userId: q.user_id, status: 'approved' })}
                      disabled={moderateQuestionnaire.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Одобрить
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        const note = prompt('Причина отклонения:');
                        if (note !== null) {
                          moderateQuestionnaire.mutate({ userId: q.user_id, status: 'rejected', note });
                        }
                      }}
                      disabled={moderateQuestionnaire.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Отклонить
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="all" className="space-y-3 mt-4">
            {isLoading && <p className="text-muted-foreground">Загрузка...</p>}
            {filtered?.map((b: any) => (
              <Card key={b.id} className="glass-card cursor-pointer hover:ring-1 hover:ring-primary/20 transition-all" onClick={() => setSelectedUser(b)}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {(b.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{b.name || 'Без имени'}</p>
                      {b.is_blocked && <Ban className="h-3.5 w-3.5 text-destructive" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{b.telegram_id ? `@${b.telegram_id}` : 'Telegram —'}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1 text-sm">
                      <Handshake className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{b.deals.finished}/{b.deals.total}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-accent fill-accent" />
                      <span className="text-sm font-medium">{Number(b.trust_score || 0).toFixed(1)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!isLoading && filtered?.length === 0 && (
              <p className="text-muted-foreground text-center py-8">Блогеры не найдены</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Добавить блогера</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Имя</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Пароль</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
            <div><Label>Telegram</Label><Input value={form.telegram_id} onChange={e => setForm(f => ({ ...f, telegram_id: e.target.value }))} placeholder="@username" /></div>
            <Button className="w-full" onClick={() => createUser.mutate()} disabled={createUser.isPending}>
              {createUser.isPending ? 'Создание...' : 'Создать аккаунт'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AdminUserDetail user={selectedUser} open={!!selectedUser} onClose={() => setSelectedUser(null)} />
    </DashboardLayout>
  );
};

export default AdminBloggers;
