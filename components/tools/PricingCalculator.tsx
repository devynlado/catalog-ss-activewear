'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calculator, ArrowRight, Info, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============ PRICING DATA FROM UPLOADED CHARTS ============

// Screen Printing: Standard (15" x 19")
const screenPrintPricing: Record<string, number[]> = {
  '50-74':     [3.95, 4.45, 4.95, 5.45, 5.95, 6.45, 6.95, 7.45],
  '75-99':     [2.95, 3.45, 3.95, 4.45, 4.95, 5.45, 5.95, 6.45],
  '100-249':   [2.45, 2.95, 3.35, 3.75, 4.25, 4.65, 5.05, 5.45],
  '250-499':   [1.65, 1.95, 2.25, 2.55, 2.85, 3.05, 3.35, 3.65],
  '500-999':   [1.20, 1.45, 1.70, 1.95, 2.20, 2.45, 2.70, 2.90],
  '1000-2499': [0.90, 1.10, 1.30, 1.50, 1.70, 1.90, 2.10, 2.30],
  '2500-5000': [0.75, 0.90, 1.05, 1.20, 1.35, 1.50, 1.65, 1.80],
};

// Jumbo Screen Printing (17" x 23")
const jumboPricing: Record<string, number[]> = {
  '50-74':     [4.95, 5.75, 6.50, 7.25, 8.00, 8.75, 9.50, 10.25],
  '75-99':     [4.20, 4.90, 5.60, 6.30, 6.95, 7.75, 8.50, 9.25],
  '100-249':   [3.75, 4.25, 4.75, 5.25, 5.75, 6.25, 6.75, 8.25],
  '250-499':   [2.45, 2.95, 3.45, 3.85, 4.05, 4.55, 5.05, 5.65],
  '500-999':   [1.95, 2.25, 2.45, 2.65, 2.85, 3.05, 3.25, 3.45],
  '1000-2499': [1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 3.25],
  '2500-5000': [1.20, 1.45, 1.70, 1.95, 2.20, 2.45, 2.65, 2.90],
};

// Digital Screen Printing (Full Color)
const digitalPricing: Record<string, number> = {
  '50-74':     8.00,
  '75-99':     6.50,
  '100-249':   5.50,
  '250-499':   4.50,
  '500-999':   3.95,
  '1000-2499': 3.25,
  '2500-5000': 2.75,
};

// Embroidery (per stitch count)
const embroideryPricing: Record<string, number[]> = {
  '50-99':     [4.95, 5.45, 5.95, 6.45],  // 2500, 5000, 7500, 10000 stitches
  '100-249':   [4.25, 4.50, 4.75, 5.00],
  '250-499':   [3.75, 4.00, 4.25, 4.50],
  '500-999':   [3.25, 3.50, 3.75, 4.00],
  '1000-2499': [3.00, 3.25, 3.50, 3.75],
  '2500-5000': [2.75, 3.00, 3.25, 3.50],
};

// Finishing Services (per piece at different quantities)
const finishingPricing: Record<string, Record<string, number>> = {
  'fold-bag-shirts':  { '50': 1.00, '100': 1.00, '150': 1.00, '250': 1.00, '500': 0.95, '750': 0.90, '1000': 0.85 },
  'fold-bag-fleece':  { '50': 1.50, '100': 1.50, '150': 1.50, '250': 1.50, '500': 1.45, '750': 1.40, '1000': 1.35 },
  'hang-tags':        { '50': 0.50, '100': 0.50, '150': 0.50, '250': 0.50, '500': 0.45, '750': 0.40, '1000': 0.35 },
  'barcode':          { '50': 0.25, '100': 0.25, '150': 0.25, '250': 0.25, '500': 0.23, '750': 0.21, '1000': 0.19 },
  'sewing-woven-labels': { '50': 6.00, '100': 3.00, '150': 2.00, '250': 1.95, '500': 1.90, '750': 1.85, '1000': 1.80 },
};

// Extra costs
const screenPrintExtras = {
  setupPerColor: 30,
  darkGarmentExtraColor: true,
  fleeceSurcharge: 1.00,
  puffSurcharge: 1.00,
  metallicSurcharge: 0.50,
  inkCharge: 35,
  pmsMatch: 30,
};

const jumboExtras = {
  setupPerColor: 50,
  darkGarmentExtraColor: true,
  fleeceSurcharge: 1.00,
  puffSurcharge: 1.00,
  metallicSurcharge: 0.50,
  inkCharge: 35,
  pmsMatch: 30,
};

const digitalExtras = {
  setup: 100,
  fleeceSurcharge: 1.00,
  dischargeSurcharge: 1.50,
};

// ============ HELPER FUNCTIONS ============

function getQuantityTier(qty: number, tiers: string[]): string {
  for (const tier of tiers) {
    const [min, max] = tier.split('-').map(Number);
    if (qty >= min && qty <= max) return tier;
  }
  return tiers[tiers.length - 1];
}

function getFinishingTier(qty: number): string {
  if (qty >= 1000) return '1000';
  if (qty >= 750) return '750';
  if (qty >= 500) return '500';
  if (qty >= 250) return '250';
  if (qty >= 150) return '150';
  if (qty >= 100) return '100';
  return '50';
}

// ============ COMPONENT ============

type ServiceTab = 'screen-printing' | 'embroidery' | 'digital' | 'jumbo' | 'finishing';

interface PricingCalculatorProps {
  defaultService?: ServiceTab;
}

export function PricingCalculator({ defaultService = 'screen-printing' }: PricingCalculatorProps) {
  const [activeTab, setActiveTab] = useState<ServiceTab>(defaultService);
  
  // Screen Printing State
  const [spQuantity, setSpQuantity] = useState('100-249');
  const [spColors, setSpColors] = useState(2);
  const [spLocations, setSpLocations] = useState<string[]>(['front']);
  const [spIsDark, setSpIsDark] = useState(false);
  const [spIsFleece, setSpIsFleece] = useState(false);
  
  // Embroidery State
  const [embQuantity, setEmbQuantity] = useState('100-249');
  const [embStitches, setEmbStitches] = useState(0); // index: 0=2500, 1=5000, 2=7500, 3=10000
  const [embLocations, setEmbLocations] = useState(1);
  
  // Digital State
  const [digQuantity, setDigQuantity] = useState('100-249');
  const [digIsFleece, setDigIsFleece] = useState(false);
  
  // Jumbo State
  const [jumboQuantity, setJumboQuantity] = useState('100-249');
  const [jumboColors, setJumboColors] = useState(2);
  const [jumboLocations, setJumboLocations] = useState<string[]>(['back']);
  const [jumboIsDark, setJumboIsDark] = useState(false);
  
  // Finishing State
  const [finQuantity, setFinQuantity] = useState(100);
  const [finServices, setFinServices] = useState<string[]>(['fold-bag-shirts']);

  // Update tab when defaultService changes
  useEffect(() => {
    setActiveTab(defaultService);
  }, [defaultService]);

  // ============ CALCULATIONS ============

  const calculateScreenPrint = () => {
    const basePrice = screenPrintPricing[spQuantity]?.[spColors - 1] || 0;
    const effectiveColors = spIsDark ? spColors + 1 : spColors;
    const adjustedPrice = screenPrintPricing[spQuantity]?.[Math.min(effectiveColors - 1, 7)] || basePrice;
    const pricePerLocation = adjustedPrice + (spIsFleece ? screenPrintExtras.fleeceSurcharge : 0);
    const pricePerPiece = pricePerLocation * spLocations.length;
    
    const qty = parseInt(spQuantity.split('-')[0]);
    const setupFees = effectiveColors * screenPrintExtras.setupPerColor * spLocations.length;
    const totalPieces = qty;
    const subtotal = pricePerPiece * totalPieces;
    const total = subtotal + setupFees;
    
    return { pricePerPiece, setupFees, subtotal, total, totalPieces };
  };

  const calculateEmbroidery = () => {
    const basePrice = embroideryPricing[embQuantity]?.[embStitches] || 0;
    const pricePerPiece = basePrice * embLocations;
    
    const qty = parseInt(embQuantity.split('-')[0]);
    const totalPieces = qty;
    const subtotal = pricePerPiece * totalPieces;
    
    return { pricePerPiece, setupFees: 0, subtotal, total: subtotal, totalPieces };
  };

  const calculateDigital = () => {
    const basePrice = digitalPricing[digQuantity] || 0;
    const pricePerPiece = basePrice + (digIsFleece ? digitalExtras.fleeceSurcharge : 0);
    
    const qty = parseInt(digQuantity.split('-')[0]);
    const setupFees = digitalExtras.setup;
    const totalPieces = qty;
    const subtotal = pricePerPiece * totalPieces;
    const total = subtotal + setupFees;
    
    return { pricePerPiece, setupFees, subtotal, total, totalPieces };
  };

  const calculateJumbo = () => {
    const basePrice = jumboPricing[jumboQuantity]?.[jumboColors - 1] || 0;
    const effectiveColors = jumboIsDark ? jumboColors + 1 : jumboColors;
    const adjustedPrice = jumboPricing[jumboQuantity]?.[Math.min(effectiveColors - 1, 7)] || basePrice;
    const pricePerPiece = adjustedPrice * jumboLocations.length;
    
    const qty = parseInt(jumboQuantity.split('-')[0]);
    const setupFees = effectiveColors * jumboExtras.setupPerColor * jumboLocations.length;
    const totalPieces = qty;
    const subtotal = pricePerPiece * totalPieces;
    const total = subtotal + setupFees;
    
    return { pricePerPiece, setupFees, subtotal, total, totalPieces };
  };

  const calculateFinishing = () => {
    const tier = getFinishingTier(finQuantity);
    let pricePerPiece = 0;
    
    for (const service of finServices) {
      pricePerPiece += finishingPricing[service]?.[tier] || 0;
    }
    
    const subtotal = pricePerPiece * finQuantity;
    
    return { pricePerPiece, setupFees: 0, subtotal, total: subtotal, totalPieces: finQuantity };
  };

  const getCalculation = () => {
    switch (activeTab) {
      case 'screen-printing': return calculateScreenPrint();
      case 'embroidery': return calculateEmbroidery();
      case 'digital': return calculateDigital();
      case 'jumbo': return calculateJumbo();
      case 'finishing': return calculateFinishing();
    }
  };

  const calculation = getCalculation();

  const tabs: { id: ServiceTab; label: string }[] = [
    { id: 'screen-printing', label: 'Screen Printing' },
    { id: 'embroidery', label: 'Embroidery' },
    { id: 'digital', label: 'Digital Screen' },
    { id: 'jumbo', label: 'Jumbo Print' },
    { id: 'finishing', label: 'Finishing' },
  ];

  const quantityOptions = ['50-74', '75-99', '100-249', '250-499', '500-999', '1000-2499', '2500-5000'];
  const embQuantityOptions = ['50-99', '100-249', '250-499', '500-999', '1000-2499', '2500-5000'];
  const locationOptions = [
    { id: 'front', label: 'Front' },
    { id: 'back', label: 'Back' },
    { id: 'left-sleeve', label: 'Left Sleeve' },
    { id: 'right-sleeve', label: 'Right Sleeve' },
  ];
  const stitchOptions = [
    { value: 0, label: '2,500 stitches', desc: 'Small logo (2-3")' },
    { value: 1, label: '5,000 stitches', desc: 'Medium logo (3-4")' },
    { value: 2, label: '7,500 stitches', desc: 'Large logo (4-5")' },
    { value: 3, label: '10,000 stitches', desc: 'XL logo (5"+)' },
  ];
  const finishingOptions = [
    { id: 'fold-bag-shirts', label: 'Fold & Bag (Shirts)', price: '$0.85-1.00' },
    { id: 'fold-bag-fleece', label: 'Fold & Bag (Fleece)', price: '$1.35-1.50' },
    { id: 'hang-tags', label: 'Hang Tags', price: '$0.35-0.50' },
    { id: 'barcode', label: 'Barcode/UPC', price: '$0.19-0.25' },
    { id: 'sewing-woven-labels', label: 'Sewing (Woven Labels)', price: '$1.80-2.00' },
  ];

  const toggleLocation = (loc: string, current: string[], setter: (val: string[]) => void) => {
    if (current.includes(loc)) {
      if (current.length > 1) {
        setter(current.filter(l => l !== loc));
      }
    } else {
      setter([...current, loc]);
    }
  };

  const toggleFinishing = (service: string) => {
    if (finServices.includes(service)) {
      if (finServices.length > 1) {
        setFinServices(finServices.filter(s => s !== service));
      }
    } else {
      setFinServices([...finServices, service]);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-stone-200 bg-stone-50">
        <div className="flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 min-w-[120px] px-4 py-4 text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'bg-white text-brand-600 border-b-2 border-brand-500'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 lg:p-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Screen Printing Options */}
            {activeTab === 'screen-printing' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
                  <select
                    value={spQuantity}
                    onChange={(e) => setSpQuantity(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  >
                    {quantityOptions.map(opt => (
                      <option key={opt} value={opt}>{opt} pieces</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Number of Colors</label>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <button
                        key={num}
                        onClick={() => setSpColors(num)}
                        className={cn(
                          'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                          spColors === num
                            ? 'bg-brand-500 text-white'
                            : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Print Locations</label>
                  <div className="grid grid-cols-2 gap-2">
                    {locationOptions.map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => toggleLocation(loc.id, spLocations, setSpLocations)}
                        className={cn(
                          'px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2',
                          spLocations.includes(loc.id)
                            ? 'bg-brand-500 text-white'
                            : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                        )}
                      >
                        {spLocations.includes(loc.id) && <Check className="h-4 w-4" />}
                        {loc.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={spIsDark}
                      onChange={(e) => setSpIsDark(e.target.checked)}
                      className="rounded border-stone-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-slate-700">Dark Garment (+1 color)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={spIsFleece}
                      onChange={(e) => setSpIsFleece(e.target.checked)}
                      className="rounded border-stone-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-slate-700">Fleece (+$1.00)</span>
                  </label>
                </div>
              </>
            )}

            {/* Embroidery Options */}
            {activeTab === 'embroidery' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
                  <select
                    value={embQuantity}
                    onChange={(e) => setEmbQuantity(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  >
                    {embQuantityOptions.map(opt => (
                      <option key={opt} value={opt}>{opt} pieces</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Stitch Count</label>
                  <div className="space-y-2">
                    {stitchOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setEmbStitches(opt.value)}
                        className={cn(
                          'w-full px-4 py-3 rounded-lg text-left transition-colors',
                          embStitches === opt.value
                            ? 'bg-brand-50 border-2 border-brand-500'
                            : 'bg-stone-50 border-2 border-transparent hover:bg-stone-100'
                        )}
                      >
                        <span className="font-medium text-slate-900">{opt.label}</span>
                        <span className="text-sm text-slate-500 ml-2">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Number of Locations</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(num => (
                      <button
                        key={num}
                        onClick={() => setEmbLocations(num)}
                        className={cn(
                          'flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors',
                          embLocations === num
                            ? 'bg-brand-500 text-white'
                            : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Digital Options */}
            {activeTab === 'digital' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
                  <select
                    value={digQuantity}
                    onChange={(e) => setDigQuantity(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  >
                    {quantityOptions.map(opt => (
                      <option key={opt} value={opt}>{opt} pieces</option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Full Color - Unlimited Colors</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Digital screen printing includes unlimited colors at no extra charge. Perfect for photorealistic designs and complex gradients.
                      </p>
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={digIsFleece}
                    onChange={(e) => setDigIsFleece(e.target.checked)}
                    className="rounded border-stone-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-slate-700">Fleece Garment (+$1.00)</span>
                </label>
              </>
            )}

            {/* Jumbo Options */}
            {activeTab === 'jumbo' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
                  <select
                    value={jumboQuantity}
                    onChange={(e) => setJumboQuantity(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  >
                    {quantityOptions.map(opt => (
                      <option key={opt} value={opt}>{opt} pieces</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Number of Colors</label>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <button
                        key={num}
                        onClick={() => setJumboColors(num)}
                        className={cn(
                          'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                          jumboColors === num
                            ? 'bg-brand-500 text-white'
                            : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Print Locations</label>
                  <div className="grid grid-cols-2 gap-2">
                    {locationOptions.map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => toggleLocation(loc.id, jumboLocations, setJumboLocations)}
                        className={cn(
                          'px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2',
                          jumboLocations.includes(loc.id)
                            ? 'bg-brand-500 text-white'
                            : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                        )}
                      >
                        {jumboLocations.includes(loc.id) && <Check className="h-4 w-4" />}
                        {loc.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jumboIsDark}
                    onChange={(e) => setJumboIsDark(e.target.checked)}
                    className="rounded border-stone-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-slate-700">Dark Garment (+1 color for underbase)</span>
                </label>
              </>
            )}

            {/* Finishing Options */}
            {activeTab === 'finishing' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    value={finQuantity}
                    onChange={(e) => setFinQuantity(Math.max(50, parseInt(e.target.value) || 50))}
                    min={50}
                    className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                  <p className="text-xs text-slate-500 mt-1">Minimum 50 pieces</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Services</label>
                  <div className="space-y-2">
                    {finishingOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => toggleFinishing(opt.id)}
                        className={cn(
                          'w-full px-4 py-3 rounded-lg text-left transition-colors flex items-center justify-between',
                          finServices.includes(opt.id)
                            ? 'bg-brand-50 border-2 border-brand-500'
                            : 'bg-stone-50 border-2 border-transparent hover:bg-stone-100'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {finServices.includes(opt.id) && <Check className="h-4 w-4 text-brand-500" />}
                          <span className="font-medium text-slate-900">{opt.label}</span>
                        </div>
                        <span className="text-sm text-slate-500">{opt.price}/pc</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Results Section */}
          <div className="bg-stone-50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="h-5 w-5 text-brand-500" />
              <h3 className="text-lg font-semibold text-slate-900">Your Estimate</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-stone-200">
                <span className="text-slate-600">Price per piece</span>
                <span className="text-2xl font-bold text-slate-900">
                  ${calculation.pricePerPiece.toFixed(2)}
                </span>
              </div>

              {calculation.setupFees > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Setup fees</span>
                  <span className="font-medium text-slate-900">${calculation.setupFees.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-slate-600">Subtotal ({calculation.totalPieces} pieces)</span>
                <span className="font-medium text-slate-900">${calculation.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-stone-200">
                <span className="font-semibold text-slate-900">Estimated Total</span>
                <span className="text-2xl font-bold text-brand-600">${calculation.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> This is an estimate based on trade pricing. Final pricing may vary based on artwork complexity, garment selection, and additional services. Garment costs not included.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href={`/contact?service=${activeTab}`}
                className="flex items-center justify-center gap-2 w-full bg-brand-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-600 transition-colors"
              >
                Get Exact Quote
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="tel:+18559427636"
                className="flex items-center justify-center gap-2 w-full bg-white text-slate-700 px-6 py-3 rounded-lg font-semibold border border-stone-200 hover:bg-stone-50 transition-colors"
              >
                Call (855) 942-7636
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
