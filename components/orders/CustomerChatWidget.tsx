'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  MessageCircle, X, Send, ImageIcon, Loader2, ChevronDown, Package,
} from 'lucide-react';
import { useCustomerChatRealtime } from '@/hooks/useCustomerChatRealtime';
import type { ChatMessage } from '@/lib/chat-helpers';

interface OrderOption {
  id: string;
  order_number: string;
  status: string;
}

interface CustomerChatWidgetProps {
  customerEmail: string;
  customerName: string | null;
}

export function CustomerChatWidget({ customerEmail, customerName }: CustomerChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNewRealtimeMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    if (msg.sender_type === 'admin' && !isOpen) {
      setUnreadCount(prev => prev + 1);
    }
  }, [isOpen]);

  useCustomerChatRealtime({ customerEmail, onNewMessage: handleNewRealtimeMessage });

  // Listen for "Contact Support" button clicks from the sidebar
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-customer-chat', handleOpenChat);
    return () => window.removeEventListener('open-customer-chat', handleOpenChat);
  }, []);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setOrders(data.orders || []);
        setHasFetched(true);
      }
    } catch (err) {
      console.error('[Chat] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !hasFetched) {
      fetchMessages();
    }
  }, [isOpen, fetchMessages, hasFetched]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const handleSend = async () => {
    if ((!newMessage.trim() && !attachmentFile) || isSending) return;
    setIsSending(true);

    let attachmentUrl: string | null = null;
    if (attachmentFile) {
      setIsUploading(true);
      attachmentUrl = await uploadAttachment(attachmentFile);
      setIsUploading(false);
      if (!attachmentUrl) {
        setIsSending(false);
        return;
      }
    }

    const content = newMessage.trim() || '📷 Image';
    setNewMessage('');
    setAttachmentFile(null);
    setAttachmentPreview(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          attachmentUrl,
          orderId: selectedOrderId || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => {
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    } catch (err) {
      console.error('[Chat] Send error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const uploadAttachment = async (file: File): Promise<string | null> => {
    try {
      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });

      if (!res.ok) return null;
      const { signedUrl, publicUrl } = await res.json();

      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type, 'x-upsert': 'true' },
        body: file,
      });

      return uploadRes.ok ? publicUrl : null;
    } catch {
      return null;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    setAttachmentFile(file);
    setAttachmentPreview(URL.createObjectURL(file));
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
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getOrderNumber = (orderId: string | null) => {
    if (!orderId) return null;
    return orders.find(o => o.id === orderId)?.order_number || null;
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 transition-all hover:scale-105 active:scale-95"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[540px] w-[400px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl sm:max-h-[640px]">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Chat with us</h3>
              <p className="text-xs text-brand-100">We typically reply within a few hours</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center px-4">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                  <MessageCircle className="h-6 w-6 text-brand-500" />
                </div>
                <p className="text-sm font-medium text-slate-700">Need help?</p>
                <p className="mt-1 text-xs text-slate-400">
                  Send us a message about your order or anything else.
                  We&apos;ll get back to you as soon as possible.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const orderRef = getOrderNumber(msg.order_id);
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] ${msg.sender_type === 'admin' ? 'flex gap-2' : ''}`}>
                        {msg.sender_type === 'admin' && (
                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-navy-100 text-[10px] font-bold text-navy-600">
                            GD
                          </div>
                        )}
                        <div>
                          {msg.sender_type === 'admin' && (
                            <p className="mb-0.5 text-[10px] font-medium text-slate-400">
                              {msg.is_auto_reply ? 'Automated Reply' : msg.sender_name || 'Garment Decor'}
                            </p>
                          )}
                          {orderRef && (
                            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                              <Package className="h-2.5 w-2.5" />
                              {orderRef}
                            </span>
                          )}
                          {msg.attachment_url && (
                            <div className="mb-1 overflow-hidden rounded-lg">
                              <Image
                                src={msg.attachment_url}
                                alt="Attachment"
                                width={240}
                                height={180}
                                className="max-h-[180px] w-auto rounded-lg object-cover cursor-pointer"
                                onClick={() => window.open(msg.attachment_url!, '_blank')}
                              />
                            </div>
                          )}
                          <div
                            className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                              msg.sender_type === 'customer'
                                ? 'bg-brand-600 text-white'
                                : msg.is_auto_reply
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-stone-100 text-slate-800'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <p className={`mt-0.5 text-[10px] text-slate-400 ${msg.sender_type === 'customer' ? 'text-right' : ''}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Attachment preview */}
          {attachmentPreview && (
            <div className="border-t border-stone-100 px-4 py-2">
              <div className="relative inline-block">
                <img src={attachmentPreview} alt="Preview" className="h-16 rounded-lg object-cover" />
                <button
                  onClick={() => { setAttachmentFile(null); setAttachmentPreview(null); }}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Order selector + Input */}
          <div className="border-t border-stone-100 px-4 py-3">
            {/* Optional order tag */}
            {orders.length > 0 && (
              <div className="mb-2">
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-slate-600 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
                >
                  <option value="">General message (no specific order)</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.order_number} — {o.status}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-end gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-stone-100 hover:text-slate-600"
                title="Attach image"
              >
                <ImageIcon className="h-5 w-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
                style={{ maxHeight: '80px' }}
              />
              <button
                onClick={handleSend}
                disabled={(!newMessage.trim() && !attachmentFile) || isSending || isUploading}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 transition-colors"
              >
                {isSending || isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
