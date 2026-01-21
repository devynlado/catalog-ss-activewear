'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { cn, debounce } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
  showSuggestions?: boolean;
  onSearch?: (query: string) => void;
  className?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  placeholder = 'Search by style # or keyword...',
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Popular style numbers for suggestions
  const popularStyles = [
    'G500', 'G200', 'G640', 'BC3001', 'BC3413', 
    'NL6210', 'NL3600', 'PC61', 'PC54', '5000'
  ];

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

  // Debounced suggestion fetching
  const fetchSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      // Filter popular styles that match the query
      const matchingStyles = popularStyles.filter((style) =>
        style.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setSuggestions(matchingStyles.slice(0, 5));
    }, 200),
    []
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

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

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
      {showSuggestions && showDropdown && (suggestions.length > 0 || query.length === 0) && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-slate-200 bg-white py-2 shadow-lg"
        >
          {query.length === 0 ? (
            <>
              <p className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                Popular Style Numbers
              </p>
              {popularStyles.slice(0, 6).map((style) => (
                <button
                  key={style}
                  onClick={() => handleSuggestionClick(style)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <Search className="h-4 w-4 text-slate-400" />
                  <span>{style}</span>
                </button>
              ))}
            </>
          ) : (
            suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50"
              >
                <Search className="h-4 w-4 text-slate-400" />
                <span>{suggestion}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Default export for Builder.io
export default SearchBar;
