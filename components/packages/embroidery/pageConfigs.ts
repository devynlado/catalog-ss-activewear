// Page-specific configurations for embroidery packages
// Contains hero, what's included, benefits, and FAQ content

import type { TrustBadge, IncludedItem, PricingRow, Benefit, FAQItem, IconName } from '../shared/types';

// ============================================
// SHARED CONTENT (used across multiple pages)
// ============================================

export const sharedTrustBadges: TrustBadge[] = [
  { icon: 'Clock', text: '10-Day Turnaround' },
  { icon: 'FileCheck', text: 'Free Sample Approval' },
  { icon: 'Palette', text: 'Mix Colors - Same Price' },
  { icon: 'Truck', text: 'Free Shipping $500+' },
];

export const sharedBenefits: Benefit[] = [
  {
    icon: 'DollarSign',
    title: 'Transparent Pricing',
    description: 'No hidden fees, no setup charges, no surprises. The price you see is the price you pay.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: 'ShieldCheck',
    title: 'All-Inclusive',
    description: 'Embroidery, digitizing, and sample approval all included. One simple price per hat.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: 'Eye',
    title: 'See Your Logo First',
    description: 'We send you a pre-production sample for approval before we embroider the full order.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: 'Clock',
    title: '10-Day Turnaround',
    description: 'From approval to delivery in just 10 business days. Need it faster? Ask about rush options.',
    color: 'bg-amber-100 text-amber-600',
  },
];

export const sharedBeanieBenefits: Benefit[] = [
  ...sharedBenefits.slice(0, 1),
  {
    icon: 'ShieldCheck',
    title: 'All-Inclusive',
    description: 'Embroidery, digitizing, and sample approval all included. One simple price per beanie.',
    color: 'bg-blue-100 text-blue-600',
  },
  ...sharedBenefits.slice(2),
];

const baseCapIncludedItems: IncludedItem[] = [
  {
    icon: 'Scissors',
    title: 'Front Embroidery',
    description: 'Up to 10,000 stitches on the front of your cap',
  },
  {
    icon: 'Sparkles',
    title: 'Professional Digitizing',
    description: 'We convert your logo to embroidery format - FREE',
  },
  {
    icon: 'FileCheck',
    title: 'Pre-Production Sample',
    description: 'Approve your design before we start production',
  },
  {
    icon: 'Clock',
    title: '10-Day Turnaround',
    description: 'Fast, reliable delivery on every order',
  },
  {
    icon: 'Palette',
    title: 'Mix Colors Free',
    description: 'Combine any colors at no extra charge',
  },
  {
    icon: 'Truck',
    title: 'Free Shipping $500+',
    description: 'Orders over $500 ship free within the US',
  },
];

const baseBeanieIncludedItems: IncludedItem[] = [
  {
    icon: 'Scissors',
    title: 'Front Embroidery',
    description: 'Up to 10,000 stitches on the front of your beanie',
  },
  ...baseCapIncludedItems.slice(1),
];

const baseCapFAQs: FAQItem[] = [
  {
    question: 'What is the minimum order quantity?',
    answer: 'Our minimum order is 50 hats. You can mix and match colors as long as the total quantity reaches 50 and the design remains the same across all caps.',
  },
  {
    question: 'Can I mix different colors in my order?',
    answer: 'Yes! You can mix any combination of available colors at no extra charge. The same design will be embroidered on all caps, but you can customize the color breakdown however you like.',
  },
  {
    question: 'What is included in the price?',
    answer: 'Everything! Our price includes front embroidery (up to 10,000 stitches), professional digitizing of your logo, a pre-production sample for approval, and shipping within the continental US for orders over $500.',
  },
  {
    question: 'How long does production take?',
    answer: 'Standard turnaround is 10 business days from when you approve the pre-production sample. Need it faster? Contact us about rush options.',
  },
  {
    question: 'What file format do you need for my logo?',
    answer: 'We accept most common formats including AI, EPS, PDF, PNG, and JPG. For best results, vector files (AI, EPS, PDF) are preferred. Our team will convert your logo to embroidery format at no extra charge.',
  },
  {
    question: 'What if I need to make changes after I place my order?',
    answer: 'Changes can be made up until you approve the pre-production sample. After approval, the order goes into production and cannot be modified.',
  },
  {
    question: 'Do you offer additional embroidery locations?',
    answer: 'Yes! In addition to front embroidery (included), you can add side embroidery and/or back embroidery for $5.00 per location, per hat.',
  },
  {
    question: 'What is 3D puff embroidery and is my design suitable?',
    answer: '3D puff embroidery creates a raised, dimensional effect that makes your logo "pop" off the cap. However, it works best with bold, simple designs—typically one color for the puff area with no fine lines, small text, or intricate details. If your design has complex elements, we may need to decline the 3D puff option or suggest modifications. When you upload your artwork, our team will review it and let you know if 3D puff is a good fit before production.',
  },
  {
    question: 'What is the pre-production sample?',
    answer: 'Before we produce your full order, we embroider one cap exactly as your order will appear and send you a photo for approval. This ensures you\'re 100% satisfied with the placement, colors, and quality before we proceed.',
  },
];

