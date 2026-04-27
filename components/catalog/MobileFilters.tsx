'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FilterSidebar } from '@/components/builder/FilterSidebar';
import { cn } from '@/lib/utils';

export function MobileFilters() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4 lg:hidden">
      <div className="rounded-lg bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full cursor-pointer px-4 py-2.5 text-sm font-medium text-slate-900 flex items-center justify-between"
        >
          <span>Filters & Sort</span>
          <span className="flex items-center gap-1.5 text-xs font-normal text-slate-500">
            <span>{isOpen ? 'Tap to close' : 'Tap to expand'}</span>
            <ChevronDown 
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isOpen && 'rotate-180'
              )} 
            />
          </span>
        </button>
        
        {isOpen && (
          <div className="border-t border-stone-100 p-4">
            <FilterSidebar
              showBrands={true}
              showCategories={true}
              showPriceRange={true}
              collapsible={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
