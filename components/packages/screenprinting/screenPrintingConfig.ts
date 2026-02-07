// Screen Printing Package Configuration

import type { TrustBadge, IncludedItem, PricingRow, Benefit, FAQItem, IconName } from '../shared/types';

// ============================================
// TRUST BADGES
// ============================================

export const screenPrintingTrustBadges: TrustBadge[] = [
  { icon: 'Clock', text: '5-7 Day Production' },
  { icon: 'FileCheck', text: 'Free Digital Proof' },
  { icon: 'Palette', text: 'Mix Colors - Same Price' },
  { icon: 'Truck', text: 'Free Shipping $500+' },
];

// ============================================
// BENEFITS
// ============================================

export const screenPrintingBenefits: Benefit[] = [
  {
    icon: 'DollarSign',
    title: 'Transparent Pricing',
    description: 'No hidden fees, no setup charges, no surprises. The price you see is the price you pay.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: 'ShieldCheck',
    title: 'All-Inclusive',
    description: 'Screen printing, art setup, and proof approval all included. One simple price per shirt.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: 'Eye',
    title: 'See Your Design First',
    description: 'We send you a digital proof for approval before we print your full order.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: 'Clock',
    title: '5-7 Day Production',
    description: 'From approval to shipping in just 5-7 business days. Need it faster? Ask about rush options.',
    color: 'bg-amber-100 text-amber-600',
  },
];

// ============================================
// WHAT'S INCLUDED
// ============================================

export const screenPrintingIncludedItems: IncludedItem[] = [
  {
    icon: 'Scissors',
    title: 'Front Print',
    description: 'Up to 15" x 19" print area on the front',
  },
  {
    icon: 'Droplets',
    title: '2 Print Colors Included',
    description: 'Base price includes up to 2 colors in your design',
  },
  {
    icon: 'Sparkles',
    title: 'Free Art Setup',
    description: 'We prepare your artwork for screen printing - FREE',
  },
  {
    icon: 'FileCheck',
    title: 'Digital Proof',
    description: 'Approve your design before we start production',
  },
  {
    icon: 'Palette',
    title: 'Mix Shirt Colors Free',
    description: 'Combine any shirt colors at no extra charge',
  },
  {
    icon: 'Truck',
    title: 'Free Shipping $500+',
    description: 'Orders over $500 ship free within the US',
  },
];

// ============================================
// FAQ
// ============================================

export const screenPrintingFAQs: FAQItem[] = [
  {
    question: 'What is the minimum order quantity?',
    answer: 'Our minimum order is 50 shirts. You can mix and match shirt colors as long as the total quantity reaches 50 and the design remains the same across all shirts.',
  },
  {
    question: 'Can I mix different shirt colors in my order?',
    answer: 'Yes! You can mix any combination of our 60+ available colors at no extra charge. The same design will be printed on all shirts, but you can customize the color breakdown however you like.',
  },
  {
    question: 'What is included in the price?',
    answer: 'Everything! Our base price includes up to 2 print colors, professional art setup, screen creation, a digital proof for approval, and shipping within the continental US for orders over $500. Colors 3-4 are a small additional charge.',
  },
  {
    question: 'How does the print color count work?',
    answer: 'Print colors refer to the number of ink colors in your design, not shirt colors. Our base price includes up to 2 print colors. If your design has 3 or 4 colors, there\'s a small additional charge per shirt. Need more than 4 colors? Contact us for a custom quote.',
  },
  {
    question: 'How long does production take?',
    answer: 'Standard production is 5-7 business days from when you approve the digital proof. Shipping time is additional based on your location. Need it faster? Contact us about rush options.',
  },
  {
    question: 'What file format do you need for my artwork?',
    answer: 'We accept most common formats including AI, EPS, PDF, PNG, and JPG. For best results, vector files (AI, EPS, PDF) are preferred. Our team will prepare your artwork for screen printing at no extra charge.',
  },
  {
    question: 'What is the maximum print size?',
    answer: 'Our standard print area is up to 15" x 19" for front or back prints. This covers most standard design sizes. If you need a larger print area, please contact us.',
  },
  {
    question: 'Can I print different designs on the front and back?',
    answer: 'Yes! You can have different designs on the front and back. The back print is priced the same as the front (based on color count). Both designs can use up to 4 colors each.',
  },
  {
    question: 'What if I need more than 4 print colors?',
    answer: 'For designs with more than 4 colors, please contact us for a custom quote. We may recommend simulated process printing for complex full-color designs.',
  },
  {
    question: 'Do you match specific brand colors?',
    answer: 'Yes! We include PMS (Pantone) color matching at no extra charge. Just provide your PMS color codes and we\'ll match them precisely.',
  },
];

