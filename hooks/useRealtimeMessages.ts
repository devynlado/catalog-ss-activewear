import { useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string | null;
  created_at: string;
  is_own: boolean;
}

interface UseRealtimeMessagesOptions {
  recipientId: string;
  currentUserId: string;
  onNewMessage: (message: Message) => void;
}

export function useRealtimeMessages({ 
  recipientId, 
  currentUserId, 
  onNewMessage 
}: UseRealtimeMessagesOptions) {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Subscribe to new messages where current user is the recipient
    const channel = supabase
      .channel(`messages:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // Only process if it's from the current conversation
          if (newMsg.sender_id === recipientId) {
            // Fetch sender details
            const { data: sender } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', newMsg.sender_id)
              .single();

            const message: Message = {
              id: newMsg.id,
              content: newMsg.content,
              sender_id: newMsg.sender_id,
              sender_name: sender?.full_name || 'Unknown',
              sender_avatar: sender?.avatar_url,
              created_at: newMsg.created_at,
              is_own: false,
            };

            onNewMessage(message);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [recipientId, currentUserId, onNewMessage]);
}
