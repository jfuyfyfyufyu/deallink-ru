import DashboardLayout from '@/components/DashboardLayout';
import { CardListSkeleton } from '@/components/ui/skeletons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, Package, UserPlus, Search, Ban } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import AdminUserDetail from '@/components/admin/AdminUserDetail';

const AdminSellers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', telegram_id: '' });
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data: sellers, isLoading } = useQuery({
    queryKey: ['admin-sellers'],
    queryFn: async () => {
      const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'seller');
      if (!profiles) return [];
      const ids = profiles.map(p => p.user_id);
      const { data: products } = await supabase.from('products').select('seller_id').in('seller_id', ids);
      const prodMap: Record<string, number> = {};
      (products || []).forEach((p: any) => { prodMap[p.seller_id] = (prodMap[p.seller_id] || 0) + 1; });
      return profiles.map(p => ({ ...p, productCount: prodMap[p.user_id] || 0 }));
    },
  });

  const createUser = useMutation({
    mutationFn: async () => {
      const res = await supabase.functions.invoke('admin-create-user', {
        body: { ...form, role: 'seller' },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      setShowCreate(false);
      setForm({ email: '', password: '', name: '', telegram_id: '' });
      toast({ title: 'Селлер создан!' });
    },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const filtered = sellers?.filter((s: any) =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.telegram_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Селлеры">
      <div className="space-y-4 animate-fade-in">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={() => setShowCreate(true)}><UserPlus className="h-4 w-4 mr-2" />Добавить</Button>
        </div>

        {isLoading && <CardListSkeleton />}
        {filtered?.map((s: any) => (
          <Card key={s.id} className="glass-card cursor-pointer hover:ring-1 hover:ring-primary/20 transition-all" onClick={() => setSelectedUser(s)}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {(s.name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{s.name || 'Без имени'}</p>
                  {s.is_blocked && <Ban className="h-3.5 w-3.5 text-destructive" />}
                </div>
                <p className="text-xs text-muted-foreground">{s.telegram_id ? `@${s.telegram_id}` : 'Telegram —'}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1 text-sm">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{s.productCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-accent fill-accent" />
                  <span className="text-sm font-medium">{Number(s.trust_score || 0).toFixed(1)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && filtered?.length === 0 && (
          <p className="text-muted-foreground text-center py-8">Селлеры не найдены</p>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Добавить селлера</DialogTitle></DialogHeader>
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

export default AdminSellers;
