'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Send, MessageSquare } from 'lucide-react';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string | null;
  created_at: string;
  is_own: boolean;
}

interface QuoteMessengerProps {
  quoteId: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string | null;
  currentUserId: string;
}

export function QuoteMessenger({ 
  quoteId, 
  customerId, 
  customerName,
  customerAvatar,
  currentUserId
}: QuoteMessengerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle new realtime messages
  const handleNewMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  // Subscribe to realtime messages
  useRealtimeMessages({
    recipientId: customerId,
    currentUserId,
    onNewMessage: handleNewMessage,
  });

  useEffect(() => {
    fetchMessages();
  }, [customerId, quoteId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `/api/messages?recipient_id=${customerId}&quote_id=${quoteId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: customerId,
          content: messageContent,
          quote_id: quoteId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data.message]);
      } else {
        // Restore message on failure
        setNewMessage(messageContent);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const customerInitials = customerName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <div className="flex h-[400px] flex-col rounded-xl border border-stone-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-stone-100 px-4 py-3">
        {customerAvatar ? (
          <Image
            src={customerAvatar}
            alt={customerName}
            width={36}
            height={36}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-600">
            {customerInitials}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-navy-800">{customerName}</h3>
          <p className="text-xs text-slate-500">Messages</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageSquare className="h-8 w-8 text-stone-300" />
            <p className="mt-2 text-xs text-slate-500">No messages yet</p>
            <p className="text-xs text-slate-400">
              Start the conversation
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.is_own ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${message.is_own ? '' : 'flex gap-2'}`}>
                  {/* Avatar for customer */}
                  {!message.is_own && (
                    message.sender_avatar ? (
                      <Image
                        src={message.sender_avatar}
                        alt={message.sender_name}
                        width={24}
                        height={24}
                        className="h-6 w-6 flex-shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-600">
                        {message.sender_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )
                  )}

                  {/* Message Bubble */}
                  <div>
                    <div
                      className={`rounded-xl px-3 py-2 text-sm ${
                        message.is_own
                          ? 'bg-brand-600 text-white'
                          : 'bg-stone-100 text-slate-800'
                      }`}
                    >
                      {message.content}
                    </div>
                    <p className={`mt-0.5 text-xs text-slate-400 ${message.is_own ? 'text-right' : ''}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-stone-100 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
