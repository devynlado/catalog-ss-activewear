'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, X, Check, ChevronUp, ChevronDown, Palette, Upload, FileImage, Loader2 } from 'lucide-react';
import { ProductColor } from '@/lib/types';
import { cn, formatPrice } from '@/lib/utils';

// Pricing tiers - Print cost per bag (base includes 2 colors)
// Extra colors: +$0.75/ea for 3rd color, +$1.50/ea for 4th color
const PRINT_PRICING = {
  50: { base: 3.50, perExtraColor: 0.75 },
  75: { base: 2.80, perExtraColor: 0.75 },
  100: { base: 2.25, perExtraColor: 0.75 },
  250: { base: 1.75, perExtraColor: 0.75 },
  500: { base: 1.45, perExtraColor: 0.75 },
};

// Quantity tiers for display
const QUANTITY_TIERS = [50, 75, 100, 250, 500] as const;
type QuantityTier = typeof QUANTITY_TIERS[number];

// Blank cost per bag
const BLANK_COST = {
  50: 5.25,
  75: 4.95,
  100: 4.75,
  250: 4.50,
  500: 4.50,
};

// Popular colors to show first
const POPULAR_COLOR_NAMES = [
  'Natural', 'Black', 'Navy', 'Red', 'Royal', 'Forest Green', 'White'
];

