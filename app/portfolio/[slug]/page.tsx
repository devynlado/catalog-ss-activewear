import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, 
  Clock, 
  Package, 
  Palette, 
  Star,
  Phone,
  CheckCircle,
  Settings,
  ShoppingBag,
  FileText,
  Truck,
  DollarSign,
  Zap
} from 'lucide-react';

// Portfolio project data with expanded fields
const portfolioProjects: Record<string, {
  title: string;
  slug: string;
  category: string;
  tags: string[];
  product: {
    name: string;
    style?: string;
    categoryLink: string; // Link to browse category
    categoryName: string; // Display name for the category
    material?: string;
    color?: string;
  };
  decoration: string;
  client?: string;
  quantity?: string;
  turnaround?: string;
  description: string;
  highlights: string[];
  equipment: string[];
  pricingHint?: {
    low: number;
    high: number;
    note: string;
  };
  testimonial?: {
    quote: string;
    author: string;
    company?: string;
  };
  images: string[];
  relatedService: string;
  relatedServiceLink: string;
}> = {
  'jumbo-screen-printing-black-wall-street': {
    title: 'Jumbo Screen Printing for LA Apparel 1801GD: Black Wall Street T-Shirts',
    slug: 'jumbo-screen-printing-black-wall-street',
    category: 'Jumbo Screen Printing',
    tags: ['Jumbo', 'Screen Printing', 'T-Shirts'],
    product: {
      name: 'Los Angeles Apparel 1801GD Garment Dye Crew Neck',
      categoryLink: '/catalog/t-shirts',
      categoryName: 'T-Shirts',
      material: '6.5 oz. 100% USA Cotton, Garment Dyed',
      color: 'White',
    },
    decoration: 'Jumbo Screen Printing + Standard Embroidery',
    client: 'New Haven Festivals Inc.',
    quantity: '500 pieces',
    turnaround: '5 business days',
    description: `At Garment Decor, we specialize in creating bold, standout apparel for clients across various industries. Our recent project for New Haven Festivals Inc. perfectly showcases our dual-decoration capabilities, combining jumbo screen printing with embroidery on premium Los Angeles Apparel 1801GD Garment Dye Crew Neck T-Shirts.

This project featured the Black Wall Street Homecoming design, celebrating a cultural event with vibrant, oversized graphics. The front of the shirt displays a clean, embroidered logo, while the back showcases a full jumbo screen print spanning the entire width of the garment.`,
    highlights: [
      'Dual decoration: Jumbo screen printing + embroidery on same garment',
      'Premium LA Apparel 1801GD - 6.5 oz garment-dyed cotton',
      '500 pieces delivered in 5 business days',
      'Full back coverage jumbo print (17" x 23")',
      'Sample before production approval process',
    ],
    equipment: [
      'M&R Challenger 3 16/18 Automatic Press',
      'Vastex EconoRed II Conveyor Dryer',
      'Barudan BEAT-IV Embroidery Machine',
    ],
    pricingHint: {
      low: 12,
      high: 18,
      note: 'Per piece for 500+ qty with jumbo print + embroidery',
    },
    testimonial: {
      quote: "Garment Decor's attention to detail and ability to combine techniques like jumbo printing and embroidery made our vision come to life. We couldn't be happier with the final product!",
      author: 'New Haven Festivals Inc.',
    },
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200',
    ],
    relatedService: 'Jumbo Screen Printing',
    relatedServiceLink: '/services/jumbo-screen-printing',
  },
  'puff-print-hoodies-awful-cloth': {
    title: 'Custom Puff Screen Printed Independent SS4500 Hoodies for Awful Cloth',
    slug: 'puff-print-hoodies-awful-cloth',
    category: 'Puff Screen Printing',
    tags: ['Puff', 'Screen Printing', 'Hoodies'],
    product: {
      name: 'Independent Trading SS4500 Midweight Hooded Pullover',
      categoryLink: '/catalog/sweatshirts',
      categoryName: 'Hoodies & Sweatshirts',
      material: '8.5 oz cotton/polyester blend',
      color: 'Chocolate',
    },
    decoration: 'Puff Screen Printing',
    client: 'Awful Cloth',
    quantity: '750 pieces',
    turnaround: '4 business days',
    description: `At Garment Decor, we recently completed a bulk screen printing project for 750 SS4500 Independent Midweight Hooded Pullover Sweatshirts in a rich chocolate color. These hoodies were brought to life with puff pink ink, which added texture and dimension to the prints on both the front and back.

The puff pink ink creates a raised, textured effect that adds depth to the design, making it stand out against the chocolate-colored fabric.`,
    highlights: [
      'Puff ink creates raised 3D effect on fabric',
      '750 units completed in just 4 business days',
      'Dual location print: front and back',
      'M&R Challenger 3 16/18 automatic press',
      'Sample before production quality control',
    ],
    equipment: [
      'M&R Challenger 3 16/18 Automatic Press',
      'Vastex EconoRed II Conveyor Dryer (390°F cure)',
      'Specialty Puff Ink Application System',
    ],
    pricingHint: {
      low: 18,
      high: 26,
      note: 'Per piece for 500+ qty hoodies with puff print (front + back)',
    },
    testimonial: {
      quote: "The puff pink ink gave our design the perfect textured finish we were looking for. The fast turnaround allowed us to meet our deadline with time to spare.",
      author: 'Awful Cloth Team',
    },
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1200',
    ],
    relatedService: 'Puff Screen Printing',
    relatedServiceLink: '/services/puff-screen-printing',
  },
  'puff-embroidery-hats': {
    title: 'Custom 3D Puff Embroidery on Caps: YP Classics, OTTO, and Flexfit Showcase',
    slug: 'puff-embroidery-hats',
    category: 'Embroidery',
    tags: ['Embroidery', 'Headwear', 'Puff', 'Hats'],
    product: {
      name: 'YP Classics, OTTO CAP 31-069, Flexfit 110 Pro-Formance',
      categoryLink: '/catalog/headwear',
      categoryName: 'Headwear',
      material: 'Various - structured caps',
    },
    decoration: '3D Puff Embroidery',
    description: `Our Puff Embroidery Portfolio showcases the bold, raised effect that 3D puff embroidery can add to any logo, creating a standout look that brings your brand to life. This technique uses foam beneath the embroidery stitches, resulting in a three-dimensional texture that enhances visibility and style.

We recently demonstrated our puff embroidery on three popular cap styles: YP Classics® Lightly Structured 5-Panel Snapback Cap, OTTO CAP 5 Panel Mid Profile Baseball Cap, and Flexfit 110® Pro-Formance® Cap.`,
    highlights: [
      '3D puff embroidery using foam under stitches',
      'Multiple passes for smooth, raised finish',
      '5 Barudan Embroidery machines (30 total heads)',
      '24-hour rush embroidery available',
      'Standard 7-10 day turnaround',
    ],
    equipment: [
      '5x Barudan BEAT-IV Embroidery Machines (30 heads total)',
      'Wilcom Hatch Digitizing Software',
      'Madeira Polyneon Threads',
    ],
    pricingHint: {
      low: 8,
      high: 14,
      note: 'Per piece for 50+ qty caps with 3D puff embroidery',
    },
    testimonial: {
      quote: "Garment Decor's 3D puff embroidery really brought our brand logo to life. The texture and quality are unmatched!",
      author: 'Brand Client',
    },
    images: [
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1200',
    ],
    relatedService: 'Embroidery',
    relatedServiceLink: '/services/embroidery',
  },
  'otto-cap-embroidery-cactus-club': {
    title: 'Custom 3D Puff Embroidered OTTO CAP 31-069 for The Cactus Club',
    slug: 'otto-cap-embroidery-cactus-club',
    category: 'Embroidery',
    tags: ['Embroidery', 'Headwear', 'Snapback'],
    product: {
      name: 'OTTO CAP 31-069 5 Panel Mid Profile Baseball Cap',
      categoryLink: '/catalog/headwear',
      categoryName: 'Headwear',
      material: '65% Polyester / 35% Cotton, Structured',
      color: 'Green/White',
    },
    decoration: 'Puff Embroidery',
    client: 'Saguaro Street',
    quantity: '450 pieces',
    turnaround: '4 business days (rush)',
    description: `We recently completed an exciting project for a client who needed custom embroidered hats with a bold finish. Using the OTTO CAP 31-069 5 Panel Mid Profile Baseball Cap, we delivered 450 hats in just four business days with our rush embroidery service.

These caps featured 3D puff embroidery on the front panel in green thread to match the brim, along with a logo embroidered on the side. We used Madeira Polyneon threads and expert digitizing by Vitor Digitizing.`,
    highlights: [
      '450 hats delivered in 4 business days (rush)',
      'Front panel puff embroidery + side logo',
      'Color-matched thread to cap brim',
      'Madeira Polyneon threads for durability',
      '30 embroidery heads for high capacity',
    ],
    equipment: [
      '5x Barudan BEAT-IV Embroidery Machines',
      'Vitor Digitizing (Professional Digitizing)',
      'Madeira Polyneon Threads',
    ],
    pricingHint: {
      low: 9,
      high: 15,
      note: 'Per piece for 250+ qty caps with puff + side embroidery',
    },
    testimonial: {
      quote: "Garment Decor's 3D puff embroidery was exactly what we needed for our custom caps. The side logo placement and color matching were perfect, and they delivered everything on time—even with a rush order!",
      author: 'Saguaro Street',
    },
    images: [
      'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?q=80&w=1200',
    ],
    relatedService: 'Embroidery',
    relatedServiceLink: '/services/embroidery',
  },
  'born-raised-online-ceramics': {
    title: 'Custom Screen Printed Independent Trading IND420XD Hoodies for Born & Raised x Online Ceramics',
    slug: 'born-raised-online-ceramics',
    category: 'Screen Printing',
    tags: ['Screen Printing', 'Hoodies', 'Collaboration'],
    product: {
      name: 'Independent Trading IND420XD Mainstreet 420gm Heavyweight Pullover Hood',
      categoryLink: '/catalog/sweatshirts',
      categoryName: 'Hoodies & Sweatshirts',
      material: '70% Cotton / 30% Polyester, 12.5 oz heavyweight',
      color: 'Pigment Black',
    },
    decoration: 'Screen Printing',
    client: 'Born & Raised x Online Ceramics',
    quantity: '350 pieces',
    turnaround: '5 business days',
    description: `At Garment Decor, we specialize in high-quality screen printing for clothing brands and creative collaborations. For this project, we screen-printed 350 Independent Trading IND420XD Mainstreet 420gm Heavyweight Pullover Hoodies for the Born & Raised x Online Ceramics collaboration.

The front design featured a striking one-color orange print, while the back design incorporated two colors: orange and white, creating a layered and dynamic look.`,
    highlights: [
      'Premium heavyweight 12.5 oz hoodie blank',
      'Multi-color print: 1 color front, 2 colors back',
      'Vibrant plastisol inks for bold colors',
      'M&R Challenger 3 16/18 automatic press',
      '5 business day turnaround',
    ],
    equipment: [
      'M&R Challenger 3 16/18 Automatic Press',
      'Vastex EconoRed II Conveyor Dryer',
      'Union Ink Plastisol Inks',
    ],
    pricingHint: {
      low: 22,
      high: 32,
      note: 'Per piece for 250+ qty premium hoodies with multi-location print',
    },
    testimonial: {
      quote: "We couldn't be happier with the results! The screen printing was vibrant and flawless, and the quick 5-day turnaround was impressive. Garment Decor ensured everything met our standards for the collaboration.",
      author: 'Born & Raised Team',
    },
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1200',
    ],
    relatedService: 'Screen Printing',
    relatedServiceLink: '/services/screen-printing',
  },
};

