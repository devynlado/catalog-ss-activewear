import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowLeft, Check, Clock, Award, Zap, Layers, PenTool, Monitor, Maximize } from 'lucide-react';

// Service data
const services: Record<string, {
  title: string;
  tagline: string;
  description: string;
  benefits: string[];
  process: { step: number; title: string; description: string }[];
  icon: React.ElementType;
  color: string;
  relatedCategories: { id: number; name: string }[];
}> = {
  'screen-printing': {
    title: 'Screen Printing',
    tagline: 'Bold, Vibrant Prints That Last',
    description: 'Screen printing is the gold standard for custom apparel decoration. Using specialized inks pressed through mesh screens, we create vibrant, durable prints that stand up to countless washes. Perfect for t-shirts, hoodies, uniforms, and promotional items.',
    benefits: [
      'Vibrant, long-lasting colors',
      'Cost-effective for bulk orders',
      'Works on most fabrics',
      'Great for bold, graphic designs',
      'Soft hand feel with water-based inks',
      'PMS color matching available',
    ],
    process: [
      { step: 1, title: 'Artwork Review', description: 'We review your design and prepare it for printing, optimizing colors and layout.' },
      { step: 2, title: 'Screen Creation', description: 'Custom screens are created for each color in your design.' },
      { step: 3, title: 'Printing', description: 'Your garments are printed using premium inks for maximum durability.' },
      { step: 4, title: 'Quality Check', description: 'Every piece is inspected before packaging and shipping.' },
    ],
    icon: Layers,
    color: 'from-orange-500 to-red-500',
    relatedCategories: [
      { id: 21, name: 'T-Shirts' },
      { id: 9, name: 'Fleece' },
    ],
  },
  'embroidery': {
    title: 'Embroidery',
    tagline: 'Premium Stitched Logos & Designs',
    description: 'Embroidery adds a touch of class to any garment. Our state-of-the-art machines stitch your logo or design directly into the fabric, creating a professional, high-end look that lasts. Ideal for polos, jackets, caps, and corporate apparel.',
    benefits: [
      'Professional, upscale appearance',
      'Extremely durable',
      'Great for logos and text',
      'Works on many fabric types',
      '3D puff embroidery available',
      'No fading or cracking',
    ],
    process: [
      { step: 1, title: 'Digitization', description: 'Your logo is converted into an embroidery file with precise stitch mapping.' },
      { step: 2, title: 'Thread Selection', description: 'We match thread colors to your brand guidelines.' },
      { step: 3, title: 'Embroidery', description: 'Your garments are embroidered with precision on commercial-grade machines.' },
      { step: 4, title: 'Finishing', description: 'Backing is trimmed and items are steamed for a polished finish.' },
    ],
    icon: PenTool,
    color: 'from-blue-500 to-indigo-500',
    relatedCategories: [
      { id: 52, name: 'Polos' },
      { id: 15, name: 'Outerwear' },
      { id: 11, name: 'Headwear' },
    ],
  },
  'digital-squeegee': {
    title: 'Digital Squeegee',
    tagline: 'Unlimited Colors, Infinite Possibilities',
    description: 'Digital squeegee combines the best of digital printing with traditional screen printing techniques. This hybrid method allows for full-color, photo-quality prints with a soft hand feel. Perfect for complex designs with gradients, photographs, or unlimited colors.',
    benefits: [
      'Unlimited colors at no extra cost',
      'Photographic quality prints',
      'Soft hand feel',
      'No minimum color requirements',
      'Ideal for detailed designs',
      'Quick turnaround',
    ],
    process: [
      { step: 1, title: 'File Prep', description: 'Your high-resolution artwork is prepared for digital printing.' },
      { step: 2, title: 'Color Profiling', description: 'Colors are calibrated for accurate reproduction.' },
      { step: 3, title: 'Printing', description: 'Designs are printed using our hybrid digital-screen process.' },
      { step: 4, title: 'Curing', description: 'Prints are heat-cured for maximum durability and wash resistance.' },
    ],
    icon: Monitor,
    color: 'from-purple-500 to-pink-500',
    relatedCategories: [
      { id: 21, name: 'T-Shirts' },
      { id: 9, name: 'Fleece' },
    ],
  },
  'jumbo-prints': {
    title: 'Jumbo Prints',
    tagline: 'Go Big, Make a Statement',
    description: 'Sometimes bigger is better. Our jumbo print capability allows for oversized designs that span the full width or length of a garment. Create bold, eye-catching apparel with all-over prints, large chest designs, or dramatic back graphics.',
    benefits: [
      'Extra-large print areas',
      'All-over print capability',
      'Bold visual impact',
      'Same durability as standard prints',
      'Great for fashion brands',
      'Unique, standout designs',
    ],
    process: [
      { step: 1, title: 'Design Sizing', description: 'Your artwork is scaled and positioned for maximum visual impact.' },
      { step: 2, title: 'Oversize Screens', description: 'Extra-large screens are created for jumbo-sized prints.' },
      { step: 3, title: 'Printing', description: 'Garments are carefully positioned for precise, large-format printing.' },
      { step: 4, title: 'Inspection', description: 'Each piece is checked for alignment and print quality.' },
    ],
    icon: Maximize,
    color: 'from-green-500 to-teal-500',
    relatedCategories: [
      { id: 21, name: 'T-Shirts' },
      { id: 9, name: 'Fleece' },
    ],
  },
};

