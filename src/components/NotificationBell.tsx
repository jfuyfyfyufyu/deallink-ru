import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const NotificationBell = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  const unread = notifications?.filter((n: any) => !n.is_read).length || 0;

  const markRead = useMutation({
    mutationFn: async () => {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-bell')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'сейчас';
    if (mins < 60) return `${mins} мин`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ч`;
    return `${Math.floor(hrs / 24)} д`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9" onClick={() => unread > 0 && markRead.mutate()}>
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b">
          <p className="font-semibold text-sm">Уведомления</p>
        </div>
        <ScrollArea className="max-h-72">
          {notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((n: any) => (
                <div key={n.id} className={cn('p-3 text-sm', !n.is_read && 'bg-primary/5')}>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{n.message}</p>
                  <p className="text-muted-foreground text-[10px] mt-1">{timeAgo(n.created_at)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm py-6">Нет уведомлений</p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
