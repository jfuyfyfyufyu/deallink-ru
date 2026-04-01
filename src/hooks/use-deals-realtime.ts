import { useEffect, useRef, useCallback } from 'react';
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
  const { user, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingKeys = useRef(new Set<string>());

  const debouncedInvalidate = useCallback((...keys: string[]) => {
    keys.forEach(k => pendingKeys.current.add(k));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const toInvalidate = [...pendingKeys.current];
      pendingKeys.current.clear();
      toInvalidate.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    }, 500);
  }, [queryClient]);

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

          if (deal.status === old.status) return;

          const isParticipant = deal.seller_id === user.id || deal.blogger_id === user.id;
          if (!isParticipant && role !== 'admin') return;

          const label = statusLabels[deal.status] || deal.status;
          const bloggerStatuses = ['ordered', 'in_pvz', 'picked_up', 'filming', 'counter_proposed'];
          const sellerStatuses = ['approved', 'finished', 'cancelled'];
          const iAmBlogger = deal.blogger_id === user.id;
          const iAmSeller = deal.seller_id === user.id;

          if (iAmBlogger && bloggerStatuses.includes(deal.status)) return;
          if (iAmSeller && sellerStatuses.includes(deal.status)) return;

          const changedBy = iAmBlogger ? 'Селлер' : 'Блогер';
          toast({
            title: '📦 ' + label,
            description: `${changedBy} обновил статус сделки`,
          });

          // Role-aware invalidation — only invalidate what the current user sees
          if (role === 'admin') {
            debouncedInvalidate('admin-deals', 'admin-stats');
          } else if (role === 'seller') {
            debouncedInvalidate('seller-deals', 'seller-applications', 'seller-active-deals', 'seller-deals-count');
          } else {
            debouncedInvalidate('blogger-deals');
          }
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

          if (role === 'admin') {
            debouncedInvalidate('admin-deals', 'admin-stats');
          } else if (role === 'seller') {
            debouncedInvalidate('seller-applications', 'seller-deals-count');
          } else {
            debouncedInvalidate('blogger-my-deals');
          }
        }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [user?.id, role]); // eslint-disable-line react-hooks/exhaustive-deps
}