const baseBeaniFAQs: FAQItem[] = [
  {
    question: 'What is the minimum order quantity?',
    answer: 'Our minimum order is 50 beanies. You can mix and match colors as long as the total quantity reaches 50 and the design remains the same across all beanies.',
  },
  {
    question: 'Can I mix different colors in my order?',
    answer: 'Yes! You can mix any combination of available colors at no extra charge. The same design will be embroidered on all beanies, but you can customize the color breakdown however you like.',
  },
  {
    question: 'What is included in the price?',
    answer: 'Everything! Our price includes front embroidery (up to 10,000 stitches), professional digitizing of your logo, a pre-production sample for approval, and shipping within the continental US for orders over $500.',
  },
  {
    question: 'How long does production take?',
    answer: 'Standard turnaround is 10 business days from when you approve the pre-production sample. Need it faster? Contact us about rush options.',
  },
  {
    question: 'What file format do you need for my logo?',
    answer: 'We accept most common formats including AI, EPS, PDF, PNG, and JPG. For best results, vector files (AI, EPS, PDF) are preferred. Our team will convert your logo to embroidery format at no extra charge.',
  },
  {
    question: 'What if I need to make changes after I place my order?',
    answer: 'Changes can be made up until you approve the pre-production sample. After approval, the order goes into production and cannot be modified.',
  },
  {
    question: 'Do you offer additional embroidery locations?',
    answer: 'Yes! In addition to front embroidery (included), you can add back embroidery for $5.00 per beanie.',
  },
  {
    question: 'What is the pre-production sample?',
    answer: 'Before we produce your full order, we embroider one beanie exactly as your order will appear and send you a photo for approval. This ensures you\'re 100% satisfied with the placement, colors, and quality before we proceed.',
  },
];

// ============================================
// EMBROIDERED BASEBALL CAPS
// ============================================

export const embroideredCapsPageConfig = {
  hero: {
    badge: '#1 Best-Selling Baseball Cap',
    title: 'Custom Embroidered',
    titleLine2: 'Baseball Caps',
    subtitle: 'All-Inclusive Pricing',
    description: 'Premium 5-panel mid-profile baseball caps with your logo embroidered. Transparent pricing, no hidden fees, free sample before production.',
    priceFrom: 13.95,
    priceUnit: 'hat',
    priceNote: 'at 100+ qty · Volume discounts available',
    image: '/images/embroidery/hero-custom-cap.png',
    imageAlt: 'Custom Embroidered Baseball Cap - The Cactus Club Example',
    colorCount: 47,
    trustBadges: sharedTrustBadges,
  },
  whatsIncluded: {
    description: 'Transparent pricing with no hidden fees. Everything you need for custom embroidered baseball caps is included.',
    items: baseCapIncludedItems,
    pricingTable: {
      columns: [
        { key: 'qty', label: 'Quantity' },
        { key: 'price', label: 'Price per Hat', align: 'right' as const },
        { key: 'savings', label: 'You Save', align: 'right' as const },
      ],
      rows: [
        { qty: '50 hats', price: 15.95, savings: null },
        { qty: '75 hats', price: 14.95, savings: '6%' },
        { qty: '100 hats', price: 13.95, savings: '13%' },
        { qty: '250 hats', price: 12.95, savings: '19%' },
        { qty: '500+ hats', price: 12.45, savings: '22%', popular: true },
      ] as PricingRow[],
      footnotes: ['Need more than 500? Contact us for custom pricing'],
    },
  },
  benefits: {
    description: 'We make custom embroidery simple, affordable, and stress-free.',
    benefits: sharedBenefits,
  },
  faq: {
    description: 'Everything you need to know about our custom embroidered baseball caps.',
    faqs: baseCapFAQs,
  },
  stickyMobileCta: {
    priceText: 'From $12.45/hat',
  },
  productStyleId: 1000318,
};

