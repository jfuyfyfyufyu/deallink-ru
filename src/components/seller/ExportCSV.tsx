import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const STATUS_LABELS: Record<string, string> = {
  requested: 'Заявка', approved: 'Одобрено', ordered: 'Заказано',
  in_pvz: 'В ПВЗ', picked_up: 'Забрал', filming: 'Снимает',
  review_posted: 'Отзыв опубл.', finished: 'Завершено', cancelled: 'Отмена',
};

const ExportCSV = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: deals } = await supabase
        .from('deals')
        .select('id, status, created_at, updated_at, views_count, click_count, utm_url, order_number, products(name, marketplace_url), blogger:profiles!deals_blogger_id_fkey(name, telegram_id)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (!deals?.length) {
        toast({ title: 'Нет данных для экспорта' });
        return;
      }

      const headers = ['ID', 'Товар', 'Блогер', 'Telegram', 'Статус', 'Заказ', 'Просмотры', 'Клики', 'Конверсия %', 'UTM', 'Создана', 'Обновлена'];
      const rows = deals.map((d: any) => {
        const conv = d.views_count && d.click_count ? ((d.click_count / d.views_count) * 100).toFixed(1) : '';
        return [
          d.id.slice(0, 8),
          d.products?.name || '',
          d.blogger?.name || '',
          d.blogger?.telegram_id || '',
          STATUS_LABELS[d.status] || d.status,
          d.order_number || '',
          d.views_count || 0,
          d.click_count || 0,
          conv,
          d.utm_url || '',
          new Date(d.created_at).toLocaleDateString('ru-RU'),
          new Date(d.updated_at).toLocaleDateString('ru-RU'),
        ];
      });

      const bom = '\uFEFF';
      const csv = bom + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deals_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'CSV экспортирован!' });
    } catch (e: any) {
      toast({ title: 'Ошибка экспорта', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
      <Download className="h-4 w-4 mr-1" />
      {loading ? 'Экспорт...' : 'CSV'}
    </Button>
  );
};

export default ExportCSV;
