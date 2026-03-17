'use client';

import { useState } from 'react';
import { Package, Users, Clock, Truck, DollarSign, Shield, HeadphonesIcon, Boxes, MapPin, Tag, Check, ArrowRight, Building2, Mail, Phone, MessageSquare, Star } from 'lucide-react';
import {
  ServiceHero,
  BenefitsBadges,
  HowItWorks,
  WhyChooseSection,
  ServiceCTA,
  ServiceFAQ,
} from '@/components/services';
import type { ServiceFaqItem } from '@/components/services';
import { SalesRepCard } from '@/components/admin/SalesRepCard';
import { trackGenerateLead } from '@/lib/analytics';

const whyChooseReasons = [
  {
    icon: DollarSign,
    title: 'Volume Discounts',
    description: 'Tiered pricing that rewards larger orders. The more you order, the more you save per piece.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Dedicated Account Rep',
    description: 'One point of contact who knows your brand and handles everything from quote to delivery.',
  },
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    description: 'Coordinate production around your launch dates, events, or inventory needs.',
  },
  {
    icon: MapPin,
    title: 'Multi-Location Shipping',
    description: 'Ship to multiple addresses, stores, or distribution centers in a single order.',
  },
  {
    icon: Tag,
    title: 'Custom Packaging',
    description: 'Retail-ready finishing including custom tags, poly bags, and branded packaging.',
  },
  {
    icon: Shield,
    title: 'Quality Assurance',
    description: 'Dedicated QC process for large runs. Every piece is inspected before shipping.',
  },
];

const orderTiers = [
  {
    range: '500 - 1,000',
    label: 'Mid-Size',
    benefits: ['Volume pricing', 'Dedicated rep', 'Priority scheduling'],
    color: 'bg-brand-500',
  },
  {
    range: '1,000 - 5,000',
    label: 'Large',
    benefits: ['Additional discounts', 'Multi-ship options', 'Custom timelines'],
    color: 'bg-navy-800',
    popular: true,
  },
  {
    range: '5,000+',
    label: 'Enterprise',
    benefits: ['Best pricing', 'Program management', 'Inventory solutions'],
    color: 'bg-emerald-600',
  },
];

const largeOrdersFaqItems: ServiceFaqItem[] = [
  {
    q: 'Do you offer bulk discounts?',
    a: 'Yes! We offer tiered pricing, meaning the more you order, the cheaper it gets. Our minimum is 50 pieces and we offer price breaks at 75, 100, 150, 250, 500, and 1000.',
  },
  {
    q: 'How do you package your orders?',
    a: 'All orders will be bulk packaged which is generally folded by the dozen for shirts and half dozens for fleece, unless the order includes retail finish. Based on the garment variation and other factors, we might deviate from our typical packaging procedures if we find it professionally reasonable to do so.',
  },
  {
    q: 'What is your policy on decorating expensive garments?',
    a: 'Due to the wholesale nature of bulk production and cost effective pricing, we reserve the right to refuse accepting customer supplied products should the ratio of blank product cost significantly outweigh the production charges associated with decorating such an expensive garment. We only provide insurance for items when we supply the products ourselves. If you are supplying your own products, the responsibility for damaged goods will fall to the customer.',
  },
  {
    q: 'What is your standard turnaround time?',
    a: 'Our standard production turnaround time is 10 business days from the date of final artwork approval and receipt of all blank garments.\n\nTurnaround may vary depending on:\n\n• Current production volume\n• Order size and complexity\n• Decoration method (screen printing, embroidery, DTF, etc.)\n• Add-on services (relabeling, folding, bagging, etc.)\n• Shipping or delivery requirements',
  },
  {
    q: "I'm not sure which blank to choose. Can I request samples?",
    a: "Absolutely. If you're undecided on which garment to use, we strongly recommend ordering blank samples before proceeding with a full production run. This helps ensure you're confident in your selection.",
  },
  {
    q: 'What is the cost of blank samples?',
    a: 'Blank samples are billable items and are priced based on the specific garment selected. Shipping costs also apply and will vary depending on your location and order size.',
  },
  {
    q: 'What happens if I receive an item in my order that is spoiled?',
    a: "While we maintain strict quality control, our process involves human labor and there is a small chance—typically less than 1%—that a misprint or defect could make it through to your final shipment. If you receive a spoiled item in your order, please notify us promptly. We'll review the issue against the approved artwork or sample and determine an appropriate resolution, which may include a refund or credit.",
  },
  {
    q: 'Do you offer exact quantity fulfillment?',
    a: 'Garment Decor can fulfill exact quantity orders, but only when this requirement is clearly communicated and confirmed prior to order approval.',
  },
  {
    q: "What are the chances my order won't be 100% complete?",
    a: 'While we strive for accuracy, Garment Decor reserves the right to decline exact quantity guarantees on orders with high complexity—such as multiple print locations or high-value garments. These projects carry a higher risk of spoilage and may not be eligible for exact count fulfillment.',
  },
  {
    q: 'Why does exact quantity come with an additional charge?',
    a: 'Fulfilling an exact quantity requires us to order extra blanks, pre-schedule production, and implement additional measures to guarantee this. Because of these added steps and labor, an exact quantity order may incur an additional fee depending on the scope of the project.',
  },
  {
    q: 'What happens if your team counts a different quantity than what I shipped?',
    a: 'If our count differs from the quantity you stated, Garment Decor is not liable for the discrepancy. We will proceed based on the count we verify during our check-in process and recommend confirming your shipment carefully before sending.',
  },
];