// ============================================
// TRUCKER CAPS
// ============================================

export const truckerCapsPageConfig = {
  hero: {
    badge: 'Most Popular Trucker',
    title: 'Custom Embroidered',
    titleLine2: 'Trucker Caps',
    subtitle: 'All-Inclusive Pricing',
    description: 'Classic mesh-back trucker caps with your logo embroidered. Breathable, adjustable, and ready for your brand.',
    priceFrom: 11.95,
    priceUnit: 'hat',
    priceNote: 'at 100+ qty · Volume discounts available',
    image: '/images/embroidery/hero-trucker-cap.png',
    imageAlt: 'Custom Embroidered Trucker Cap',
    colorCount: 95,
    trustBadges: sharedTrustBadges,
  },
  whatsIncluded: {
    description: 'Transparent pricing with no hidden fees. Everything you need for custom embroidered trucker caps is included.',
    items: baseCapIncludedItems,
    pricingTable: {
      columns: [
        { key: 'qty', label: 'Quantity' },
        { key: 'price', label: 'Price per Hat', align: 'right' as const },
        { key: 'savings', label: 'You Save', align: 'right' as const },
      ],
      rows: [
        { qty: '50 hats', price: 13.95, savings: null },
        { qty: '75 hats', price: 12.95, savings: '7%' },
        { qty: '100 hats', price: 11.95, savings: '14%' },
        { qty: '250 hats', price: 10.95, savings: '21%' },
        { qty: '500+ hats', price: 10.45, savings: '25%', popular: true },
      ] as PricingRow[],
      footnotes: ['Need more than 500? Contact us for custom pricing'],
    },
  },
  benefits: {
    description: 'We make custom embroidery simple, affordable, and stress-free.',
    benefits: sharedBenefits,
  },
  faq: {
    description: 'Everything you need to know about our custom embroidered trucker caps.',
    faqs: baseCapFAQs,
  },
  stickyMobileCta: {
    priceText: 'From $10.45/hat',
  },
  productStyleId: 27113,
};

// ============================================
// SNAPBACK CAPS
// ============================================

export const snapbackCapsPageConfig = {
  hero: {
    badge: 'Premium Flatbill Style',
    title: 'Custom Embroidered',
    titleLine2: 'Snapback Caps',
    subtitle: 'All-Inclusive Pricing',
    description: 'Premium 5-panel snapback caps with structured crown and flat bill. Your logo embroidered with precision.',
    priceFrom: 15.95,
    priceUnit: 'hat',
    priceNote: 'at 100+ qty · Volume discounts available',
    image: '/images/embroidery/hero-snapback-cap.png',
    imageAlt: 'Custom Embroidered Snapback Cap',
    colorCount: 24,
    trustBadges: sharedTrustBadges,
  },
  whatsIncluded: {
    description: 'Transparent pricing with no hidden fees. Everything you need for custom embroidered snapback caps is included.',
    items: baseCapIncludedItems,
    pricingTable: {
      columns: [
        { key: 'qty', label: 'Quantity' },
        { key: 'price', label: 'Price per Hat', align: 'right' as const },
        { key: 'savings', label: 'You Save', align: 'right' as const },
      ],
      rows: [
        { qty: '50 hats', price: 17.95, savings: null },
        { qty: '75 hats', price: 16.95, savings: '6%' },
        { qty: '100 hats', price: 15.95, savings: '11%' },
        { qty: '250 hats', price: 14.95, savings: '17%' },
        { qty: '500+ hats', price: 14.45, savings: '19%', popular: true },
      ] as PricingRow[],
      footnotes: ['Need more than 500? Contact us for custom pricing'],
    },
  },
  benefits: {
    description: 'We make custom embroidery simple, affordable, and stress-free.',
    benefits: sharedBenefits,
  },
  faq: {
    description: 'Everything you need to know about our custom embroidered snapback caps.',
    faqs: baseCapFAQs,
  },
  stickyMobileCta: {
    priceText: 'From $14.45/hat',
  },
  productStyleId: 1000500,
};

