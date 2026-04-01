import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface DealApprovalActionsProps {
  dealId: string;
  senderId: string;
  type: 'content' | 'review';
  bloggerId?: string;
  sellerId?: string;
  productName?: string;
  onDone?: () => void;
}

const DealApprovalActions = ({ dealId, senderId, type, bloggerId, sellerId, productName, onDone }: DealApprovalActionsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  const field = type === 'content' ? 'content_status' : 'review_status';
  const label = type === 'content' ? 'контент' : 'отзыв';
  const labelCap = type === 'content' ? 'Контент' : 'Отзыв';

  const notify = (targetUserId: string, title: string, message: string, inline_keyboard?: any[]) => {
    supabase.functions.invoke('telegram-notify', {
      body: { user_id: targetUserId, title, message, inline_keyboard },
    }).catch(() => {});
  };

  const approve = useMutation({
    mutationFn: async () => {
      const { error: dealErr } = await supabase.from('deals').update({ [field]: 'approved' }).eq('id', dealId);
      if (dealErr) throw dealErr;
      await supabase.from('deal_messages').insert({
        deal_id: dealId,
        sender_id: senderId,
        message: null,
        message_type: `${type}_approved`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-deals'] });
      queryClient.invalidateQueries({ queryKey: ['blogger-deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal-messages', dealId] });
      toast({ title: `${labelCap} одобрен!` });
      // Notify blogger
      if (bloggerId && productName) {
        notify(bloggerId, `✅ ${labelCap} одобрен`,
          `Селлер одобрил ${label} по товару «${productName}»`,
          [[{ text: '📋 Открыть сделки', url: `${window.location.origin}/blogger/deals` }]]);
      }
      onDone?.();
    },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const reject = useMutation({
    mutationFn: async () => {
      const { error: dealErr } = await supabase.from('deals').update({ [field]: 'rejected' }).eq('id', dealId);
      if (dealErr) throw dealErr;
      await supabase.from('deal_messages').insert({
        deal_id: dealId,
        sender_id: senderId,
        message: reason || 'Без комментария',
        message_type: `${type}_rejected`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-deals'] });
      queryClient.invalidateQueries({ queryKey: ['blogger-deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal-messages', dealId] });
      toast({ title: `${labelCap} отклонён` });
      // Notify blogger
      if (bloggerId && productName) {
        notify(bloggerId, `❌ ${labelCap} отклонён`,
          `Селлер отклонил ${label} по товару «${productName}».\n\nПричина: ${reason || 'Без комментария'}`,
          [[{ text: '📋 Открыть сделки', url: `${window.location.origin}/blogger/deals` }]]);
      }
      setRejectOpen(false);
      setReason('');
      onDone?.();
    },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => approve.mutate()} disabled={approve.isPending} className="flex-1">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Одобрить {label}
        </Button>
        <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)} className="flex-1">
          <XCircle className="h-3 w-3 mr-1" /> Отклонить
        </Button>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Причина отклонения</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Опишите, что нужно исправить..." />
            <Button className="w-full" variant="destructive" onClick={() => reject.mutate()} disabled={!reason.trim() || reject.isPending}>
              {reject.isPending ? 'Отклонение...' : 'Отклонить'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DealApprovalActions;
