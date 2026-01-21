'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { Brand, Category } from '@/lib/types';
import { getCategoryName, MAIN_CATEGORIES } from '@/lib/category-taxonomy';

interface ActiveFiltersProps {
  search?: string;
  category?: string;
  brand?: string;
  colorFamily?: string;
  attr?: string; // Comma-separated attribute category IDs
}

export function ActiveFilters({ search, category, brand, colorFamily, attr }: ActiveFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [brandName, setBrandName] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [attributeNames, setAttributeNames] = useState<Map<string, string>>(new Map());
  
  // Parse attribute IDs
  const attributeIds = attr?.split(',').filter(Boolean) || [];

  // Fetch brand name if we have a brand filter
  useEffect(() => {
    if (!brand) {
      setBrandName(null);
      return;
    }

    const fetchBrandName = async () => {
      try {
        const res = await fetch('/api/brands');
        if (res.ok) {
          const data = await res.json();
          const foundBrand = (data.data as Brand[])?.find(
            (b) => b.id.toString() === brand
          );
          setBrandName(foundBrand?.name || null);
        }
      } catch (e) {
        console.error('Error fetching brand:', e);
      }
    };

    fetchBrandName();
  }, [brand]);

  // Resolve category name (try taxonomy first, then fetch)
  useEffect(() => {
    if (!category) {
      setCategoryName(null);
      return;
    }

    const categoryId = parseInt(category, 10);
    
    // Check if it's a main category from taxonomy
    if (MAIN_CATEGORIES[categoryId]) {
      setCategoryName(MAIN_CATEGORIES[categoryId].name);
      return;
    }

    // Otherwise fetch from API
    const fetchCategoryName = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          const foundCategory = (data.data as Category[])?.find(
            (c) => c.id.toString() === category
          );
          setCategoryName(foundCategory?.name || null);
        }
      } catch (e) {
        console.error('Error fetching category:', e);
      }
    };

    fetchCategoryName();
  }, [category]);

  // Fetch attribute names for selected attribute IDs
  useEffect(() => {
    if (attributeIds.length === 0) {
      setAttributeNames(new Map());
      return;
    }

    const fetchAttributeNames = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          const newNames = new Map<string, string>();
          for (const id of attributeIds) {
            const found = (data.data as Category[])?.find(
              (c) => c.id.toString() === id
            );
            if (found) {
              newNames.set(id, found.name);
            }
          }
          setAttributeNames(newNames);
        }
      } catch (e) {
        console.error('Error fetching attribute names:', e);
      }
    };

    fetchAttributeNames();
  }, [attr]); // eslint-disable-line react-hooks/exhaustive-deps

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete('page');
    router.push(`/catalog?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push('/catalog');
  };

  // Parse color families (can be comma-separated for multi-select)
  const colorFamilies = colorFamily?.split(',').filter(Boolean) || [];
  
  // Remove a single attribute from the list
  const removeAttribute = (idToRemove: string) => {
    const remaining = attributeIds.filter(id => id !== idToRemove);
    const params = new URLSearchParams(searchParams.toString());
    if (remaining.length > 0) {
      params.set('attr', remaining.join(','));
    } else {
      params.delete('attr');
    }
    params.delete('page');
    router.push(`/catalog?${params.toString()}`);
  };
  
  const hasFilters = search || category || brand || colorFamilies.length > 0 || attributeIds.length > 0;

  if (!hasFilters) return null;

  return (
    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500">Showing results for:</span>
        
        {search && (
          <FilterTag
            label={`"${search}"`}
            onRemove={() => removeFilter('search')}
            variant="primary"
          />
        )}
        
        {category && (
          <FilterTag
            label={categoryName || `Category ${category}`}
            onRemove={() => removeFilter('category')}
          />
        )}
        
        {brand && (
          <FilterTag
            label={brandName || `Brand ${brand}`}
            onRemove={() => removeFilter('brand')}
          />
        )}
        
        {colorFamilies.map((cf) => (
          <FilterTag
            key={cf}
            label={cf}
            onRemove={() => {
              // Remove this specific color from the list
              const remaining = colorFamilies.filter(c => c !== cf);
              const params = new URLSearchParams(searchParams.toString());
              if (remaining.length > 0) {
                params.set('colorFamily', remaining.join(','));
              } else {
                params.delete('colorFamily');
              }
              params.delete('page');
              router.push(`/catalog?${params.toString()}`);
            }}
            variant="primary"
          />
        ))}
        
        {/* Attribute filters (Sleeve, Fit, Material, etc.) */}
        {attributeIds.map((id) => (
          <FilterTag
            key={id}
            label={attributeNames.get(id) || `Attribute ${id}`}
            onRemove={() => removeAttribute(id)}
          />
        ))}

        <button
          onClick={clearAllFilters}
          className="ml-2 text-sm text-slate-500 hover:text-slate-700 underline"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}

function FilterTag({
  label,
  onRemove,
  variant = 'default',
}: {
  label: string;
  onRemove: () => void;
  variant?: 'default' | 'primary';
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
        variant === 'primary'
          ? 'bg-brand-50 text-brand-700'
          : 'bg-slate-100 text-slate-700'
      }`}
    >
      {label}
      <button
        onClick={(e) => {
          e.preventDefault();
          onRemove();
        }}
        className="rounded-full p-0.5 hover:bg-black/10"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
