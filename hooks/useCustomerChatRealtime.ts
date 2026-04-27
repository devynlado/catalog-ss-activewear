import { useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { ChatMessage } from '@/lib/chat-helpers';

interface UseCustomerChatRealtimeOptions {
  customerEmail: string | null;
  onNewMessage: (message: ChatMessage) => void;
}

/**
 * Listens for new chat messages across all conversations for a given customer.
 * Uses a broad INSERT listener on the order_chat_messages table
 * and filters client-side by customer_email.
 */
export function useCustomerChatRealtime({ customerEmail, onNewMessage }: UseCustomerChatRealtimeOptions) {
  useEffect(() => {
    if (!customerEmail) return;

    const supabase = createSupabaseBrowserClient();
    const email = customerEmail.toLowerCase();

    const channel = supabase
      .channel(`customer-chat-${email.replace(/[^a-z0-9]/g, '_')}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_chat_messages',
          filter: `customer_email=eq.${email}`,
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
  }, [customerEmail, onNewMessage]);
}
