'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Color rules (mirrors the /admin/contacts trend chart) ────────────────
const SOURCE_COLORS = {
  'Google Ads': '#3b82f6',      // blue
  'Organic Search': '#22c55e',  // green
  'Referral': '#f97316',        // orange
  'Organic Social': '#a855f7',  // purple
  'Direct': '#64748b',          // grey
} as const;

// Business timezone — keeps day buckets and tick labels in sync with the
// quote list regardless of who is viewing the dashboard.
const BUSINESS_TZ = 'America/Los_Angeles';

type SourceKey = keyof typeof SOURCE_COLORS;
const SOURCE_KEYS: SourceKey[] = ['Google Ads', 'Organic Search', 'Referral', 'Organic Social', 'Direct'];

interface TrendDay extends Record<SourceKey, number> {
  date: string;
  total: number;
  Other: number;
}

interface TrendResponse {
  from: string;
  to: string;
  days: number;
  total: number;
  totalsBySource: Record<SourceKey | 'Other', number>;
  data: TrendDay[];
}

type Preset = '7d' | '30d' | '90d' | 'custom';

const PRESETS: { id: Preset; label: string; days: number | null }[] = [
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '90d', label: 'Last 90 days', days: 90 },
  { id: 'custom', label: 'Custom', days: null },
];

