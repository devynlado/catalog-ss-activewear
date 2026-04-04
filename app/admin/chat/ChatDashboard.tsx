'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Send, MessageCircle, Loader2, Search, Filter,
  ExternalLink, Clock, User,
} from 'lucide-react';
import { useOrderChatRealtime } from '@/hooks/useOrderChatRealtime';
import type { ChatMessage, ConversationSummary } from '@/lib/chat-helpers';

export function ChatDashboard() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleNewRealtimeMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    // Update conversation list too
    setConversations(prev => prev.map(c => {
      if (c.order_id === msg.order_id) {
        return {
          ...c,
          last_message: msg.content,
          last_message_at: msg.created_at,
          last_sender_type: msg.sender_type,
          unread_count: msg.sender_type === 'customer' ? c.unread_count + 1 : c.unread_count,
        };
      }
      return c;
    }));
  }, []);

  useOrderChatRealtime({ orderId: selectedOrderId, onNewMessage: handleNewRealtimeMessage });

  useEffect(() => {
    fetchConversations();
  }, [filter]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const res = await fetch(`/api/admin/chat?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('[Chat] Fetch conversations error:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const selectConversation = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/chat`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        // Mark as read in the list
        setConversations(prev => prev.map(c =>
          c.order_id === orderId ? { ...c, unread_count: 0 } : c
        ));
      }
    } catch (err) {
      console.error('[Chat] Fetch messages error:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedOrderId || isSending) return;
    setIsSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrderId}/chat`, {
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
        // Update the conversation summary
        setConversations(prev => prev.map(c =>
          c.order_id === selectedOrderId
            ? { ...c, last_message: content, last_message_at: data.message.created_at, last_sender_type: 'admin' }
            : c
        ));
      }
    } catch (err) {
      console.error('[Chat] Send error:', err);
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
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const selectedConversation = conversations.find(c => c.order_id === selectedOrderId);

  const filteredConversations = conversations.filter(c => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.order_number.toLowerCase().includes(q) ||
      (c.customer_name || '').toLowerCase().includes(q) ||
      c.customer_email.toLowerCase().includes(q)
    );
  });

  const statusColors: Record<string, string> = {
    ordered: 'bg-blue-100 text-blue-700',
    shipped: 'bg-green-100 text-green-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[500px] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      {/* Conversation list */}
      <div className="flex w-[340px] flex-shrink-0 flex-col border-r border-stone-200">
        {/* Search + filters */}
        <div className="space-y-2 border-b border-stone-100 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders, customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 pl-9 pr-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                filter === 'all' ? 'bg-brand-100 text-brand-700' : 'text-slate-500 hover:bg-stone-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                filter === 'unread' ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-stone-100'
              }`}
            >
              <Filter className="mr-1 inline h-3 w-3" />
              Unread
            </button>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <MessageCircle className="mx-auto h-8 w-8 text-stone-300" />
              <p className="mt-2 text-sm text-slate-500">
                {filter === 'unread' ? 'No unread messages' : 'No conversations yet'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.order_id}
                onClick={() => selectConversation(conv.order_id)}
                className={`w-full border-b border-stone-50 px-4 py-3 text-left transition-colors hover:bg-stone-50 ${
                  selectedOrderId === conv.order_id ? 'bg-brand-50 border-l-2 border-l-brand-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-navy-800">
                        {conv.customer_name || conv.customer_email}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{conv.order_number}</p>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {conv.last_sender_type === 'admin' ? 'You: ' : ''}
                      {conv.last_message}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="whitespace-nowrap text-[10px] text-slate-400">
                      {formatTime(conv.last_message_at)}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusColors[conv.order_status] || 'bg-stone-100 text-stone-600'}`}>
                      {conv.order_status}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {!selectedOrderId ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-8">
            <MessageCircle className="h-12 w-12 text-stone-200" />
            <h3 className="mt-3 text-lg font-semibold text-slate-600">Select a conversation</h3>
            <p className="mt-1 text-sm text-slate-400">Choose a conversation from the left to view messages</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-600">
                  {(selectedConversation?.customer_name || selectedConversation?.customer_email)?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-800">
                    {selectedConversation?.customer_name || selectedConversation?.customer_email || 'Customer'}
                  </p>
                  <p className="text-xs text-slate-500">{selectedConversation?.order_number}</p>
                </div>
              </div>
              <Link
                href={`/admin/orders/${selectedOrderId}`}
                className="flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-stone-50"
              >
                View Order <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageCircle className="h-8 w-8 text-stone-300" />
                  <p className="mt-2 text-sm text-slate-500">No messages in this conversation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${msg.sender_type === 'customer' ? 'flex gap-2.5' : ''}`}>
                        {msg.sender_type === 'customer' && (
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600">
                            <User className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <div>
                          {msg.sender_type === 'customer' && (
                            <p className="mb-1 text-xs font-medium text-slate-500">
                              {msg.sender_name || selectedConversation?.customer_name || 'Customer'}
                            </p>
                          )}
                          {msg.sender_type === 'admin' && !msg.is_auto_reply && (
                            <p className="mb-1 text-right text-xs font-medium text-slate-500">
                              {msg.sender_name || 'You'}
                            </p>
                          )}
                          {msg.attachment_url && (
                            <div className="mb-1.5">
                              <img
                                src={msg.attachment_url}
                                alt="Attachment"
                                className="max-h-[200px] w-auto rounded-lg object-cover cursor-pointer border border-stone-200"
                                onClick={() => window.open(msg.attachment_url!, '_blank')}
                              />
                            </div>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                              msg.sender_type === 'admin'
                                ? msg.is_auto_reply
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-brand-600 text-white'
                                : 'bg-stone-100 text-slate-800'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <div className={`mt-1 flex items-center gap-1 text-[10px] text-slate-400 ${msg.sender_type === 'admin' ? 'justify-end' : ''}`}>
                            {msg.is_auto_reply && (
                              <>
                                <Clock className="h-2.5 w-2.5" />
                                <span>Auto-reply</span>
                                <span>•</span>
                              </>
                            )}
                            <span>{formatTime(msg.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-stone-100 px-5 py-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Reply to customer..."
                  className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || isSending}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
