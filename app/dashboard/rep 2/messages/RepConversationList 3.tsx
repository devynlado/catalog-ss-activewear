'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Send, ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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

interface Conversation {
  id: string;
  full_name: string | null;
  email: string;
  company: string | null;
  avatar_url: string | null;
  lastMessage: {
    content: string;
    created_at: string;
    sender_id: string;
  } | null;
  unreadCount: number;
}

interface RepConversationListProps {
  conversations: Conversation[];
  currentUserId: string;
}

export function RepConversationList({ conversations, currentUserId }: RepConversationListProps) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle new realtime messages
  const handleNewMessage = useCallback((message: Message) => {
    // Only add if from the selected conversation
    if (selectedConversation && message.sender_id === selectedConversation.id) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    }
  }, [selectedConversation?.id]);

  // Subscribe to realtime messages
  useRealtimeMessages({
    recipientId: selectedConversation?.id || '',
    currentUserId,
    onNewMessage: handleNewMessage,
  });

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async (customerId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/messages?recipient_id=${customerId}`);
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
    if (!newMessage.trim() || isSending || !selectedConversation) return;

    setIsSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: selectedConversation.id,
          content: messageContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data.message]);
      } else {
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
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  // Mobile: show either list or chat
  // Desktop: show both side by side

  return (
    <div className="grid h-[600px] gap-4 lg:grid-cols-3">
      {/* Conversation List */}
      <div className={`overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm ${
        selectedConversation ? 'hidden lg:block' : ''
      }`}>
        <div className="border-b border-stone-100 px-4 py-3">
          <h2 className="font-semibold text-navy-800">Conversations</h2>
        </div>
        <div className="h-[calc(100%-52px)] overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className={`flex w-full items-center gap-3 border-b border-stone-50 p-4 text-left transition-colors hover:bg-stone-50 ${
                selectedConversation?.id === conv.id ? 'bg-brand-50' : ''
              }`}
            >
              {conv.avatar_url ? (
                <Image
                  src={conv.avatar_url}
                  alt={conv.full_name || 'Customer'}
                  width={44}
                  height={44}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-600">
                  {getInitials(conv.full_name, conv.email)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate font-medium text-slate-700">
                    {conv.full_name || conv.email}
                  </p>
                  {conv.lastMessage && (
                    <span className="text-xs text-slate-400">
                      {formatTime(conv.lastMessage.created_at)}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-slate-500">
                  {conv.lastMessage 
                    ? (conv.lastMessage.sender_id === currentUserId ? 'You: ' : '') + conv.lastMessage.content
                    : conv.company || conv.email
                  }
                </p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-medium text-white">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm lg:col-span-2 ${
        !selectedConversation ? 'hidden lg:flex' : ''
      }`}>
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-stone-100 px-4 py-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-stone-100 hover:text-slate-600 lg:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              {selectedConversation.avatar_url ? (
                <Image
                  src={selectedConversation.avatar_url}
                  alt={selectedConversation.full_name || 'Customer'}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-600">
                  {getInitials(selectedConversation.full_name, selectedConversation.email)}
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-navy-800">
                  {selectedConversation.full_name || selectedConversation.email}
                </h3>
                {selectedConversation.company && (
                  <p className="text-xs text-slate-500">{selectedConversation.company}</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <MessageSquare className="h-10 w-10 text-stone-300" />
                  <p className="mt-2 text-sm text-slate-500">No messages yet</p>
                  <p className="text-xs text-slate-400">Start the conversation</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.is_own ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] ${message.is_own ? '' : 'flex gap-2'}`}>
                        {!message.is_own && (
                          selectedConversation.avatar_url ? (
                            <Image
                              src={selectedConversation.avatar_url}
                              alt={selectedConversation.full_name || 'Customer'}
                              width={28}
                              height={28}
                              className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-600">
                              {getInitials(selectedConversation.full_name, selectedConversation.email)}
                            </div>
                          )
                        )}
                        <div>
                          <div
                            className={`rounded-2xl px-4 py-2 text-sm ${
                              message.is_own
                                ? 'bg-brand-600 text-white'
                                : 'bg-stone-100 text-slate-800'
                            }`}
                          >
                            {message.content}
                          </div>
                          <p className={`mt-1 text-xs text-slate-400 ${message.is_own ? 'text-right' : ''}`}>
                            {new Date(message.created_at).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
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
            <div className="border-t border-stone-100 p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSend}
                  disabled={!newMessage.trim() || isSending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <MessageSquare className="h-12 w-12 text-stone-300" />
            <p className="mt-3 font-medium text-slate-600">Select a conversation</p>
            <p className="text-sm text-slate-400">Choose a customer to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
