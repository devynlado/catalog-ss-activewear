'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpecTableData {
  sizes: string[];
  specs: Array<{
    specName: string;
    values: Record<string, string>;
  }>;
}

interface SpecsContentProps {
  styleId: number;
  isActive?: boolean; // For tab mode - auto-fetch when active
  className?: string;
}

// Specs content component - used by tabs
export function SpecsContent({ styleId, isActive = true, className }: SpecsContentProps) {
  const [specData, setSpecData] = useState<SpecTableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch specs when active
  useEffect(() => {
    if (isActive && !loaded && !loading) {
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
  }, [isActive, loaded, loading, styleId]);

  const hasMultipleSizes = specData && specData.sizes.length > 1;

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-500">Loading specifications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('px-4 py-8 text-sm text-red-500 text-center', className)}>
        {error}
      </div>
    );
  }

  if (loaded && (!specData || specData.specs.length === 0)) {
    return (
      <div className={cn('px-4 py-8 text-sm text-slate-500 text-center', className)}>
        No specifications available for this product.
      </div>
    );
  }

  if (!loaded) {
    return null;
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      {hasMultipleSizes ? (
        // Table layout for size-based specs
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50">
              <th className="px-4 py-3 text-left font-medium text-slate-600 min-w-[180px]">
                Specification
              </th>
              {specData!.sizes.map((size) => (
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
            {specData!.specs.map((spec, index) => (
              <tr
                key={spec.specName}
                className={cn(
                  'border-b border-slate-100',
                  index % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'
                )}
              >
                <td className="px-4 py-3 font-medium text-slate-700">
                  {spec.specName}
                </td>
                {specData!.sizes.map((size) => (
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
        <dl className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {specData!.specs.map((spec) => (
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
  );
}

// Legacy accordion export for backward compatibility
export function SpecsAccordion({ styleId, className }: { styleId: number; className?: string }) {
  return <SpecsContent styleId={styleId} isActive={true} className={className} />;
}
