'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface CustomerFiltersProps {
  currentType: string;
  currentSearch: string;
  typeCounts: {
    all: number;
    direct: number;
    distributor: number;
  };
}

const typeTabs = [
  { id: 'all', label: 'All' },
  { id: 'direct', label: 'Direct' },
  { id: 'distributor', label: 'Trade Partners' },
];

export function CustomerFilters({ currentType, currentSearch, typeCounts }: CustomerFiltersProps) {
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

    router.push(`/admin/customers?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: searchValue || undefined });
  };

  const clearSearch = () => {
    setSearchValue('');
    updateParams({ search: undefined });
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
            placeholder="Search by name, email, or company..."
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

      {/* Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {typeTabs.map((tab) => {
          const count = typeCounts[tab.id as keyof typeof typeCounts];
          const isActive = currentType === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => updateParams({ type: tab.id === 'all' ? undefined : tab.id })}
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
