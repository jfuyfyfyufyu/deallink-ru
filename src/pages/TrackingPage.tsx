import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Package, CheckCircle2, Camera, Eye, Upload, Truck, MapPin, PackageOpen, Film, FileCheck } from 'lucide-react';

const statusSteps = [
  { key: 'approved', label: 'Одобрено', icon: CheckCircle2 },
  { key: 'ordered', label: 'Заказано', icon: Package },
  { key: 'in_pvz', label: 'В ПВЗ', icon: MapPin },
  { key: 'picked_up', label: 'Забрал', icon: PackageOpen },
  { key: 'filming', label: 'Снимает', icon: Film },
  { key: 'review_posted', label: 'Отзыв', icon: FileCheck },
  { key: 'finished', label: 'Готово', icon: Eye },
];

const TrackingPage = () => {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [orderNumber, setOrderNumber] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [viewsCount, setViewsCount] = useState('');
  const [uploading, setUploading] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: deal, isLoading } = useQuery({
    queryKey: ['tracking', token],
    queryFn: async () => {
      const { data } = await supabase
        .from('deals')
        .select('*, products(name, marketplace_url)')
        .eq('tracking_token', token)
        .single();
      return data;
    },
    enabled: !!token,
  });

  const updateStatus = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase.from('deals').update(updates).eq('tracking_token', token);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking', token] });
      toast({ title: 'Статус обновлён!' });
    },
    onError: (e: any) => toast({ title: 'Ошибка', description: e.message, variant: 'destructive' }),
  });

  const uploadScreenshot = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `screenshots/${token}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('proofs').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('proofs').getPublicUrl(path);
      setScreenshotPreview(urlData.publicUrl);
      return urlData.publicUrl;
    } catch (e: any) {
      toast({ title: 'Ошибка загрузки', description: e.message, variant: 'destructive' });
      return null;
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Загрузка...</p></div>;
  if (!deal) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Сделка не найдена</p></div>;

  const currentStep = statusSteps.findIndex(s => s.key === deal.status);

  return (
    <div className="min-h-screen bg-background p-4 max-w-md mx-auto">
      <div className="space-y-6 animate-fade-in">
        <div className="text-center pt-6">
          <h1 className="text-xl font-bold">Отслеживание сделки</h1>
          <p className="text-muted-foreground text-sm mt-1">{(deal as any).products?.name}</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-between px-0">
          {statusSteps.map((step, i) => (
            <div key={step.key} className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <div className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-xs transition-colors ${
                i <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <step.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
              <span className="text-[8px] sm:text-[9px] text-muted-foreground text-center leading-tight truncate w-full px-0.5">{step.label}</span>
            </div>
          ))}
        </div>

        {/* Step: Order the product */}
        {deal.status === 'approved' && (
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Заказать товар</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(deal as any).products?.marketplace_url && (
                <a href={(deal as any).products.marketplace_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block">
                  Открыть на маркетплейсе →
                </a>
              )}
              <div><Label>Номер заказа</Label><Input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="WB-123456" /></div>
              <div>
                <Label>Скриншот заказа (опционально)</Label>
                <input type="file" ref={fileRef} accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) uploadScreenshot(f); }} className="hidden" />
                <Button variant="outline" className="w-full mt-1" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Загрузка...' : screenshotPreview ? 'Файл загружен ✓' : 'Загрузить скриншот'}
                </Button>
                {screenshotPreview && <img src={screenshotPreview} alt="Screenshot" className="mt-2 rounded-lg max-h-40 w-full object-cover" />}
              </div>
              <Button className="w-full" onClick={() => updateStatus.mutate({
                status: 'ordered', order_number: orderNumber,
                ...(screenshotPreview ? { order_screenshot_url: screenshotPreview } : {}),
              })} disabled={!orderNumber || updateStatus.isPending}>
                {updateStatus.isPending ? 'Обновление...' : 'Я заказал товар'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: In PVZ */}
        {deal.status === 'ordered' && (
          <Card className="glass-card">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium">Заказ оформлен</p>
              {deal.order_number && <p className="text-sm text-muted-foreground">Номер: {deal.order_number}</p>}
              <Button className="w-full" onClick={() => updateStatus.mutate({ status: 'in_pvz' })} disabled={updateStatus.isPending}>
                <MapPin className="h-4 w-4 mr-2" /> Заказ в ПВЗ
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Picked up */}
        {deal.status === 'in_pvz' && (
          <Card className="glass-card">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium">Заказ ждёт в ПВЗ</p>
              <Button className="w-full" onClick={() => updateStatus.mutate({ status: 'picked_up' })} disabled={updateStatus.isPending}>
                <PackageOpen className="h-4 w-4 mr-2" /> Забрал посылку
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Filming */}
        {deal.status === 'picked_up' && (
          <Card className="glass-card">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium">Посылка у вас</p>
              <Button className="w-full" onClick={() => updateStatus.mutate({ status: 'filming' })} disabled={updateStatus.isPending}>
                <Film className="h-4 w-4 mr-2" /> Снимаю ролик
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Review posted */}
        {deal.status === 'filming' && (
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Публикация</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Ссылка на контент</Label><Input value={contentUrl} onChange={e => setContentUrl(e.target.value)} placeholder="https://..." /></div>
              <Button className="w-full" onClick={() => updateStatus.mutate({ status: 'review_posted', content_url: contentUrl })} disabled={!contentUrl || updateStatus.isPending}>
                {updateStatus.isPending ? 'Обновление...' : 'Отзыв опубликован'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Final views */}
        {deal.status === 'review_posted' && (
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Финальные охваты</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Количество просмотров</Label><Input type="number" value={viewsCount} onChange={e => setViewsCount(e.target.value)} placeholder="0" /></div>
              <Button className="w-full" onClick={() => updateStatus.mutate({ status: 'finished', views_count: Number(viewsCount) || 0 })} disabled={updateStatus.isPending}>
                {updateStatus.isPending ? 'Обновление...' : 'Завершить сделку'}
              </Button>
            </CardContent>
          </Card>
        )}

        {deal.status === 'finished' && (
          <Card className="glass-card border-primary/30">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-2" />
              <p className="font-semibold">Сделка завершена!</p>
              {deal.content_url && (
                <a href={deal.content_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-1 block">
                  Посмотреть контент →
                </a>
              )}
              {deal.views_count != null && deal.views_count > 0 && (
                <p className="text-sm text-muted-foreground mt-1">{deal.views_count} просмотров</p>
              )}
            </CardContent>
          </Card>
        )}

        {deal.status === 'cancelled' && (
          <Card className="glass-card border-destructive/30">
            <CardContent className="p-4 text-center">
              <p className="font-semibold text-destructive">Сделка отменена</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TrackingPage;
