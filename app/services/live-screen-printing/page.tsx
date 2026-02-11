'use client';

import Link from 'next/link';
import { 
  Zap, 
  Users, 
  MapPin, 
  Clock, 
  Plug, 
  Maximize2, 
  Palette,
  Truck,
  Check,
  Calendar,
  Building2,
  PartyPopper,
  GraduationCap,
  Heart,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LiveEventForm,
  ServiceCTA,
} from '@/components/services';

// Event types this service is perfect for
const eventTypes = [
  {
    icon: Building2,
    title: 'Corporate Events',
    description: 'Team retreats, company anniversaries, product launches, and employee appreciation days.',
  },
  {
    icon: Users,
    title: 'Trade Shows & Conferences',
    description: 'Drive booth traffic and give attendees something memorable to take home.',
  },
  {
    icon: PartyPopper,
    title: 'Festivals & Fairs',
    description: 'Community events, music festivals, and public gatherings.',
  },
  {
    icon: GraduationCap,
    title: 'University Events',
    description: 'Orientations, homecoming, alumni weekends, and campus activations.',
  },
  {
    icon: Heart,
    title: 'Nonprofit Fundraisers',
    description: 'Galas, charity runs, awareness campaigns, and volunteer appreciation.',
  },
  {
    icon: Zap,
    title: 'Brand Activations',
    description: 'Pop-up shops, product launches, and marketing campaigns.',
  },
];

// FAQ items
const faqs = [
  {
    question: "How many designs can we have?",
    answer: "Our equipment supports up to 4 different designs per event. Each design can be a single color - perfect for bold logos and graphics. If you need more variety, we can discuss options.",
  },
  {
    question: "What if we need more shirts than you can print?",
    answer: "For high-volume events, we recommend pre-printing some shirts during slower periods (like when attendees are in sessions). We can also bring pre-printed inventory as backup. We will help you plan the right approach.",
  },
  {
    question: "Do you provide the t-shirts or do we?",
    answer: "We provide everything, including quality soft-style blank t-shirts in sizes S-3XL. We use popular, comfortable blanks that people actually want to wear - not stiff, cheap giveaway tees.",
  },
  {
    question: "How long does each shirt take?",
    answer: "At steady pace, we print about 60-75 shirts per hour. The actual speed depends on how much guests want to engage - some like to watch and ask questions, others just want to grab and go.",
  },
  {
    question: "How far in advance should we book?",
    answer: "2-4 weeks is ideal, but we can sometimes accommodate shorter timelines. The sooner you reach out, the more flexibility we have with scheduling.",
  },
  {
    question: "What areas do you serve?",
    answer: "We serve California, Arizona, and Nevada. Our facility is in the LA area, so Southern California events are easiest, but we travel throughout the region.",
  },
  {
    question: "What do we need to provide?",
    answer: "Just a 10x10 to 10x15 ft space and access to one standard electrical outlet (120V). We handle everything else - setup, operation, and breakdown.",
  },
];