/** Returns YYYY-MM-DD for the given instant, evaluated in the business timezone. */
function ymdInBusinessTz(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

/** Subtract `days` calendar days from a YYYY-MM-DD string. */
function shiftYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  const yy = next.getUTCFullYear();
  const mm = String(next.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(next.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function rangeForPreset(preset: Preset): { from: string; to: string } {
  const todayBusiness = ymdInBusinessTz(new Date());
  const days = PRESETS.find(p => p.id === preset)?.days ?? 30;
  return { from: shiftYmd(todayBusiness, -(days - 1)), to: todayBusiness };
}

/**
 * Format a YYYY-MM-DD bucket label for the X-axis. We construct the date as
 * UTC noon so timezone shifts can never push it onto the wrong calendar day.
 */
function formatTickDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return d.toLocaleDateString('en-US', {
    timeZone: BUSINESS_TZ,
    month: 'short',
    day: 'numeric',
  });
}

export function QuotesTrendChart() {
  const initial = rangeForPreset('30d');
  const [preset, setPreset] = useState<Preset>('30d');
  const [dateFrom, setDateFrom] = useState(initial.from);
  const [dateTo, setDateTo] = useState(initial.to);
  const [hiddenSources, setHiddenSources] = useState<Set<SourceKey>>(new Set());

  const [trend, setTrend] = useState<TrendResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Avoid double-fetch when both from/to change in the same preset click.
  const lastQueryRef = useRef<string>('');

  useEffect(() => {
    const queryKey = `${dateFrom}|${dateTo}`;
    if (queryKey === lastQueryRef.current) return;
    lastQueryRef.current = queryKey;

    let cancelled = false;
    setLoading(true);
    setError(null);

    // Bucket by business timezone (LA) so the chart matches the quote list.
    const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo, tz: BUSINESS_TZ });
    fetch(`/api/admin/quotes/leads-trend?${params}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return res.json() as Promise<TrendResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        setTrend(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load trend');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dateFrom, dateTo]);

  const handlePreset = (id: Preset) => {
    setPreset(id);
    if (id === 'custom') return;
    const r = rangeForPreset(id);
    setDateFrom(r.from);
    setDateTo(r.to);
  };

  const toggleSource = (source: SourceKey) => {
    setHiddenSources((prev) => {
      const next = new Set(prev);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  };

  const data = trend?.data ?? [];
  const totals = trend?.totalsBySource;

  const peakDay = useMemo(() => {
    if (!data.length) return null;
    return data.reduce((max, d) => (d.total > max.total ? d : max), data[0]);
  }, [data]);

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-b border-stone-100 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Quote Requests by Visitor Source</span>
          <span className="text-xs text-slate-400">
            {trend ? `${trend.total} request${trend.total === 1 ? '' : 's'} · ${trend.days} day${trend.days === 1 ? '' : 's'}` : '\u00A0'}
          </span>
        </div>

        {/* Preset chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePreset(p.id)}
              className={cn(
                'h-7 rounded-full border px-3 text-xs font-medium transition-colors',
                preset === p.id
                  ? 'border-brand-300 bg-brand-50 text-brand-700'
                  : 'border-stone-200 bg-white text-slate-500 hover:border-stone-300 hover:bg-stone-50'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Date pickers (always visible; act as manual override) ───────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 px-5 py-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <CalendarIcon className="h-3.5 w-3.5" />
          Range
        </div>
        <input
          type="date"
          value={dateFrom}
          max={dateTo}
          onChange={(e) => {
            setPreset('custom');
            setDateFrom(e.target.value);
          }}
          className="h-8 rounded-lg border border-stone-200 px-2.5 text-xs text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
        <span className="text-xs text-slate-400">to</span>
        <input
          type="date"
          value={dateTo}
          min={dateFrom}
          max={ymdInBusinessTz(new Date())}
          onChange={(e) => {
            setPreset('custom');
            setDateTo(e.target.value);
          }}
          className="h-8 rounded-lg border border-stone-200 px-2.5 text-xs text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />

        {peakDay && (
          <span className="ml-auto text-xs text-slate-400">
            Peak: <span className="font-medium text-slate-600">{formatTickDate(peakDay.date)}</span>{' '}
            ({peakDay.total} request{peakDay.total === 1 ? '' : 's'})
          </span>
        )}
      </div>

      {/* ── Chart body ──────────────────────────────────────────────────── */}
      <div className="px-3 pt-4 sm:px-5">
        {error ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-red-600">
            {error}
          </div>
        ) : loading && !trend ? (
          <div className="flex h-[280px] items-center justify-center text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-slate-400">
            No quote requests in this period
          </div>
        ) : (
          <div className={cn('h-[280px] w-full', loading && 'opacity-60')}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 12, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatTickDate}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#e7e5e4' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip content={<TrendTooltip hiddenSources={hiddenSources} />} />
                {SOURCE_KEYS.map((key) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={key}
                    stroke={SOURCE_COLORS[key]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    hide={hiddenSources.has(key)}
                    isAnimationActive={false}
                  />
                ))}
                <Legend content={() => null} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Custom legend (click to toggle) ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-stone-100 px-5 py-3">
        {SOURCE_KEYS.map((key) => {
          const muted = hiddenSources.has(key);
          const count = totals?.[key] ?? 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleSource(key)}
              className={cn(
                'flex items-center gap-2 text-xs transition-opacity',
                muted ? 'opacity-40' : 'opacity-100'
              )}
              title={muted ? 'Show this source' : 'Hide this source'}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: SOURCE_COLORS[key] }}
              />
              <span className="font-medium text-slate-700">{key}</span>
              <span className="text-slate-400">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Tooltip ──────────────────────────────────────────────────────────────

interface TooltipPayload {
  name: SourceKey | string;
  value: number;
  color: string;
  dataKey: string;
}

function TrendTooltip({
  active,
  payload,
  label,
  hiddenSources,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  hiddenSources: Set<SourceKey>;
}) {
  if (!active || !payload?.length || !label) return null;

  const visible = payload.filter((p) => !hiddenSources.has(p.dataKey as SourceKey) && p.value > 0);
  const total = visible.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3 text-xs shadow-md">
      <p className="mb-2 font-semibold text-slate-700">{formatTickDate(label)}</p>
      {visible.length === 0 ? (
        <p className="text-slate-400">No requests</p>
      ) : (
        <>
          {visible
            .sort((a, b) => b.value - a.value)
            .map((entry) => (
              <div key={entry.dataKey} className="flex items-center justify-between gap-6">
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.name}
                </span>
                <span className="font-medium text-slate-700">{entry.value}</span>
              </div>
            ))}
          <div className="mt-2 flex items-center justify-between gap-6 border-t border-stone-100 pt-1.5">
            <span className="text-slate-500">Total</span>
            <span className="font-semibold text-navy-800">{total}</span>
          </div>
        </>
      )}
    </div>
  );
}
