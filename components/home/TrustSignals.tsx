'use client';

import { motion } from 'framer-motion';
import { Building2, Users, Heart, Star } from 'lucide-react';
import { SalesRepCard } from '@/components/admin/SalesRepCard';

const features = [
  {
    icon: Building2,
    title: 'Factory Direct Pricing',
    description: 'No middlemen, no markups. You work directly with the production team.',
  },
  {
    icon: Users,
    title: 'Dedicated Account Reps',
    description: 'One point of contact who knows your business and your preferences.',
  },
  {
    icon: Heart,
    title: 'Family Values, Enterprise Quality',
    description: 'The personal touch of a small business with the capacity of a large operation.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

export function TrustSignals() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-stone-50/50 to-stone-100 py-24">
      {/* Soft transition to dark FinalCTA below */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-navy-800/[0.04] to-transparent" />
      
      {/* Grain texture */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-brand-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-1/3 h-80 w-80 rounded-full bg-navy-800/5 blur-3xl" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Why Garment Decor
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Built for Businesses Like Yours
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Whether you&apos;re a startup launching your first merch line or an established 
              distributor managing dozens of accounts, we have the expertise and infrastructure 
              to support your growth.
            </p>

            <motion.div 
              className="mt-10 space-y-5"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div 
                    key={index}
                    variants={itemVariants}
                    className="flex items-start gap-4 rounded-xl bg-white/70 backdrop-blur-sm border border-stone-200 p-4 shadow-sm"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Meet Your Future Rep */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 mb-2">
                  <Star className="h-4 w-4 fill-brand-500 text-brand-500" />
                  Meet Your Future Rep
                </div>
                <p className="text-sm text-slate-500">
                  Every client gets a dedicated account manager like this
                </p>
              </div>
              
              {/* Sales Rep Card */}
              <SalesRepCard 
                rep={{
                  id: 'home-rep-preview',
                  full_name: 'Devyn Lado',
                  email: 'enterprise@garmentdecor.com',
                  phone: '(855) 942-7636',
                  avatar_url: '/images/team/devyn-lado.png',
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}
