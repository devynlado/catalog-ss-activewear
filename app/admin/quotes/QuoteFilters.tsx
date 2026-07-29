'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Search, X } from 'lucide-react';

interface QuoteFiltersProps {
  currentStatus: string;
  currentSearch: string;
  currentDateFrom: string;
  currentDateTo: string;
  statusCounts: {
    all: number;
    new: number;
    contacted: number;
    quoted: number;
  };
}

const statusTabs = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'quoted', label: 'Quoted' },
];

export function QuoteFilters({ currentStatus, currentSearch, currentDateFrom, currentDateTo, statusCounts }: QuoteFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentSearch);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/admin/quotes?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: searchValue || undefined });
  };

  const clearSearch = () => {
    setSearchValue('');
    updateParams({ search: undefined });
  };

  const clearDates = () => {
    updateParams({ date_from: undefined, date_to: undefined });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search by quote ID, customer, or company..."
            className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-10 pr-10 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          {searchValue && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      {/* Date range filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Calendar className="h-4 w-4" />
          Date
        </div>
        <input
          type="date"
          value={currentDateFrom}
          max={currentDateTo || undefined}
          onChange={(e) => updateParams({ date_from: e.target.value || undefined })}
          className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <span className="text-xs text-slate-400">to</span>
        <input
          type="date"
          value={currentDateTo}
          min={currentDateFrom || undefined}
          onChange={(e) => updateParams({ date_to: e.target.value || undefined })}
          className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        {(currentDateFrom || currentDateTo) && (
          <button
            type="button"
            onClick={clearDates}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600"
          >
            <X className="h-3 w-3" /> Clear dates
          </button>
        )}
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusTabs.map((tab) => {
          const count = statusCounts[tab.id as keyof typeof statusCounts];
          const isActive = currentStatus === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => updateParams({ status: tab.id === 'all' ? undefined : tab.id })}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-navy-800 text-white'
                  : 'bg-white text-slate-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-stone-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
