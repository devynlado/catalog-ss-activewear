'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  BookOpen, 
  TrendingUp, 
  Calendar, 
  ArrowRight, 
  Search, 
  GraduationCap, 
  Trophy, 
  Building2, 
  PartyPopper, 
  Store,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuideProduct {
  id: number;
  name: string;
  style_number: string;
  image_url?: string;
}

interface Guide {
  id: number;
  name: string;
  slug: string;
  productCount?: number;
  topProducts?: GuideProduct[];
}

interface GuidesClientProps {
  guides: Guide[];
}

// Recent guides storage key
const RECENT_GUIDES_KEY = 'garment-decor-recent-guides';
const MAX_RECENT_GUIDES = 5;

// Use-case filter definitions with expanded keywords
const USE_CASE_FILTERS = [
  { 
    id: 'all', 
    label: 'All Guides', 
    icon: BookOpen,
    keywords: [] // Empty means show all
  },
  { 
    id: 'schools', 
    label: 'For Schools', 
    icon: GraduationCap,
    keywords: [
      'school', 'uniform', 'youth', 'education', 'student', 'campus', 'collegiate',
      'k-12', 'university', 'elementary', 'high school', 'middle school', 'kids',
      'children', 'junior', 'academic', 'graduation', 'spirit wear', 'playbook'
    ]
  },
  { 
    id: 'sports', 
    label: 'For Sports', 
    icon: Trophy,
    keywords: [
      'sport', 'athletic', 'team', 'performance', 'jersey', 'fitness', 'gym', 'workout',
      'basketball', 'football', 'baseball', 'soccer', 'volleyball', 'track', 'running',
      'coach', 'league', 'tournament', 'championship', 'moisture', 'dri-fit', 'active',
      'training', 'exercise', 'warmup', 'warm-up'
    ]
  },
  { 
    id: 'corporate', 
    label: 'For Corporate', 
    icon: Building2,
    keywords: [
      'corporate', 'business', 'polo', 'office', 'professional', 'work', 'company',
      'executive', 'dress', 'button', 'oxford', 'formal', 'uniform', 'employee',
      'staff', 'logo', 'branded', 'workwear', 'industrial', 'trade', 'safety'
    ]
  },
  { 
    id: 'events', 
    label: 'For Events', 
    icon: PartyPopper,
    keywords: [
      'event', 'promo', 'giveaway', 'trade', 'show', 'festival', 'concert', 'party',
      'promotional', 'fundraiser', 'charity', 'run', 'walk', 'marathon', '5k',
      'conference', 'convention', 'expo', 'fair', 'booth', 'swag', 'merch'
    ]
  },
  { 
    id: 'retail', 
    label: 'For Retail', 
    icon: Store,
    keywords: [
      'retail', 'streetwear', 'fashion', 'trending', 'lifestyle', 'market',
      'vintage', 'premium', 'luxury', 'boutique', 'brand', 'style', 'urban',
      'casual', 'everyday', 'comfortable', 'soft', 'ring-spun', 'wholesale'
    ]
  },
];

// Category cards for visual navigation (matching home page)
const CATEGORY_CARDS = [
  { 
    id: 'schools',
    label: 'For Schools', 
    icon: GraduationCap, 
    gradient: 'from-blue-500 to-blue-600',
    bgHover: 'hover:bg-blue-50',
    description: 'Uniforms, spirit wear & youth sizes'
  },
  { 
    id: 'sports',
    label: 'For Sports', 
    icon: Trophy, 
    gradient: 'from-green-500 to-green-600',
    bgHover: 'hover:bg-green-50',
    description: 'Athletic wear & team jerseys'
  },
  { 
    id: 'corporate',
    label: 'For Corporate', 
    icon: Building2, 
    gradient: 'from-purple-500 to-purple-600',
    bgHover: 'hover:bg-purple-50',
    description: 'Polos, workwear & professional'
  },
  { 
    id: 'events',
    label: 'For Events', 
    icon: PartyPopper, 
    gradient: 'from-amber-500 to-amber-600',
    bgHover: 'hover:bg-amber-50',
    description: 'Promos, giveaways & merch'
  },
  { 
    id: 'retail',
    label: 'For Retail', 
    icon: Store, 
    gradient: 'from-rose-500 to-rose-600',
    bgHover: 'hover:bg-rose-50',
    description: 'Streetwear & fashion blanks'
  },
];

