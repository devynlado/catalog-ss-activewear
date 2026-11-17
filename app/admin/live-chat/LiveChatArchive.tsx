'use client';

import { useState, useCallback } from 'react';
import {
  Loader2, MessageCircle, Search, User, Headphones, Globe, ExternalLink, Clock,
} from 'lucide-react';

export interface LiveChatConversation {
  id: string;
  chat_id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_question: string | null;
  source_url: string | null;
  referrer: string | null;
  status: 'active' | 'closed' | string;
  started_at: string | null;
  ended_at: string | null;
  message_count: number | null;
  created_at: string;
}

interface LiveChatMessage {
  id: string;
  chat_id: string;
  author_type: 'customer' | 'agent' | 'system' | 'unknown' | string;
  author_id: string | null;
  text: string | null;
  event_type: string | null;
  sent_at: string | null;
}

export function LiveChatArchive({ conversations }: { conversations: LiveChatConversation[] }) {
  const [selected, setSelected] = useState<LiveChatConversation | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  const selectConversation = useCallback(async (conv: LiveChatConversation) => {
    setSelected(conv);
    setMessages([]);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/live-chat/${encodeURIComponent(conv.chat_id)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('[Live Chat Archive] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const formatTime = (value: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return (
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' ' +
      date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    );
  };

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.customer_name || '').toLowerCase().includes(q) ||
      (c.customer_email || '').toLowerCase().includes(q) ||
      (c.customer_question || '').toLowerCase().includes(q) ||
      (c.source_url || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[500px] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      {/* Conversation list */}
      <div className="flex w-[340px] flex-shrink-0 flex-col border-r border-stone-200">
        <div className="border-b border-stone-100 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 pl-9 pr-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <MessageCircle className="mx-auto h-8 w-8 text-stone-300" />
              <p className="mt-2 text-sm text-slate-500">No live chats yet</p>
              <p className="mt-1 text-xs text-slate-400">
                Archived chats from the website appear here once the LiveChat
                webhook delivers them.
              </p>
            </div>
          ) : (
            filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full border-b border-stone-50 px-4 py-3 text-left transition-colors hover:bg-stone-50 ${
                  selected?.id === conv.id ? 'bg-brand-50 border-l-2 border-l-brand-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy-800">
                      {conv.customer_name || conv.customer_email || 'Anonymous visitor'}
                    </p>
                    {conv.customer_email && (
                      <p className="truncate text-xs text-slate-500">{conv.customer_email}</p>
                    )}
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {conv.customer_question || conv.source_url || '—'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="whitespace-nowrap text-[10px] text-slate-400">
                      {formatTime(conv.created_at)}
                    </span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        conv.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {conv.status === 'active' ? 'Active' : 'Closed'}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail */}
      <div className="flex flex-1 flex-col">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-8">
            <MessageCircle className="h-12 w-12 text-stone-200" />
            <h3 className="mt-3 text-lg font-semibold text-slate-600">Select a lead</h3>
            <p className="mt-1 text-sm text-slate-400">
              Choose a conversation to read the full transcript
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="border-b border-stone-100 px-5 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-navy-800">
                    {selected.customer_name || selected.customer_email || 'Anonymous visitor'}
                  </p>
                  {selected.customer_email && (
                    <p className="text-xs text-slate-500">{selected.customer_email}</p>
                  )}
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <p>Started {formatTime(selected.started_at)}</p>
                  {selected.ended_at && <p>Ended {formatTime(selected.ended_at)}</p>}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {selected.source_url && (
                  <a
                    href={selected.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-stone-50"
                  >
                    <Globe className="h-3 w-3" />
                    <span className="max-w-[260px] truncate">{selected.source_url}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {selected.referrer && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 text-[11px] text-slate-500">
                    Ref: <span className="max-w-[200px] truncate">{selected.referrer}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Transcript */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {selected.customer_question && (
                <div className="mb-4 rounded-lg border border-brand-100 bg-brand-50/60 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
                    Pre-chat question
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{selected.customer_question}</p>
                </div>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageCircle className="h-8 w-8 text-stone-300" />
                  <p className="mt-2 text-sm text-slate-500">No transcript stored</p>
                  <p className="mt-1 text-xs text-slate-400">
                    The full transcript is archived when the chat ends (requires a
                    <span className="font-medium"> chat_ended</span> webhook).
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isAgent = msg.author_type === 'agent';
                    const isSystem = msg.author_type === 'system';
                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] text-slate-500">
                            {msg.text || msg.event_type}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${!isAgent ? 'flex gap-2.5' : ''}`}>
                          {!isAgent && (
                            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600">
                              <User className="h-3.5 w-3.5" />
                            </div>
                          )}
                          <div>
                            <p
                              className={`mb-1 flex items-center gap-1 text-xs font-medium text-slate-500 ${
                                isAgent ? 'justify-end' : ''
                              }`}
                            >
                              {isAgent && <Headphones className="h-3 w-3" />}
                              {isAgent ? msg.author_id || 'Agent' : selected.customer_name || 'Visitor'}
                            </p>
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                isAgent ? 'bg-brand-600 text-white' : 'bg-stone-100 text-slate-800'
                              }`}
                            >
                              {msg.text}
                            </div>
                            <div
                              className={`mt-1 flex items-center gap-1 text-[10px] text-slate-400 ${
                                isAgent ? 'justify-end' : ''
                              }`}
                            >
                              <Clock className="h-2.5 w-2.5" />
                              <span>{formatTime(msg.sent_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
