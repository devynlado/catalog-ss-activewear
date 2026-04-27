'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Scissors, 
  FileImage, 
  Palette, 
  Ruler, 
  Shirt, 
  CheckCircle, 
  Download,
  ArrowRight,
  Mail,
  Star,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

export default function EmbroideryGuidePage() {
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
        body: JSON.stringify({ email, guide: 'embroidery' }),
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
        'Submit vector files (AI, EPS, PDF) whenever possible',
        'If using raster images, ensure 300 DPI minimum at actual size',
        'Simplify small details - thread cannot reproduce tiny elements',
        'Outline all fonts to prevent font substitution issues',
        'Provide Pantone color codes for accurate thread matching',
      ],
      warning: 'Avoid gradients, shadows, and photorealistic images - they don\'t translate well to embroidery.',
    },
    {
      icon: Ruler,
      title: '2. Size Your Design Appropriately',
      tips: [
        'Left chest logos: 3.5" - 4" wide is standard',
        'Cap front: 2.5" tall maximum for structured caps',
        'Full back: Up to 12" x 12" for jackets',
        'Sleeve: 3" - 4" wide depending on garment',
        'Consider how design scales across different garment sizes',
      ],
      warning: 'Text smaller than 1/4" tall may not be legible in embroidery.',
    },
    {
      icon: Palette,
      title: '3. Choose Your Thread Colors',
      tips: [
        'We use Madeira Polyneon thread with 400+ color options',
        'Provide Pantone (PMS) codes for exact matching',
        'Fewer colors = faster production = lower cost',
        'Metallic threads available for premium look (slight upcharge)',
        'Consider contrast with garment color for visibility',
      ],
      warning: 'Some colors may require a color match fee ($30) for exact PMS matching.',
    },
    {
      icon: Shirt,
      title: '4. Select the Right Garments',
      tips: [
        'Structured fabrics (pique polo, twill) produce cleanest results',
        'Cotton and cotton-blends work great',
        'Performance fabrics require special backing',
        'Avoid ultra-lightweight or stretchy materials',
        'Darker garments may need tear-away backing',
      ],
      bestFor: ['Polos', 'Caps', 'Jackets', 'Quarter-zips', 'Heavyweight fleece'],
    },
    {
      icon: Scissors,
      title: '5. Understand Stitch Count',
      tips: [
        'Stitch count determines pricing - more stitches = higher cost',
        'Simple logo (2,500 stitches): ~$4-5 per piece',
        'Medium logo (5,000 stitches): ~$4.50-5.50 per piece',
        'Large/detailed logo (10,000+ stitches): ~$5.50-7 per piece',
        'We optimize designs to reduce stitch count without sacrificing quality',
      ],
      warning: 'Very dense designs may pucker thin fabrics. We\'ll advise if adjustments are needed.',
    },
  ];

  const commonMistakes = [
    {
      mistake: 'Using low-resolution logos',
      fix: 'Always provide vector files or high-res images (300+ DPI)',
    },
    {
      mistake: 'Expecting photorealistic results',
      fix: 'Embroidery is best for logos, text, and simple graphics',
    },
    {
      mistake: 'Ordering wrong garment types',
      fix: 'Stick to structured fabrics - we can recommend options',
    },
    {
      mistake: 'Placing embroidery over seams/pockets',
      fix: 'Avoid placement on uneven surfaces for best results',
    },
    {
      mistake: 'Ordering minimum quantity for first-time digitization',
      fix: 'Digitization is a one-time cost - order more to spread it out',
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium mb-6">
                <Download className="h-4 w-4" />
                Free Guide
              </div>
              <h1 className="text-4xl font-bold text-white sm:text-5xl">
                The Complete Embroidery Prep Guide
              </h1>
              <p className="mt-6 text-lg text-white/80 leading-relaxed">
                Everything you need to know to get perfect embroidery results. 
                From artwork preparation to garment selection, this guide covers 
                the essential steps for a successful embroidery order.
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
                        className="w-full rounded-lg border border-stone-300 pl-12 pr-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                      />
                    </div>
                    {error && (
                      <p className="mt-2 text-sm text-red-600">{error}</p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    {['Artwork preparation checklist', 'Size & placement guide', 'Garment selection tips', 'Common mistakes to avoid', 'Cost-saving strategies'].map((item, i) => (
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
                  href="/services/embroidery"
                  className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700"
                >
                  View Embroidery Services
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
                        <div className="flex-shrink-0 h-14 w-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                          <Icon className="h-7 w-7 text-indigo-600" />
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
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-amber-800">{section.warning}</p>
                            </div>
                          )}

                          {section.bestFor && (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                              <p className="text-sm font-medium text-indigo-900 mb-2">Best garments for embroidery:</p>
                              <div className="flex flex-wrap gap-2">
                                {section.bestFor.map((item, i) => (
                                  <span key={i} className="bg-white px-3 py-1 rounded-full text-sm text-indigo-700 border border-indigo-200">
                                    {item}
                                  </span>
                                ))}
                              </div>
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

          {/* Common Mistakes Section */}
          <section className="py-16 lg:py-20 bg-white">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900">5 Common Mistakes to Avoid</h2>
                <p className="mt-4 text-slate-600">Learn from others' mistakes so your order is perfect the first time</p>
              </div>

              <div className="space-y-4">
                {commonMistakes.map((item, index) => (
                  <div key={index} className="bg-stone-50 rounded-xl p-6">
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

          {/* Pro Tips */}
          <section className="py-16 lg:py-20 bg-indigo-50">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-start gap-4 mb-8">
                <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Pro Tips for Cost Savings</h2>
                  <p className="text-slate-600 mt-1">Ways to get the most value from your embroidery order</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  'Order in bulk - price per piece drops significantly at 100, 250, and 500+ pieces',
                  'Stick to one logo placement - each location requires separate setup',
                  'Simplify your design - fewer colors and smaller size = lower stitch count',
                  'Reuse your digitization - once created, your embroidery file is yours forever',
                  'Choose standard placements - left chest and cap front are most efficient',
                  'Plan ahead - rush orders incur additional fees',
                ].map((tip, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-700 text-sm">{tip}</p>
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
          <h2 className="text-3xl font-bold text-white">Ready to Start Your Embroidery Order?</h2>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
            Now that you know how to prepare, let's bring your design to life. 
            Get a quote within 24 hours.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/pricing?service=embroidery"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Get Instant Estimate
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/catalog?category=52"
              className="inline-flex items-center gap-2 bg-white/10 text-white px-6 py-3.5 rounded-lg font-semibold hover:bg-white/20 transition-colors"
            >
              Shop Embroidery Blanks
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
