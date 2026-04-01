import DashboardLayout from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Search, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDealsRealtime } from '@/hooks/use-deals-realtime';

const statusLabels: Record<string, string> = {
  requested: 'Заявка', approved: 'Одобрено', product_sent: 'Отправлен',
  received: 'Получен', content_created: 'Контент готов', finished: 'Завершено', cancelled: 'Отменено',
};

const statusColors: Record<string, string> = {
  requested: 'bg-muted text-muted-foreground', approved: 'bg-primary/15 text-primary',
  product_sent: 'bg-accent/15 text-accent-foreground', received: 'bg-primary/10 text-primary',
  content_created: 'bg-primary/20 text-primary', finished: 'bg-primary/25 text-foreground', cancelled: 'bg-destructive/15 text-destructive',
};

const allStatuses = ['requested', 'approved', 'product_sent', 'received', 'content_created', 'finished', 'cancelled'];

const AdminDeals = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  useDealsRealtime();

  const { data: deals, isLoading } = useQuery({
    queryKey: ['admin-deals'],
    queryFn: async () => {
      const { data } = await supabase
        .from('deals')
        .select('*, products(name), blogger:profiles!deals_blogger_id_fkey(name), seller:profiles!deals_seller_id_fkey(name)')
        .order('updated_at', { ascending: false });
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('deals').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      toast({ title: 'Статус обновлён' });
    },
  });

  const filtered = deals?.filter((d: any) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.products?.name?.toLowerCase().includes(q) || d.blogger?.name?.toLowerCase().includes(q) || d.seller?.name?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <DashboardLayout title="Все сделки">
      <div className="space-y-4 animate-fade-in">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Поиск по товару или участнику..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {allStatuses.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading && <p className="text-muted-foreground">Загрузка...</p>}
        {filtered?.map((deal: any) => (
          <Card key={deal.id} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{deal.products?.name || 'Товар'}</p>
                  <p className="text-xs text-muted-foreground">
                    {deal.blogger?.name || '—'} ↔ {deal.seller?.name || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(deal.updated_at).toLocaleDateString('ru')}
                  </p>
                </div>
                <Select value={deal.status} onValueChange={status => updateStatus.mutate({ id: deal.id, status })}>
                  <SelectTrigger className="w-[150px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allStatuses.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {deal.content_url && (
                <a href={deal.content_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-2 flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Контент
                </a>
              )}
            </CardContent>
          </Card>
        ))}
        {!isLoading && filtered?.length === 0 && (
          <p className="text-muted-foreground text-center py-8">Сделок не найдено</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDeals;
