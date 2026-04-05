'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { User, MessageCircle, Clock, Phone, CheckCircle } from 'lucide-react';
import { trackPhoneClick } from '@/lib/analytics';

interface LPDedicatedRepProps {
  service: 'screen-printing' | 'embroidery' | 't-shirt-printing' | 'jumbo-screen-printing' | 'digital-screen-printing' | 'puff-screen-printing';
}

const benefits = [
  {
    icon: User,
    title: 'One Point of Contact',
    description: 'Your dedicated rep knows your brand, preferences, and history.',
  },
  {
    icon: MessageCircle,
    title: 'Direct Communication',
    description: 'Call, text, or email your rep directly — no phone trees or tickets.',
  },
  {
    icon: Clock,
    title: '2-Hour Response Time',
    description: 'Get answers fast. We respond to all inquiries within 2 hours.',
  },
  {
    icon: CheckCircle,
    title: 'Proactive Updates',
    description: 'Your rep will keep you informed at every step of production.',
  },
];

export function LPDedicatedRep({ service }: LPDedicatedRepProps) {
  const isEmbroidery = service === 'embroidery';

  return (
    <section className="relative py-16 lg:py-20 bg-gradient-to-b from-stone-50 to-white overflow-hidden">
      {/* Grain texture */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Decorative orbs */}
      <div className={`pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full ${isEmbroidery ? 'bg-indigo-500/5' : 'bg-brand-500/5'} blur-3xl`} />
      <div className="pointer-events-none absolute -right-32 bottom-1/3 h-80 w-80 rounded-full bg-navy-800/5 blur-3xl" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className={`inline-flex items-center gap-2 rounded-full ${isEmbroidery ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-brand-50 text-brand-600 border-brand-100'} backdrop-blur-sm border px-4 py-2 text-sm font-medium mb-4`}>
              <User className="h-4 w-4" />
              Personal Service
            </div>
            
            <h2 className="text-2xl font-bold text-navy-800 sm:text-3xl lg:text-4xl">
              Work 1-on-1 With a <span className={isEmbroidery ? 'text-indigo-600' : 'text-brand-600'}>Dedicated Expert</span>
            </h2>
            
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              No call centers. No ticket systems. When you work with Garment Decor, 
              you get a dedicated account representative who becomes an extension of your team.
            </p>

            {/* Benefits - Glassmorphism cards */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-start gap-3 rounded-xl bg-white/70 backdrop-blur-sm border border-stone-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isEmbroidery ? 'bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600' : 'bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy-800">{benefit.title}</h3>
                      <p className="mt-0.5 text-sm text-slate-600">{benefit.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8"
            >
              <a
                href="tel:+18559427636"
                onClick={() => trackPhoneClick({ source: `lp_${service}_dedicated_rep` })}
                className={`inline-flex items-center gap-2 rounded-xl ${isEmbroidery ? 'bg-indigo-500 shadow-indigo-500/25 hover:bg-indigo-600' : 'bg-brand-500 shadow-brand-500/25 hover:bg-brand-600'} px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5`}
              >
                <Phone className="h-5 w-5" />
                Speak With an Expert Now
              </a>
            </motion.div>
          </motion.div>

          {/* Right - Image with floating card */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl shadow-slate-200/50">
              <Image
                src="/images/factory-tour/team-member-embroidery-station.webp"
                alt="Dedicated account representative at Garment Decor"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/40 via-transparent to-transparent" />
            </div>
            
            {/* Floating testimonial card - Glassmorphism */}
            <motion.div 
              className="absolute -bottom-6 -left-6 max-w-xs rounded-2xl bg-white/95 backdrop-blur-sm px-6 py-4 shadow-xl border border-stone-200"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-4 w-4 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-slate-600 italic">
                &ldquo;Our rep Adryan knows our brand better than we do. He catches mistakes 
                before they happen.&rdquo;
              </p>
              <p className="mt-2 text-sm font-semibold text-navy-800">
                — Chris T., Streetwear Brand
              </p>
            </motion.div>

            {/* Floating stats badge */}
            <motion.div 
              className={`absolute -top-4 -right-4 rounded-2xl ${isEmbroidery ? 'bg-indigo-500' : 'bg-brand-500'} px-5 py-3 shadow-xl text-white`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <p className="text-2xl font-bold">98%</p>
              <p className="text-xs text-white/80">Client Retention</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
