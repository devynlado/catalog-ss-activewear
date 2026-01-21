'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpecTableData {
  sizes: string[];
  specs: Array<{
    specName: string;
    values: Record<string, string>;
  }>;
}

interface SpecsAccordionProps {
  styleId: number;
  className?: string;
}

export function SpecsAccordion({ styleId, className }: SpecsAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [specData, setSpecData] = useState<SpecTableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch specs when accordion is first opened
  useEffect(() => {
    if (isOpen && !loaded && !loading) {
      setLoading(true);
      fetch(`/api/products/${styleId}/specs`)
        .then((res) => res.json())
        .then((data: SpecTableData) => {
          if (data && data.sizes && data.specs) {
            setSpecData(data);
          }
          setLoaded(true);
        })
        .catch((err) => {
          console.error('Error loading specs:', err);
          setError('Failed to load specifications');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, loaded, loading, styleId]);

  // Don't render if no specs after loading
  if (loaded && (!specData || specData.specs.length === 0)) {
    return null;
  }

  const hasMultipleSizes = specData && specData.sizes.length > 1;

  return (
    <div className={cn('rounded-xl bg-white shadow-sm overflow-hidden', className)}>
      {/* Accordion Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-slate-400" />
          <span className="font-semibold text-slate-900">Specifications</span>
          {!loaded && (
            <span className="text-xs text-slate-400">(click to load)</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-slate-400 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Accordion Content */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-[2000px]' : 'max-h-0'
        )}
      >
        <div className="border-t border-slate-100">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">Loading specifications...</span>
            </div>
          )}

          {error && (
            <div className="px-6 py-4 text-sm text-red-500">{error}</div>
          )}

          {loaded && specData && specData.specs.length > 0 && (
            <div className="overflow-x-auto">
              {hasMultipleSizes ? (
                // Table layout for size-based specs
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left font-medium text-slate-600 min-w-[180px]">
                        Specification
                      </th>
                      {specData.sizes.map((size) => (
                        <th
                          key={size}
                          className="px-3 py-3 text-center font-semibold text-slate-700 min-w-[60px]"
                        >
                          {size}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {specData.specs.map((spec, index) => (
                      <tr
                        key={spec.specName}
                        className={cn(
                          'border-b border-slate-100',
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                        )}
                      >
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {spec.specName}
                        </td>
                        {specData.sizes.map((size) => (
                          <td
                            key={size}
                            className="px-3 py-3 text-center text-slate-600"
                          >
                            {spec.values[size] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                // Simple list layout for single-size or no-size specs
                <dl className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {specData.specs.map((spec) => (
                    <div key={spec.specName} className="flex flex-col">
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {spec.specName}
                      </dt>
                      <dd className="mt-0.5 text-sm text-slate-900">
                        {Object.values(spec.values)[0] || '—'}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
