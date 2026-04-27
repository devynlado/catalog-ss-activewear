'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, SlidersHorizontal, Calendar, Truck, Palette } from 'lucide-react';

interface OrderFiltersProps {
  currentStatus: string;
  currentSearch: string;
  statusCounts: {
    all: number;
    pending: number;
    awaiting_purchasing: number;
    ordered: number;
    shipped: number;
    delivered: number;
  };
}

const statusTabs = [
  { id: 'all', label: 'All' },
  { id: 'awaiting_purchasing', label: 'Awaiting Purchasing' },
  { id: 'ordered', label: 'Ordered' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'pending', label: 'Pending', dimmed: true },
];

const supplierOptions = [
  { id: '', label: 'All Suppliers' },
  { id: 'ss', label: 'SS Activewear' },
  { id: 'laa', label: 'LA Apparel' },
  { id: 'ss_laa', label: 'SS + LA Apparel' },
];

const contentOptions = [
  { id: '', label: 'All Types' },
  { id: 'product_only', label: 'Product Only' },
  { id: 'product_deco', label: 'Product & Decoration' },
];

export function OrderFilters({ currentStatus, currentSearch, statusCounts }: OrderFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentSearch);

  const currentDateFrom = searchParams.get('date_from') || '';
  const currentDateTo = searchParams.get('date_to') || '';
  const currentSupplier = searchParams.get('supplier') || '';
  const currentContent = searchParams.get('content') || '';

  const hasAdvancedFilters = !!(currentDateFrom || currentDateTo || currentSupplier || currentContent);
  const [showAdvanced, setShowAdvanced] = useState(hasAdvancedFilters);

  const activeFilterCount = [currentDateFrom || currentDateTo, currentSupplier, currentContent].filter(Boolean).length;

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/admin/orders?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: searchValue || undefined });
  };

  const clearSearch = () => {
    setSearchValue('');
    updateParams({ search: undefined });
  };

  const clearAllAdvanced = () => {
    updateParams({
      date_from: undefined,
      date_to: undefined,
      supplier: undefined,
      content: undefined,
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search by order number, customer, company, or PO number..."
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

      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
          {statusTabs.map((tab) => {
            const count = statusCounts[tab.id as keyof typeof statusCounts];
            const isActive = currentStatus === tab.id;
            const isDimmed = 'dimmed' in tab && tab.dimmed;

            return (
              <button
                key={tab.id}
                onClick={() => updateParams({ status: tab.id === 'all' ? undefined : tab.id })}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-navy-800 text-white'
                    : isDimmed
                      ? 'bg-stone-50 text-slate-400 hover:bg-stone-100 border border-stone-200/60'
                      : 'bg-white text-slate-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isDimmed
                      ? 'bg-stone-100 text-slate-400'
                      : 'bg-stone-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            hasAdvancedFilters
              ? 'bg-brand-50 text-brand-700 border border-brand-200'
              : 'bg-white text-slate-600 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showAdvanced && (
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Advanced Filters</span>
            {hasAdvancedFilters && (
              <button
                onClick={clearAllAdvanced}
                className="text-xs font-medium text-red-500 hover:text-red-700"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Date Range */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Calendar className="h-3.5 w-3.5" /> Date Range
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={currentDateFrom}
                  onChange={(e) => updateParams({ date_from: e.target.value || undefined })}
                  className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={currentDateTo}
                  onChange={(e) => updateParams({ date_to: e.target.value || undefined })}
                  className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            {/* Supplier Type */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Truck className="h-3.5 w-3.5" /> Supplier
              </label>
              <select
                value={currentSupplier}
                onChange={(e) => updateParams({ supplier: e.target.value || undefined })}
                className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {supplierOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Order Content */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Palette className="h-3.5 w-3.5" /> Order Content
              </label>
              <select
                value={currentContent}
                onChange={(e) => updateParams({ content: e.target.value || undefined })}
                className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {contentOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