// Categorize guides by type
function categorizeGuides(guides: Guide[]): {
  seasonal: Guide[];
  trending: Guide[];
  specialty: Guide[];
} {
  const seasonal: Guide[] = [];
  const trending: Guide[] = [];
  const specialty: Guide[] = [];
  
  for (const guide of guides) {
    const nameLower = guide.name.toLowerCase();
    
    if (nameLower.includes('2025') || nameLower.includes('2024') || 
        nameLower.includes('spring') || nameLower.includes('summer') ||
        nameLower.includes('fall') || nameLower.includes('winter') ||
        nameLower.includes('holiday') || nameLower.includes('seasonal')) {
      seasonal.push(guide);
    } else if (nameLower.includes('trending') || nameLower.includes('new') ||
               nameLower.includes("what's") || nameLower.includes('popular') ||
               nameLower.includes('hot') || nameLower.includes('bestseller')) {
      trending.push(guide);
    } else {
      specialty.push(guide);
    }
  }
  
  return { seasonal, trending, specialty };
}

// Get recent guides from localStorage
function getRecentGuides(): { id: number; name: string; slug: string; visitedAt: number }[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_GUIDES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save a guide visit to localStorage
function saveRecentGuide(guide: Guide) {
  if (typeof window === 'undefined') return;
  try {
    const recent = getRecentGuides().filter(g => g.id !== guide.id);
    recent.unshift({
      id: guide.id,
      name: guide.name,
      slug: guide.slug,
      visitedAt: Date.now()
    });
    localStorage.setItem(RECENT_GUIDES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT_GUIDES)));
  } catch {
    // Ignore localStorage errors
  }
}

