'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Send, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string | null;
  created_at: string;
  is_own: boolean;
}

interface ChatWindowProps {
  messages: Message[];
  recipient: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  onSendMessage: (content: string) => Promise<void>;
  onClose?: () => void;
  isLoading?: boolean;
}

export function ChatWindow({ 
  messages, 
  recipient, 
  onSendMessage, 
  onClose,
  isLoading 
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage.trim());
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = '';
  
  messages.forEach((message) => {
    const messageDate = new Date(message.created_at).toDateString();
    if (messageDate !== currentDate) {
      currentDate = messageDate;
      groupedMessages.push({ date: message.created_at, messages: [message] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(message);
    }
  });

  const recipientInitials = recipient.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <div className="flex h-full flex-col rounded-xl border border-stone-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-stone-100 px-4 py-3">
        {recipient.avatar ? (
          <Image
            src={recipient.avatar}
            alt={recipient.name}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-600">
            {recipientInitials}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-navy-800">{recipient.name}</h3>
          <p className="text-xs text-slate-500">Messages</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-stone-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
              <Send className="h-6 w-6 text-stone-400" />
            </div>
            <p className="text-sm text-slate-600">No messages yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Start the conversation with {recipient.name}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Date Divider */}
                <div className="mb-4 flex items-center justify-center">
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-slate-500">
                    {formatDate(group.date)}
                  </span>
                </div>

                {/* Messages for this date */}
                <div className="space-y-3">
                  {group.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.is_own ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex max-w-[80%] gap-2 ${message.is_own ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar (only for other person) */}
                        {!message.is_own && (
                          message.sender_avatar ? (
                            <Image
                              src={message.sender_avatar}
                              alt={message.sender_name}
                              width={32}
                              height={32}
                              className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-600">
                              {message.sender_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )
                        )}

                        {/* Message Bubble */}
                        <div>
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              message.is_own
                                ? 'bg-stone-200 text-slate-800'
                                : 'bg-white border border-stone-200 text-slate-800'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          <p className={`mt-1 text-xs text-slate-400 ${message.is_own ? 'text-right' : ''}`}>
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-stone-100 p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full resize-none rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