// Proxy Google Drive URLs
function proxyImageUrl(url: string): string {
  if (!url) return '';
  if (url.includes('drive.usercontent.google.com') || url.includes('drive.google.com')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

// Get price for a quantity tier
function getPrintPrice(qty: QuantityTier, printColors: number): number {
  const tier = PRINT_PRICING[qty];
  const extraColors = Math.max(0, printColors - 2);
  return tier.base + (extraColors * tier.perExtraColor);
}

// Get total price per bag
function getTotalPricePerBag(qty: QuantityTier, printColors: number, hasSecondSide: boolean): number {
  const printCost = getPrintPrice(qty, printColors);
  const blankCost = BLANK_COST[qty];
  const secondSideCost = hasSecondSide ? getPrintPrice(qty, printColors) : 0;
  return blankCost + printCost + secondSideCost;
}

// Get color inventory
function getColorInventory(colors: ProductColor[], colorCode: string): number {
  const color = colors.find(c => c.colorCode === colorCode);
  if (!color || !color.sizes) return 0;
  return color.sizes.reduce((sum, size) => sum + (size.qty || 0), 0);
}

interface ColorSelection {
  colorCode: string;
  colorName: string;
  frontImage: string;
  quantity: number;
}

interface ToteBagPackageBuilderProps {
  colors: ProductColor[];
  productStyleId: number;
  productName: string;
  productSlug: string;
}

const ACCEPTED_FILE_TYPES = '.ai,.eps,.pdf,.png,.jpg,.jpeg,.svg';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const STORAGE_KEY = 'printedTotesIsabella_selections';

export function ToteBagPackageBuilder({ colors, productStyleId, productName, productSlug }: ToteBagPackageBuilderProps) {
  const router = useRouter();
  const [selectedColors, setSelectedColors] = useState<ColorSelection[]>([]);
  const [printColors, setPrintColors] = useState(2);
  const [hasSecondSide, setHasSecondSide] = useState(false);
  const [showAllColors, setShowAllColors] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Sort colors: popular first, then alphabetical
  const sortedColors = useMemo(() => {
    const popular = colors.filter(c => 
      POPULAR_COLOR_NAMES.some(name => 
        c.colorName.toLowerCase().includes(name.toLowerCase())
      )
    );
    const others = colors.filter(c => 
      !POPULAR_COLOR_NAMES.some(name => 
        c.colorName.toLowerCase().includes(name.toLowerCase())
      )
    );
    return [...popular, ...others];
  }, [colors]);
  
  // Restore selections from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.selectedColors?.length > 0) setSelectedColors(data.selectedColors);
        if (data.printColors) setPrintColors(data.printColors);
        if (data.hasSecondSide !== undefined) setHasSecondSide(data.hasSecondSide);
      } catch {
        // Invalid data, ignore
      }
    }
    setIsHydrated(true);
  }, []);
  
  // Save selections to localStorage when they change
  useEffect(() => {
    if (!isHydrated) return;
    
    if (selectedColors.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        selectedColors,
        printColors,
        hasSecondSide,
      }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedColors, printColors, hasSecondSide, isHydrated]);
  
  // Calculate totals
  const totalQuantity = useMemo(() => 
    selectedColors.reduce((sum, c) => sum + c.quantity, 0),
    [selectedColors]
  );
  
  // Determine effective tier based on total quantity
  const effectiveTier = useMemo((): QuantityTier => {
    if (totalQuantity >= 500) return 500;
    if (totalQuantity >= 250) return 250;
    if (totalQuantity >= 100) return 100;
    if (totalQuantity >= 75) return 75;
    return 50;
  }, [totalQuantity]);
  
  const pricePerBag = getTotalPricePerBag(effectiveTier, printColors, hasSecondSide);
  const subtotal = totalQuantity * pricePerBag;
  
  // Get next tier info for upsell
  const nextTier = useMemo(() => {
    const currentIndex = QUANTITY_TIERS.indexOf(effectiveTier);
    if (currentIndex < QUANTITY_TIERS.length - 1) {
      return QUANTITY_TIERS[currentIndex + 1];
    }
    return null;
  }, [effectiveTier]);
  
  const qtyToNextTier = nextTier ? nextTier - totalQuantity : 0;
  
  // Add a color
  const addColor = (color: ProductColor) => {
    if (selectedColors.find(c => c.colorCode === color.colorCode)) {
      setSelectedColors(prev => prev.filter(c => c.colorCode !== color.colorCode));
    } else {
      const currentTotal = totalQuantity;
      const minimumOrder = 50;
      const remaining = Math.max(0, minimumOrder - currentTotal);
      const defaultQty = remaining > 0 ? Math.min(remaining, 25) : 25;
      
      setSelectedColors(prev => [...prev, {
        colorCode: color.colorCode,
        colorName: color.colorName,
        frontImage: color.frontImage || '',
        quantity: defaultQty,
      }]);
    }
  };
  
  // Update color quantity
  const updateQuantity = (colorCode: string, delta: number) => {
    setSelectedColors(prev => prev.map(c => {
      if (c.colorCode === colorCode) {
        const newQty = Math.max(1, c.quantity + delta);
        return { ...c, quantity: newQty };
      }
      return c;
    }));
  };
  
  // Set exact quantity
  const setQuantity = (colorCode: string, qty: number) => {
    setSelectedColors(prev => prev.map(c => {
      if (c.colorCode === colorCode) {
        return { ...c, quantity: Math.max(1, qty) };
      }
      return c;
    }));
  };
  
  // Remove color
  const removeColor = (colorCode: string) => {
    setSelectedColors(prev => prev.filter(c => c.colorCode !== colorCode));
  };
  
  // File upload handlers
  const handleFileSelect = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      alert('File is too large. Maximum size is 10MB.');
      return;
    }
    setUploadedFile(file);
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle checkout navigation
  const handleCheckout = () => {
    if (!hasMinimum) return;
    
    setIsNavigating(true);
    
    const packageData = {
      packageType: 'printed-totes-isabella' as const,
      productStyleId,
      productName,
      productSlug,
      selectedColors: selectedColors.map(c => ({
        colorCode: c.colorCode,
        colorName: c.colorName,
        quantity: c.quantity,
        frontImage: c.frontImage,
      })),
      printColors,
      printLocations: hasSecondSide ? ['front', 'back'] : ['front'],
      totalQuantity,
      pricePerItem: pricePerBag,
      subtotal,
      uploadedFileName: uploadedFile?.name || null,
    };
    
    sessionStorage.setItem('packageCheckoutData', JSON.stringify(packageData));
    
    if (uploadedFile) {
      sessionStorage.setItem('packageLogoFile', uploadedFile.name);
    }
    
    localStorage.removeItem(STORAGE_KEY);
    router.push('/packages/checkout');
  };
  
  const displayedColors = showAllColors ? sortedColors : sortedColors.slice(0, 24);
  const hasMinimum = totalQuantity >= 50;
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-2">
          Build Your Package
        </h2>
        <p className="text-stone-600">
          Select your quantity, bag colors, and print options
        </p>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Volume Pricing Display */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-stone-200/60">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-navy-900">
                Volume Pricing
              </h3>
            </div>
            
            <p className="text-sm text-stone-600 mb-4">
              {totalQuantity > 0 
                ? "Your rate improves as you add more bags"
                : "Select bag colors below to see your rate"
              }
            </p>
            
            <div className="grid grid-cols-5 gap-2">
              {QUANTITY_TIERS.map((tier) => {
                const tierPrice = getTotalPricePerBag(tier, printColors, hasSecondSide);
                const isCurrentTier = totalQuantity > 0 && effectiveTier === tier;
                const isReached = totalQuantity >= tier;
                const isEmpty = totalQuantity === 0;
                
                return (
                  <div
                    key={tier}
                    className={cn(
                      'flex flex-col items-center p-3 rounded-xl border-2 transition-all relative',
                      isCurrentTier
                        ? 'border-brand-500 bg-brand-50'
                        : isEmpty
                          ? 'border-stone-200 bg-stone-50 opacity-60'
                          : isReached
                            ? 'border-green-200 bg-green-50/50'
                            : 'border-stone-200 bg-white'
                    )}
                  >
                    {isCurrentTier && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white bg-brand-500 px-2 py-0.5 rounded-full whitespace-nowrap">
                        YOUR RATE
                      </span>
                    )}
                    <span className={cn(
                      'text-lg font-bold',
                      isCurrentTier ? 'text-brand-600' : isEmpty ? 'text-stone-400' : 'text-navy-900'
                    )}>
                      {tier}
                    </span>
                    <span className={cn(
                      'text-xs',
                      isEmpty ? 'text-stone-400' : 'text-stone-500'
                    )}>
                      bags
                    </span>
                    <span className={cn(
                      'text-sm font-semibold mt-1',
                      isCurrentTier ? 'text-brand-600' : isEmpty ? 'text-stone-400' : 'text-stone-600'
                    )}>
                      {formatPrice(tierPrice)}/ea
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Upsell nudge */}
            {hasMinimum && nextTier && qtyToNextTier > 0 && (
              <div className="mt-4 p-3 bg-gradient-to-r from-brand-50 to-amber-50 rounded-lg border border-brand-100">
                <p className="text-sm font-medium text-navy-900">
                  Add {qtyToNextTier} more {qtyToNextTier === 1 ? 'bag' : 'bags'} to unlock {formatPrice(getTotalPricePerBag(nextTier, printColors, hasSecondSide))}/ea
                </p>
                <p className="text-xs text-stone-600 mt-0.5">
                  Save {formatPrice(pricePerBag - getTotalPricePerBag(nextTier, printColors, hasSecondSide))}/bag — {formatPrice((pricePerBag - getTotalPricePerBag(nextTier, printColors, hasSecondSide)) * nextTier)} on {nextTier} bags
                </p>
              </div>
            )}
            
            {/* At best rate message */}
            {totalQuantity >= 500 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">You&apos;re at our best rate!</span>
              </div>
            )}
          </div>
          
          {/* Step 1: Bag Colors */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-stone-200/60">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-brand-500 text-white text-sm font-semibold">1</span>
              <h3 className="text-lg font-semibold text-navy-900">
                Select Bag Colors
              </h3>
              <span className="ml-auto text-sm text-stone-500">
                {colors.length} colors available
              </span>
            </div>
            
            {/* Mix colors callout */}
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg mb-4">
              <Palette className="h-4 w-4" />
              <span className="text-sm font-medium">Mix bag colors at no extra charge - same design on all bags</span>
            </div>
            
            {/* Color grid */}
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
              {displayedColors.map((color) => {
                const isSelected = selectedColors.some(c => c.colorCode === color.colorCode);
                return (
                  <button
                    key={color.colorCode}
                    onClick={() => addColor(color)}
                    className={cn(
                      'relative aspect-square rounded-lg overflow-hidden border-2 transition-all group',
                      isSelected
                        ? 'border-brand-500 ring-2 ring-brand-200'
                        : 'border-stone-200 hover:border-stone-400'
                    )}
                    title={color.colorName}
                  >
                    {color.frontImage ? (
                      <Image
                        src={proxyImageUrl(color.frontImage)}
                        alt={color.colorName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-stone-200" />
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-brand-500/20 flex items-center justify-center">
                        <Check className="h-4 w-4 text-brand-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Show more/less */}
            {colors.length > 24 && (
              <button
                onClick={() => setShowAllColors(!showAllColors)}
                className="mt-4 text-brand-600 hover:text-brand-700 text-sm font-medium flex items-center gap-1"
              >
                {showAllColors ? (
                  <>Show less <ChevronUp className="h-4 w-4" /></>
                ) : (
                  <>View all {colors.length} colors</>
                )}
              </button>
            )}
            
            {/* Selected Colors with Quantities */}
            <AnimatePresence>
              {selectedColors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 pt-6 border-t border-stone-200"
                >
                  <h4 className="text-base font-semibold text-navy-900 mb-4">
                    Your Selection
                  </h4>
                  
                  <div className="space-y-3">
                  {selectedColors.map((color) => {
                    const available = getColorInventory(colors, color.colorCode);
                    const isOverStock = color.quantity > available;
                    const isLowStock = available > 0 && available <= 50;
                    const isOutOfStock = available === 0;
                    
                    return (
                      <div
                        key={color.colorCode}
                        className={cn(
                          'flex items-center gap-4 p-3 rounded-xl',
                          isOverStock ? 'bg-red-50 border border-red-200' : 'bg-stone-50'
                        )}
                      >
                        {/* Color thumbnail */}
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
                          {color.frontImage ? (
                            <Image
                              src={proxyImageUrl(color.frontImage)}
                              alt={color.colorName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-stone-300" />
                          )}
                        </div>
                        
                        {/* Color name and stock */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-navy-900 truncate">
                            {color.colorName}
                          </p>
                          {isOutOfStock ? (
                            <p className="text-xs text-red-600 font-medium">Out of stock</p>
                          ) : isOverStock ? (
                            <p className="text-xs text-red-600 font-medium">
                              Only {available} available
                            </p>
                          ) : isLowStock ? (
                            <p className="text-xs text-amber-600">Low stock: {available}</p>
                          ) : (
                            <p className="text-xs text-stone-500">{available} available</p>
                          )}
                        </div>
                        
                        {/* Quantity controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(color.colorCode, -5)}
                            className="h-8 w-8 rounded-lg bg-white border border-stone-300 flex items-center justify-center hover:bg-stone-50 transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            value={color.quantity}
                            onChange={(e) => setQuantity(color.colorCode, parseInt(e.target.value) || 1)}
                            className={cn(
                              'w-16 h-8 text-center border rounded-lg font-medium',
                              isOverStock ? 'border-red-300 text-red-700' : 'border-stone-300'
                            )}
                            min="1"
                          />
                          <button
                            onClick={() => updateQuantity(color.colorCode, 5)}
                            className="h-8 w-8 rounded-lg bg-white border border-stone-300 flex items-center justify-center hover:bg-stone-50 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {/* Remove button */}
                        <button
                          onClick={() => removeColor(color.colorCode)}
                          className="h-8 w-8 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                {/* Total quantity indicator */}
                <div className={cn(
                  'mt-4 p-3 rounded-lg',
                  hasMinimum ? 'bg-green-50' : 'bg-amber-50'
                )}>
                  <div className="flex justify-between items-center">
                    <span className={hasMinimum ? 'text-green-700' : 'text-amber-700'}>
                      Total Quantity
                    </span>
                    <span className={cn(
                      'font-bold',
                      hasMinimum ? 'text-green-700' : 'text-amber-700'
                    )}>
                      {totalQuantity} bags
                    </span>
                  </div>
                  {!hasMinimum && (
                    <p className="text-sm text-amber-600 mt-1">
                      Add {50 - totalQuantity} more to reach minimum order
                    </p>
                  )}
                </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Step 2: Print Colors */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-stone-200/60">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-brand-500 text-white text-sm font-semibold">2</span>
              <h3 className="text-lg font-semibold text-navy-900">
                Print Colors
              </h3>
            </div>
            
            <p className="text-sm text-stone-600 mb-4">
              How many colors are in your design? Base price includes up to 2 colors.
            </p>
            
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((num) => {
                const isSelected = printColors === num;
                const isBase = num <= 2;
                
                return (
                  <button
                    key={num}
                    onClick={() => setPrintColors(num)}
                    className={cn(
                      'flex flex-col items-center p-4 rounded-xl border-2 transition-all',
                      isSelected
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    )}
                  >
                    <span className={cn(
                      'text-2xl font-bold',
                      isSelected ? 'text-brand-600' : 'text-navy-900'
                    )}>
                      {num}
                    </span>
                    <span className="text-sm text-stone-500">
                      {num === 1 ? 'color' : 'colors'}
                    </span>
                    <span className={cn(
                      'text-xs mt-1 font-medium',
                      isBase ? 'text-green-600' : 'text-stone-500'
                    )}>
                      {isBase ? 'Included' : `+${formatPrice((num - 2) * 0.25)}/ea`}
                    </span>
                  </button>
                );
              })}
            </div>
            
            <p className="text-xs text-stone-500 mt-3">
              Need more than 4 colors? <a href="/quote" className="text-brand-600 hover:underline">Get a custom quote</a>
            </p>
          </div>
          
          {/* Step 3: Print Locations */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-stone-200/60">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-brand-500 text-white text-sm font-semibold">3</span>
              <h3 className="text-lg font-semibold text-navy-900">
                Print Locations
              </h3>
            </div>
            
            <div className="space-y-3">
              {/* Front - always included */}
              <div className="flex items-center justify-between p-4 bg-brand-50 rounded-xl border border-brand-200">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded bg-brand-500 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-navy-900">One Side Print</p>
                    <p className="text-sm text-stone-500">Up to 10&quot; x 10&quot; print area</p>
                  </div>
                </div>
                <span className="text-brand-600 font-medium">Included</span>
              </div>
              
              {/* Second side add-on */}
              <button
                onClick={() => setHasSecondSide(!hasSecondSide)}
                className={cn(
                  'w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left',
                  hasSecondSide
                    ? 'bg-brand-50 border-brand-200'
                    : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-5 w-5 rounded flex items-center justify-center',
                    hasSecondSide ? 'bg-brand-500' : 'bg-white border border-stone-300'
                  )}>
                    {hasSecondSide && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div>
                    <p className="font-medium text-navy-900">Second Side Print</p>
                    <p className="text-sm text-stone-500">Same design or different (same color count)</p>
                  </div>
                </div>
                <span className={cn(
                  'font-medium',
                  hasSecondSide ? 'text-brand-600' : 'text-stone-600'
                )}>
                  +{formatPrice(getPrintPrice(effectiveTier, printColors))}/bag
                </span>
              </button>
            </div>
          </div>
          
          {/* Your Artwork Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-stone-200/60">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-brand-500" />
              <h3 className="text-lg font-semibold text-navy-900">
                Your Artwork
              </h3>
            </div>
            
            <p className="text-stone-600 mb-4">
              After checkout, we&apos;ll email you to collect your artwork and create a free digital proof for your approval.
            </p>
            
            {/* Trust signals */}
            <div className="bg-stone-50 rounded-xl p-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-stone-700">Free art setup & screen creation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-stone-700">Digital proof before production</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-stone-700">PMS color matching included</span>
                </div>
              </div>
            </div>
            
            {/* Expandable upload section */}
            <div className="border-t border-stone-200/60 pt-4">
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>Have your artwork ready? Upload now (optional)</span>
                {showUpload ? (
                  <ChevronUp className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                )}
              </button>
              
              <AnimatePresence>
                {showUpload && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4">
                      {!uploadedFile ? (
                        <div
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onClick={() => fileInputRef.current?.click()}
                          className={cn(
                            'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
                            isDragging
                              ? 'border-brand-500 bg-brand-50'
                              : 'border-stone-300 hover:border-brand-400 hover:bg-stone-50'
                          )}
                        >
                          <FileImage className="h-10 w-10 text-stone-400 mx-auto mb-3" />
                          <p className="text-sm font-medium text-navy-900 mb-1">
                            Drag and drop your artwork here
                          </p>
                          <p className="text-xs text-stone-500 mb-3">
                            or click to browse
                          </p>
                          <p className="text-xs text-stone-400">
                            Accepts: AI, EPS, PDF, PNG, JPG, SVG (max 10MB)
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept={ACCEPTED_FILE_TYPES}
                            onChange={handleFileInputChange}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                          <FileImage className="h-8 w-8 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-navy-900 truncate">
                              {uploadedFile.name}
                            </p>
                            <p className="text-xs text-stone-500">
                              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            onClick={removeFile}
                            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg shadow-stone-200/50 border border-white/60">
            <h3 className="text-lg font-semibold text-navy-900 mb-4">
              Order Summary
            </h3>
            
            {/* Quantity and tier */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Total Quantity</span>
                <span className="text-xl font-bold text-navy-900">{totalQuantity} bags</span>
              </div>
              
              {/* Minimum warning or tier display */}
              {!hasMinimum ? (
                <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-lg text-sm">
                  <p className="font-medium">Minimum 50 bags required</p>
                  <p>Add {50 - totalQuantity} more to continue</p>
                </div>
              ) : (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">
                  <p className="font-medium">Your tier: {formatPrice(pricePerBag)}/bag</p>
                  {nextTier && qtyToNextTier > 0 && (
                    <p>Add {qtyToNextTier} more for better pricing</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Pricing breakdown */}
            <div className="border-t border-stone-200/60 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">Tote Bag (Isabella)</span>
                <span>{formatPrice(BLANK_COST[effectiveTier])}/ea</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">Print ({printColors} {printColors === 1 ? 'color' : 'colors'})</span>
                <span>{formatPrice(getPrintPrice(effectiveTier, printColors))}/ea</span>
              </div>
              
              {hasSecondSide && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Second Side Print</span>
                  <span>+{formatPrice(getPrintPrice(effectiveTier, printColors))}/ea</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm font-medium pt-2 border-t border-stone-100">
                <span>Price per bag</span>
                <span className="text-brand-600">{formatPrice(pricePerBag)}</span>
              </div>
            </div>
            
            {/* Subtotal */}
            <div className="border-t border-stone-200/60 mt-4 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Subtotal</span>
                <span className="text-2xl font-bold text-navy-900">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Shipping calculated at checkout
              </p>
            </div>
            
            {/* CTA Button */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={!hasMinimum || isNavigating}
              className={cn(
                'w-full mt-6 py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-2',
                hasMinimum && !isNavigating
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-lg shadow-brand-500/30'
                  : 'bg-stone-200 text-stone-500 cursor-not-allowed'
              )}
            >
              {isNavigating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : hasMinimum ? (
                'Continue to Checkout'
              ) : (
                `Add ${50 - totalQuantity} more bags`
              )}
            </button>
            
            {/* Trust signals */}
            <div className="mt-5 pt-5 border-t border-stone-200/60 space-y-3">
              <div className="flex items-center gap-3 p-2.5 bg-green-50/80 rounded-xl">
                <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm text-green-800 font-medium">Free art setup included</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 bg-blue-50/80 rounded-xl">
                <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Check className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm text-blue-800 font-medium">Digital proof before production</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 bg-amber-50/80 rounded-xl">
                <div className="flex-shrink-0 h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Check className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-sm text-amber-800 font-medium">Ready to ship in 5-7 days</span>
              </div>
            </div>
            
            {/* Contact for help */}
            <div className="mt-4 text-center">
              <p className="text-xs text-stone-500 mb-1">Questions about your order?</p>
              <a href="tel:8559427636" className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                (855) 942-7636
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
