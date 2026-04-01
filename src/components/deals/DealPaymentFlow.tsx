import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getPaymentStatus, PAYMENT_STATUS_DISPLAY } from './deal-utils';
import { Copy, Upload, CheckCircle2, XCircle, CreditCard } from 'lucide-react';

interface Props {
  deal: any;
  isSeller: boolean;
  userId: string;
}

const DealPaymentFlow = ({ deal, isSeller, userId }: Props) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const ps = getPaymentStatus(deal);
  const display = PAYMENT_STATUS_DISPLAY[ps];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'details' | 'pay'>('details');
  const [cardNumber, setCardNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [holderName, setHolderName] = useState('');
  const [amount, setAmount] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const productName = deal.products?.name || 'товар';
  const bloggerName = deal.blogger?.name || 'Блогер';
  const sellerName = deal.seller?.name || 'Селлер';

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['seller-deals'] });
    qc.invalidateQueries({ queryKey: ['blogger-deals'] });
  };

  const notify = (targetUserId: string, title: string, message: string, inline_keyboard?: any[]) => {
    supabase.functions.invoke('telegram-notify', {
      body: { user_id: targetUserId, title, message, inline_keyboard },
    }).catch(() => {});
  };

  const updateDeal = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase.from('deals').update(updates).eq('id', deal.id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setDialogOpen(false); toast({ title: 'Обновлено!' }); },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const uploadFile = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `payment-proofs/${userId}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('proofs').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('proofs').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setScreenshotUrl(url);
    } catch (e: any) {
      toast({ title: 'Ошибка загрузки', description: e.message, variant: 'destructive' });
    } finally { setUploading(false); }
  };

  // Show payment block when deal is approved (regardless of payment_amount)
  if (deal.status !== 'approved') {
    // After approved, show summary only if payment was made
    if (ps === 'confirmed' && deal.payment_amount) {
      return (
        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">{deal.payment_amount} ₽</span>
            </div>
            <span className="text-xs font-medium text-emerald-500">Оплачено</span>
          </div>
        </div>
      );
    }
    return null;
  }

  const details = deal.payment_details as { card?: string; bank?: string; holder?: string } | null;

  const openDialog = (type: 'details' | 'pay') => {
    setDialogType(type);
    setDialogOpen(true);
    setScreenshotUrl(null);
    setCardNumber('');
    setBankName('');
    setHolderName('');
    setAmount('');
  };

  const copyDetails = () => {
    if (details?.card) {
      navigator.clipboard.writeText(details.card);
      toast({ title: 'Скопировано!' });
    }
  };

  // Request advance handler with notification
  const handleRequestAdvance = () => {
    updateDeal.mutate({
      payment_status: 'details_sent',
      payment_requested_at: new Date().toISOString(),
      payment_amount: parseFloat(amount),
      payment_details: { card: cardNumber, bank: bankName || null, holder: holderName },
    }, {
      onSuccess: () => {
        invalidate();
        setDialogOpen(false);
        toast({ title: 'Обновлено!' });
        // Notify seller
        notify(
          deal.seller_id,
          '💳 Запрос аванса',
          `Блогер ${bloggerName} запросил аванс ${amount} ₽ по товару «${productName}».\n\nРеквизиты:\n💳 ${cardNumber}\n🏦 ${bankName || '—'}\n👤 ${holderName}`,
          [[{ text: '💸 Открыть сделки', url: `${window.location.origin}/seller/deals` }]],
        );
      },
    });
  };

  // Seller paid handler with notification
  const handleSellerPaid = () => {
    updateDeal.mutate({
      payment_status: 'paid_pending',
      payment_screenshot_url: screenshotUrl,
    }, {
      onSuccess: () => {
        invalidate();
        setDialogOpen(false);
        toast({ title: 'Обновлено!' });
        // Notify blogger with inline buttons
        notify(deal.blogger_id, '💸 Аванс оплачен',
          `Селлер ${sellerName} оплатил аванс по товару «${productName}». Проверьте получение.`,
          [[
            { text: '✅ Получил', url: `${window.location.origin}/blogger/deals` },
            { text: '❌ Не получил', url: `${window.location.origin}/blogger/deals` },
          ]]);
      },
    });
  };

  // Blogger confirm payment
  const handleConfirmPayment = () => {
    updateDeal.mutate({ payment_status: 'confirmed', payment_confirmed_at: new Date().toISOString() }, {
      onSuccess: () => {
        invalidate();
        toast({ title: 'Обновлено!' });
        notify(deal.seller_id, '✅ Оплата подтверждена',
          `Блогер ${bloggerName} подтвердил получение оплаты по товару «${productName}»`,
          [[{ text: '📋 Открыть сделки', url: `${window.location.origin}/seller/deals` }]]);
      },
    });
  };

  // Blogger deny payment
  const handleDenyPayment = () => {
    updateDeal.mutate({ payment_status: 'problem' }, {
      onSuccess: () => {
        invalidate();
        toast({ title: 'Обновлено!' });
        notify(deal.seller_id, '❌ Проблема с оплатой',
          `Блогер ${bloggerName} сообщил о проблеме с получением оплаты по товару «${productName}»`);
      },
    });
  };

  return (
    <>
      <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">
              {deal.payment_amount ? `${deal.payment_amount} ₽` : 'Аванс'}
            </span>
          </div>
          <span className={`text-xs font-medium ${display.color}`}>
            {display.emoji} {display.label}
          </span>
        </div>

        {/* Show details if available (for seller when details_sent) */}
        {details?.card && isSeller && (ps === 'details_sent' || ps === 'paying') && (
          <div className="bg-background rounded-md p-2 text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Реквизиты</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={copyDetails}>
                <Copy className="h-3 w-3 mr-1" /> Скопировать
              </Button>
            </div>
            <p className="font-mono font-medium">{details.card}</p>
            {details.bank && <p className="text-muted-foreground text-xs">{details.bank}</p>}
            {details.holder && <p className="text-muted-foreground text-xs">{details.holder}</p>}
            {deal.payment_amount && <p className="text-sm font-medium mt-1">Сумма: {deal.payment_amount} ₽</p>}
          </div>
        )}

        {/* Payment screenshot */}
        {deal.payment_screenshot_url && (ps === 'paid_pending' || ps === 'confirmed') && (
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Скриншот оплаты:</span>
            <img
              src={deal.payment_screenshot_url}
              alt="Оплата"
              className="rounded-md max-h-24 w-full object-cover cursor-pointer"
              onClick={() => window.open(deal.payment_screenshot_url, '_blank')}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {/* Blogger: request advance (send details + amount) */}
          {!isSeller && ps === 'none' && (
            <Button size="sm" className="flex-1 text-xs" onClick={() => openDialog('details')}>
              Запросить аванс
            </Button>
          )}

          {/* Seller: pay */}
          {isSeller && (ps === 'details_sent' || ps === 'paying') && (
            <Button size="sm" className="flex-1 text-xs" onClick={() => openDialog('pay')}>
              Я оплатил
            </Button>
          )}

          {/* Blogger: confirm/deny payment */}
          {!isSeller && ps === 'paid_pending' && (
            <>
              <Button size="sm" className="flex-1 text-xs" onClick={handleConfirmPayment}>
                <CheckCircle2 className="h-3 w-3 mr-1" /> Получил
              </Button>
              <Button size="sm" variant="destructive" className="flex-1 text-xs" onClick={handleDenyPayment}>
                <XCircle className="h-3 w-3 mr-1" /> Не получил
              </Button>
            </>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClick={e => e.stopPropagation()} onPointerDownOutside={e => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'details' && 'Запросить аванс'}
              {dialogType === 'pay' && 'Подтверждение оплаты'}
            </DialogTitle>
          </DialogHeader>

          {dialogType === 'details' && (
            <div className="space-y-3">
              <div>
                <Label>Сумма аванса (₽) *</Label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="2000" />
              </div>
              <div>
                <Label>Номер карты / телефон *</Label>
                <Input value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="+7 999 123-45-67 или 4276..." />
              </div>
              <div>
                <Label>Банк</Label>
                <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Сбербанк" />
              </div>
              <div>
                <Label>ФИО получателя *</Label>
                <Input value={holderName} onChange={e => setHolderName(e.target.value)} placeholder="Иванов Иван Иванович" />
              </div>
              <Button
                className="w-full"
                disabled={!cardNumber || !amount || !holderName || updateDeal.isPending}
                onClick={handleRequestAdvance}
              >
                {updateDeal.isPending ? 'Отправка...' : 'Отправить запрос'}
              </Button>
            </div>
          )}

          {dialogType === 'pay' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Загрузите скриншот перевода</p>
              <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
              <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Upload className="h-4 w-4 mr-2" />{uploading ? 'Загрузка...' : screenshotUrl ? 'Загружено ✓' : 'Загрузить скриншот'}
              </Button>
              {screenshotUrl && <img src={screenshotUrl} alt="" className="rounded-lg max-h-32 w-full object-cover" />}
              <Button
                className="w-full"
                disabled={!screenshotUrl || updateDeal.isPending}
                onClick={handleSellerPaid}
              >
                {updateDeal.isPending ? 'Отправка...' : 'Подтвердить оплату'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DealPaymentFlow;
