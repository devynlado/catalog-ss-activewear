'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useOrderChatRealtime } from '@/hooks/useOrderChatRealtime';
import type { ChatMessage } from '@/lib/chat-helpers';

interface OrderChatProps {
  orderId: string;
  customerName: string;
  customerEmail: string;
}

export function OrderChat({ orderId, customerName, customerEmail }: OrderChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleNewRealtimeMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    if (msg.sender_type === 'customer') {
      setIsExpanded(true);
    }
  }, []);

  useOrderChatRealtime({ orderId, onNewMessage: handleNewRealtimeMessage });

  useEffect(() => {
    fetchMessages();
  }, [orderId]);

  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/chat`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('[Admin Chat] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => {
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    } catch (err) {
      console.error('[Admin Chat] Send error:', err);
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
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const unreadCustomerMessages = messages.filter(m => m.sender_type === 'customer' && m.read_at === null).length;
  const hasUnread = unreadCustomerMessages > 0;

  return (
    <div data-chat-section className={`rounded-xl border-2 shadow-sm transition-colors ${
      hasUnread
        ? 'border-red-400 bg-red-50 ring-2 ring-red-200'
        : 'border-stone-200 bg-white'
    }`}>
      {/* Header — clickable to toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex w-full items-center justify-between px-6 py-4 text-left rounded-t-xl transition-colors ${
          hasUnread ? 'bg-red-50' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={`relative ${hasUnread ? 'animate-pulse' : ''}`}>
            <MessageCircle className={`h-5 w-5 ${hasUnread ? 'text-red-500' : 'text-brand-500'}`} />
            {hasUnread && (
              <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
            )}
          </div>
          <h2 className={`text-lg font-semibold ${hasUnread ? 'text-red-800' : 'text-navy-800'}`}>
            Customer Chat
          </h2>
          {hasUnread && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white animate-pulse">
              {unreadCustomerMessages} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <span className="text-xs text-slate-400">{messages.length} messages</span>
          )}
          {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {isExpanded && (
        <>
          {/* Messages */}
          <div className="max-h-[350px] overflow-y-auto border-t border-stone-100 px-4 py-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="py-6 text-center">
                <MessageCircle className="mx-auto h-8 w-8 text-stone-300" />
                <p className="mt-2 text-sm text-slate-500">No messages yet</p>
                <p className="text-xs text-slate-400">Customer hasn&apos;t sent any messages</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] ${msg.sender_type === 'customer' ? 'flex gap-2' : ''}`}>
                      {msg.sender_type === 'customer' && (
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-600">
                          {(msg.sender_name || customerName || customerEmail)?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        {msg.sender_type === 'customer' && (
                          <p className="mb-0.5 text-[10px] font-medium text-slate-400">
                            {msg.sender_name || customerName || customerEmail}
                          </p>
                        )}
                        {msg.attachment_url && (
                          <div className="mb-1">
                            <img
                              src={msg.attachment_url}
                              alt="Attachment"
                              className="max-h-[140px] w-auto rounded-lg object-cover cursor-pointer"
                              onClick={() => window.open(msg.attachment_url!, '_blank')}
                            />
                          </div>
                        )}
                        <div
                          className={`rounded-xl px-3 py-2 text-sm ${
                            msg.sender_type === 'admin'
                              ? msg.is_auto_reply
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-brand-600 text-white'
                              : 'bg-stone-100 text-slate-800'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <p className={`mt-0.5 text-[10px] text-slate-400 ${msg.sender_type === 'admin' ? 'text-right' : ''}`}>
                          {msg.is_auto_reply ? 'Auto-reply • ' : ''}{formatTime(msg.created_at)}
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
          <div className="border-t border-stone-100 px-4 py-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Reply to customer..."
                className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || isSending}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
