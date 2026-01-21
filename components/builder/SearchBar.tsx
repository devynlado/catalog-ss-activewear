'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Loader2, Tag, Palette, Grid3X3, Hash } from 'lucide-react';
import { cn, debounce } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
  showSuggestions?: boolean;
  onSearch?: (query: string) => void;
  className?: string;
  autoFocus?: boolean;
}

// Suggestion types for categorized display
interface Suggestion {
  type: 'style' | 'brand' | 'color' | 'category';
  value: string;
  label: string;
}

export function SearchBar({
  placeholder = 'Search by style #, brand, or keyword...',
  showSuggestions = true,
  onSearch,
  className,
  autoFocus = false,
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  
  const [query, setQuery] = useState(initialSearch);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Popular style numbers
  const popularStyles = [
    'G500', 'G200', 'G640', 'BC3001', 'BC3413', 
    'NL6210', 'NL3600', 'PC61', 'PC54', '5000',
    'G180', 'G185', 'G240', 'G800', 'DT6000',
  ];

  // Popular brands (top brands in the catalog)
  const popularBrands = [
    'Gildan', 'Hanes', 'Next Level', 'Bella+Canvas', 'Champion',
    'Fruit of the Loom', 'Adidas', 'Nike', 'Port Authority', 'Sport-Tek',
    'Comfort Colors', 'American Apparel', 'Alternative', 'JERZEES', 'District',
  ];

  // Color families for suggestions
  const colorFamilies = [
    'Black', 'White', 'Grey', 'Navy', 'Blue', 'Red', 
    'Green', 'Orange', 'Yellow', 'Pink', 'Purple', 'Brown',
  ];

  // Main categories for suggestions
  const mainCategories = [
    { value: 'T-Shirts', label: 'T-Shirts' },
    { value: 'Fleece', label: 'Fleece & Sweatshirts' },
    { value: 'Polos', label: 'Polos' },
    { value: 'Outerwear', label: 'Outerwear & Jackets' },
    { value: 'Headwear', label: 'Headwear & Caps' },
    { value: 'Bottoms', label: 'Bottoms & Pants' },
    { value: 'Bags', label: 'Bags & Totes' },
    { value: 'Accessories', label: 'Accessories' },
  ];

  // Default suggestions when no query
  const defaultSuggestions = useMemo<Suggestion[]>(() => [
    // Show a mix of popular items
    { type: 'style', value: 'G500', label: 'Gildan G500' },
    { type: 'style', value: 'BC3001', label: 'Bella+Canvas 3001' },
    { type: 'brand', value: 'Gildan', label: 'Gildan' },
    { type: 'brand', value: 'Next Level', label: 'Next Level' },
    { type: 'category', value: 'T-Shirts', label: 'T-Shirts' },
    { type: 'color', value: 'Navy', label: 'Navy' },
  ], []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate suggestions based on query
  const generateSuggestions = useCallback((searchQuery: string): Suggestion[] => {
    if (!searchQuery || searchQuery.length < 2) {
      return [];
    }

    const q = searchQuery.toLowerCase();
    const results: Suggestion[] = [];

    // Match style numbers
    popularStyles.forEach(style => {
      if (style.toLowerCase().includes(q)) {
        results.push({ type: 'style', value: style, label: style });
      }
    });

    // Match brands
    popularBrands.forEach(brand => {
      if (brand.toLowerCase().includes(q)) {
        results.push({ type: 'brand', value: brand, label: brand });
      }
    });

    // Match colors
    colorFamilies.forEach(color => {
      if (color.toLowerCase().includes(q)) {
        results.push({ type: 'color', value: color, label: color });
      }
    });

    // Match categories
    mainCategories.forEach(cat => {
      if (cat.value.toLowerCase().includes(q) || cat.label.toLowerCase().includes(q)) {
        results.push({ type: 'category', value: cat.value, label: cat.label });
      }
    });

    // Limit and dedupe
    return results.slice(0, 8);
  }, []);

  // Debounced suggestion fetching
  const fetchSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      const results = generateSuggestions(searchQuery);
      setSuggestions(results);
    }, 150),
    [generateSuggestions]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (showSuggestions) {
      fetchSuggestions(value);
      setShowDropdown(true);
    }
  };

  const handleSearch = (searchQuery: string = query) => {
    setShowDropdown(false);
    setIsLoading(true);

    if (onSearch) {
      onSearch(searchQuery);
      setIsLoading(false);
    } else {
      // Navigate to catalog with search param
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) {
        params.set('search', searchQuery);
      } else {
        params.delete('search');
      }
      router.push(`/catalog?${params.toString()}`);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setQuery(suggestion.value);
    handleSearch(suggestion.value);
  };

  // Get icon for suggestion type
  const getSuggestionIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'style':
        return <Hash className="h-4 w-4 text-slate-400" />;
      case 'brand':
        return <Tag className="h-4 w-4 text-blue-500" />;
      case 'color':
        return <Palette className="h-4 w-4 text-pink-500" />;
      case 'category':
        return <Grid3X3 className="h-4 w-4 text-green-500" />;
      default:
        return <Search className="h-4 w-4 text-slate-400" />;
    }
  };

  // Get label for suggestion type
  const getSuggestionTypeLabel = (type: Suggestion['type']) => {
    switch (type) {
      case 'style': return 'Style';
      case 'brand': return 'Brand';
      case 'color': return 'Color';
      case 'category': return 'Category';
      default: return '';
    }
  };

  // Group suggestions by type for display
  const groupedSuggestions = useMemo(() => {
    const groups: Record<Suggestion['type'], Suggestion[]> = {
      style: [],
      brand: [],
      color: [],
      category: [],
    };
    
    (query.length === 0 ? defaultSuggestions : suggestions).forEach(s => {
      groups[s.type].push(s);
    });
    
    return groups;
  }, [suggestions, defaultSuggestions, query.length]);

  const hasAnySuggestions = Object.values(groupedSuggestions).some(arr => arr.length > 0);

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        {/* Search Icon */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          ) : (
            <Search className="h-5 w-5 text-slate-400" />
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => showSuggestions && setShowDropdown(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            'w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-12',
            'text-sm placeholder:text-slate-400',
            'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
            'transition-colors'
          )}
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && showDropdown && hasAnySuggestions && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-lg"
        >
          {query.length === 0 && (
            <p className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Quick Suggestions
            </p>
          )}
          
          {/* Style suggestions */}
          {groupedSuggestions.style.length > 0 && (
            <div className="border-b border-slate-100 pb-2 mb-2">
              {query.length > 0 && (
                <p className="px-4 py-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Styles
                </p>
              )}
              {groupedSuggestions.style.map((suggestion) => (
                <button
                  key={`style-${suggestion.value}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50"
                >
                  {getSuggestionIcon(suggestion.type)}
                  <span className="font-medium">{suggestion.label}</span>
                  <span className="ml-auto text-xs text-slate-400">
                    {getSuggestionTypeLabel(suggestion.type)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Brand suggestions */}
          {groupedSuggestions.brand.length > 0 && (
            <div className="border-b border-slate-100 pb-2 mb-2">
              {query.length > 0 && (
                <p className="px-4 py-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Brands
                </p>
              )}
              {groupedSuggestions.brand.map((suggestion) => (
                <button
                  key={`brand-${suggestion.value}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50"
                >
                  {getSuggestionIcon(suggestion.type)}
                  <span className="font-medium">{suggestion.label}</span>
                  <span className="ml-auto text-xs text-slate-400">
                    {getSuggestionTypeLabel(suggestion.type)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Category suggestions */}
          {groupedSuggestions.category.length > 0 && (
            <div className="border-b border-slate-100 pb-2 mb-2">
              {query.length > 0 && (
                <p className="px-4 py-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Categories
                </p>
              )}
              {groupedSuggestions.category.map((suggestion) => (
                <button
                  key={`category-${suggestion.value}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50"
                >
                  {getSuggestionIcon(suggestion.type)}
                  <span className="font-medium">{suggestion.label}</span>
                  <span className="ml-auto text-xs text-slate-400">
                    {getSuggestionTypeLabel(suggestion.type)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Color suggestions */}
          {groupedSuggestions.color.length > 0 && (
            <div>
              {query.length > 0 && (
                <p className="px-4 py-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Colors
                </p>
              )}
              {groupedSuggestions.color.map((suggestion) => (
                <button
                  key={`color-${suggestion.value}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50"
                >
                  {getSuggestionIcon(suggestion.type)}
                  <span className="font-medium">{suggestion.label}</span>
                  <span className="ml-auto text-xs text-slate-400">
                    {getSuggestionTypeLabel(suggestion.type)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Default export for Builder.io
export default SearchBar;
