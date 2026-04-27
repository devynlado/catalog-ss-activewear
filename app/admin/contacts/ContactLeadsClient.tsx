'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  MailX,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldBan,
  ShieldCheck,
  Phone,
  Building2,
  Calendar,
  MessageSquare,
  BarChart3,
  Filter,
  X,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────

interface ContactItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service: string | null;
  message: string;
  status: string;
  source: string | null;
  variant: string | null;
  quantity: string | null;
  visitor_source: string | null;
  is_spam: boolean;
  blocked_at: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  thisWeek: number;
  spam: number;
  blocked: number;
}

interface SourceRank {
  source: string;
  total: number;
  thisWeek: number;
}

interface BlockedEmail {
  id: string;
  email: string;
  reason: string | null;
  created_at: string;
}

// ── Source label mapping ──────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  '(null)': 'Contact Page / Direct',
  contact_page: 'Contact Page',
  'service_screen-printing': 'Screen Printing (Service)',
  'service_digital-screen-printing': 'Digital Screen Printing (Service)',
  'service_embroidery': 'Embroidery (Service)',
  'service_jumbo-screen-printing': 'Jumbo Screen Printing (Service)',
  'service_retail-finishing': 'Retail Finishing (Service)',
  'service_live-screen-printing': 'Live Screen Printing (Service)',
  'lp_screen-printing': 'Screen Printing (Landing Page)',
  'lp_embroidery': 'Embroidery (Landing Page)',
  'lp_screen-printing_exit_intent': 'Screen Printing LP Exit Intent',
  'lp_embroidery_exit_intent': 'Embroidery LP Exit Intent',
  portfolio_quote_modal: 'Portfolio Inquiry',
  services_page_inquiry_form: 'Project Inquiry (Services)',
  streetwear: 'Streetwear Form',
};

function getSourceLabel(source: string | null): string {
  const key = source || '(null)';
  return SOURCE_LABELS[key] || key.replace(/_/g, ' ').replace(/-/g, ' ');
}

// ── Helpers ──────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-amber-50 text-amber-700 border-amber-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  spam: 'bg-red-50 text-red-700 border-red-200',
};

const VISITOR_SOURCE_OPTIONS = [
  'Direct',
  'Google Ads',
  'Organic Search',
  'Organic Social',
  'Organic Shopping',
  'Referral',
  'Cross-network',
  'Other',
] as const;

const VISITOR_SOURCE_COLORS: Record<string, string> = {
  'Direct': 'bg-slate-100 text-slate-700',
  'Google Ads': 'bg-blue-100 text-blue-800',
  'Organic Search': 'bg-green-100 text-green-800',
  'Organic Social': 'bg-purple-100 text-purple-800',
  'Organic Shopping': 'bg-teal-100 text-teal-800',
  'Referral': 'bg-amber-100 text-amber-800',
  'Cross-network': 'bg-indigo-100 text-indigo-800',
  'Other': 'bg-stone-100 text-stone-700',
  'Untracked': 'bg-stone-50 text-stone-400 border border-dashed border-stone-300',
};

// ── Main Component ───────────────────────────────────────────────────────