// ============================================
// PAGE CONFIG
// ============================================

export const printedTeesGildanPageConfig = {
  hero: {
    badge: 'Best Value T-Shirt',
    title: 'Custom Screen Printed',
    titleLine2: 'T-Shirts',
    subtitle: 'All-Inclusive Pricing',
    description: 'Classic Gildan 5000 cotton t-shirts with your design screen printed. Volume pricing, no hidden fees, free digital proof before production.',
    priceFrom: 4.40,
    priceUnit: 'shirt',
    priceNote: 'at 500+ qty with 2-color print · Volume discounts available',
    image: '/images/screen-printing/hero-printed-tee.png',
    imageAlt: 'Custom Screen Printed T-Shirt',
    colorCount: 64,
    trustBadges: screenPrintingTrustBadges,
  },
  whatsIncluded: {
    description: 'Transparent pricing with no hidden fees. Everything you need for custom screen printed t-shirts is included.',
    items: screenPrintingIncludedItems,
    pricingTable: {
      columns: [
        { key: 'qty', label: 'Quantity' },
        { key: 'print', label: 'Print Cost', align: 'right' as const },
        { key: 'blank', label: 'Shirt Cost', align: 'right' as const },
        { key: 'total', label: 'Total/Shirt', align: 'right' as const },
        { key: 'savings', label: 'You Save', align: 'right' as const },
      ],
      rows: [
        { qty: '50 shirts', print: 4.75, blank: 3.25, total: 8.00, savings: null },
        { qty: '75 shirts', print: 3.70, blank: 3.10, total: 6.80, savings: '15%' },
        { qty: '100 shirts', print: 3.00, blank: 2.95, total: 5.95, savings: '26%' },
        { qty: '250 shirts', print: 2.10, blank: 2.75, total: 4.85, savings: '39%' },
        { qty: '500+ shirts', print: 1.80, blank: 2.60, total: 4.40, savings: '45%', popular: true },
      ] as PricingRow[],
      footnotes: [
        'Pricing shown for 2-color prints. Add $0.15-0.50/shirt for 3rd & 4th colors depending on quantity.',
        'Need more than 500? Contact us for custom pricing',
      ],
    },
  },
  benefits: {
    description: 'We make custom screen printing simple, affordable, and stress-free.',
    benefits: screenPrintingBenefits,
  },
  faq: {
    description: 'Everything you need to know about our custom printed t-shirts.',
    faqs: screenPrintingFAQs,
  },
  stickyMobileCta: {
    priceText: 'From $4.40/shirt',
  },
  productStyleId: 1001,
  productSlug: 'g500-gildan-adult-heavy-cotton-53-oz-t-shirt',
};

// ============================================
// TOTE BAG SPECIFIC CONTENT
// ============================================

export const toteBagIncludedItems: IncludedItem[] = [
  {
    icon: 'Scissors',
    title: 'One-Side Print',
    description: 'Full print on one side of your tote bag',
  },
  {
    icon: 'Droplets',
    title: '2 Print Colors Included',
    description: 'Base price includes up to 2 colors in your design',
  },
  {
    icon: 'Sparkles',
    title: 'Free Art Setup',
    description: 'We prepare your artwork for screen printing - FREE',
  },
  {
    icon: 'FileCheck',
    title: 'Digital Proof',
    description: 'Approve your design before we start production',
  },
  {
    icon: 'Palette',
    title: 'Mix Bag Colors Free',
    description: 'Combine any bag colors at no extra charge',
  },
  {
    icon: 'Truck',
    title: 'Free Shipping $500+',
    description: 'Orders over $500 ship free within the US',
  },
];

