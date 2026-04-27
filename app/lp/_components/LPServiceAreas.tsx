'use client';

import { MapPin, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

const serviceAreas = [
  { city: 'Los Angeles', areas: 'Downtown, Hollywood, West LA, South LA' },
  { city: 'Orange County', areas: 'Anaheim, Irvine, Santa Ana, Newport' },
  { city: 'Riverside', areas: 'Corona, Moreno Valley, Temecula' },
  { city: 'San Bernardino', areas: 'Ontario, Rancho Cucamonga, Fontana' },
  { city: 'San Diego', areas: 'Downtown, La Jolla, Chula Vista' },
  { city: 'Nationwide', areas: 'Shipping available to all 50 states' },
];

interface LPServiceAreasProps {
  location?: string | null;
}

export function LPServiceAreas({ location }: LPServiceAreasProps = {}) {
  return (
    <section className="py-12 lg:py-16 bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 text-brand-600 font-medium text-sm mb-2">
            <MapPin className="h-4 w-4" />
            Service Areas
          </div>
          <h2 className="text-2xl font-bold text-navy-800 sm:text-3xl">
            {location ? `Serving ${location} & Beyond` : 'Serving Southern California & Beyond'}
          </h2>
          <p className="mt-2 text-slate-600">
            Local pickup available • Free shipping on orders over $500
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serviceAreas.map((area, index) => (
            <motion.div
              key={area.city}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`rounded-xl p-5 ${
                area.city === 'Nationwide' 
                  ? 'bg-navy-800 text-white' 
                  : 'bg-white/70 backdrop-blur-sm border border-stone-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  area.city === 'Nationwide'
                    ? 'bg-white/10'
                    : 'bg-brand-100 text-brand-600'
                }`}>
                  {area.city === 'Nationwide' ? (
                    <Truck className="h-5 w-5" />
                  ) : (
                    <MapPin className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className={`font-semibold ${
                    area.city === 'Nationwide' ? 'text-white' : 'text-navy-800'
                  }`}>
                    {area.city}
                  </h3>
                  <p className={`text-sm ${
                    area.city === 'Nationwide' ? 'text-white/70' : 'text-slate-500'
                  }`}>
                    {area.areas}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
