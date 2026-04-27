'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, X, Search, Leaf, Tag, Sparkles, Flame, TrendingUp } from 'lucide-react';
import { Brand, Category } from '@/lib/types';
import { cn } from '@/lib/utils';
import { 
  classifyAllCategories, 
  getAttributeGroupName, 
  shouldShowAttributeGroup, 
  MAIN_CATEGORIES, 
  SUB_CATEGORIES,
  idToSlug,
  parseCategoryParam,
  buildCategoryParam,
  selectMainCategory,
  toggleCategoryInParam,
  type ClassifiedCategory, 
  type AttributeGroup 
} from '@/lib/category-taxonomy';

interface FilterSidebarProps {
  showBrands?: boolean;
  showCategories?: boolean;
  showPriceRange?: boolean;
  collapsible?: boolean;
  className?: string;
}

interface FilterSection {
  title: string;
  isOpen: boolean;
}

export function FilterSidebar({
  showBrands = true,
  showCategories = true,
  showPriceRange = true,
  collapsible = true,
  className,
}: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [brandSearch, setBrandSearch] = useState('');

  const [sections, setSections] = useState<Record<string, FilterSection>>({
    quickFilters: { title: 'Quick Filters', isOpen: true },
    categories: { title: 'Categories', isOpen: true },
    colorFamily: { title: 'Color', isOpen: true },
    gender: { title: 'Gender/Age', isOpen: false },
    sleeve: { title: 'Sleeve Length', isOpen: false },
    fit: { title: 'Fit', isOpen: false },
    collar: { title: 'Collar Style', isOpen: false },
    material: { title: 'Material', isOpen: false },
    feature: { title: 'Features', isOpen: false },
    weight: { title: 'Weight', isOpen: false },
    // New attribute groups (Enhanced Filtering Plan)
    treatment: { title: 'Treatment', isOpen: false },
    pattern: { title: 'Pattern', isOpen: false },
    zipper: { title: 'Zipper Style', isOpen: false },
    structure: { title: 'Structure', isOpen: false },  // Headwear-specific
    panel: { title: 'Panel Count', isOpen: false },     // Headwear-specific
    closure: { title: 'Closure Type', isOpen: false },  // Headwear-specific
    sustainable: { title: 'Sustainable', isOpen: false },
    style: { title: 'Style', isOpen: false },
    brands: { title: 'Brands', isOpen: true },
    price: { title: 'Price Range', isOpen: false },
  });

  // Color family options (static, based on SS Activewear color families)
  const colorFamilies = [
    { value: 'Black', label: 'Black', color: '#1a1a1a' },
    { value: 'White', label: 'White', color: '#ffffff' },
    { value: 'Grey', label: 'Grey', color: '#808080' },
    { value: 'Navy', label: 'Navy', color: '#1e3a5f' },
    { value: 'Blue', label: 'Blue', color: '#3b82f6' },
    { value: 'Red', label: 'Red', color: '#ef4444' },
    { value: 'Green', label: 'Green', color: '#22c55e' },
    { value: 'Brown', label: 'Brown', color: '#8b4513' },
    { value: 'Tan', label: 'Tan', color: '#d2b48c' },
    { value: 'Orange', label: 'Orange', color: '#f97316' },
    { value: 'Yellow', label: 'Yellow', color: '#eab308' },
    { value: 'Pink', label: 'Pink', color: '#ec4899' },
    { value: 'Purple', label: 'Purple', color: '#a855f7' },
    { value: 'Multi', label: 'Multi', color: 'linear-gradient(135deg, #ef4444, #eab308, #22c55e, #3b82f6, #a855f7)' },
  ];

  // Attribute groups to show in sidebar (in display order)
  // Organized by category: General -> Apparel-specific -> Headwear-specific -> Style options
  const attributeGroupsToShow: AttributeGroup[] = [
    // General attributes (shown for all categories)
    'gender', 
    'material',
    'weight',
    // Apparel-specific (hidden for headwear/bags/accessories)
    'sleeve', 
    'fit', 
    'collar', 
    // Zipper (shown for sweatshirts/jackets/outerwear)
    'zipper',
    // Headwear-specific (only shown when headwear selected)
    'structure',
    'panel',
    'closure',
    // Style options (shown for all)
    'treatment',
    'pattern',
    'feature',
    'sustainable',
    'style',
  ];
  
  // Groups that should be single-select (mutually exclusive options)
  const singleSelectGroups: AttributeGroup[] = ['sleeve', 'fit', 'collar', 'gender', 'structure', 'panel'];
  
  // Groups that allow multi-select (additive options like features)
  const multiSelectGroups: AttributeGroup[] = ['feature', 'material', 'weight', 'treatment', 'pattern', 'closure', 'sustainable', 'style', 'zipper'];

  // Classify categories using taxonomy
  const classifiedCategories = useMemo(() => {
    if (categories.length === 0) return null;
    return classifyAllCategories(categories);
  }, [categories]);

  // Filter brands by search term
  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) {
      return brands;
    }
    const searchLower = brandSearch.toLowerCase().trim();
    return brands.filter(brand => 
      brand.name.toLowerCase().includes(searchLower)
    );
  }, [brands, brandSearch]);

  // Get current filter values from URL
  const selectedBrand = searchParams.get('brand');
  const categoryParam = searchParams.get('category');
  const selectedColorFamilies = searchParams.get('colorFamily')?.split(',').filter(Boolean) || [];
  const selectedAttributes = searchParams.get('attr')?.split(',').filter(Boolean) || []; // Category IDs for attribute filters
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const onSaleFilter = searchParams.get('onSale') === 'true';
  const sustainableFilter = searchParams.get('sustainable') === 'true';
  const featuredFilter = searchParams.get('featured') === 'true';
  const streetwearFilter = searchParams.get('streetwear') === 'true';
  
  // Parse category param (supports both slug format "t-shirts+cotton" and legacy ID format "21,57")
  const selectedCategoryIds = parseCategoryParam(categoryParam);
  
  // Get the main category ID for context-aware filtering (first main category in selection)
  const selectedCategoryId = selectedCategoryIds.find(id => MAIN_CATEGORIES[id]) ?? 
                              (selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : null);
  
  // Check if a category is selected
  const isCategorySelected = (categoryId: number) => selectedCategoryIds.includes(categoryId);
  
  // ============================================================================
  // FILTER LOCKING LOGIC
  // Determines which filters are available based on current state
  // ============================================================================
  const hasSearch = !!searchParams.get('search');
  const hasMainCategory = selectedCategoryId !== null;
  const hasBrandOnly = !!selectedBrand && !hasMainCategory && !hasSearch;
  
  // Filters are locked (show "Select a category" message) when:
  // - No main category selected AND no search query AND not in brand-only mode
  const filtersLocked = !hasMainCategory && !hasSearch;
  
  // Universal filters that show even in brand-only mode (no category)
  const universalAttributeGroups: AttributeGroup[] = ['material', 'weight'];
  
  // Determine if an attribute group should be visible
  const isAttributeGroupVisible = (group: AttributeGroup): boolean => {
    // If we have a category or search, use the normal shouldShowAttributeGroup logic
    if (hasMainCategory || hasSearch) {
      return shouldShowAttributeGroup(group, selectedCategoryId);
    }
    
    // Brand-only mode: show only universal attributes
    if (hasBrandOnly) {
      return universalAttributeGroups.includes(group);
    }
    
    // No context at all: hide all attribute groups
    return false;
  };

  // Fetch filter options
  useEffect(() => {
    const fetchFilters = async () => {
      setIsLoading(true);
      try {
        const [brandsRes, categoriesRes] = await Promise.all([
          showBrands ? fetch('/api/brands') : Promise.resolve(null),
          showCategories ? fetch('/api/categories') : Promise.resolve(null),
        ]);

        if (brandsRes?.ok) {
          const brandsData = await brandsRes.json();
          setBrands(brandsData.data || []);
        }

        if (categoriesRes?.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.data || []);
        }
      } catch (error) {
        console.error('Error fetching filters:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilters();
  }, [showBrands, showCategories]);

  const toggleSection = (key: string) => {
    if (!collapsible) return;
    setSections((prev) => ({
      ...prev,
      [key]: { ...prev[key], isOpen: !prev[key].isOpen },
    }));
  };

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    // Reset to page 1 when filters change
    params.delete('page');
    
    router.push(`/catalog?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push('/catalog');
  };

  // Toggle color family (multi-select)
  const toggleColorFamily = (colorFamily: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = new Set(selectedColorFamilies);
    
    if (current.has(colorFamily)) {
      current.delete(colorFamily);
    } else {
      current.add(colorFamily);
    }
    
    if (current.size > 0) {
      params.set('colorFamily', Array.from(current).join(','));
    } else {
      params.delete('colorFamily');
    }
    
    params.delete('page');
    router.push(`/catalog?${params.toString()}`);
  };

  // Toggle attribute category selection using slug-based URLs
  // Attributes are combined with main category: "t-shirts+cotton+short-sleeve"
  // Single-select groups: clicking a new option replaces the old one
  // Multi-select groups: clicking adds/removes from selection
  const toggleAttribute = (categoryId: number, group: AttributeGroup) => {
    const params = new URLSearchParams(searchParams.toString());
    
    const isSingleSelect = singleSelectGroups.includes(group);
    
    // Get current selection
    let currentIds = [...selectedCategoryIds];
    
    if (currentIds.includes(categoryId)) {
      // Clicking already selected item - deselect it
      currentIds = currentIds.filter(id => id !== categoryId);
    } else {
      if (isSingleSelect && classifiedCategories) {
        // For single-select: remove any other selections from the same group
        const groupAttributes = classifiedCategories.attributes.get(group) || [];
        const groupIds = new Set(groupAttributes.map(a => a.id));
        currentIds = currentIds.filter(id => !groupIds.has(id));
      }
      currentIds.push(categoryId);
    }
    
    // Build new URL param using slugs
    const newParam = buildCategoryParam(currentIds);
    
    if (newParam) {
      params.set('category', newParam);
    } else {
      params.delete('category');
    }
    
    // Remove legacy attr param since we're combining everything into category
    params.delete('attr');
    params.delete('page');
    
    const queryString = params.toString();
    router.push(queryString ? `/catalog?${queryString}` : '/catalog');
  };

  // Check if an attribute category is selected (now part of the unified category param)
  const isAttributeSelected = (categoryId: number) => {
    return selectedCategoryIds.includes(categoryId);
  };

  const hasActiveFilters = selectedBrand || selectedCategoryIds.length > 0 || selectedColorFamilies.length > 0 || selectedAttributes.length > 0 || minPrice || maxPrice || onSaleFilter || sustainableFilter || featuredFilter || streetwearFilter;

  return (
    <aside className={cn('w-full', className)}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
          >
            <X className="h-4 w-4" />
            Clear all
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-6 w-24 rounded bg-slate-200" />
              <div className="mt-3 space-y-2">
                <div className="h-4 w-full rounded bg-stone-100" />
                <div className="h-4 w-3/4 rounded bg-stone-100" />
                <div className="h-4 w-1/2 rounded bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Filters - Sale & Sustainable */}
          <FilterSection
            title={sections.quickFilters.title}
            isOpen={sections.quickFilters.isOpen}
            onToggle={() => toggleSection('quickFilters')}
            collapsible={collapsible}
          >
            <div className="space-y-2">
              {/* Popular Products Toggle */}
              <button
                onClick={() => updateFilter('featured', featuredFilter ? null : 'true')}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  featuredFilter
                    ? 'bg-amber-50 font-medium text-amber-700'
                    : 'text-slate-600 hover:bg-stone-50 hover:text-slate-900'
                )}
              >
                <Flame className={cn('h-4 w-4', featuredFilter ? 'text-amber-500' : 'text-slate-400')} />
                <span>Popular Products</span>
                {featuredFilter && (
                  <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Active
                  </span>
                )}
              </button>

              {/* Streetwear Essentials Toggle */}
              <button
                onClick={() => updateFilter('streetwear', streetwearFilter ? null : 'true')}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  streetwearFilter
                    ? 'bg-purple-50 font-medium text-purple-700'
                    : 'text-slate-600 hover:bg-stone-50 hover:text-slate-900'
                )}
              >
                <TrendingUp className={cn('h-4 w-4', streetwearFilter ? 'text-purple-500' : 'text-slate-400')} />
                <span>Streetwear Essentials</span>
                {streetwearFilter && (
                  <span className="ml-auto rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                    Active
                  </span>
                )}
              </button>

              {/* On Sale Toggle */}
              <button
                onClick={() => updateFilter('onSale', onSaleFilter ? null : 'true')}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  onSaleFilter
                    ? 'bg-red-50 font-medium text-red-700'
                    : 'text-slate-600 hover:bg-stone-50 hover:text-slate-900'
                )}
              >
                <Tag className={cn('h-4 w-4', onSaleFilter ? 'text-red-500' : 'text-slate-400')} />
                <span>On Sale</span>
                {onSaleFilter && (
                  <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    Active
                  </span>
                )}
              </button>

              {/* Sustainable Toggle */}
              <button
                onClick={() => updateFilter('sustainable', sustainableFilter ? null : 'true')}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  sustainableFilter
                    ? 'bg-green-50 font-medium text-green-700'
                    : 'text-slate-600 hover:bg-stone-50 hover:text-slate-900'
                )}
              >
                <Leaf className={cn('h-4 w-4', sustainableFilter ? 'text-green-500' : 'text-slate-400')} />
                <span>Sustainable / Eco-Friendly</span>
                {sustainableFilter && (
                  <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Active
                  </span>
                )}
              </button>
            </div>
          </FilterSection>

          {/* Main Categories (from taxonomy) - SINGLE SELECT */}
          {showCategories && classifiedCategories && classifiedCategories.main.length > 0 && (
            <FilterSection
              title={sections.categories.title}
              isOpen={sections.categories.isOpen}
              onToggle={() => toggleSection('categories')}
              collapsible={collapsible}
            >
              <div className="space-y-1">
                {classifiedCategories.main.map((category) => {
                  const isSelected = isCategorySelected(category.id);
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        // Single-select: REPLACE main category, don't combine
                        const newParam = selectMainCategory(categoryParam, category.id);
                        const params = new URLSearchParams(searchParams.toString());
                        
                        if (newParam) {
                          params.set('category', newParam);
                        } else {
                          params.delete('category');
                          // Also clear color filters when no category
                          params.delete('colorFamily');
                        }
                        params.delete('page');
                        
                        const queryString = params.toString();
                        router.push(queryString ? `/catalog?${queryString}` : '/catalog');
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                        isSelected
                          ? 'bg-brand-50 font-medium text-brand-700'
                          : 'text-slate-600 hover:bg-stone-50 hover:text-slate-900'
                      )}
                    >
                      {/* Radio-style indicator */}
                      <span className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-full border-2',
                        isSelected
                          ? 'border-brand-600 bg-brand-600'
                          : 'border-stone-300'
                      )}>
                        {isSelected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </FilterSection>
          )}

          {/* Color Family Filter (multi-select) - requires category, search, or brand */}
          <FilterSection
            title={sections.colorFamily.title}
            isOpen={sections.colorFamily.isOpen}
            onToggle={() => toggleSection('colorFamily')}
            collapsible={collapsible}
          >
            {filtersLocked && !hasBrandOnly ? (
              <p className="text-sm text-slate-500 italic">
                Select a category to filter by color
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {colorFamilies.map((color) => {
                  const isSelected = selectedColorFamilies.includes(color.value);
                  const isMulti = color.value === 'Multi';
                  return (
                    <button
                      key={color.value}
                      onClick={() => toggleColorFamily(color.value)}
                      title={color.label}
                      className={cn(
                        'group relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                        isSelected
                          ? 'border-brand-500 ring-2 ring-brand-200'
                          : 'border-stone-200 hover:border-slate-400',
                        color.value === 'White' && 'border-stone-300'
                      )}
                    >
                      <span
                        className={cn(
                          'h-6 w-6 rounded-full',
                          isMulti ? '' : ''
                        )}
                        style={{
                          background: isMulti ? color.color : color.color,
                        }}
                      />
                      {isSelected && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className={cn(
                              'h-4 w-4',
                              color.value === 'White' || color.value === 'Yellow' || color.value === 'Tan'
                                ? 'text-slate-800'
                                : 'text-white'
                            )}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {selectedColorFamilies.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedColorFamilies.map((cf) => (
                  <span
                    key={cf}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
                  >
                    {cf}
                    <button
                      onClick={() => toggleColorFamily(cf)}
                      className="ml-0.5 hover:text-brand-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </FilterSection>

          {/* Dynamic Attribute Filters from Taxonomy */}
          {classifiedCategories && attributeGroupsToShow.map((group) => {
            // Context-aware filtering: only show relevant attribute groups
            // Uses new isAttributeGroupVisible which handles category-first logic
            if (!isAttributeGroupVisible(group)) {
              return null;
            }
            
            let attributes = classifiedCategories.attributes.get(group);
            if (!attributes || attributes.length === 0) return null;
            
            // Sort weights numerically (1oz, 2oz, ... 14oz)
            if (group === 'weight') {
              attributes = [...attributes].sort((a, b) => {
                const numA = parseFloat(a.name.match(/^(\d+)/)?.[1] || '999');
                const numB = parseFloat(b.name.match(/^(\d+)/)?.[1] || '999');
                return numA - numB;
              });
            }
            
            // For materials: group by parent and show with expandable sections
            const isMaterial = group === 'material';
            let displayAttributes = attributes;
            let expandedMaterials: ClassifiedCategory[] = [];
            
            if (isMaterial) {
              // Identify main materials vs variants (variants contain " - ")
              const mainMaterials = attributes.filter(a => !a.name.includes(' - '));
              const variants = attributes.filter(a => a.name.includes(' - '));
              
              // Show main materials first, variants in "Show more"
              displayAttributes = mainMaterials;
              expandedMaterials = variants;
            }
            
            const sectionKey = group;
            const sectionTitle = getAttributeGroupName(group);
            const isSingleSelect = singleSelectGroups.includes(group);
            
            // For single-select groups: check if any option is already selected
            const selectedInGroup = attributes.filter(a => isAttributeSelected(a.id));
            const hasSelectionInGroup = selectedInGroup.length > 0;
            
            // For single-select groups with a selection: only show the selected option
            // (other options would return 0 results anyway)
            if (isSingleSelect && hasSelectionInGroup) {
              displayAttributes = selectedInGroup;
            }
            
            return (
              <FilterSection
                key={group}
                title={sectionTitle}
                isOpen={sections[sectionKey]?.isOpen ?? false}
                onToggle={() => toggleSection(sectionKey)}
                collapsible={collapsible}
              >
                <div className="space-y-1">
                  {/* Show selection mode hint for multi-select only */}
                  {!isSingleSelect && (
                    <p className="mb-2 text-xs text-slate-400">Select multiple</p>
                  )}
                  
                  <div className="max-h-48 space-y-1 overflow-y-auto">
                    {displayAttributes.map((attr) => (
                      <button
                        key={attr.id}
                        onClick={() => toggleAttribute(attr.id, group)}
                        className={cn(
                          'block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                          isAttributeSelected(attr.id)
                            ? 'bg-brand-50 font-medium text-brand-700'
                            : 'text-slate-600 hover:bg-stone-50 hover:text-slate-900'
                        )}
                      >
                        {attr.name}
                      </button>
                    ))}
                    
                    {/* For single-select with selection: show "Change" button to see all options */}
                    {isSingleSelect && hasSelectionInGroup && (
                      <button
                        onClick={() => {
                          // Clear all selections in this group to show all options again
                          const params = new URLSearchParams(searchParams.toString());
                          const current = new Set(selectedAttributes);
                          attributes!.forEach(a => current.delete(a.id.toString()));
                          if (current.size > 0) {
                            params.set('attr', Array.from(current).join(','));
                          } else {
                            params.delete('attr');
                          }
                          params.delete('page');
                          router.push(`/catalog?${params.toString()}`);
                        }}
                        className="mt-1 text-xs text-brand-600 hover:text-brand-700"
                      >
                        × Clear to see all options
                      </button>
                    )}
                    
                    {/* Show more for material variants */}
                    {isMaterial && expandedMaterials.length > 0 && !hasSelectionInGroup && (
                      <MaterialExpander
                        variants={expandedMaterials}
                        isAttributeSelected={isAttributeSelected}
                        onToggle={(id) => toggleAttribute(id, group)}
                      />
                    )}
                  </div>
                </div>
              </FilterSection>
            );
          })}

          {/* Brands with logos - searchable and scrollable */}
          {showBrands && brands.length > 0 && (
            <FilterSection
              title={sections.brands.title}
              isOpen={sections.brands.isOpen}
              onToggle={() => toggleSection('brands')}
              collapsible={collapsible}
            >
              <div className="space-y-2">
                {/* Brand search input */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search brands..."
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 py-2 pl-8 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  {brandSearch && (
                    <button
                      onClick={() => setBrandSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Scrollable brand list */}
                <div className="max-h-64 space-y-1 overflow-y-auto">
                  {filteredBrands.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-slate-500">No brands found</p>
                  ) : (
                    filteredBrands.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() =>
                          updateFilter(
                            'brand',
                            selectedBrand === brand.id.toString() ? null : brand.id.toString()
                          )
                        }
                        className={cn(
                          'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                          selectedBrand === brand.id.toString()
                            ? 'bg-brand-50 font-medium text-brand-700'
                            : 'text-slate-600 hover:bg-stone-50 hover:text-slate-900'
                        )}
                      >
                        {brand.image && (
                          <span className="relative h-5 w-5 flex-shrink-0 overflow-hidden rounded">
                            <Image
                              src={brand.image.startsWith('http') ? brand.image : `https://www.ssactivewear.com/${brand.image}`}
                              alt={brand.name}
                              fill
                              className="object-contain"
                              sizes="20px"
                            />
                          </span>
                        )}
                        <span className="truncate">{brand.name}</span>
                      </button>
                    ))
                  )}
                </div>
                
                {/* Show count when filtering */}
                {brandSearch && filteredBrands.length > 0 && (
                  <p className="text-xs text-slate-400">
                    Showing {filteredBrands.length} of {brands.length} brands
                  </p>
                )}
              </div>
            </FilterSection>
          )}

          {/* Price Range */}
          {showPriceRange && (
            <FilterSection
              title={sections.price.title}
              isOpen={sections.price.isOpen}
              onToggle={() => toggleSection('price')}
              collapsible={collapsible}
            >
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice || ''}
                    onChange={(e) => updateFilter('minPrice', e.target.value || null)}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice || ''}
                    onChange={(e) => updateFilter('maxPrice', e.target.value || null)}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Under $5', min: null, max: '5' },
                    { label: '$5 - $10', min: '5', max: '10' },
                    { label: '$10 - $20', min: '10', max: '20' },
                    { label: '$20+', min: '20', max: null },
                  ].map((range) => (
                    <button
                      key={range.label}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        if (range.min) params.set('minPrice', range.min);
                        else params.delete('minPrice');
                        if (range.max) params.set('maxPrice', range.max);
                        else params.delete('maxPrice');
                        params.delete('page');
                        router.push(`/catalog?${params.toString()}`);
                      }}
                      className="rounded-full border border-stone-200 px-3 py-1 text-xs text-slate-600 hover:border-brand-500 hover:text-brand-600"
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </FilterSection>
          )}
        </div>
      )}
    </aside>
  );
}

