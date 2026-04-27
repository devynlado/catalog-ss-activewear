import { useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { ChatMessage } from '@/lib/chat-helpers';

interface UseOrderChatRealtimeOptions {
  orderId: string | null;
  onNewMessage: (message: ChatMessage) => void;
}

export function useOrderChatRealtime({ orderId, onNewMessage }: UseOrderChatRealtimeOptions) {
  useEffect(() => {
    if (!orderId) return;

    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`order-chat-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_chat_messages',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage;
          onNewMessage(msg);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, onNewMessage]);
}