// Guide card with hover preview
function GuideCard({ 
  guide, 
  onNavigate 
}: { 
  guide: Guide; 
  onNavigate?: (guide: Guide) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleClick = () => {
    if (onNavigate) {
      onNavigate(guide);
    }
  };
  
  return (
    <div className="relative">
      <Link
        href={`/guides/${guide.slug}`}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative block overflow-hidden rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-brand-300 hover:shadow-lg"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
              {guide.name}
            </h3>
            {guide.productCount && guide.productCount > 0 && (
              <p className="mt-1 text-sm text-slate-500">
                {guide.productCount} products
              </p>
            )}
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
        </div>
        
        {/* Product preview on hover */}
        {guide.topProducts && guide.topProducts.length > 0 && (
          <div className={cn(
            'mt-4 pt-4 border-t border-stone-100 transition-all duration-200',
            isHovered ? 'opacity-100 max-h-24' : 'opacity-0 max-h-0 overflow-hidden'
          )}>
            <p className="text-xs font-medium text-slate-500 mb-2">Top products:</p>
            <div className="flex gap-2">
              {guide.topProducts.slice(0, 3).map((product) => (
                <div 
                  key={product.id}
                  className="flex items-center gap-1.5 text-xs text-slate-600 bg-stone-50 rounded px-2 py-1"
                >
                  {product.image_url ? (
                    <Image 
                      src={product.image_url} 
                      alt="" 
                      width={16} 
                      height={16} 
                      className="rounded"
                    />
                  ) : (
                    <Package className="h-3 w-3 text-slate-400" />
                  )}
                  <span className="truncate max-w-[80px]">{product.style_number}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Link>
    </div>
  );
}

function GuideSection({ 
  title, 
  icon: Icon, 
  guides, 
  description,
  initialLimit = 9,
  onNavigate,
}: { 
  title: string; 
  icon: typeof BookOpen; 
  guides: Guide[]; 
  description: string;
  initialLimit?: number;
  onNavigate?: (guide: Guide) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (guides.length === 0) return null;
  
  const displayedGuides = isExpanded ? guides : guides.slice(0, initialLimit);
  const hasMore = guides.length > initialLimit;
  
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
            <Icon className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {title}
              <span className="ml-2 text-sm font-normal text-slate-500">({guides.length})</span>
            </h2>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
        
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            {isExpanded ? (
              <>
                Show Less
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                View All ({guides.length})
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayedGuides.map((guide) => (
          <GuideCard key={guide.id} guide={guide} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
}

// Recent guides section
function RecentGuidesSection({ 
  guides, 
  allGuides,
  onNavigate 
}: { 
  guides: { id: number; name: string; slug: string; visitedAt: number }[];
  allGuides: Guide[];
  onNavigate?: (guide: Guide) => void;
}) {
  if (guides.length === 0) return null;
  
  // Enrich recent guides with full data
  const enrichedGuides = guides
    .map(recent => {
      const full = allGuides.find(g => g.id === recent.id);
      return full ? { ...full, visitedAt: recent.visitedAt } : null;
    })
    .filter((g): g is Guide & { visitedAt: number } => g !== null);
  
  if (enrichedGuides.length === 0) return null;
  
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
          <Clock className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Recently Viewed
            <span className="ml-2 text-sm font-normal text-slate-500">({enrichedGuides.length})</span>
          </h2>
          <p className="text-sm text-slate-500">Pick up where you left off</p>
        </div>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {enrichedGuides.map((guide) => (
          <GuideCard key={guide.id} guide={guide} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
}

export function GuidesClient({ guides }: GuidesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [activeFilter, setActiveFilter] = useState(searchParams.get('filter') || 'all');
  const [recentGuides, setRecentGuides] = useState<{ id: number; name: string; slug: string; visitedAt: number }[]>([]);
  
  // Load recent guides on mount
  useEffect(() => {
    setRecentGuides(getRecentGuides());
  }, []);
  
  // Update URL when filters change (debounced for search)
  const updateUrl = useCallback((search: string, filter: string) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (filter !== 'all') params.set('filter', filter);
    
    const queryString = params.toString();
    const newUrl = queryString ? `/guides?${queryString}` : '/guides';
    router.replace(newUrl, { scroll: false });
  }, [router]);
  
  // Debounce search URL updates
  useEffect(() => {
    const timer = setTimeout(() => {
      updateUrl(searchQuery, activeFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter, updateUrl]);
  
  // Handle guide navigation (save to recent)
  const handleNavigate = useCallback((guide: Guide) => {
    saveRecentGuide(guide);
  }, []);
  
  // Filter guides based on search and use-case filter
  const filteredGuides = useMemo(() => {
    let result = guides;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(g => 
        g.name.toLowerCase().includes(query)
      );
    }
    
    // Apply use-case filter
    if (activeFilter !== 'all') {
      const filter = USE_CASE_FILTERS.find(f => f.id === activeFilter);
      if (filter && filter.keywords.length > 0) {
        result = result.filter(g => {
          const nameLower = g.name.toLowerCase();
          return filter.keywords.some(keyword => nameLower.includes(keyword));
        });
      }
    }
    
    return result;
  }, [guides, searchQuery, activeFilter]);
  
  // Categorize filtered guides
  const { seasonal, trending, specialty } = useMemo(
    () => categorizeGuides(filteredGuides),
    [filteredGuides]
  );
  
  const hasResults = filteredGuides.length > 0;
  const isFiltering = searchQuery.trim() || activeFilter !== 'all';
  
  // Get matching count for each filter (for badges)
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    USE_CASE_FILTERS.forEach(filter => {
      if (filter.id === 'all') {
        counts[filter.id] = guides.length;
      } else {
        counts[filter.id] = guides.filter(g => {
          const nameLower = g.name.toLowerCase();
          return filter.keywords.some(keyword => nameLower.includes(keyword));
        }).length;
      }
    });
    return counts;
  }, [guides]);
  
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header with Search and Filters */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Title Row */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
              <BookOpen className="h-6 w-6 text-brand-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Product Guides</h1>
              <p className="mt-1 text-slate-600">
                Curated collections to help you find the perfect blanks
              </p>
            </div>
          </div>
          
          {/* Category Cards - Visual navigation */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {CATEGORY_CARDS.map((category) => {
              const Icon = category.icon;
              const isActive = activeFilter === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveFilter(isActive ? 'all' : category.id)}
                  className={cn(
                    'group flex flex-col items-center text-center rounded-xl border p-4 transition-all',
                    isActive 
                      ? 'bg-white border-brand-300 shadow-lg shadow-brand-100 ring-2 ring-brand-500/20'
                      : `bg-white/70 backdrop-blur-sm border-stone-200 hover:shadow-lg hover:shadow-stone-200/50 hover:-translate-y-0.5 ${category.bgHover}`
                  )}
                >
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-lg mb-2 transition-transform',
                    `bg-gradient-to-br ${category.gradient}`,
                    isActive && 'scale-110'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={cn(
                    'font-semibold text-sm',
                    isActive ? 'text-brand-600' : 'text-navy-800'
                  )}>{category.label}</span>
                  <span className="text-xs mt-0.5 text-slate-500 line-clamp-1">{category.description}</span>
                </button>
              );
            })}
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search guides by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-stone-50 py-3 pl-12 pr-10 text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {/* Use-Case Quick Filters - Horizontally scrollable on mobile */}
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 sm:flex-wrap scrollbar-hide">
              {USE_CASE_FILTERS.map((filter) => {
                const Icon = filter.icon;
                const isActive = activeFilter === filter.id;
                const count = filterCounts[filter.id] || 0;
                
                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0',
                      isActive
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-stone-200 hover:text-slate-900'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {filter.label}
                    {filter.id !== 'all' && count > 0 && (
                      <span className={cn(
                        'ml-1 text-xs rounded-full px-1.5 py-0.5',
                        isActive ? 'bg-white/20' : 'bg-stone-200'
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter status */}
        {isFiltering && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold">{filteredGuides.length}</span> of {guides.length} guides
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
        
        {!hasResults ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">No guides found</h3>
            <p className="mt-2 text-slate-500">
              {searchQuery 
                ? `No guides match "${searchQuery}"`
                : 'No guides match the selected filter'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              View all guides
            </button>
          </div>
        ) : (
          <>
            {/* When filtering, show all results in one flat list */}
            {isFiltering ? (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                    <Search className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Search Results
                      <span className="ml-2 text-sm font-normal text-slate-500">({filteredGuides.length})</span>
                    </h2>
                    <p className="text-sm text-slate-500">Matching guides for your search</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredGuides.map((guide) => (
                    <GuideCard key={guide.id} guide={guide} onNavigate={handleNavigate} />
                  ))}
                </div>
              </section>
            ) : (
              <>
                {/* Recently Viewed - only show when not filtering */}
                <RecentGuidesSection 
                  guides={recentGuides} 
                  allGuides={guides}
                  onNavigate={handleNavigate}
                />
                
                <GuideSection
                  title="Seasonal Collections"
                  icon={Calendar}
                  guides={seasonal}
                  description="Current season picks and yearly collections"
                  onNavigate={handleNavigate}
                />
                
                <GuideSection
                  title="Trending Now"
                  icon={TrendingUp}
                  guides={trending}
                  description="Popular and new arrivals"
                  onNavigate={handleNavigate}
                />
                
                <GuideSection
                  title="Specialty Guides"
                  icon={BookOpen}
                  guides={specialty}
                  description="Curated selections for specific needs"
                  onNavigate={handleNavigate}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
