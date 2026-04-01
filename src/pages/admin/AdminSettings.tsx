import DashboardLayout from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserX, UserCheck, Search, Users, Package, Star, Zap, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const AdminSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleDialog, setRoleDialog] = useState<any>(null);
  const [newRole, setNewRole] = useState<'admin' | 'blogger' | 'seller'>('blogger');
  const [stressRunning, setStressRunning] = useState(false);
  const [stressReport, setStressReport] = useState<any>(null);

  const runStressTest = async () => {
    setStressRunning(true);
    setStressReport(null);
    try {
      const { data, error } = await supabase.functions.invoke('stress-test');
      if (error) throw error;
      setStressReport(data);
      toast({ title: 'Стресс-тест завершён', description: `${data.all_errors?.length || 0} ошибок найдено` });
    } catch (e: any) {
      toast({ title: 'Ошибка', description: e.message, variant: 'destructive' });
    } finally {
      setStressRunning(false);
    }
  };

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      return profiles || [];
    },
  });

  const changeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // Update profile role
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ role: role as any })
        .eq('user_id', userId);
      if (profileErr) throw profileErr;

      // Upsert user_roles
      const { error: deleteErr } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      const { error: insertErr } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: role as any });
      if (insertErr) throw insertErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      setRoleDialog(null);
      toast({ title: 'Роль изменена!' });
    },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const roleLabels: Record<string, string> = { admin: 'Админ', seller: 'Селлер', blogger: 'Блогер' };
  const roleColors: Record<string, string> = { admin: 'bg-destructive/15 text-destructive', seller: 'bg-primary/15 text-primary', blogger: 'bg-accent/15 text-accent-foreground' };
  const roleIcons: Record<string, any> = { admin: Shield, seller: Package, blogger: Users };

  const filtered = users?.filter((u: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) || (u.telegram_id || '').toLowerCase().includes(q);
  }) || [];

  const stats = {
    total: users?.length || 0,
    admins: users?.filter((u: any) => u.role === 'admin').length || 0,
    sellers: users?.filter((u: any) => u.role === 'seller').length || 0,
    bloggers: users?.filter((u: any) => u.role === 'blogger').length || 0,
  };

  return (
    <DashboardLayout title="Настройки">
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="glass-card"><CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground">Всего</p>
          </CardContent></Card>
          <Card className="glass-card"><CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stats.admins}</p>
            <p className="text-[10px] text-muted-foreground">Админы</p>
          </CardContent></Card>
          <Card className="glass-card"><CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stats.sellers}</p>
            <p className="text-[10px] text-muted-foreground">Селлеры</p>
          </CardContent></Card>
          <Card className="glass-card"><CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stats.bloggers}</p>
            <p className="text-[10px] text-muted-foreground">Блогеры</p>
          </CardContent></Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Поиск пользователей..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Stress Test */}
        <Card className="glass-card border-dashed border-2 border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Стресс-тест платформы
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Запускает 150 параллельных операций: 50 регистраций, 50 поисков, 50 операций со сделками. Тестовые данные удаляются автоматически.
            </p>
            <Button onClick={runStressTest} disabled={stressRunning} className="w-full">
              {stressRunning ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Выполняется...</> : <><Zap className="h-4 w-4 mr-2" />Запустить тест</>}
            </Button>
            {stressReport && (
              <div className="space-y-3 pt-2">
                <div className="text-xs font-medium">Общее время: {(stressReport.total_time_ms / 1000).toFixed(1)}с</div>
                {[
                  { key: 'registrations', label: 'Регистрации', icon: '👤' },
                  { key: 'searches', label: 'Поиски', icon: '🔍' },
                  { key: 'deals', label: 'Сделки', icon: '🤝' },
                ].map(({ key, label, icon }) => {
                  const d = stressReport[key];
                  if (!d) return null;
                  const total = d.success + d.failed;
                  const pct = total > 0 ? (d.success / total) * 100 : 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>{icon} {label}</span>
                        <span className={d.failed > 0 ? 'text-destructive font-medium' : 'text-green-600 font-medium'}>
                          {d.success}/{total} ({d.avg_ms}мс)
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                      {d.errors?.length > 0 && (
                        <div className="bg-destructive/10 rounded p-2 text-[10px] max-h-24 overflow-y-auto space-y-1">
                          {d.errors.slice(0, 10).map((e: any, i: number) => (
                            <div key={i} className="text-destructive">❌ {e.error}</div>
                          ))}
                          {d.errors.length > 10 && <div className="text-muted-foreground">...и ещё {d.errors.length - 10}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="text-[10px] text-muted-foreground">{stressReport.cleanup_note}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User list */}
        <div className="space-y-3">
          {isLoading && <p className="text-muted-foreground">Загрузка...</p>}
          {filtered.map((u: any) => {
            const Icon = roleIcons[u.role] || Users;
            return (
              <Card key={u.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                      {(u.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{u.name || 'Без имени'}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {u.telegram_id && <span>@{u.telegram_id}</span>}
                        <span>{new Date(u.created_at).toLocaleDateString('ru')}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className={`text-xs shrink-0 ${roleColors[u.role]}`}>
                      <Icon className="h-3 w-3 mr-1" />
                      {roleLabels[u.role]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 text-accent fill-accent" />
                      {Number(u.trust_score || 0).toFixed(1)}
                    </div>
                    <div className="flex-1" />
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setRoleDialog(u); setNewRole(u.role); }}>
                      Сменить роль
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Change role dialog */}
      <Dialog open={!!roleDialog} onOpenChange={v => { if (!v) setRoleDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сменить роль: {roleDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Текущая роль: <strong>{roleLabels[roleDialog?.role]}</strong></Label>
            </div>
            <div>
              <Label>Новая роль</Label>
              <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Админ</SelectItem>
                  <SelectItem value="seller">Селлер</SelectItem>
                  <SelectItem value="blogger">Блогер</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => changeRole.mutate({ userId: roleDialog.user_id, role: newRole })}
              disabled={changeRole.isPending || newRole === roleDialog?.role}
            >
              {changeRole.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminSettings;