// FAQ Accordion component
function FAQItem({ question, answer, isOpen, onClick }: { 
  question: string; 
  answer: string; 
  isOpen: boolean; 
  onClick: () => void;
}) {
  return (
    <div className="border-b border-stone-200 last:border-b-0">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="font-semibold text-navy-800 pr-4">{question}</span>
        <ChevronDown 
          className={`h-5 w-5 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      {isOpen && (
        <div className="pb-5 pr-8">
          <p className="text-slate-600">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function LiveScreenPrintingPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 py-20 lg:py-28">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/90 mb-6">
              <MapPin className="h-4 w-4" />
              Serving California, Arizona & Nevada
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Live Screen Printing for Your Event
            </h1>
            
            <p className="mt-6 text-xl text-white/90 leading-relaxed">
              We bring the screen printing experience to you. Guests watch their shirt get printed, 
              pick it up warm from the dryer, and leave with something they will actually wear. 
              Part show, part giveaway, and 100% memorable.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="#quote-form"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-4 text-base font-semibold text-orange-600 shadow-lg transition-all hover:bg-orange-50 hover:-translate-y-0.5"
              >
                Get a Quote
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="tel:+18559427636"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-4 text-base font-semibold text-white border border-white/20 transition-all hover:bg-white/20"
              >
                Call (855) 942-7636
              </Link>
            </div>

            {/* Quick stats */}
            <div className="mt-12 grid grid-cols-3 gap-8 border-t border-white/20 pt-8">
              <div>
                <div className="text-3xl font-bold text-white">4</div>
                <div className="text-sm text-white/70">Designs per event</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">60-75</div>
                <div className="text-sm text-white/70">Shirts per hour</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">450+</div>
                <div className="text-sm text-white/70">Shirts per day</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-800 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              We make it easy. You focus on your event - we handle the printing.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Tell Us About Your Event',
                description: "Share your event details - date, location, expected attendance, and design ideas. We will put together a custom quote.",
              },
              {
                step: '2',
                title: 'We Handle Everything',
                description: 'We show up with our equipment, trained staff, and quality blank t-shirts. Setup takes about an hour.',
              },
              {
                step: '3',
                title: 'Guests Leave Happy',
                description: 'Attendees pick a design, watch it get printed, and walk away with a warm, custom shirt. Instant conversation starter.',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative bg-stone-50 rounded-2xl p-8"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-navy-800 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 lg:py-20 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-800 sm:text-4xl">
              What's Included
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Full-service means full-service. Here's what you get.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Palette,
                title: 'Screen Printing Equipment',
                description: '4-color press with conveyor dryer. Professional setup that looks good and works fast.',
              },
              {
                icon: Users,
                title: 'Trained Staff',
                description: 'Two experienced printers who know how to work a crowd and keep the line moving.',
              },
              {
                icon: Truck,
                title: 'Quality Blank T-Shirts',
                description: 'Soft-style tees in sizes S-3XL. Comfortable fits people actually want to wear.',
              },
              {
                icon: Clock,
                title: 'Setup & Breakdown',
                description: 'We arrive early, set up, run the event, pack up, and leave no trace.',
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600 mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-navy-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Perfect For */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-800 sm:text-4xl">
              Perfect For
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Live screen printing works great for any event where you want to create a memorable experience.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {eventTypes.map((event, index) => {
              const Icon = event.icon;
              return (
                <div key={index} className="flex items-start gap-4 p-6 bg-stone-50 rounded-xl">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-800 mb-1">{event.title}</h3>
                    <p className="text-sm text-slate-600">{event.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Requirements / Specs */}
      <section className="py-16 lg:py-20 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-800 sm:text-4xl">
              What We Need From You
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Our setup is minimal. Here's what your venue needs to provide.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
                    <Maximize2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-800">Space</h3>
                    <p className="text-slate-600">10x10 ft minimum, 10x15 ft ideal</p>
                    <p className="text-sm text-slate-500 mt-1">Indoor or covered outdoor</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
                    <Plug className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-800">Power</h3>
                    <p className="text-slate-600">One standard 120V outlet</p>
                    <p className="text-sm text-slate-500 mt-1">Just a regular wall outlet</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-800">Lead Time</h3>
                    <p className="text-slate-600">2-4 weeks recommended</p>
                    <p className="text-sm text-slate-500 mt-1">Rush available sometimes</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-800">Service Area</h3>
                    <p className="text-slate-600">California, Arizona, Nevada</p>
                    <p className="text-sm text-slate-500 mt-1">Based in Los Angeles</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-200">
                <h4 className="font-semibold text-navy-800 mb-3">What About Storage?</h4>
                <p className="text-slate-600">
                  You'll want a place to store blank t-shirts and printed inventory nearby. 
                  A storage closet, back room, or even a few tables works fine. 
                  We'll help you figure out the logistics during planning.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Form */}
      <LiveEventForm />

      {/* The Experience */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-navy-800 sm:text-4xl mb-6">
              Why Live Printing Works
            </h2>
            <div className="space-y-6 text-left">
              <div className="flex items-start gap-4">
                <Check className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-700">
                    <span className="font-semibold text-navy-800">It's a show.</span> People 
                    gather around to watch. The machine spins, the squeegee pulls, the shirt 
                    comes out fresh. It naturally draws a crowd.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Check className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-700">
                    <span className="font-semibold text-navy-800">It's shareable.</span> Guests 
                    snap photos and post them. Your brand gets organic reach without you 
                    having to ask for it.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Check className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-700">
                    <span className="font-semibold text-navy-800">It's a real takeaway.</span> Not 
                    a pen or a stress ball - a quality t-shirt they will actually wear. 
                    Your logo stays in rotation for years.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Check className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-700">
                    <span className="font-semibold text-navy-800">It's event-exclusive.</span> Guests 
                    know they can only get this shirt here, right now. That scarcity 
                    makes it more valuable than anything you could mail them.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 lg:py-20 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-800 sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm">
            <div className="divide-y divide-stone-200 px-6">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFAQ === index}
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <ServiceCTA
        title="Ready to Add Live Printing to Your Event?"
        subtitle="Get a custom quote for your event. We'll help you plan the details."
        serviceSlug="live-screen-printing"
      />
    </div>
  );
}