export const toteBagBenefits: Benefit[] = [
  {
    icon: 'DollarSign',
    title: 'Transparent Pricing',
    description: 'No hidden fees, no setup charges, no surprises. The price you see is the price you pay.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: 'ShieldCheck',
    title: 'All-Inclusive',
    description: 'Screen printing, art setup, and proof approval all included. One simple price per bag.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: 'Eye',
    title: 'See Your Design First',
    description: 'We send you a digital proof for approval before we print your full order.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: 'Clock',
    title: '5-7 Day Production',
    description: 'From approval to shipping in just 5-7 business days. Need it faster? Ask about rush options.',
    color: 'bg-amber-100 text-amber-600',
  },
];

export const toteBagFAQs: FAQItem[] = [
  {
    question: 'What is the minimum order quantity?',
    answer: 'Our minimum order is 50 tote bags. You can mix and match colors as long as the total quantity reaches 50 and the design remains the same across all bags.',
  },
  {
    question: 'Can I mix different bag colors in my order?',
    answer: 'Yes! You can mix any combination of available colors at no extra charge. The same design will be printed on all bags, but you can customize the color breakdown however you like.',
  },
  {
    question: 'What is included in the price?',
    answer: 'Everything! Our base price includes up to 2 print colors, professional art setup, screen creation, a digital proof for approval, and shipping within the continental US for orders over $500. Colors 3-4 are a small additional charge.',
  },
  {
    question: 'How does the print color count work?',
    answer: 'Print colors refer to the number of ink colors in your design, not bag colors. Our base price includes up to 2 print colors. If your design has 3 or 4 colors, there\'s a small additional charge per bag. Need more than 4 colors? Contact us for a custom quote.',
  },
  {
    question: 'How long does production take?',
    answer: 'Standard production is 5-7 business days from when you approve the digital proof. Shipping time is additional based on your location. Need it faster? Contact us about rush options.',
  },
  {
    question: 'What file format do you need for my artwork?',
    answer: 'We accept most common formats including AI, EPS, PDF, PNG, and JPG. For best results, vector files (AI, EPS, PDF) are preferred. Our team will prepare your artwork for screen printing at no extra charge.',
  },
  {
    question: 'What is the maximum print size?',
    answer: 'Our print area depends on the bag size. For the Isabella Tote, we can print up to 10" x 10" on each side.',
  },
  {
    question: 'Can I print on both sides of the bag?',
    answer: 'Yes! You can have prints on both sides. The second side is priced the same as the first (based on color count). Both sides can use up to 4 colors each.',
  },
  {
    question: 'What are these tote bags made of?',
    answer: 'The Isabella Tote (Liberty Bags 8503) is made from 12 oz. cotton canvas - durable, reusable, and eco-friendly. Perfect for events, retail, giveaways, and everyday use.',
  },
  {
    question: 'Do you match specific brand colors?',
    answer: 'Yes! We include PMS (Pantone) color matching at no extra charge. Just provide your PMS color codes and we\'ll match them precisely.',
  },
];

// ============================================
// ISABELLA TOTE PAGE CONFIG
// ============================================