export function ContactLeadsClient() {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, thisWeek: 0, spam: 0, blocked: 0 });
  const [sourceRanking, setSourceRanking] = useState<SourceRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [status, setStatus] = useState('all');
  const [source, setSource] = useState('');
  const [visitorSource, setVisitorSource] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [showSpam, setShowSpam] = useState(false);

  // UI state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showSourceChart, setShowSourceChart] = useState(true);
  const [showBlockedPanel, setShowBlockedPanel] = useState(false);
  const [blockedEmails, setBlockedEmails] = useState<BlockedEmail[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Fetch contacts ────────────────────────────────────────────────────

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), show_spam: String(showSpam) });
      if (status !== 'all') params.set('status', status);
      if (source) params.set('source', source);
      if (visitorSource) params.set('visitor_source', visitorSource);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/contacts?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setContacts(data.contacts);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setStats(data.stats);
      setSourceRanking(data.sourceRanking);
    } catch {
      console.error('Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  }, [page, status, source, visitorSource, dateFrom, dateTo, search, showSpam]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ── Fetch blocked emails ──────────────────────────────────────────────

  const fetchBlocked = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/contacts/block-email');
      if (res.ok) {
        const data = await res.json();
        setBlockedEmails(data.blocked);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { if (showBlockedPanel) fetchBlocked(); }, [showBlockedPanel, fetchBlocked]);

  // ── Actions ───────────────────────────────────────────────────────────

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setToast({ type: 'success', message: `Status updated to ${newStatus}` });
        fetchContacts();
      }
    } catch {
      setToast({ type: 'error', message: 'Failed to update status' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkSpam = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_spam: true, status: 'spam' }),
      });
      if (res.ok) {
        setToast({ type: 'success', message: 'Marked as spam and email blocked' });
        fetchContacts();
      }
    } catch {
      setToast({ type: 'error', message: 'Failed to mark as spam' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnmarkSpam = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_spam: false, status: 'new' }),
      });
      if (res.ok) {
        setToast({ type: 'success', message: 'Unmarked as spam and email unblocked' });
        fetchContacts();
      }
    } catch {
      setToast({ type: 'error', message: 'Failed to unmark spam' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkSpam = async () => {
    if (selectedIds.size === 0) return;
    setActionLoading('bulk');
    try {
      const promises = [...selectedIds].map(id =>
        fetch(`/api/admin/contacts/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_spam: true, status: 'spam' }),
        })
      );
      await Promise.all(promises);
      setToast({ type: 'success', message: `${selectedIds.size} entries marked as spam` });
      setSelectedIds(new Set());
      fetchContacts();
    } catch {
      setToast({ type: 'error', message: 'Failed to mark as spam' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblock = async (email: string) => {
    try {
      const res = await fetch('/api/admin/contacts/block-email', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setToast({ type: 'success', message: `${email} unblocked` });
        fetchBlocked();
        fetchContacts();
      }
    } catch {
      setToast({ type: 'error', message: 'Failed to unblock' });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setStatus('all');
    setSource('');
    setVisitorSource('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
    setSearchInput('');
    setShowSpam(false);
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map(c => c.id)));
    }
  };

  const maxSourceTotal = sourceRanking.length > 0 ? sourceRanking[0].total : 1;
  const hasFilters = status !== 'all' || source || visitorSource || dateFrom || dateTo || search || showSpam;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg',
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        )}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* ── Stats Bar ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<MessageSquare className="h-4 w-4 text-blue-600" />} bg="bg-blue-50" value={stats.total} label="Total Leads" />
        <StatCard icon={<Calendar className="h-4 w-4 text-emerald-600" />} bg="bg-emerald-50" value={stats.thisWeek} label="This Week" />
        <StatCard icon={<ShieldBan className="h-4 w-4 text-red-600" />} bg="bg-red-50" value={stats.spam} label="Spam Flagged" />
        <button onClick={() => setShowBlockedPanel(!showBlockedPanel)} className="text-left">
          <StatCard icon={<MailX className="h-4 w-4 text-slate-600" />} bg="bg-slate-100" value={stats.blocked} label="Blocked Emails" clickable />
        </button>
      </div>

      {/* ── Source Performance ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <button
          onClick={() => setShowSourceChart(!showSourceChart)}
          className="flex w-full items-center justify-between px-5 py-3.5"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">Source Performance</span>
            <span className="text-xs text-slate-400">({sourceRanking.length} sources)</span>
          </div>
          {showSourceChart ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {showSourceChart && sourceRanking.length > 0 && (
          <div className="border-t border-stone-100 px-5 py-4 space-y-2.5">
            {sourceRanking.map((s) => (
              <button
                key={s.source}
                onClick={() => { setSource(s.source === source ? '' : s.source); setPage(1); }}
                className={cn(
                  'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                  source === s.source ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-stone-50'
                )}
              >
                <div className="w-48 shrink-0 text-sm text-slate-700 truncate font-medium">
                  {getSourceLabel(s.source)}
                </div>
                <div className="flex-1 h-5 rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-300"
                    style={{ width: `${Math.max((s.total / maxSourceTotal) * 100, 2)}%` }}
                  />
                </div>
                <div className="w-20 shrink-0 text-right">
                  <span className="text-sm font-semibold text-navy-800">{s.total}</span>
                  {s.thisWeek > 0 && (
                    <span className="text-xs text-emerald-600 ml-1">(+{s.thisWeek})</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Filter className="h-4 w-4" />
            Filters
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-stone-200 px-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="resolved">Resolved</option>
            <option value="spam">Spam</option>
          </select>

          {/* Source */}
          <select
            value={source}
            onChange={(e) => { setSource(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-stone-200 px-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          >
            <option value="">All Sources</option>
            {sourceRanking.map(s => (
              <option key={s.source} value={s.source}>
                {getSourceLabel(s.source)} ({s.total})
              </option>
            ))}
          </select>

          {/* Visitor Source */}
          <select
            value={visitorSource}
            onChange={(e) => { setVisitorSource(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-stone-200 px-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          >
            <option value="">All Channels</option>
            <option value="(untracked)">Untracked (pre-system)</option>
            {VISITOR_SOURCE_OPTIONS.map(vs => (
              <option key={vs} value={vs}>{vs}</option>
            ))}
          </select>

          {/* Date from */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-stone-200 px-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-stone-200 px-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            placeholder="To"
          />

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-1.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search..."
                className="h-9 w-44 rounded-lg border border-stone-200 pl-8 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            <button type="submit" className="h-9 rounded-lg bg-navy-800 px-3 text-xs font-medium text-white hover:bg-navy-700">
              Go
            </button>
          </form>

          {/* Show spam toggle */}
          <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showSpam}
              onChange={(e) => { setShowSpam(e.target.checked); setPage(1); }}
              className="rounded border-stone-300 text-brand-600 focus:ring-brand-500"
            />
            Show spam
          </label>

          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Bulk actions ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{total} entr{total !== 1 ? 'ies' : 'y'}</p>
        {selectedIds.size > 0 && (
          <button
            onClick={handleBulkSpam}
            disabled={actionLoading === 'bulk'}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {actionLoading === 'bulk' ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldBan className="h-3 w-3" />}
            Mark {selectedIds.size} as Spam
          </button>
        )}
      </div>

      {/* ── Entries Table ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-stone-200 bg-white">
          <MessageSquare className="h-10 w-10 text-stone-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No entries found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === contacts.length && contacts.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Source</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Channel</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Service</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {contacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  expanded={expandedId === contact.id}
                  onToggle={() => setExpandedId(expandedId === contact.id ? null : contact.id)}
                  selected={selectedIds.has(contact.id)}
                  onSelect={() => toggleSelect(contact.id)}
                  actionLoading={actionLoading === contact.id}
                  onStatusChange={(s) => handleStatusChange(contact.id, s)}
                  onMarkSpam={() => handleMarkSpam(contact.id)}
                  onUnmarkSpam={() => handleUnmarkSpam(contact.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-stone-200 p-2 text-slate-500 hover:bg-stone-50 disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-stone-200 p-2 text-slate-500 hover:bg-stone-50 disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Blocked Emails Panel ─────────────────────────────────────── */}
      {showBlockedPanel && (
        <div className="rounded-xl border border-red-200 bg-red-50/30 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldBan className="h-4 w-4 text-red-600" />
              <h3 className="text-sm font-semibold text-red-800">Blocked Emails ({blockedEmails.length})</h3>
            </div>
            <button onClick={() => setShowBlockedPanel(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          {blockedEmails.length === 0 ? (
            <p className="text-sm text-slate-500">No blocked emails</p>
          ) : (
            <div className="space-y-2">
              {blockedEmails.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg bg-white px-4 py-2.5 border border-red-100">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{b.email}</p>
                    <p className="text-xs text-slate-400">
                      {b.reason || 'No reason'} &middot; {formatDate(b.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUnblock(b.email)}
                    className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-stone-50"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────

function StatCard({ icon, bg, value, label, clickable }: {
  icon: React.ReactNode; bg: string; value: number; label: string; clickable?: boolean;
}) {
  return (
    <div className={cn(
      'rounded-xl border border-stone-200 bg-white p-4 shadow-sm',
      clickable && 'hover:border-stone-300 cursor-pointer transition-colors'
    )}>
      <div className="flex items-center gap-3">
        <div className={cn('rounded-full p-2', bg)}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-navy-800">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ContactRow({ contact, expanded, onToggle, selected, onSelect, actionLoading, onStatusChange, onMarkSpam, onUnmarkSpam }: {
  contact: ContactItem;
  expanded: boolean;
  onToggle: () => void;
  selected: boolean;
  onSelect: () => void;
  actionLoading: boolean;
  onStatusChange: (s: string) => void;
  onMarkSpam: () => void;
  onUnmarkSpam: () => void;
}) {
  return (
    <>
      <tr className={cn(
        'transition-colors',
        contact.is_spam ? 'bg-red-50/30' : 'hover:bg-stone-50/50',
        expanded && 'bg-brand-50/20'
      )}>
        <td className="w-10 px-3 py-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            className="rounded border-stone-300 text-brand-600 focus:ring-brand-500"
          />
        </td>

        <td className="px-4 py-3">
          <p className="text-xs text-slate-500 whitespace-nowrap">{formatDate(contact.created_at)}</p>
        </td>

        <td className="px-4 py-3">
          <button onClick={onToggle} className="text-left">
            <p className={cn('text-sm font-medium text-navy-800', contact.is_spam && 'line-through text-red-600')}>
              {contact.name || '(no name)'}
            </p>
            <p className={cn('text-xs text-slate-400', contact.is_spam && 'line-through')}>
              {contact.email}
            </p>
          </button>
        </td>

        <td className="px-4 py-3 hidden lg:table-cell">
          <span className="inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 max-w-[180px] truncate">
            {getSourceLabel(contact.source)}
          </span>
        </td>

        <td className="px-4 py-3 hidden md:table-cell">
          <span className={cn(
            'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
            VISITOR_SOURCE_COLORS[contact.visitor_source || 'Untracked'] || 'bg-stone-100 text-stone-700'
          )}>
            {contact.visitor_source || 'Untracked'}
          </span>
        </td>

        <td className="px-4 py-3 hidden md:table-cell">
          <span className="text-xs text-slate-600 max-w-[140px] truncate block">
            {contact.service || '—'}
          </span>
        </td>

        <td className="px-4 py-3">
          <span className={cn(
            'inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize',
            STATUS_COLORS[contact.status] || STATUS_COLORS.new
          )}>
            {contact.status}
          </span>
        </td>

        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            {!contact.is_spam ? (
              <>
                <select
                  value={contact.status}
                  onChange={(e) => onStatusChange(e.target.value)}
                  disabled={actionLoading}
                  className="h-7 rounded border border-stone-200 px-1.5 text-xs text-slate-600 focus:border-brand-400 focus:outline-none disabled:opacity-50"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="resolved">Resolved</option>
                </select>
                <button
                  onClick={onMarkSpam}
                  disabled={actionLoading}
                  title="Mark as spam & block email"
                  className="rounded p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </>
            ) : (
              <button
                onClick={onUnmarkSpam}
                disabled={actionLoading}
                className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                Unmark
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr>
          <td colSpan={8} className="border-t border-stone-100 bg-stone-50 px-6 py-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left column — Contact details */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-navy-800">Contact Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <a href={`mailto:${contact.email}`} className="text-brand-600 hover:text-brand-700">{contact.email}</a>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <a href={`tel:${contact.phone}`} className="text-brand-600 hover:text-brand-700">{contact.phone}</a>
                    </div>
                  )}
                  {contact.company && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      {contact.company}
                    </div>
                  )}
                  {contact.service && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MessageSquare className="h-4 w-4 text-slate-400" />
                      {contact.service}
                    </div>
                  )}
                </div>
              </div>

              {/* Right column — Lead info */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-navy-800">Lead Info</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {formatDateTime(contact.created_at)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <BarChart3 className="h-4 w-4 text-slate-400" />
                    Source: {getSourceLabel(contact.source)}
                  </div>
                  {contact.quantity && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Filter className="h-4 w-4 text-slate-400" />
                      Estimated qty: {contact.quantity}
                    </div>
                  )}
                  {contact.variant && (
                    <div className="text-sm text-slate-500">
                      Variant: {contact.variant}
                    </div>
                  )}
                </div>
              </div>

              {/* Full-width message */}
              <div className="md:col-span-2">
                <h4 className="mb-2 text-sm font-semibold text-navy-800">Message</h4>
                <div className="rounded-lg bg-white border border-stone-200 p-3 text-sm text-slate-700 whitespace-pre-wrap">
                  {contact.message}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