// ============================================
// DAD CAPS
// ============================================

export const dadCapsPageConfig = {
  hero: {
    badge: 'Classic Relaxed Fit',
    title: 'Custom Embroidered',
    titleLine2: 'Dad Caps',
    subtitle: 'All-Inclusive Pricing',
    description: 'Relaxed, unstructured dad caps with your logo embroidered. The perfect casual, comfortable style.',
    priceFrom: 12.95,
    priceUnit: 'hat',
    priceNote: 'at 100+ qty · Volume discounts available',
    image: '/images/embroidery/hero-dad-cap.png',
    imageAlt: 'Custom Embroidered Dad Cap',
    colorCount: 30,
    trustBadges: sharedTrustBadges,
  },
  whatsIncluded: {
    description: 'Transparent pricing with no hidden fees. Everything you need for custom embroidered dad caps is included.',
    items: baseCapIncludedItems,
    pricingTable: {
      columns: [
        { key: 'qty', label: 'Quantity' },
        { key: 'price', label: 'Price per Hat', align: 'right' as const },
        { key: 'savings', label: 'You Save', align: 'right' as const },
      ],
      rows: [
        { qty: '50 hats', price: 14.95, savings: null },
        { qty: '75 hats', price: 13.95, savings: '7%' },
        { qty: '100 hats', price: 12.95, savings: '13%' },
        { qty: '250 hats', price: 11.95, savings: '20%' },
        { qty: '500+ hats', price: 11.45, savings: '23%', popular: true },
      ] as PricingRow[],
      footnotes: ['Need more than 500? Contact us for custom pricing'],
    },
  },
  benefits: {
    description: 'We make custom embroidery simple, affordable, and stress-free.',
    benefits: sharedBenefits,
  },
  faq: {
    description: 'Everything you need to know about our custom embroidered dad caps.',
    faqs: baseCapFAQs,
  },
  stickyMobileCta: {
    priceText: 'From $11.45/hat',
  },
  productStyleId: 1000410,
};

// ============================================
// BEANIES
// ============================================

export const beaniesPageConfig = {
  hero: {
    badge: 'Winter Essential',
    title: 'Custom Embroidered',
    titleLine2: 'Beanies',
    subtitle: 'All-Inclusive Pricing',
    description: 'Cozy knit beanies with your logo embroidered. Perfect for cold weather branding.',
    priceFrom: 11.95,
    priceUnit: 'beanie',
    priceNote: 'at 100+ qty · Volume discounts available',
    image: '/images/embroidery/hero-beanie.png',
    imageAlt: 'Custom Embroidered Beanie',
    colorCount: 48,
    trustBadges: sharedTrustBadges,
  },
  whatsIncluded: {
    description: 'Transparent pricing with no hidden fees. Everything you need for custom embroidered beanies is included.',
    items: baseBeanieIncludedItems,
    pricingTable: {
      columns: [
        { key: 'qty', label: 'Quantity' },
        { key: 'price', label: 'Price per Beanie', align: 'right' as const },
        { key: 'savings', label: 'You Save', align: 'right' as const },
      ],
      rows: [
        { qty: '50 beanies', price: 13.95, savings: null },
        { qty: '75 beanies', price: 12.95, savings: '7%' },
        { qty: '100 beanies', price: 11.95, savings: '14%' },
        { qty: '250 beanies', price: 10.95, savings: '21%' },
        { qty: '500+ beanies', price: 10.45, savings: '25%', popular: true },
      ] as PricingRow[],
      footnotes: ['Need more than 500? Contact us for custom pricing'],
    },
  },
  benefits: {
    description: 'We make custom embroidery simple, affordable, and stress-free.',
    benefits: sharedBeanieBenefits,
  },
  faq: {
    description: 'Everything you need to know about our custom embroidered beanies.',
    faqs: baseBeaniFAQs,
  },
  stickyMobileCta: {
    priceText: 'From $10.45/beanie',
  },
  productStyleId: 1000261,
};

// Export all configs
export const embroideryPageConfigs = {
  'embroidered-caps': embroideredCapsPageConfig,
  'trucker-caps': truckerCapsPageConfig,
  'snapback-caps': snapbackCapsPageConfig,
  'dad-caps': dadCapsPageConfig,
  'beanies': beaniesPageConfig,
} as const;
