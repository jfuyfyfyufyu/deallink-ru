import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const statusLabels: Record<string, string> = {
  requested: 'Новая заявка',
  counter_proposed: 'Блогер предложил правки',
  approved: 'Заявка одобрена',
  ordered: 'Товар заказан',
  in_pvz: 'Заказ в ПВЗ',
  picked_up: 'Посылка забрана',
  filming: 'Съёмка контента',
  review_posted: 'Контент опубликован',
  finished: 'Сделка завершена',
  cancelled: 'Сделка отменена',
};

export function useDealsRealtime() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('deals-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deals' },
        (payload) => {
          const deal = payload.new as any;
          const old = payload.old as any;

          // Only notify if status actually changed
          if (deal.status === old.status) return;

          // Notify if user is participant
          const isParticipant = deal.seller_id === user.id || deal.blogger_id === user.id;
          if (!isParticipant) return;

          const label = statusLabels[deal.status] || deal.status;
          // Don't show toast if the current user made the change
          // We detect this: if I'm the blogger and the status is one bloggers typically set, skip
          const bloggerStatuses = ['ordered', 'in_pvz', 'picked_up', 'filming', 'counter_proposed'];
          const sellerStatuses = ['approved', 'finished', 'cancelled'];
          const iAmBlogger = deal.blogger_id === user.id;
          const iAmSeller = deal.seller_id === user.id;
          
          // If I'm blogger and the new status is typically set by blogger — it's my own action, skip
          if (iAmBlogger && bloggerStatuses.includes(deal.status)) return;
          if (iAmSeller && sellerStatuses.includes(deal.status)) return;

          const changedBy = iAmBlogger ? 'Селлер' : 'Блогер';
          toast({
            title: '📦 ' + label,
            description: `${changedBy} обновил статус сделки`,
          });

          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['seller-deals'] });
          queryClient.invalidateQueries({ queryKey: ['seller-applications'] });
          queryClient.invalidateQueries({ queryKey: ['blogger-deals'] });
          queryClient.invalidateQueries({ queryKey: ['seller-active-deals'] });
          queryClient.invalidateQueries({ queryKey: ['seller-deals-count'] });
          queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deals' },
        (payload) => {
          const deal = payload.new as any;
          if (deal.seller_id === user.id) {
            toast({ title: '🆕 Новая заявка!', description: 'Блогер подал заявку на бартер' });
          }
          queryClient.invalidateQueries({ queryKey: ['seller-applications'] });
          queryClient.invalidateQueries({ queryKey: ['seller-deals-count'] });
          queryClient.invalidateQueries({ queryKey: ['blogger-my-deals'] });
          queryClient.invalidateQueries({ queryKey: ['admin-deals'] });
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
}