interface ServicePageProps {
  params: {
    service: string;
  };
}

export function generateStaticParams() {
  return Object.keys(services).map((service) => ({
    service,
  }));
}

export function generateMetadata({ params }: ServicePageProps) {
  const service = services[params.service];
  if (!service) return { title: 'Service Not Found' };
  
  return {
    title: `${service.title} Services | Garment Decor`,
    description: service.description,
  };
}

export default function ServicePage({ params }: ServicePageProps) {
  const service = services[params.service];
  
  if (!service) {
    notFound();
  }

  const Icon = service.icon;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${service.color} py-24`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Icon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              {service.title}
            </h1>
            <p className="mt-4 text-xl text-white/90">
              {service.tagline}
            </p>
            <p className="mt-6 text-lg text-white/80 leading-relaxed">
              {service.description}
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-base font-semibold text-slate-900 transition-all hover:bg-slate-100"
              >
                Browse Blanks
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="tel:+18559427636"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/50 px-6 py-3.5 text-base font-semibold text-white transition-all hover:border-white hover:bg-white/10"
              >
                Get a Quote
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-navy-800">
                Why Choose {service.title}?
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Get the results you need with our professional {service.title.toLowerCase()} services.
              </p>
              <ul className="mt-8 space-y-4">
                {service.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-slate-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Process Steps */}
            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <h3 className="text-xl font-bold text-navy-800 mb-6">Our Process</h3>
              <div className="space-y-6">
                {service.process.map((step) => (
                  <div key={step.step} className="flex gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-bold">
                      {step.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy-800">{step.title}</h4>
                      <p className="mt-1 text-sm text-slate-600">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Categories */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-navy-800 text-center">
            Popular Products for {service.title}
          </h2>
          <p className="mt-2 text-center text-slate-600">
            These categories work great with {service.title.toLowerCase()}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {service.relatedCategories.map((category) => (
              <Link
                key={category.id}
                href={`/catalog?category=${category.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-6 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-brand-100 hover:text-brand-700"
              >
                {category.name}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Turnaround CTA */}
      <section className="bg-navy-800 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Ready to Get Started?
              </h2>
              <p className="mt-2 text-slate-300">
                Rush orders available — get your decorated apparel in as little as 48 hours.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3 text-base font-semibold text-white transition-all hover:bg-brand-400"
              >
                Shop Blanks
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="tel:+18559427636"
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/30 px-6 py-3 text-base font-semibold text-white transition-all hover:border-white hover:bg-white/10"
              >
                Call (855) 942-7636
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
