'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Route, Inbox, History as HistoryIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RedirectsTable } from './RedirectsTable';
import { UnresolvedSlugsTable } from './UnresolvedSlugsTable';
import { HistoryTable } from './HistoryTable';
import { RedirectFormModal } from './RedirectFormModal';
import type { PickedProduct } from './ProductPicker';
import type { RedirectRow, NotFoundSlugRow, HistoryRow } from './types';

type Tab = 'redirects' | 'unresolved' | 'history';

/**
 * Top-level admin UI for the slug-redirect system.
 *
 * Owns all three tabs' data, the create/edit modal state, and the
 * coordination between resolving an unresolved-slug row → opening the
 * modal pre-filled → marking the queue entry resolved on save.
 */
export function RedirectsClient() {
  const [tab, setTab] = useState<Tab>('redirects');

  const [redirects, setRedirects] = useState<RedirectRow[]>([]);
  const [redirectsLoading, setRedirectsLoading] = useState(true);

  const [unresolved, setUnresolved] = useState<NotFoundSlugRow[]>([]);
  const [unresolvedLoading, setUnresolvedLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [showBots, setShowBots] = useState(false);

  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RedirectRow | null>(null);
  const [presetSlug, setPresetSlug] = useState<string | null>(null);
  const [presetProduct, setPresetProduct] = useState<PickedProduct | null>(null);
  const [resolvedSlugKey, setResolvedSlugKey] = useState<string | null>(null);

  const fetchRedirects = useCallback(async () => {
    setRedirectsLoading(true);
    try {
      const res = await fetch('/api/admin/redirects?includeInactive=true');
      const data = await res.json().catch(() => ({}));
      setRedirects((data.redirects ?? []) as RedirectRow[]);
    } catch {
      setRedirects([]);
    } finally {
      setRedirectsLoading(false);
    }
  }, []);

  const fetchUnresolved = useCallback(async () => {
    setUnresolvedLoading(true);
    try {
      const params = new URLSearchParams();
      if (showResolved) params.set('includeResolved', 'true');
      if (showBots) params.set('includeBots', 'true');
      const qs = params.toString();
      const res = await fetch(`/api/admin/not-found-slugs${qs ? `?${qs}` : ''}`);
      const data = await res.json().catch(() => ({}));
      setUnresolved((data.slugs ?? []) as NotFoundSlugRow[]);
    } catch {
      setUnresolved([]);
    } finally {
      setUnresolvedLoading(false);
    }
  }, [showResolved, showBots]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/admin/redirects/history?limit=300');
      const data = await res.json().catch(() => ({}));
      setHistory((data.history ?? []) as HistoryRow[]);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRedirects();
  }, [fetchRedirects]);

  useEffect(() => {
    if (tab === 'unresolved') void fetchUnresolved();
  }, [tab, fetchUnresolved]);

  useEffect(() => {
    if (tab === 'history') void fetchHistory();
  }, [tab, fetchHistory]);

  // Refresh data on any save so every tab stays in sync.
  function handleSaved() {
    void fetchRedirects();
    void fetchUnresolved();
    void fetchHistory();
  }

  function openCreate() {
    setEditing(null);
    setPresetSlug(null);
    setPresetProduct(null);
    setResolvedSlugKey(null);
    setModalOpen(true);
  }

  function openEdit(row: RedirectRow) {
    setEditing(row);
    setPresetSlug(null);
    setPresetProduct(null);
    setResolvedSlugKey(null);
    setModalOpen(true);
  }

  function openCreateForSlug(slug: string, product?: PickedProduct | null) {
    setEditing(null);
    setPresetSlug(slug);
    setPresetProduct(product ?? null);
    setResolvedSlugKey(slug);
    setModalOpen(true);
  }

  const unresolvedCount = unresolved.filter((r) => !r.resolved && !r.is_bot).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-stone-200 bg-white p-1 shadow-sm">
          <TabButton
            active={tab === 'redirects'}
            onClick={() => setTab('redirects')}
            icon={<Route className="h-4 w-4" />}
            label="Active Redirects"
            count={redirects.length}
          />
          <TabButton
            active={tab === 'unresolved'}
            onClick={() => setTab('unresolved')}
            icon={<Inbox className="h-4 w-4" />}
            label="Unresolved Slugs"
            count={unresolvedCount}
            highlight={unresolvedCount > 0}
          />
          <TabButton
            active={tab === 'history'}
            onClick={() => setTab('history')}
            icon={<HistoryIcon className="h-4 w-4" />}
            label="History"
          />
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          New redirect
        </Button>
      </div>

      {tab === 'redirects' && (
        <RedirectsTable
          rows={redirects}
          loading={redirectsLoading}
          onEdit={openEdit}
          onChanged={handleSaved}
        />
      )}
      {tab === 'unresolved' && (
        <UnresolvedSlugsTable
          rows={unresolved}
          loading={unresolvedLoading}
          showResolved={showResolved}
          showBots={showBots}
          onToggleShowResolved={setShowResolved}
          onToggleShowBots={setShowBots}
          onCreateFor={openCreateForSlug}
          onChanged={handleSaved}
        />
      )}
      {tab === 'history' && <HistoryTable rows={history} loading={historyLoading} />}

      <RedirectFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        editing={editing}
        presetFromSlug={presetSlug}
        presetProduct={presetProduct}
        resolvedSlugKey={resolvedSlugKey}
      />
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
  highlight?: boolean;
}

function TabButton({ active, onClick, icon, label, count, highlight }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
        active
          ? 'bg-brand-50 font-medium text-brand-700'
          : 'text-slate-600 hover:bg-stone-50 hover:text-slate-900'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
            highlight && !active
              ? 'bg-red-500 text-white'
              : active
                ? 'bg-brand-100 text-brand-700'
                : 'bg-stone-100 text-slate-600'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