// Filter Section Component
function FilterSection({
  title,
  isOpen,
  onToggle,
  collapsible,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  collapsible: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-100 pb-6">
      <button
        onClick={onToggle}
        disabled={!collapsible}
        className={cn(
          'flex w-full items-center justify-between text-left',
          collapsible && 'cursor-pointer'
        )}
      >
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {collapsible && (
          <ChevronDown
            className={cn(
              'h-4 w-4 text-slate-400 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        )}
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}

// Material Expander Component - shows variants in a collapsible "Show more"
function MaterialExpander({
  variants,
  isAttributeSelected,
  onToggle,
}: {
  variants: ClassifiedCategory[];
  isAttributeSelected: (id: number) => boolean;
  onToggle: (id: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if any variant is selected (to auto-expand)
  const hasSelectedVariant = variants.some(v => isAttributeSelected(v.id));
  
  // Group variants by parent (e.g., "Cotton - 100%" -> "Cotton")
  const groupedVariants = useMemo(() => {
    const groups: Record<string, ClassifiedCategory[]> = {};
    for (const variant of variants) {
      const [parent] = variant.name.split(' - ');
      if (!groups[parent]) groups[parent] = [];
      groups[parent].push(variant);
    }
    return groups;
  }, [variants]);
  
  if (!isExpanded && !hasSelectedVariant) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="mt-2 text-xs text-brand-600 hover:text-brand-700"
      >
        + Show {variants.length} more options
      </button>
    );
  }
  
  return (
    <div className="mt-2 border-t border-slate-100 pt-2">
      <button
        onClick={() => setIsExpanded(false)}
        className="mb-2 text-xs text-slate-500 hover:text-slate-700"
      >
        − Hide specific options
      </button>
      <div className="space-y-1">
        {Object.entries(groupedVariants).map(([parent, items]) => (
          <div key={parent} className="pl-2">
            <p className="mb-1 text-xs font-medium text-slate-500">{parent}</p>
            {items.map((attr) => (
              <button
                key={attr.id}
                onClick={() => onToggle(attr.id)}
                className={cn(
                  'block w-full rounded-lg px-3 py-1.5 text-left text-xs transition-colors',
                  isAttributeSelected(attr.id)
                    ? 'bg-brand-50 font-medium text-brand-700'
                    : 'text-slate-600 hover:bg-stone-50 hover:text-slate-900'
                )}
              >
                {attr.name.split(' - ')[1] || attr.name}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Default export for Builder.io
export default FilterSidebar;