export const printedTotesIsabellaPageConfig = {
  hero: {
    badge: 'Popular Canvas Tote',
    title: 'Custom Screen Printed',
    titleLine2: 'Tote Bags',
    subtitle: 'All-Inclusive Pricing',
    description: 'Premium 12 oz. cotton canvas tote bags with your design screen printed. Perfect for events, retail, and promotional giveaways.',
    priceFrom: 5.95,
    priceUnit: 'bag',
    priceNote: 'at 500+ qty with 2-color print · Volume discounts available',
    image: '/images/packages/tote-bags/hero-tote-bag.png',
    imageAlt: 'Custom Screen Printed Tote Bag - Isabella Canvas Tote',
    colorCount: 12,
    trustBadges: screenPrintingTrustBadges,
  },
  whatsIncluded: {
    description: 'Transparent pricing with no hidden fees. Everything you need for custom screen printed tote bags is included.',
    items: toteBagIncludedItems,
    pricingTable: {
      columns: [
        { key: 'qty', label: 'Quantity' },
        { key: 'print', label: 'Print Cost', align: 'right' as const },
        { key: 'blank', label: 'Bag Cost', align: 'right' as const },
        { key: 'total', label: 'Total/Bag', align: 'right' as const },
        { key: 'savings', label: 'You Save', align: 'right' as const },
      ],
      rows: [
        { qty: '50 bags', print: 3.50, blank: 5.25, total: 8.75, savings: null },
        { qty: '75 bags', print: 2.80, blank: 4.95, total: 7.75, savings: '11%' },
        { qty: '100 bags', print: 2.25, blank: 4.75, total: 7.00, savings: '20%' },
        { qty: '250 bags', print: 1.75, blank: 4.50, total: 6.25, savings: '29%' },
        { qty: '500+ bags', print: 1.45, blank: 4.50, total: 5.95, savings: '32%', popular: true },
      ] as PricingRow[],
      footnotes: [
        'Pricing shown for 2-color prints. Add $0.15-0.50/bag for 3rd & 4th colors depending on quantity.',
        'Need more than 500? Contact us for custom pricing',
      ],
    },
  },
  benefits: {
    description: 'We make custom screen printing simple, affordable, and stress-free.',
    benefits: toteBagBenefits,
  },
  faq: {
    description: 'Everything you need to know about our custom printed tote bags.',
    faqs: toteBagFAQs,
  },
  stickyMobileCta: {
    priceText: 'From $5.95/bag',
  },
  productStyleId: 8503,
  productSlug: 'liberty-bags-8503',
};

// ============================================
// COMFORT COLORS 1717 T-SHIRT CONFIG
// ============================================

export const comfortColorsBenefits: Benefit[] = [
  {
    icon: 'DollarSign',
    title: 'Transparent Pricing',
    description: 'No hidden fees, no setup charges, no surprises. The price you see is the price you pay.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: 'ShieldCheck',
    title: 'All-Inclusive',
    description: 'Screen printing, art setup, and proof approval all included. One simple price per shirt.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: 'Eye',
    title: 'See Your Design First',
    description: 'We send you a digital proof for approval before we print your full order.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: 'Clock',
    title: '5-7 Day Production',
    description: 'From approval to shipping in just 5-7 business days. Need it faster? Ask about rush options.',
    color: 'bg-amber-100 text-amber-600',
  },
];

