'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function startOfYear(): string {
  return `${new Date().getFullYear()}-01-01`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const PRESETS = [
  { label: '7 days', start: () => daysAgo(7), end: today },
  { label: '30 days', start: () => daysAgo(30), end: today },
  { label: '90 days', start: () => daysAgo(90), end: today },
  { label: 'YTD', start: startOfYear, end: today },
] as const;

export function DateRangePicker({ startDate, endDate }: DateRangePickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = (start: string, end: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('startDate', start);
    params.set('endDate', end);
    router.push(`/admin/sales-funnel?${params.toString()}`);
  };

  const activePreset = PRESETS.findIndex(
    (p) => p.start() === startDate && p.end() === endDate
  );

  return (
    <div className="mb-8 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span>Date range</span>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => navigate(e.target.value, endDate)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            max={today()}
            onChange={(e) => navigate(startDate, e.target.value)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {PRESETS.map((preset, i) => (
            <button
              key={preset.label}
              onClick={() => navigate(preset.start(), preset.end())}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activePreset === i
                  ? 'bg-navy-800 text-white'
                  : 'border border-stone-200 bg-white text-slate-600 hover:bg-stone-50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
