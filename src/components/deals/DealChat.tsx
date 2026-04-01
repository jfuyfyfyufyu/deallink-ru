import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface DealChatProps {
  dealId: string;
  currentUserId: string;
  bloggerId?: string;
  sellerId?: string;
}


const DealChat = ({ dealId, currentUserId, bloggerId, sellerId }: DealChatProps) => {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useQuery({
    queryKey: ['deal-messages', dealId],
    queryFn: async () => {
      const { data } = await supabase
        .from('deal_messages')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: true });
      return data || [];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`deal-messages-${dealId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'deal_messages',
        filter: `deal_id=eq.${dealId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['deal-messages', dealId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dealId, queryClient]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!newMessage.trim()) return;
      const { error } = await supabase.from('deal_messages').insert({
        deal_id: dealId,
        sender_id: currentUserId,
        message: newMessage.trim(),
        message_type: 'text',
      });
      if (error) throw error;
    },
    onSuccess: async (_, __, context) => {
      const msgText = newMessage.trim();
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['deal-messages', dealId] });

      // Fire-and-forget Telegram notification to the other participant
      const otherUserId = currentUserId === bloggerId ? sellerId : bloggerId;
      if (otherUserId && msgText) {
        try {
          await supabase.functions.invoke('telegram-notify', {
            body: {
              user_id: otherUserId,
              title: 'Новое сообщение в сделке',
              message: msgText.length > 200 ? msgText.slice(0, 200) + '...' : msgText,
            },
          });
        } catch {
          // Notification is best-effort, don't block chat
        }
      }
    },
  });

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage.mutate();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 max-h-[300px] p-3" ref={scrollRef}>
        <div className="space-y-2">
          {messages?.filter((msg: any) => ['text', 'counter_proposal', 'order_proof', 'pickup_proof', 'payment_proof', 'content_submitted', 'review_submitted', 'review_media'].includes(msg.message_type)).map((msg: any, idx: number, arr: any[]) => {
            const isOwn = msg.sender_id === currentUserId;
            const msgDate = new Date(msg.created_at);
            const prevMsg = idx > 0 ? arr[idx - 1] : null;
            const prevDate = prevMsg ? new Date(prevMsg.created_at) : null;
            const showDateSeparator = !prevDate || msgDate.toDateString() !== prevDate.toDateString();

            return (
              <div key={msg.id}>
                {showDateSeparator && (
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted-foreground font-medium px-2">
                      {format(msgDate, 'dd MMMM', { locale: ru })}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {!isOwn && bloggerId && sellerId && (
                      <p className="text-[10px] font-semibold mb-0.5 opacity-70">
                        {msg.sender_id === bloggerId ? 'Блогер' : msg.sender_id === sellerId ? 'Селлер' : ''}
                      </p>
                    )}
                    {msg.message_type === 'counter_proposal' && <p className="text-xs font-medium mb-1 opacity-80">Контрпредложение</p>}
                    {msg.message_type === 'order_proof' && <p className="text-xs font-medium mb-1 opacity-80">📸 Скриншот заказа</p>}
                    {msg.message_type === 'pickup_proof' && <p className="text-xs font-medium mb-1 opacity-80">📸 Фото получения</p>}
                    {msg.message_type === 'payment_proof' && <p className="text-xs font-medium mb-1 opacity-80">💸 Скриншот оплаты</p>}
                    {msg.message_type === 'content_submitted' && <p className="text-xs font-medium mb-1 opacity-80">🎬 Контент на проверку</p>}
                    {msg.message_type === 'review_submitted' && <p className="text-xs font-medium mb-1 opacity-80">📝 Отзыв</p>}
                    {msg.message_type === 'review_media' && <p className="text-xs font-medium mb-1 opacity-80">📷 Фото к отзыву</p>}
                    {msg.attachment_url && (
                      <img src={msg.attachment_url} alt="attachment" className="rounded-lg max-h-40 mb-1 cursor-pointer" onClick={() => window.open(msg.attachment_url, '_blank')} />
                    )}
                    {msg.message && <p className="whitespace-pre-wrap break-words">{msg.message}</p>}
                    <p className={`text-[10px] mt-1 ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {format(msgDate, 'HH:mm', { locale: ru })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {(!messages || messages.length === 0) && (
            <p className="text-center text-muted-foreground text-xs py-4">Нет сообщений</p>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2 p-2 border-t border-border">
        <Input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Сообщение..."
          className="flex-1"
        />
        <Button size="icon" onClick={() => sendMessage.mutate()} disabled={!newMessage.trim() || sendMessage.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default DealChat;
