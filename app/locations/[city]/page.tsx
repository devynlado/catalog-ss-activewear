'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Star, 
  ArrowRight,
  Zap,
  Building2,
  Users,
  ShieldCheck,
  Calendar,
  Layers,
  PenTool,
  Monitor,
  Maximize,
  ExternalLink
} from 'lucide-react';

// Calculate business days from today
function addBusinessDays(days: number): Date {
  const date = new Date();
  let added = 0;
  
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  
  return date;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// Location data with expanded audiences
const locations: Record<string, {
  name: string;
  fullName: string;
  tagline: string;
  description: string;
  heroDescription: string;
  targetAudience: { name: string; icon: React.ElementType; description: string }[];
  testimonials: { quote: string; name: string; company?: string }[];
  faq: { question: string; answer: string }[];
  seoKeywords: string[];
}> = {
  'hollywood': {
    name: 'Hollywood',
    fullName: 'Hollywood, CA',
    tagline: "Hollywood's Trusted Source for Custom Apparel & Screen Printing",
    description: 'Serving the entertainment industry with premium custom apparel decoration services.',
    heroDescription: "Your best option for movie productions, TV shows, concert merch, and entertainment industry apparel. We deliver quality you can see and feel — on time, every time.",
    targetAudience: [
      { name: 'Movie & TV Productions', icon: Building2, description: 'Crew shirts, cast gifts, wrap presents' },
      { name: 'Concert Tours', icon: Users, description: 'Tour merch, backstage apparel, VIP gifts' },
      { name: 'Music Labels', icon: Layers, description: 'Artist merchandise, promotional apparel' },
      { name: 'Event Companies', icon: Calendar, description: 'Staff uniforms, branded giveaways' },
    ],
    testimonials: [
      { quote: "Garment Decor handled our entire production run for a major Netflix series. The quality was impeccable and they met our impossible deadline.", name: "Sarah M.", company: "Production Coordinator" },
      { quote: "We've used them for three concert tours now. Consistent quality, fair pricing, and they actually answer the phone.", name: "Mike R.", company: "Tour Manager" },
      { quote: "The best screen printing shop in LA for entertainment. Period.", name: "Jennifer L.", company: "Merchandise Director" },
    ],
    faq: [
      { question: 'How much does custom screen printing cost?', answer: 'Pricing depends on quantity, number of colors, and garment type. For a basic 1-color print on t-shirts, expect $8-15/piece at 50 units. Prices drop significantly at higher quantities—500+ pieces can be $5-8/piece. Request a free quote for exact pricing.' },
      { question: 'What is the minimum order quantity?', answer: 'Our minimum order is 50 pieces, but you can mix sizes and even styles within that minimum. This makes it easy for smaller productions or events to get started.' },
      { question: 'How long does screen printing take?', answer: 'Standard turnaround is 7-10 business days from artwork approval. Need it faster? We offer rush services as quick as 48 hours for an additional fee. Just let us know your deadline.' },
      { question: 'Do you provide artwork and design help?', answer: 'Yes! If you have a logo or concept, our team can help prepare print-ready artwork. We provide digital proofs for approval before any production begins—no surprises.' },
      { question: 'Can I see a sample before ordering?', answer: 'Absolutely. We create a sample (pre-production proof) for your approval before running the full order. You only pay for production after you approve the sample.' },
      { question: 'Do you work with production companies and film sets?', answer: 'Yes! We regularly work with film, TV, and commercial productions throughout LA. We understand tight schedules and offer rush services to meet production deadlines.' },
    ],
    seoKeywords: ['Hollywood screen printing', 'LA custom apparel', 'entertainment merchandise', 'production crew shirts', 'tour merch Los Angeles'],
  },
  'orange-county': {
    name: 'Orange County',
    fullName: 'Orange County, CA',
    tagline: "Orange County's Trusted Source for Custom Apparel, Embroidery, & Screen Printing",
    description: 'Serving OC schools, corporate teams, and surfwear startups with quality custom decoration.',
    heroDescription: "Your best option for school pride, business uniforms, or concert merch, we deliver quality you can see and feel.",
    targetAudience: [
      { name: 'Schools & Teams', icon: Users, description: 'Spirit wear, team uniforms, booster clubs' },
      { name: 'Corporate Teams', icon: Building2, description: 'Company apparel, trade show gear' },
      { name: 'Surfwear Brands', icon: Layers, description: 'Streetwear, coastal lifestyle apparel' },
      { name: 'Local Businesses', icon: MapPin, description: 'Staff uniforms, promotional items' },
    ],
    testimonials: [
      { quote: "Adryan and his team have been amazing throughout the entire process! We had our company shirts screen printed here and they answered all our questions quickly and efficiently.", name: "Melanie Mendoza", company: "" },
      { quote: "Love this team!! They helped my brand with this jumbo screen printing project. 350 t-shirts in less than a week. The fast t-shirt printing service was the best.", name: "Danny Gross", company: "" },
      { quote: "I've been going to Adryan and Devyn's business for upwards of 6+ years. These guys know how to make any custom shirts, hats, sweaters. Their prices are very competitive.", name: "Amir Tadros", company: "" },
    ],
    faq: [
      { question: 'How much does custom screen printing cost?', answer: 'Pricing depends on quantity, colors, and garment type. A basic 1-color t-shirt print runs $8-15/piece at 50 units. Bulk orders of 500+ can drop to $5-8/piece. We offer tiered pricing—the more you order, the cheaper per piece.' },
      { question: 'What is the minimum order quantity?', answer: 'Our minimum is 50 pieces. You can mix sizes and even mix styles within that minimum, which is perfect for schools, teams, or small businesses testing designs.' },
      { question: 'How long does it take to get my order?', answer: 'Standard turnaround is 7-10 business days after artwork approval. Rush orders can be completed in as little as 48 hours. Let us know your event date and we\'ll make it happen.' },
      { question: 'What\'s the difference between screen printing and embroidery?', answer: 'Screen printing is best for t-shirts, hoodies, and large graphics (up to 12 colors). Embroidery is ideal for polos, caps, and professional looks—it\'s stitched thread that lasts longer on work uniforms.' },
      { question: 'Do you do embroidery on hats and polos?', answer: 'Yes! We have 5 Barudan embroidery machines with 30 heads total. We do flat embroidery, 3D puff embroidery, and can embroider on caps, polos, jackets, bags, and more.' },
      { question: 'How do I get started with a quote?', answer: 'Request a quote on our website, call (855) 942-7636, or email info@garmentdecor.com. We typically respond within 2 hours with pricing and recommendations.' },
    ],
    seoKeywords: ['Orange County screen printing', 'OC custom apparel', 'Irvine embroidery', 'surf brand printing', 'school spirit wear OC'],
  },
  'santa-barbara': {
    name: 'Santa Barbara',
    fullName: 'Santa Barbara, CA',
    tagline: "Santa Barbara's Premier Custom Apparel & Decoration Service",
    description: 'Serving UCSB, local wineries, and coastal businesses with premium custom apparel.',
    heroDescription: "Your trusted partner for college apparel, winery merchandise, and coastal business uniforms. Quality decoration for the Central Coast.",
    targetAudience: [
      { name: 'UCSB & Colleges', icon: Users, description: 'Greek life, clubs, campus organizations' },
      { name: 'Wineries & Tasting Rooms', icon: Building2, description: 'Staff uniforms, gift shop merchandise' },
      { name: 'Coastal Brands', icon: Layers, description: 'Beach lifestyle, tourism apparel' },
      { name: 'Restaurants & Hospitality', icon: MapPin, description: 'Staff uniforms, branded merchandise' },
    ],
    testimonials: [
      { quote: "They did all the merchandise for our winery's grand opening. Professional quality and arrived exactly when promised.", name: "Carlos V.", company: "Winery Owner" },
      { quote: "We've used Garment Decor for our Greek Week shirts for three years. Always great quality and they make the process easy.", name: "Amanda K.", company: "UCSB Student" },
      { quote: "Best pricing we found for our restaurant uniforms. The embroidery looks amazing.", name: "David T.", company: "Restaurant Group" },
    ],
    faq: [
      { question: 'How much does custom screen printing cost?', answer: 'Pricing varies by quantity, print colors, and garment. Basic 1-color t-shirt prints start around $8-15/piece at 50 units. Higher quantities (250+) can drop to $5-8/piece. Request a free quote for exact pricing.' },
      { question: 'What is the minimum order?', answer: 'Our minimum is 50 pieces, but you can mix sizes and styles within that minimum. Perfect for winery staff uniforms, Greek organization events, or college club merch.' },
      { question: 'Do you deliver to Santa Barbara?', answer: 'Yes! While our facility is in Montclair (Inland Empire), we ship to Santa Barbara regularly. Most orders arrive within 1-2 days of completion. We also offer delivery for larger orders.' },
      { question: 'How fast can I get my order?', answer: 'Standard turnaround is 7-10 business days. Rush orders can be done in 48-72 hours for events with tight deadlines. Just tell us your event date when requesting a quote.' },
      { question: 'Can you help with design and artwork?', answer: 'Yes! If you have a logo or idea, we can prepare print-ready artwork. We send digital proofs for approval before production—no surprises. Basic artwork setup is included.' },
      { question: 'Do you work with fraternities and sororities?', answer: 'Absolutely! We work with Greek organizations at UCSB and other colleges. We understand rush timelines, chapter requirements, and can handle group orders with mixed sizes.' },
    ],
    seoKeywords: ['Santa Barbara screen printing', 'UCSB custom apparel', 'winery merchandise', 'Central Coast embroidery', 'college apparel Santa Barbara'],
  },
};

// Full decoration services with specs (like homepage)
const decorationServices = [
  {
    id: 'screen-printing',
    title: 'Screen Printing',
    specs: ['Up to 12 colors', 'Max print: 16" x 20"', 'Plastisol, water-based & discharge inks'],
    icon: Layers,
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'embroidery',
    title: 'Embroidery',
    specs: ['Up to 15 colors per design', 'Max size: 14" x 14"', '3D puff & flat embroidery'],
    icon: PenTool,
    color: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'digital-screen-printing',
    title: 'Digital Squeegee',
    specs: ['Unlimited colors', 'Photo-quality prints', 'Soft hand feel finish'],
    icon: Monitor,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'jumbo-screen-printing',
    title: 'Jumbo Prints',
    specs: ['Oversized prints up to 18" x 24"', 'All-over print capable', 'Front, back & sleeve coverage'],
    icon: Maximize,
    color: 'from-green-500 to-teal-500',
  },
];

export default function LocationPage({ params }: { params: { city: string } }) {
  const location = locations[params.city];

  if (!location) {
    notFound();
  }

  const rushDate = addBusinessDays(2);
  const standardDate = addBusinessDays(7);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 py-16 sm:py-24">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90">
              <MapPin className="h-4 w-4" />
              Serving {location.fullName}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {location.tagline}
            </h1>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed">
              {location.heroDescription}
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-brand-600"
              >
                Browse Catalog
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/quote"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur transition-all hover:bg-white/20"
              >
                Request a Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Separator */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      {/* Turnaround Banner */}
      <section className="bg-navy-800 py-8 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
            
            {/* Guarantee Badge */}
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                  Guaranteed
                </p>
                <p className="text-lg font-bold text-white">
                  Expedited Service
                </p>
              </div>
            </div>

            {/* Delivery Options */}
            <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10">
              
              {/* Rush Delivery */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-brand-400">
                  <Zap className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Rush Order</span>
                </div>
                <p className="mt-1 text-xl font-bold text-white">
                  {formatDate(rushDate)}
                </p>
                <a 
                  href="tel:+18559427636" 
                  className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-brand-400 transition-colors"
                >
                  <Phone className="h-3 w-3" />
                  Call for rush
                </a>
              </div>

              {/* Divider */}
              <div className="hidden h-12 w-px bg-white/20 lg:block" />

              {/* Standard Delivery */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Standard</span>
                </div>
                <p className="mt-1 text-xl font-bold text-white">
                  {formatDate(standardDate)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Most orders
                </p>
              </div>

              {/* Divider */}
              <div className="hidden h-12 w-px bg-white/20 lg:block" />

              {/* Custom Deadline */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Have a Deadline?</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-white">
                  We&apos;ll guarantee it
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Tell us your event date
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Trust Stats Bar */}
      <section className="border-b border-stone-200 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
            <div className="text-center">
              <p className="text-3xl font-bold text-navy-800">1M+</p>
              <p className="text-sm text-slate-500">Garments/Year</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <p className="text-3xl font-bold text-navy-800">4.8</p>
                <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
              </div>
              <p className="text-sm text-slate-500">185 Reviews</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-navy-800">50pc</p>
              <p className="text-sm text-slate-500">Minimum Order</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-navy-800">2hr</p>
              <p className="text-sm text-slate-500">Avg Response</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Service - Location Tailored */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Who We Service in {location.name}</h2>
            <p className="mt-3 text-slate-600">Trusted by businesses across Southern California</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {location.targetAudience.map((audience) => (
              <div key={audience.name} className="rounded-xl bg-stone-50 p-6 text-center hover:bg-stone-100 transition-colors">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <audience.icon className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-slate-900">{audience.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{audience.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full Services Grid with Specs */}
      <section className="py-16 sm:py-20 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Our Decoration Services</h2>
            <p className="mt-3 text-slate-600">Professional-grade decoration with industry-leading equipment</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {decorationServices.map((service) => {
              const Icon = service.icon;
              return (
                <Link
                  key={service.id}
                  href={`/services/${service.id}`}
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* Icon Area */}
                  <div className={`relative h-36 bg-gradient-to-br ${service.color}`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon className="h-14 w-14 text-white/80" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-navy-800 group-hover:text-brand-500 transition-colors">
                      {service.title}
                    </h3>
                    
                    {/* Technical Specs */}
                    <ul className="mt-3 space-y-1.5">
                      {service.specs.map((spec, index) => (
                        <li 
                          key={index} 
                          className="flex items-start gap-2 text-sm text-slate-600"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" />
                          {spec}
                        </li>
                      ))}
                    </ul>
                    
                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-500">
                      Learn More
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">How It Works</h2>
            <p className="mt-3 text-slate-600">From quote to delivery in 5 simple steps</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-5">
            {[
              { step: 1, title: 'Pick Your Products', description: 'Choose from 5,000+ blanks' },
              { step: 2, title: 'Choose Decoration', description: 'Screen printing, embroidery, or both' },
              { step: 3, title: 'Submit Quote', description: 'Get response in ~2 hours' },
              { step: 4, title: 'Approve Proof', description: 'Review digital mockup' },
              { step: 5, title: 'Production', description: 'As fast as 48 hours' },
            ].map((item, index, arr) => (
              <div key={item.step} className="text-center relative">
                {/* Connector line */}
                {index < arr.length - 1 && (
                  <div className="hidden sm:block absolute top-6 left-1/2 w-full h-0.5 bg-stone-200" />
                )}
                <div className="relative mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white font-bold z-10">
                  {item.step}
                </div>
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Fixed with white title and Google badge */}
      <section className="py-16 sm:py-20 bg-navy-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">What Our Customers Say</h2>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-white font-semibold">4.8</span>
                <span className="text-slate-400">(185 reviews)</span>
              </div>
              <a 
                href="https://www.google.com/search?q=garment+decor+montclair+reviews" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                View on Google
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {location.testimonials.slice(0, 3).map((testimonial, index) => (
              <div key={index} className="rounded-xl bg-white/10 p-6 backdrop-blur">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-200 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="mt-4">
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  {testimonial.company && (
                    <p className="text-sm text-slate-400">{testimonial.company}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {location.faq.map((item, index) => (
              <details key={index} className="group rounded-xl border border-stone-200 bg-white">
                <summary className="flex cursor-pointer items-center justify-between p-6 font-semibold text-slate-900">
                  {item.question}
                  <span className="ml-4 shrink-0 text-brand-500 group-open:rotate-180 transition-transform">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-slate-600">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-brand-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to Get Started?</h2>
          <p className="mt-4 text-lg text-white/90">
            Get a quote in 2 hours or less. We&apos;ll help bring your vision to life.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quote"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3.5 text-base font-semibold text-brand-600 shadow-lg transition-all hover:bg-stone-50"
            >
              Request a Quote
            </Link>
            <a
              href="tel:+18559427636"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/20 px-6 py-3.5 text-base font-semibold text-white backdrop-blur transition-all hover:bg-white/30"
            >
              <Phone className="h-5 w-5" />
              (855) 942-7636
            </a>
          </div>
          <p className="mt-6 text-sm text-white/80">
            <Clock className="inline h-4 w-4 mr-1" />
            Average quote response: 2 hours
          </p>
        </div>
      </section>
    </div>
  );
}