export const comfortColorsFAQs: FAQItem[] = [
  {
    question: 'What is the minimum order quantity?',
    answer: 'Our minimum order is 50 shirts. You can mix and match shirt colors as long as the total quantity reaches 50 and the design remains the same across all shirts.',
  },
  {
    question: 'What makes Comfort Colors different from regular t-shirts?',
    answer: 'Comfort Colors 1717 is a premium garment-dyed, heavyweight (6.1 oz) 100% ring-spun cotton t-shirt. The garment-dye process gives each shirt a unique vintage, lived-in look and incredibly soft hand feel. It\'s the go-to choice for bands, breweries, boutiques, and anyone wanting that premium vintage aesthetic.',
  },
  {
    question: 'Can I mix different shirt colors in my order?',
    answer: 'Yes! You can mix any combination of our 60+ available colors at no extra charge. The same design will be printed on all shirts, but you can customize the color breakdown however you like.',
  },
  {
    question: 'What is included in the price?',
    answer: 'Everything! Our base price includes up to 2 print colors, professional art setup, screen creation, a digital proof for approval, and shipping within the continental US for orders over $500. Colors 3-4 are a small additional charge.',
  },
  {
    question: 'How does the print color count work?',
    answer: 'Print colors refer to the number of ink colors in your design, not shirt colors. Our base price includes up to 2 print colors. If your design has 3 or 4 colors, there\'s a small additional charge per shirt. Need more than 4 colors? Contact us for a custom quote.',
  },
  {
    question: 'How long does production take?',
    answer: 'Standard production is 5-7 business days from when you approve the digital proof. Shipping time is additional based on your location. Need it faster? Contact us about rush options.',
  },
  {
    question: 'What file format do you need for my artwork?',
    answer: 'We accept most common formats including AI, EPS, PDF, PNG, and JPG. For best results, vector files (AI, EPS, PDF) are preferred. Our team will prepare your artwork for screen printing at no extra charge.',
  },
  {
    question: 'Will the colors vary between shirts?',
    answer: 'Yes, slight color variation is part of the charm of garment-dyed apparel. Each shirt has a unique character due to the dyeing process. This is expected and adds to the vintage aesthetic.',
  },
  {
    question: 'Do you match specific brand colors?',
    answer: 'Yes! We include PMS (Pantone) color matching at no extra charge. Just provide your PMS color codes and we\'ll match them precisely.',
  },
];

export const printedTeesComfortColorsPageConfig = {
  hero: {
    badge: 'Premium Vintage Feel',
    title: 'Custom Printed',
    titleLine2: 'Comfort Colors Tees',
    subtitle: 'All-Inclusive Pricing',
    description: 'Premium garment-dyed heavyweight t-shirts with that vintage, lived-in feel. Perfect for bands, breweries, boutiques, and anyone wanting a premium look.',
    priceFrom: 10.50,
    priceUnit: 'shirt',
    priceNote: 'at 100+ qty with 2-color print · Volume discounts available',
    image: '/images/packages/comfort-colors-1717/comfort-colors-print.png',
    imageAlt: 'Custom Screen Printed Comfort Colors 1717 T-Shirt',
    colorCount: 62,
    trustBadges: screenPrintingTrustBadges,
  },
  whatsIncluded: {
    description: 'Transparent pricing with no hidden fees. Everything you need for custom screen printed Comfort Colors t-shirts is included.',
    items: screenPrintingIncludedItems,
    pricingTable: {
      columns: [
        { key: 'qty', label: 'Quantity' },
        { key: 'print', label: 'Print Cost', align: 'right' as const },
        { key: 'blank', label: 'Shirt Cost', align: 'right' as const },
        { key: 'total', label: 'Total/Shirt', align: 'right' as const },
        { key: 'savings', label: 'You Save', align: 'right' as const },
      ],
      rows: [
        { qty: '50 shirts', print: 4.75, blank: 8.50, total: 13.25, savings: null },
        { qty: '75 shirts', print: 3.70, blank: 7.95, total: 11.65, savings: '12%' },
        { qty: '100 shirts', print: 3.00, blank: 7.50, total: 10.50, savings: '21%' },
        { qty: '250 shirts', print: 2.10, blank: 7.25, total: 9.35, savings: '29%' },
        { qty: '500+ shirts', print: 1.80, blank: 7.15, total: 8.95, savings: '32%', popular: true },
      ] as PricingRow[],
      footnotes: [
        'Pricing shown for 2-color prints. Add $0.15-0.50/shirt for 3rd & 4th colors depending on quantity.',
        'Need more than 500? Contact us for custom pricing',
      ],
    },
  },
  benefits: {
    description: 'We make custom screen printing simple, affordable, and stress-free.',
    benefits: comfortColorsBenefits,
  },
  faq: {
    description: 'Everything you need to know about our custom printed Comfort Colors t-shirts.',
    faqs: comfortColorsFAQs,
  },
  stickyMobileCta: {
    priceText: 'From $10.50/shirt',
  },
  productStyleId: 1717,
  productSlug: 'comfort-colors-1717',
};
