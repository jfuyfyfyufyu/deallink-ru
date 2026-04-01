import DashboardLayout from '@/components/DashboardLayout';
import { CardListSkeleton } from '@/components/ui/skeletons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Search } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDealsRealtime } from '@/hooks/use-deals-realtime';
import { HUMAN_STATUS } from '@/components/deals/deal-utils';

const allStatuses = Object.keys(HUMAN_STATUS);

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
        .select('*, products(name)')
        .order('updated_at', { ascending: false });
      if (!data || data.length === 0) return [];
      // Fetch blogger & seller profiles separately (no FK exists)
      const bloggerIds = [...new Set(data.map((d: any) => d.blogger_id))];
      const sellerIds = [...new Set(data.map((d: any) => d.seller_id))];
      const allIds = [...new Set([...bloggerIds, ...sellerIds])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', allIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.name]));
      return data.map((d: any) => ({
        ...d,
        blogger_name: profileMap.get(d.blogger_id) || '—',
        seller_name: profileMap.get(d.seller_id) || '—',
      }));
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase.from('deals').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select('id').single();
      if (error) throw error;
      if (!data) throw new Error('Не удалось обновить сделку');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
      toast({ title: 'Статус обновлён' });
    },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const filtered = deals?.filter((d: any) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (d.products?.name || '').toLowerCase().includes(q) ||
        (d.blogger_name || '').toLowerCase().includes(q) ||
        (d.seller_name || '').toLowerCase().includes(q);
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
              {allStatuses.map(s => {
                const h = HUMAN_STATUS[s];
                return <SelectItem key={s} value={s}>{h?.emoji} {h?.label || s}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>

        {isLoading && <CardListSkeleton />}
        {filtered?.map((deal: any) => {
          const h = HUMAN_STATUS[deal.status] || { emoji: '', label: deal.status };
          return (
            <Card key={deal.id} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{deal.products?.name || 'Товар'}</p>
                    <p className="text-xs text-muted-foreground">
                      {deal.blogger_name} ↔ {deal.seller_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(deal.updated_at).toLocaleDateString('ru')}
                    </p>
                  </div>
                  <Select value={deal.status} onValueChange={status => updateStatus.mutate({ id: deal.id, status })}>
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                      <SelectValue>{h.emoji} {h.label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {allStatuses.map(s => {
                        const sh = HUMAN_STATUS[s];
                        return <SelectItem key={s} value={s}>{sh?.emoji} {sh?.label || s}</SelectItem>;
                      })}
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
          );
        })}
        {!isLoading && filtered?.length === 0 && (
          <p className="text-muted-foreground text-center py-8">Сделок не найдено</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDeals;