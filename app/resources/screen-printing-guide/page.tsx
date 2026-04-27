'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Layers, 
  FileImage, 
  Palette, 
  Maximize2, 
  Shirt, 
  CheckCircle, 
  Download,
  ArrowRight,
  Mail,
  Star,
  AlertTriangle,
  Lightbulb,
  DollarSign
} from 'lucide-react';

export default function ScreenPrintingGuidePage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, guide: 'screen-printing' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send guide');
      }

      setIsUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const guideContent = [
    {
      icon: FileImage,
      title: '1. Prepare Your Artwork',
      tips: [
        'Vector files (AI, EPS, PDF) are ideal - they scale without losing quality',
        'Raster images should be 300 DPI minimum at final print size',
        'Separate colors into layers if possible',
        'Outline all fonts to prevent substitution',
        'Remove any unnecessary elements or hidden layers',
      ],
      warning: 'Low-resolution images will print blurry. If you only have a small logo, we can recreate it in vector format (additional fee may apply).',
    },
    {
      icon: Palette,
      title: '2. Optimize Your Color Count',
      tips: [
        'Each color requires a separate screen = separate setup fee',
        'Fewer colors = lower cost per piece',
        '1-2 colors: Most economical for simple logos',
        '3-4 colors: Good balance of visual impact and cost',
        '5+ colors: Consider digital screen printing for better value',
      ],
      proTip: 'Use the garment color as part of your design. A white print on a black shirt only needs ONE color!',
    },
    {
      icon: Maximize2,
      title: '3. Choose Your Print Size & Placement',
      tips: [
        'Standard front: Up to 12" x 14"',
        'Standard back: Up to 14" x 17"',
        'Left chest: 3.5" - 4" wide',
        'Jumbo print: Up to 17" x 23" (additional cost)',
        'Sleeve: 3" - 4" wide',
      ],
      placements: [
        { name: 'Left Chest', size: '3.5" - 4"', common: true },
        { name: 'Center Chest', size: '10" - 12" wide', common: true },
        { name: 'Full Front', size: '12" x 14"', common: true },
        { name: 'Full Back', size: '14" x 17"', common: true },
        { name: 'Sleeve', size: '3" - 4"', common: false },
      ],
    },
    {
      icon: Shirt,
      title: '4. Select the Right Garments',
      tips: [
        '100% cotton: Best ink absorption and color vibrancy',
        '50/50 blends: Good balance of comfort and print quality',
        'Tri-blends: Softer feel but may show slight heathering in print',
        'Polyester: Requires special inks (dye-sublimation or poly-safe)',
        'Dark garments: Require a white underbase (counts as +1 color)',
      ],
      warning: 'Avoid 100% polyester for standard screen printing - the ink may not adhere properly or colors may shift.',
    },
    {
      icon: DollarSign,
      title: '5. Understand Pricing',
      tips: [
        'Setup fee: $30 per color per location (one-time)',
        'More quantity = lower per-piece price',
        'Price breaks at 75, 100, 250, 500, and 1,000 pieces',
        'Dark garments add +1 color for underbase',
        'Special inks (puff, metallic, glow) have small surcharges',
      ],
      priceExample: {
        scenario: '100 black t-shirts, 2-color front print',
        breakdown: [
          { item: 'Print cost (100 x $2.95)', price: '$295.00' },
          { item: 'Setup (3 colors x $30)', price: '$90.00' },
          { item: 'Total decoration', price: '$385.00' },
          { item: 'Per piece', price: '$3.85' },
        ],
        note: 'Dark garments count as 3 colors (2 + white underbase)',
      },
    },
  ];

  const commonMistakes = [
    {
      mistake: 'Sending a tiny logo from a website',
      fix: 'Request original files from whoever designed your logo, or let us recreate it',
    },
    {
      mistake: 'Designing with too many colors',
      fix: 'Simplify to 2-4 colors for best value. Use halftones for shading effects',
    },
    {
      mistake: 'Forgetting about the garment color',
      fix: 'Dark shirts need a white underbase (+1 color). Plan your design accordingly',
    },
    {
      mistake: 'Ordering mixed garment types',
      fix: 'Stick to one fabric type per order for consistent results',
    },
    {
      mistake: 'Not accounting for size variations',
      fix: 'A 12" print looks different on S vs. 3XL. Consider scaling or separate artwork',
    },
  ];

  const inkTypes = [
    { name: 'Plastisol', desc: 'Standard screen print ink. Bold, opaque, durable.', best: 'Most orders' },
    { name: 'Water-based', desc: 'Softer hand feel, eco-friendly. Soaks into fabric.', best: 'Soft prints, vintage look' },
    { name: 'Discharge', desc: 'Removes garment dye and replaces with ink. Ultra-soft.', best: 'Dark garments, premium feel' },
    { name: 'Puff', desc: 'Expands when heated for 3D raised effect.', best: 'Streetwear, bold logos' },
    { name: 'Metallic', desc: 'Shimmery, reflective finish.', best: 'Special events, premium branding' },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 to-brand-800 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium mb-6">
                <Download className="h-4 w-4" />
                Free Guide
              </div>
              <h1 className="text-4xl font-bold text-white sm:text-5xl">
                The Complete Screen Printing Prep Guide
              </h1>
              <p className="mt-6 text-lg text-white/80 leading-relaxed">
                Master the fundamentals of screen printing preparation. 
                Learn how to optimize your artwork, choose the right garments, 
                and get the best value for your custom apparel order.
              </p>
              
              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full bg-white/20 border-2 border-white/30" />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-white/70">Trusted by 500+ businesses</p>
                </div>
              </div>
            </div>

            {/* Email Capture Form */}
            {!isUnlocked ? (
              <div className="bg-white rounded-2xl p-8 shadow-2xl">
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Get the Free Guide
                </h2>
                <p className="text-slate-600 mb-6">
                  Enter your email to unlock the full guide instantly.
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="sr-only">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full rounded-lg border border-stone-300 pl-12 pr-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                      />
                    </div>
                    {error && (
                      <p className="mt-2 text-sm text-red-600">{error}</p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Unlocking...
                      </>
                    ) : (
                      <>
                        Unlock Free Guide
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
                
                <p className="mt-4 text-xs text-slate-500 text-center">
                  No spam, ever. Unsubscribe anytime.
                </p>

                {/* Preview of what's inside */}
                <div className="mt-6 pt-6 border-t border-stone-200">
                  <p className="text-sm font-medium text-slate-700 mb-3">What's inside:</p>
                  <ul className="space-y-2">
                    {['Artwork preparation checklist', 'Color optimization tips', 'Size & placement guide', 'Ink types explained', 'Pricing breakdown example'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Guide Unlocked!
                </h2>
                <p className="text-slate-600 mb-6">
                  Scroll down to read the full guide. We've also sent a copy to your email.
                </p>
                <Link
                  href="/services/screen-printing"
                  className="inline-flex items-center gap-2 text-brand-600 font-medium hover:text-brand-700"
                >
                  View Screen Printing Services
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Guide Content - Only show if unlocked */}
      {isUnlocked && (
        <>
          {/* Main Guide Content */}
          <section className="py-16 lg:py-20">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <div className="space-y-16">
                {guideContent.map((section, index) => {
                  const Icon = section.icon;
                  return (
                    <div key={index} className="relative">
                      <div className="flex items-start gap-6">
                        <div className="flex-shrink-0 h-14 w-14 bg-brand-100 rounded-xl flex items-center justify-center">
                          <Icon className="h-7 w-7 text-brand-600" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-slate-900 mb-4">
                            {section.title}
                          </h2>
                          
                          <ul className="space-y-3 mb-6">
                            {section.tips.map((tip, tipIndex) => (
                              <li key={tipIndex} className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-700">{tip}</span>
                              </li>
                            ))}
                          </ul>

                          {section.warning && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 mb-4">
                              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-amber-800">{section.warning}</p>
                            </div>
                          )}

                          {section.proTip && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 mb-4">
                              <Lightbulb className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-green-800"><strong>Pro Tip:</strong> {section.proTip}</p>
                            </div>
                          )}

                          {section.placements && (
                            <div className="bg-stone-50 rounded-lg p-4">
                              <p className="text-sm font-medium text-slate-900 mb-3">Common placements:</p>
                              <div className="grid grid-cols-2 gap-2">
                                {section.placements.map((p, i) => (
                                  <div key={i} className="bg-white rounded px-3 py-2 text-sm">
                                    <span className="font-medium text-slate-900">{p.name}</span>
                                    <span className="text-slate-500 ml-2">{p.size}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {section.priceExample && (
                            <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
                              <p className="text-sm font-medium text-brand-900 mb-3">
                                Example: {section.priceExample.scenario}
                              </p>
                              <div className="space-y-1">
                                {section.priceExample.breakdown.map((line, i) => (
                                  <div key={i} className="flex justify-between text-sm">
                                    <span className="text-brand-800">{line.item}</span>
                                    <span className="font-medium text-brand-900">{line.price}</span>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-brand-700 mt-3 pt-3 border-t border-brand-200">
                                {section.priceExample.note}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Ink Types Section */}
          <section className="py-16 lg:py-20 bg-white">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900">Ink Types Explained</h2>
                <p className="mt-4 text-slate-600">Choose the right ink for your project</p>
              </div>

              <div className="space-y-4">
                {inkTypes.map((ink, index) => (
                  <div key={index} className="bg-stone-50 rounded-xl p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-slate-900">{ink.name}</h3>
                        <p className="text-slate-600 text-sm mt-1">{ink.desc}</p>
                      </div>
                      <span className="text-xs bg-brand-100 text-brand-700 px-3 py-1 rounded-full whitespace-nowrap">
                        Best for: {ink.best}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Common Mistakes Section */}
          <section className="py-16 lg:py-20 bg-stone-50">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900">5 Common Mistakes to Avoid</h2>
                <p className="mt-4 text-slate-600">Learn from others' mistakes so your order is perfect the first time</p>
              </div>

              <div className="space-y-4">
                {commonMistakes.map((item, index) => (
                  <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-bold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 mb-1">
                          <span className="text-red-600">Mistake:</span> {item.mistake}
                        </p>
                        <p className="text-slate-600">
                          <span className="text-green-600 font-medium">Fix:</span> {item.fix}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to Start Your Screen Print Order?</h2>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
            Now that you know how to prepare, let's bring your design to life. 
            Get a quote within 24 hours.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/pricing?service=screen-printing"
              className="inline-flex items-center gap-2 bg-brand-500 text-white px-6 py-3.5 rounded-lg font-semibold hover:bg-brand-600 transition-colors"
            >
              Get Instant Estimate
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/catalog?category=21"
              className="inline-flex items-center gap-2 bg-white/10 text-white px-6 py-3.5 rounded-lg font-semibold hover:bg-white/20 transition-colors"
            >
              Shop T-Shirts
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