export default function LargeOrdersPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    quantity: '',
    services: [] as string[],
    timeline: '',
    details: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // TODO: Integrate with your form submission endpoint
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Track lead generation in GA4
    trackGenerateLead({
      source: 'large_order_form',
      value: formData.quantity ? parseInt(formData.quantity.replace(/[^0-9]/g, ''), 10) : undefined,
    });
    
    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <ServiceHero
        title="Large & Enterprise Orders"
        tagline="Dedicated Support for Orders 500+ Pieces"
        description="When your order requires more than our standard process can offer, our enterprise team steps in. Get volume pricing, a dedicated account rep, custom timelines, and white-glove service from quote to delivery."
        icon={Package}
        gradient="from-navy-800 to-navy-700"
        minimumOrder={500}
      />

      {/* Benefits Badges */}
      <BenefitsBadges />

      {/* Order Tiers Section */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-800 sm:text-4xl">
              Volume Tiers & Benefits
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              The larger your order, the more benefits you unlock. All tiers include dedicated support and quality guarantees.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {orderTiers.map((tier, index) => (
              <div
                key={index}
                className={`relative rounded-2xl bg-white border-2 p-6 transition-all ${
                  tier.popular 
                    ? 'border-brand-500 shadow-lg shadow-brand-500/10' 
                    : 'border-stone-200 hover:border-stone-300 hover:shadow-md'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-6 bg-brand-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Common
                  </div>
                )}
                
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${tier.color} text-white mb-4`}>
                  <Boxes className="h-6 w-6" />
                </div>
                
                <p className="text-sm font-medium text-slate-500 mb-1">{tier.label}</p>
                <h3 className="text-2xl font-bold text-navy-800 mb-4">
                  {tier.range} <span className="text-base font-normal text-slate-500">pieces</span>
                </h3>
                
                <ul className="space-y-3">
                  {tier.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center gap-2 text-sm text-slate-700">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks
        title="How Large Orders Work"
        description="Our enterprise process is designed to handle complex orders with multiple SKUs, locations, and timelines. Here's what to expect when you work with us on a large order."
        steps={[
          { title: 'Contact Us', description: 'Fill out the form below or call us directly. Tell us about your project, quantities, and timeline.' },
          { title: 'Custom Quote', description: 'Your dedicated rep creates a detailed quote within 24 hours, including volume pricing and options.' },
          { title: 'Artwork & Approval', description: 'We work with your team on artwork, create digital proofs, and get your sign-off before production.' },
          { title: 'Production', description: 'Your order is scheduled with priority production and regular status updates throughout.' },
          { title: 'Quality Check & Ship', description: 'Every piece is inspected. We ship to one location or coordinate multi-location delivery.' },
        ]}
        customContent={
          <div className="space-y-4">
            {/* Meet Your Rep Header */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 mb-2">
                <Star className="h-4 w-4 fill-brand-500 text-brand-500" />
                Meet Your Future Rep
              </div>
              <p className="text-sm text-slate-500">
                Every enterprise client gets a dedicated account manager like this
              </p>
            </div>
            
            {/* Sales Rep Card */}
            <SalesRepCard 
              rep={{
                id: 'enterprise-rep-preview',
                full_name: 'Devyn Lado',
                email: 'enterprise@garmentdecor.com',
                phone: '(855) 942-7636',
                avatar_url: null, // Will show initials
                calendly_url: 'https://calendly.com/garmentdecor',
                title: 'Enterprise Account Manager',
                years_experience: 7,
                specialties: ['Coordinating', 'Large Orders', 'Corporate'],
                response_time: '< 2 hours',
              }}
              showEnhanced={true}
              showActions={false}
            />
            
            {/* Reassurance Note */}
            <p className="text-xs text-center text-slate-400 italic">
              Your assigned rep will reach out within 24 hours of your inquiry
            </p>
          </div>
        }
      />

      {/* Why Choose */}
      <WhyChooseSection
        title="Why Work With Us on Large Orders?"
        subtitle="Enterprise-level service without enterprise-level hassle"
        reasons={whyChooseReasons}
      />

      {/* FAQ */}
      <ServiceFAQ
        title="Large Orders FAQ"
        subtitle="Common questions about our large and enterprise order services"
        items={largeOrdersFaqItems}
      />

      {/* Contact Form Section */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            {/* Left: Form Info */}
            <div>
              <h2 className="text-3xl font-bold text-navy-800 sm:text-4xl">
                Let&apos;s Talk About Your Order
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Tell us about your project and a dedicated account rep will be in touch within 24 hours with a custom quote.
              </p>
              
              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 flex-shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-navy-800">Fast Response</h4>
                    <p className="text-sm text-slate-600">Custom quotes delivered within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 flex-shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-navy-800">Dedicated Rep</h4>
                    <p className="text-sm text-slate-600">One point of contact for your entire order</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 flex-shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-navy-800">Prefer to Call?</h4>
                    <p className="text-sm text-slate-600">
                      <a href="tel:+18559427636" className="text-brand-600 font-medium hover:text-brand-700">
                        (855) 942-7636
                      </a>
                      {' '}— We&apos;re available Mon-Fri, 8am-5pm PT
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="rounded-2xl bg-stone-50 border border-stone-200 p-6 sm:p-8">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-navy-800 mb-2">Request Received!</h3>
                  <p className="text-slate-600">
                    A dedicated account rep will be in touch within 24 hours with your custom quote.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-navy-800 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-navy-800 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
                        placeholder="Acme Corp"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-navy-800 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
                        placeholder="john@company.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-navy-800 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-navy-800 mb-1">
                        Estimated Quantity *
                      </label>
                      <select
                        id="quantity"
                        required
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
                      >
                        <option value="">Select quantity</option>
                        <option value="500-1000">500 - 1,000 pieces</option>
                        <option value="1000-2500">1,000 - 2,500 pieces</option>
                        <option value="2500-5000">2,500 - 5,000 pieces</option>
                        <option value="5000+">5,000+ pieces</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="timeline" className="block text-sm font-medium text-navy-800 mb-1">
                        Timeline
                      </label>
                      <select
                        id="timeline"
                        value={formData.timeline}
                        onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
                      >
                        <option value="">Select timeline</option>
                        <option value="flexible">Flexible / No rush</option>
                        <option value="2-4-weeks">2-4 weeks</option>
                        <option value="1-2-weeks">1-2 weeks (Rush)</option>
                        <option value="asap">ASAP</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy-800 mb-2">
                      Services Needed
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Screen Printing', 'Embroidery', 'Retail Finishing', 'Multi-Location Shipping'].map((service) => (
                        <button
                          key={service}
                          type="button"
                          onClick={() => handleServiceToggle(service)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                            formData.services.includes(service)
                              ? 'bg-brand-500 text-white'
                              : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                          }`}
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="details" className="block text-sm font-medium text-navy-800 mb-1">
                      Project Details
                    </label>
                    <textarea
                      id="details"
                      rows={4}
                      value={formData.details}
                      onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-navy-800 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors resize-none"
                      placeholder="Tell us about your project — products, designs, special requirements, delivery locations, etc."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    {isSubmitting ? 'Submitting...' : 'Request Custom Quote'}
                    {!isSubmitting && <ArrowRight className="h-5 w-5" />}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <ServiceCTA
        title="Ready to Discuss Your Large Order?"
        subtitle="Our enterprise team is standing by to help with orders of 500+ pieces."
      />
    </div>
  );
}
