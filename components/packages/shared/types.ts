// Icon names that can be serialized (strings instead of React components)
export type IconName = 
  | 'Clock' 
  | 'FileCheck' 
  | 'Palette' 
  | 'Truck' 
  | 'DollarSign' 
  | 'Eye' 
  | 'ShieldCheck' 
  | 'Scissors' 
  | 'Sparkles'
  | 'Droplets';

// Trust badge for hero section
export interface TrustBadge {
  icon: IconName;
  text: string;
}

// Hero section props
export interface PackageHeroProps {
  badge: string;
  title: string;
  titleLine2?: string;
  subtitle?: string;
  description: string;
  priceFrom: number;
  priceUnit: string;
  priceNote: string;
  image: string;
  imageAlt: string;
  colorCount: number;
  trustBadges: TrustBadge[];
  ctaText?: string;
  secondaryCta?: {
    text: string;
    href: string;
  };
}

// What's included item
export interface IncludedItem {
  icon: IconName;
  title: string;
  description: string;
}

// Pricing table row
export interface PricingRow {
  qty: string;
  price?: number;
  print?: number;
  blank?: number;
  total?: number;
  savings: string | null;
  popular?: boolean;
}

// Pricing table config
export interface PricingTableConfig {
  columns: {
    key: string;
    label: string;
    align?: 'left' | 'right';
  }[];
  rows: PricingRow[];
  footnotes?: string[];
}

// What's included props
export interface WhatsIncludedProps {
  title?: string;
  description: string;
  items: IncludedItem[];
  pricingTable: PricingTableConfig;
}

// Benefit item
export interface Benefit {
  icon: IconName;
  title: string;
  description: string;
  color: string;
}

// Benefits row props
export interface BenefitsRowProps {
  title?: string;
  description: string;
  benefits: Benefit[];
}

// FAQ item
export interface FAQItem {
  question: string;
  answer: string;
}

// FAQ section props
export interface FAQSectionProps {
  title?: string;
  description: string;
  faqs: FAQItem[];
}

// Sticky mobile CTA props
export interface StickyMobileCTAProps {
  priceText: string;
  subtext?: string;
  ctaText?: string;
}
