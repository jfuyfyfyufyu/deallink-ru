import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { useDealsRealtime } from '@/hooks/use-deals-realtime';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Star, Users, CalendarIcon, FileText } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

const SellerApplications = () => {
  const { user } = useAuth();
  useDealsRealtime();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [approveApp, setApproveApp] = useState<any>(null);
  const [requirements, setRequirements] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);

  const { data: applications, isLoading } = useQuery({
    queryKey: ['seller-applications', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('deals')
        .select('*, products(name, requirements, deadline_days), blogger:profiles!deals_blogger_id_fkey(name, trust_score, niche, subscribers_count, content_formats, bio)')
        .eq('seller_id', user!.id)
        .eq('status', 'requested')
        .eq('initiated_by', 'blogger')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const updateDeal = useMutation({
    mutationFn: async ({ id, status, updates, bloggerId, productName }: { id: string; status: string; updates?: Record<string, any>; bloggerId?: string; productName?: string }) => {
      const { error } = await supabase.from('deals').update({ status, ...updates }).eq('id', id);
      if (error) throw error;
      return { bloggerId, productName, status };
    },
    onSuccess: (result, vars) => {
      queryClient.invalidateQueries({ queryKey: ['seller-applications'] });
      queryClient.invalidateQueries({ queryKey: ['seller-deals'] });
      toast({ title: vars.status === 'approved' ? 'Заявка одобрена!' : 'Заявка отклонена' });
      if (vars.status === 'cancelled' && result?.bloggerId) {
        supabase.functions.invoke('telegram-notify', {
          body: {
            user_id: result.bloggerId,
            title: '❌ Заявка отклонена',
            message: `К сожалению, ваша заявка на товар «${result.productName || ''}» была отклонена селлером.`,
          },
        }).catch(() => {});
      }
    },
  });

  const openApproveDialog = (app: any) => {
    setApproveApp(app);
    setRequirements((app.products as any)?.requirements || '');
    const days = (app.products as any)?.deadline_days;
    setDeadline(days ? addDays(new Date(), days) : undefined);
  };

  const handleApprove = () => {
    if (!approveApp) return;
    const originalReq = (approveApp.products as any)?.requirements || '';
    if (requirements !== originalReq) {
      supabase.from('products').update({ requirements }).eq('id', approveApp.product_id).then(null, () => {});
    }
    updateDeal.mutate({
      id: approveApp.id,
      status: 'approved',
      updates: { deadline_final: deadline?.toISOString() || null },
    });
    // Notify blogger via Telegram
    supabase.functions.invoke('telegram-notify', {
      body: {
        user_id: approveApp.blogger_id,
        title: '✅ Заявка одобрена!',
        message: `Ваша заявка на товар «${(approveApp.products as any)?.name || ''}» одобрена селлером. Перейдите в раздел "Мои сделки" для дальнейших действий.`,
      },
    }).catch(() => {});
    setApproveApp(null);
  };

  return (
    <DashboardLayout title="Заявки блогеров">
      <div className="space-y-3 animate-fade-in">
        {isLoading && <p className="text-muted-foreground">Загрузка...</p>}
        {applications?.map((app: any) => (
          <Card key={app.id} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                  {(app.blogger?.name || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{app.blogger?.name || 'Блогер'}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-accent fill-accent" />
                      {Number(app.blogger?.trust_score || 0).toFixed(1)}
                    </span>
                    {(app.blogger as any)?.subscribers_count > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Users className="h-3 w-3" />
                        {(app.blogger as any).subscribers_count.toLocaleString()}
                      </span>
                    )}
                    {(app.blogger as any)?.niche && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{(app.blogger as any).niche}</Badge>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">{app.products?.name}</Badge>
              </div>

              {(app.blogger as any)?.bio && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{(app.blogger as any).bio}</p>
              )}
              {(app.blogger as any)?.content_formats?.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-3">
                  {((app.blogger as any).content_formats as string[]).map((f) => (
                    <Badge key={f} variant="outline" className="text-[10px] px-1.5 py-0">{f}</Badge>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground italic mb-3">
                Telegram-контакт станет доступен после одобрения
              </p>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => openApproveDialog(app)} disabled={updateDeal.isPending}>
                  <FileText className="h-4 w-4 mr-1" /> Рассмотреть
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateDeal.mutate({ id: app.id, status: 'cancelled', bloggerId: app.blogger_id, productName: app.products?.name })} disabled={updateDeal.isPending}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && applications?.length === 0 && (
          <p className="text-muted-foreground text-center py-8">Нет новых заявок</p>
        )}
      </div>

      {/* Approve dialog with ТЗ and deadline editing */}
      <Dialog open={!!approveApp} onOpenChange={v => { if (!v) setApproveApp(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Одобрение заявки — {approveApp?.products?.name}</DialogTitle>
          </DialogHeader>
          {approveApp && (
            <div className="space-y-4">
              {/* Blogger info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                  {(approveApp.blogger?.name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">{approveApp.blogger?.name || 'Блогер'}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-accent fill-accent" />
                      {Number(approveApp.blogger?.trust_score || 0).toFixed(1)}
                    </span>
                    {(approveApp.blogger as any)?.subscribers_count > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Users className="h-3 w-3" />
                        {(approveApp.blogger as any).subscribers_count.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ТЗ editing */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><FileText className="h-4 w-4" /> Техническое задание</Label>
                <Textarea
                  value={requirements}
                  onChange={e => setRequirements(e.target.value)}
                  placeholder="Опишите требования к блогеру: что снять, как показать товар..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">Блогер увидит это ТЗ после одобрения</p>
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Дедлайн выполнения</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !deadline && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, 'dd.MM.yyyy') : 'Выберите дату'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={deadline} onSelect={setDeadline} disabled={(date) => date < new Date()} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">К какой дате блогер должен завершить задание</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={handleApprove} disabled={updateDeal.isPending}>
                  <Check className="h-4 w-4 mr-1" /> Одобрить
                </Button>
                <Button variant="outline" onClick={() => setApproveApp(null)}>Отмена</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SellerApplications;
