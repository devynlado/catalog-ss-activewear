'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, X, Check, ChevronUp, ChevronDown, Sparkles, AlertTriangle, Zap, Palette, Upload, FileImage, Loader2 } from 'lucide-react';
import { ProductColor } from '@/lib/types';
import { cn, formatPrice } from '@/lib/utils';
import { EmbroideryPackageConfig, PricingTier } from './embroideryConfig';

// Proxy Google Drive URLs
function proxyImageUrl(url: string): string {
  if (!url) return '';
  if (url.includes('drive.usercontent.google.com') || url.includes('drive.google.com')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

// Get tier for a quantity
function getTierForQuantity(qty: number, tiers: PricingTier[], minQty: number) {
  if (qty < minQty) return tiers[0];
  return tiers.find(t => qty >= t.min && qty <= t.max) || tiers[tiers.length - 1];
}

// Get current tier index for progress display
function getTierIndex(qty: number, tiers: PricingTier[], minQty: number): number {
  if (qty < minQty) return -1;
  const index = tiers.findIndex(t => qty >= t.min && qty <= t.max);
  return index >= 0 ? index : tiers.length - 1;
}

// Get next tier info for upsell
function getNextTier(qty: number, tiers: PricingTier[]) {
  const currentTierIndex = tiers.findIndex(t => qty >= t.min && qty <= t.max);
  if (currentTierIndex < tiers.length - 1) {
    return tiers[currentTierIndex + 1];
  }
  return null;
}

// Get total inventory for a color
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

interface EmbroideryPackageBuilderProps {
  colors: ProductColor[];
  productStyleId: number;
  productName: string;
  config: EmbroideryPackageConfig;
}

// Accepted file types for logo upload
const ACCEPTED_FILE_TYPES = '.ai,.eps,.pdf,.png,.jpg,.jpeg,.svg';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function EmbroideryPackageBuilder({ 
  colors, 
  productStyleId, 
  productName, 
  config 
}: EmbroideryPackageBuilderProps) {
  const router = useRouter();
  const [selectedColors, setSelectedColors] = useState<ColorSelection[]>([]);
  const [addons, setAddons] = useState<string[]>([]);
  const [showAllColors, setShowAllColors] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { pricingTiers, minimumQuantity, unitSingular, unitPlural, storageKey, packageType } = config;
  
  // Restore selections from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.selectedColors?.length > 0) setSelectedColors(data.selectedColors);
        if (data.addons?.length > 0) setAddons(data.addons);
      } catch {
        // Invalid data, ignore
      }
    }
    setIsHydrated(true);
  }, [storageKey]);
  
  // Save selections to localStorage when they change
  useEffect(() => {
    if (!isHydrated) return;
    
    if (selectedColors.length > 0 || addons.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify({
        selectedColors,
        addons,
      }));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [selectedColors, addons, isHydrated, storageKey]);
  
  // Calculate totals
  const totalQuantity = useMemo(() => 
    selectedColors.reduce((sum, c) => sum + c.quantity, 0),
    [selectedColors]
  );
  
  const currentTier = getTierForQuantity(totalQuantity, pricingTiers, minimumQuantity);
  const nextTier = getNextTier(totalQuantity, pricingTiers);
  const qtyToNextTier = nextTier ? nextTier.min - totalQuantity : 0;
  
  const basePrice = currentTier.price;
  const addonPrice = useMemo(() => {
    let total = 0;
    addons.forEach(id => {
      if (id === 'puff' && config.puffAddon) {
        total += config.puffAddon.price;
      } else {
        const addon = config.addons.find(a => a.id === id);
        if (addon) total += addon.price;
      }
    });
    return total;
  }, [addons, config.addons, config.puffAddon]);
  const pricePerUnit = basePrice + addonPrice;
  const subtotal = totalQuantity * pricePerUnit;
  
  // Add a color
  const addColor = (color: ProductColor) => {
    if (selectedColors.find(c => c.colorCode === color.colorCode)) {
      setSelectedColors(prev => prev.filter(c => c.colorCode !== color.colorCode));
    } else {
      setSelectedColors(prev => [...prev, {
        colorCode: color.colorCode,
        colorName: color.colorName,
        frontImage: color.frontImage || '',
        quantity: 10,
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
  
  // Toggle addon
  const toggleAddon = (addonId: string) => {
    setAddons(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
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
      packageType,
      productStyleId,
      productName,
      selectedColors: selectedColors.map(c => ({
        colorCode: c.colorCode,
        colorName: c.colorName,
        quantity: c.quantity,
        frontImage: c.frontImage,
      })),
      embroideryLocations: ['front', ...addons.filter(a => a === 'side' || a === 'back')],
      has3DPuff: addons.includes('puff'),
      totalQuantity,
      pricePerHat: pricePerUnit,
      subtotal,
      uploadedFileName: uploadedFile?.name || null,
    };
    
    sessionStorage.setItem('packageCheckoutData', JSON.stringify(packageData));
    
    if (uploadedFile) {
      sessionStorage.setItem('packageLogoFile', uploadedFile.name);
    }
    
    localStorage.removeItem(storageKey);
    router.push('/packages/checkout');
  };
  
  const displayedColors = showAllColors ? colors : colors.slice(0, 20);
  const hasMinimum = totalQuantity >= minimumQuantity;
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-2">
          Build Your Package
        </h2>
        <p className="text-stone-600">
          Select colors, choose quantities, and add embroidery locations
        </p>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Color Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Color Picker */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-stone-200/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-navy-900">
                Select Colors
              </h3>
              <span className="text-sm text-stone-500">
                {colors.length} colors available
              </span>
            </div>
            
            {/* Mix colors callout */}
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Mix colors at no extra charge - same design on all {unitPlural}</span>
            </div>
            
            {/* Color grid */}
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
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
                        <Check className="h-5 w-5 text-brand-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Show more/less */}
            {colors.length > 20 && (
              <button
                onClick={() => setShowAllColors(!showAllColors)}
                className="mt-4 text-brand-600 hover:text-brand-700 text-sm font-medium flex items-center gap-1"
              >
                {showAllColors ? (
                  <>Show less <ChevronUp className="h-4 w-4" /></>
                ) : (
                  <>Show all {colors.length} colors</>
                )}
              </button>
            )}
          </div>
          
          {/* Selected Colors with Quantities */}
          <AnimatePresence>
            {selectedColors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-stone-200/60"
              >
                <h3 className="text-lg font-semibold text-navy-900 mb-4">
                  Your Selection
                </h3>
                
                <div className="space-y-3">
                  {selectedColors.map((color) => {
                    const available = getColorInventory(colors, color.colorCode);
                    const isOverStock = color.quantity > available;
                    const isLowStock = available > 0 && available <= 20;
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
                            <p className="text-xs text-amber-600">Only {available} left</p>
                          ) : (
                            <p className="text-xs text-stone-500">{available} available</p>
                          )}
                        </div>
                        
                        {/* Quantity controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(color.colorCode, -1)}
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
                            onClick={() => updateQuantity(color.colorCode, 1)}
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
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Embroidery Locations */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-stone-200/60">
            <h3 className="text-lg font-semibold text-navy-900 mb-4">
              Embroidery Locations
            </h3>
            
            <div className="space-y-3">
              {/* Front - always included */}
              <div className="flex items-center justify-between p-4 bg-brand-50 rounded-xl border border-brand-200">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded bg-brand-500 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-navy-900">{config.includedLocation.label}</p>
                    <p className="text-sm text-stone-500">{config.includedLocation.description}</p>
                  </div>
                </div>
                <span className="text-brand-600 font-medium">Included</span>
              </div>
              
              {/* Additional location add-ons */}
              {config.addons.map((addon) => {
                const isSelected = addons.includes(addon.id);
                return (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left',
                      isSelected
                        ? 'bg-brand-50 border-brand-200'
                        : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-5 w-5 rounded flex items-center justify-center',
                        isSelected ? 'bg-brand-500' : 'bg-white border border-stone-300'
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div>
                        <p className="font-medium text-navy-900">{addon.label}</p>
                        <p className="text-sm text-stone-500">{addon.description}</p>
                      </div>
                    </div>
                    <span className={cn(
                      'font-medium',
                      isSelected ? 'text-brand-600' : 'text-stone-600'
                    )}>
                      +{formatPrice(addon.price)}/{unitSingular}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Upgrades & Add-ons (only if puff addon is available) */}
          {config.puffAddon && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-stone-200/60">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-semibold text-navy-900">
                  Upgrades & Add-ons
                </h3>
              </div>
              
              <div className="space-y-3">
                {/* 3D Puff Option */}
                <button
                  onClick={() => toggleAddon(config.puffAddon!.id)}
                  className={cn(
                    'w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left',
                    addons.includes(config.puffAddon.id)
                      ? 'bg-brand-50 border-brand-200'
                      : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-5 w-5 rounded flex items-center justify-center',
                      addons.includes(config.puffAddon.id) ? 'bg-brand-500' : 'bg-white border border-stone-300'
                    )}>
                      {addons.includes(config.puffAddon.id) && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div>
                      <p className="font-medium text-navy-900">{config.puffAddon.label}</p>
                      <p className="text-sm text-stone-500">{config.puffAddon.description}</p>
                    </div>
                  </div>
                  <span className={cn(
                    'font-medium',
                    addons.includes(config.puffAddon.id) ? 'text-brand-600' : 'text-stone-600'
                  )}>
                    +{formatPrice(config.puffAddon.price)}/{unitSingular}
                  </span>
                </button>
                
                {/* 3D Puff Warning */}
                <AnimatePresence>
                  {addons.includes('puff') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                          <p className="font-medium mb-1">3D Puff Design Requirements</p>
                          <ul className="text-amber-700 space-y-1">
                            <li>• Designs must be <strong>bold and simple</strong> (1 color for puff area)</li>
                            <li>• No fine lines, small text, or intricate details</li>
                            <li>• We may decline 3D puff if your design isn&apos;t suitable</li>
                          </ul>
                          <p className="mt-2 text-amber-600 italic">
                            Not sure? We&apos;ll review your artwork and advise before production.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
          
          {/* Your Logo Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-stone-200/60">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-brand-500" />
              <h3 className="text-lg font-semibold text-navy-900">
                Your Logo
              </h3>
            </div>
            
            <p className="text-stone-600 mb-4">
              After checkout, we&apos;ll email you to collect your logo and create a free mockup for your approval.
            </p>
            
            {/* Multiple locations note */}
            {(addons.includes('side') || addons.includes('back')) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
                <p>
                  <strong>Multiple embroidery locations?</strong> No need to have it all figured out now. 
                  After checkout, our art team will collect your artwork and confirm placement for each location.
                </p>
              </div>
            )}
            
            {/* Trust signals */}
            <div className="bg-stone-50 rounded-xl p-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-stone-700">Professional digitizing included</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-stone-700">See your logo on the {unitSingular} before production</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-stone-700">Unlimited revisions until you&apos;re happy</span>
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
                <span>Have your logo ready? Upload now (optional)</span>
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
                            Drag and drop your logo here
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
                <span className="text-xl font-bold text-navy-900">{totalQuantity} {unitPlural}</span>
              </div>
              
              {/* Minimum warning or tier display */}
              {!hasMinimum ? (
                <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-lg text-sm">
                  <p className="font-medium">Minimum {minimumQuantity} {unitPlural} required</p>
                  <p>Add {minimumQuantity - totalQuantity} more to continue</p>
                </div>
              ) : (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">
                  <p className="font-medium">Your tier: {formatPrice(basePrice)}/{unitSingular}</p>
                  {nextTier && qtyToNextTier > 0 && (
                    <p>Add {qtyToNextTier} more for {formatPrice(nextTier.price)}/{unitSingular}</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Pricing breakdown */}
            <div className="border-t border-stone-200/60 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">Base price</span>
                <span>{formatPrice(basePrice)}/{unitSingular}</span>
              </div>
              
              {addons.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Add-ons ({addons.length})</span>
                  <span>+{formatPrice(addonPrice)}/{unitSingular}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm font-medium pt-2 border-t border-stone-100">
                <span>Price per {unitSingular}</span>
                <span className="text-brand-600">{formatPrice(pricePerUnit)}</span>
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
            
            {/* Tier Progress Visual */}
            <div className="border-t border-stone-200/60 mt-4 pt-4">
              <p className="text-sm font-medium text-navy-900 mb-3">Volume Savings</p>
              
              {/* Progress dots */}
              <div className="flex items-center justify-between mb-2">
                {pricingTiers.map((tier, index) => {
                  const tierIdx = getTierIndex(totalQuantity, pricingTiers, minimumQuantity);
                  const isActive = index === tierIdx;
                  const isPast = tierIdx > index;
                  const isFuture = tierIdx < index;
                  
                  return (
                    <div key={tier.min} className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-3 h-3 rounded-full transition-all',
                          isActive && 'bg-brand-500 ring-4 ring-brand-100',
                          isPast && 'bg-green-500',
                          isFuture && 'bg-stone-200',
                          !hasMinimum && index === 0 && 'ring-2 ring-amber-300 bg-amber-100'
                        )}
                      />
                      <span className={cn(
                        'text-xs mt-1',
                        isActive ? 'text-brand-600 font-medium' : 'text-stone-400'
                      )}>
                        {tier.min}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {/* Progress line */}
              <div className="relative h-1 bg-stone-200 rounded-full mb-3 mx-1.5">
                <div 
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-brand-500 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(100, Math.max(0, ((getTierIndex(totalQuantity, pricingTiers, minimumQuantity) + 1) / pricingTiers.length) * 100))}%` 
                  }}
                />
              </div>
              
              {/* Savings message */}
              {hasMinimum && nextTier && (
                <div className="bg-gradient-to-r from-stone-50 to-stone-100/50 rounded-xl p-3 text-sm border border-stone-200/50">
                  <p className="text-stone-600">
                    <span className="font-medium text-navy-900">Add {qtyToNextTier} more</span>
                    {' → '}{formatPrice(nextTier.price)}/{unitSingular}
                  </p>
                  <p className="text-green-600 font-medium">
                    Save {formatPrice((basePrice - nextTier.price) * (totalQuantity + qtyToNextTier))} on your order!
                  </p>
                </div>
              )}
              
              {!hasMinimum && (
                <p className="text-xs text-stone-500 text-center">
                  Starting at {formatPrice(pricingTiers[0].price)}/{unitSingular} ({minimumQuantity} minimum)
                </p>
              )}
              
              {hasMinimum && !nextTier && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50/50 rounded-xl p-3 text-sm text-center border border-green-200/50">
                  <p className="text-green-700 font-medium">
                    Best price unlocked! {formatPrice(pricingTiers[pricingTiers.length - 1].price)}/{unitSingular}
                  </p>
                </div>
              )}
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
                `Add ${minimumQuantity - totalQuantity} more ${unitPlural}`
              )}
            </button>
            
            {/* Trust signals */}
            <div className="mt-5 pt-5 border-t border-stone-200/60 space-y-3">
              <div className="flex items-center gap-3 p-2.5 bg-green-50/80 rounded-xl">
                <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm text-green-800 font-medium">Free digitizing included</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 bg-blue-50/80 rounded-xl">
                <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Check className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm text-blue-800 font-medium">Art approval before production</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 bg-amber-50/80 rounded-xl">
                <div className="flex-shrink-0 h-8 w-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Check className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-sm text-amber-800 font-medium">Ships in {config.turnaroundDays} days</span>
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
