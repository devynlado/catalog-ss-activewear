'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface ChatNotificationBannerProps {
  orderId: string;
  customerName: string;
}

export function ChatNotificationBanner({ orderId, customerName }: ChatNotificationBannerProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [latestMessage, setLatestMessage] = useState('');

  useEffect(() => {
    fetchUnreadCount();
  }, [orderId]);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/chat/unread`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
        if (data.latestMessage) {
          setLatestMessage(data.latestMessage);
        }
      }
    } catch {
      // Silently fail
    }
  };

  if (unreadCount === 0 || dismissed) return null;

  const scrollToChat = () => {
    const chatEl = document.querySelector('[data-chat-section]');
    if (chatEl) {
      chatEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border-2 border-red-300 bg-red-50 px-5 py-4 shadow-sm">
      <div className="relative flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <MessageCircle className="h-5 w-5 text-red-600" />
        </div>
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unreadCount}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-red-800">
          {unreadCount} unread message{unreadCount !== 1 ? 's' : ''} from {customerName}
        </p>
        {latestMessage && (
          <p className="mt-0.5 truncate text-xs text-red-600">
            &ldquo;{latestMessage.length > 80 ? latestMessage.substring(0, 80) + '...' : latestMessage}&rdquo;
          </p>
        )}
      </div>
      <button
        onClick={scrollToChat}
        className="flex-shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
      >
        View Chat
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 rounded-lg p-1.5 text-red-400 hover:bg-red-100 hover:text-red-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
