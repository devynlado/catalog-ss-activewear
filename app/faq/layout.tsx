import { Metadata } from 'next';
import { FAQJsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'FAQ - Frequently Asked Questions',
  description: 'Get answers to common questions about screen printing, embroidery, pricing, turnaround times, artwork requirements, and ordering from Garment Decor.',
  keywords: ['screen printing FAQ', 'embroidery questions', 'custom apparel FAQ', 'printing turnaround', 'artwork requirements'],
  alternates: {
    canonical: 'https://garmentdecor.com/faq',
  },
  openGraph: {
    title: 'FAQ - Frequently Asked Questions | Garment Decor',
    description: 'Get answers to common questions about screen printing, embroidery, pricing, and ordering.',
    url: 'https://garmentdecor.com/faq',
    siteName: 'Garment Decor',
    type: 'website',
  },
};

// Top FAQs for structured data (plain text versions for SEO)
const topFAQs = [
  {
    question: 'What is your minimum order quantity?',
    answer: 'Our minimum order is 50 pieces per design. This helps us keep pricing competitive while maintaining quality.',
  },
  {
    question: 'What is your standard turnaround time?',
    answer: 'Our standard production turnaround is 10 business days from artwork approval and receipt of blank garments.',
  },
  {
    question: 'Do you offer rush orders?',
    answer: 'Yes! Rush orders are typically completed within 2-4 business days. Rush fees apply based on order complexity and timeline.',
  },
  {
    question: 'What file formats do you accept for artwork?',
    answer: 'We accept vector files (AI, EPS, PDF) for best results. High-resolution PNG or PSD files at 300 DPI also work for most projects.',
  },
  {
    question: 'Do you offer bulk discounts?',
    answer: 'Yes! We offer tiered pricing with price breaks at 75, 100, 150, 250, 500, and 1000 pieces. The more you order, the lower the per-piece cost.',
  },
  {
    question: 'Can you source blank apparel for me?',
    answer: 'Absolutely! We have access to all major blank apparel brands at wholesale pricing. We can recommend the best options for your project.',
  },
  {
    question: 'What decoration methods do you offer?',
    answer: 'We offer screen printing, embroidery, digital/DTG printing, puff printing, simulated process, and retail finishing services.',
  },
  {
    question: 'Do you ship nationwide?',
    answer: 'Yes, we ship throughout the United States via UPS and FedEx. Local pickup is also available at our Montclair, CA facility.',
  },
];

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FAQJsonLd items={topFAQs} />
      {children}
    </>
  );
}
