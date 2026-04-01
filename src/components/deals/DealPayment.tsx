import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Banknote, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  dealId: string;
  currentAmount: number | null;
  currentStatus: string | null;
  currentNote: string | null;
  isSeller: boolean;
}

const DealPayment = ({ dealId, currentAmount, currentStatus, currentNote, isSeller }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(currentAmount?.toString() || '');
  const [note, setNote] = useState(currentNote || '');

  const saveMutation = useMutation({
    mutationFn: async (status: string) => {
      const payload: any = { payment_status: status };
      if (status === 'set') {
        payload.payment_amount = Number(amount) || 0;
        payload.payment_note = note || null;
      }
      if (status === 'paid') payload.payment_status = 'paid';
      const { error } = await supabase.from('deals').update(payload).eq('id', dealId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-deals'] });
      queryClient.invalidateQueries({ queryKey: ['blogger-deals'] });
      setOpen(false);
      toast({ title: 'Оплата обновлена!' });
    },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  if (!isSeller && !currentAmount) return null;

  // Display-only for blogger
  if (!isSeller && currentAmount) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Banknote className="h-3 w-3 text-primary" />
        <span>{currentAmount} ₽</span>
        <Badge variant={currentStatus === 'paid' ? 'default' : 'secondary'} className="text-[10px]">
          {currentStatus === 'paid' ? 'Оплачено' : 'Ожидание'}
        </Badge>
        {currentNote && <span className="text-muted-foreground truncate max-w-[120px]">{currentNote}</span>}
      </div>
    );
  }

  return (
    <>
      {currentAmount ? (
        <div className="flex items-center gap-2 text-xs">
          <Banknote className="h-3 w-3 text-primary" />
          <span>{currentAmount} ₽</span>
          <Badge variant={currentStatus === 'paid' ? 'default' : 'secondary'} className="text-[10px]">
            {currentStatus === 'paid' ? 'Оплачено' : 'Назначено'}
          </Badge>
          {currentStatus !== 'paid' && (
            <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => saveMutation.mutate('paid')}>
              <CheckCircle2 className="h-3 w-3 mr-0.5" /> Оплачено
            </Button>
          )}
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              <Banknote className="h-3 w-3 mr-1" /> Доплата
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Назначить доплату</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Сумма (₽)</Label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="500" />
              </div>
              <div>
                <Label>Комментарий</Label>
                <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="За что доплата..." rows={2} />
              </div>
              <Button className="w-full" disabled={!amount || saveMutation.isPending} onClick={() => saveMutation.mutate('set')}>
                {saveMutation.isPending ? 'Сохранение...' : 'Назначить'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default DealPayment;