// Get all project slugs for related projects
const allProjects = Object.values(portfolioProjects);

// Process timeline steps
const processSteps = [
  { day: '1', title: 'Quote & Approval', description: 'Submit request, receive quote in ~2 hours', icon: FileText },
  { day: '2', title: 'Artwork & Proof', description: 'Digital mockup for your approval', icon: Palette },
  { day: '3-4', title: 'Production', description: 'Your order is decorated in-house', icon: Settings },
  { day: '5+', title: 'QC & Ship', description: 'Quality check and delivery', icon: Truck },
];

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return Object.keys(portfolioProjects).map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = portfolioProjects[slug];
  
  if (!project) {
    return {
      title: 'Project Not Found | Garment Decor Portfolio',
    };
  }

  return {
    title: `${project.title} | Garment Decor Portfolio`,
    description: project.description.substring(0, 160),
    openGraph: {
      title: project.title,
      description: project.description.substring(0, 160),
      type: 'article',
    },
  };
}

export default async function PortfolioProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = portfolioProjects[slug];

  if (!project) {
    notFound();
  }

  // Get related projects (same category, excluding current)
  const relatedProjects = allProjects
    .filter(p => p.slug !== slug)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Full-Width Hero Image */}
      <section className="relative h-[50vh] min-h-[400px] max-h-[600px] bg-navy-900">
        <Image
          src={project.images[0]}
          alt={project.title}
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/50 to-transparent" />
        
        {/* Breadcrumb */}
        <div className="absolute top-0 left-0 right-0">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-white/70 hover:text-white">Home</Link>
              <span className="text-white/50">/</span>
              <Link href="/portfolio" className="text-white/70 hover:text-white">Portfolio</Link>
              <span className="text-white/50">/</span>
              <span className="text-white font-medium truncate">{project.category}</span>
            </nav>
          </div>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {project.tags.map(tag => (
                <span key={tag} className="rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-medium text-white">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl max-w-4xl">
              {project.title}
            </h1>
            {project.client && (
              <p className="mt-3 text-lg text-white/80">Client: {project.client}</p>
            )}
          </div>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
            {project.quantity && (
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-brand-500" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Quantity</p>
                  <p className="font-bold text-slate-900">{project.quantity}</p>
                </div>
              </div>
            )}
            {project.turnaround && (
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-brand-500" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Turnaround</p>
                  <p className="font-bold text-slate-900">{project.turnaround}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Palette className="h-6 w-6 text-brand-500" />
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Decoration</p>
                <p className="font-bold text-slate-900">{project.decoration}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content - Magazine Layout */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Main Content Column */}
            <div className="lg:col-span-2">
              {/* Story */}
              <div className="prose prose-slate prose-lg max-w-none">
                <h2 className="text-2xl font-bold text-slate-900">The Story</h2>
                {project.description.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              {/* Project Highlights */}
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Project Highlights</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {project.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-slate-50">
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-slate-700">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Process Timeline */}
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Production Process</h2>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 hidden sm:block" />
                  
                  <div className="space-y-6">
                    {processSteps.map((step, index) => (
                      <div key={index} className="relative flex gap-4 sm:gap-6">
                        <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white font-bold text-sm">
                          {step.day}
                        </div>
                        <div className="flex-1 pb-6">
                          <h3 className="font-semibold text-slate-900">{step.title}</h3>
                          <p className="mt-1 text-slate-600">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Equipment Used */}
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Equipment Used</h2>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-brand-500" />
                      <span className="font-semibold text-slate-900">Professional-Grade Production</span>
                    </div>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {project.equipment.map((item, index) => (
                      <li key={index} className="px-6 py-4 flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-brand-500" />
                        <span className="text-slate-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Testimonial */}
              {project.testimonial && (
                <blockquote className="mt-12 rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 p-8 text-white">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xl italic text-white/90">
                    &ldquo;{project.testimonial.quote}&rdquo;
                  </p>
                  <footer className="mt-6 text-sm font-medium text-white/80">
                    — {project.testimonial.author}
                    {project.testimonial.company && (
                      <span className="text-white/60">, {project.testimonial.company}</span>
                    )}
                  </footer>
                </blockquote>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Product Card */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-900 px-6 py-4">
                    <h3 className="font-semibold text-white">Product Used</h3>
                  </div>
                  <div className="p-6">
                    <p className="font-semibold text-slate-900">{project.product.name}</p>
                    {project.product.material && (
                      <p className="mt-2 text-sm text-slate-600">{project.product.material}</p>
                    )}
                    {project.product.color && (
                      <p className="mt-1 text-sm text-slate-600">Color: {project.product.color}</p>
                    )}
                    
                    {/* Browse Category Button */}
                    {project.product.categoryLink && (
                      <Link
                        href={project.product.categoryLink}
                        className="mt-4 flex items-center justify-center gap-2 w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        Browse {project.product.categoryName}
                      </Link>
                    )}
                  </div>
                </div>

                {/* Pricing Hint */}
                {project.pricingHint && (
                  <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-900">Pricing Guide</h3>
                    </div>
                    <p className="text-3xl font-bold text-green-700">
                      ${project.pricingHint.low} - ${project.pricingHint.high}
                      <span className="text-base font-normal text-green-600">/piece</span>
                    </p>
                    <p className="mt-2 text-sm text-green-700">{project.pricingHint.note}</p>
                    <p className="mt-3 text-xs text-green-600">
                      *Final price varies based on decoration, quantity, and blank selection
                    </p>
                  </div>
                )}

                {/* CTA Card */}
                <div className="rounded-xl bg-slate-900 p-6 text-white">
                  <h3 className="font-semibold text-lg mb-2 text-white">Start Your Project</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Get a quote for a similar project in under 2 hours.
                  </p>
                  <Link
                    href="/quote"
                    className="flex items-center justify-center gap-2 w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
                  >
                    Request a Quote
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="tel:+18559427636"
                    className="mt-3 flex items-center justify-center gap-2 w-full rounded-lg border border-white/20 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    (855) 942-7636
                  </a>
                </div>

                {/* Related Service */}
                <div className="rounded-xl border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-2">Learn About This Service</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Explore our {project.relatedService.toLowerCase()} capabilities.
                  </p>
                  <Link
                    href={project.relatedServiceLink}
                    className="inline-flex items-center gap-2 text-brand-600 font-medium hover:text-brand-700 text-sm"
                  >
                    View {project.relatedService}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Projects */}
      <section className="py-12 sm:py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">More Projects</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProjects.map(related => (
              <Link
                key={related.slug}
                href={`/portfolio/${related.slug}`}
                className="group rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all"
              >
                <div className="relative aspect-[4/3] bg-slate-100">
                  <Image
                    src={related.images[0]}
                    alt={related.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-5">
                  <p className="text-xs font-medium text-brand-600 mb-1">{related.category}</p>
                  <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-brand-600 transition-colors">
                    {related.title}
                  </h3>
                  {related.pricingHint && (
                    <p className="mt-2 text-sm text-slate-500">
                      From ${related.pricingHint.low}/piece
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 text-brand-600 font-medium hover:text-brand-700"
            >
              View All Projects
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-20 bg-brand-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-6 w-6 text-white" />
            <span className="text-white/90 font-medium">Average quote response: 2 hours</span>
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to Start Your Project?</h2>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
            Whether you need 50 pieces or 50,000, we&apos;ll help bring your vision to life with the same attention to detail.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quote"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 text-base font-semibold text-brand-600 shadow-lg transition-all hover:bg-slate-50"
            >
              Get Your Free Quote
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="tel:+18559427636"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/20 px-8 py-4 text-base font-semibold text-white backdrop-blur transition-all hover:bg-white/30"
            >
              <Phone className="h-5 w-5" />
              (855) 942-7636
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
