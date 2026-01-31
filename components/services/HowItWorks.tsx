'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface HowItWorksProps {
  title: string;
  description: string;
  steps?: { title: string; description: string }[];
  image?: { src: string; alt: string };
  customContent?: React.ReactNode; // Custom content to display instead of image
}

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

export function HowItWorks({ title, description, steps, image, customContent }: HowItWorksProps) {
  return (
    <section className="relative py-16 lg:py-20 bg-stone-50 overflow-hidden">
      {/* Grain texture */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Decorative orb */}
      <div className="pointer-events-none absolute -right-32 top-20 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-navy-800 sm:text-4xl">
              {title}
            </h2>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              {description}
            </p>
            
            {steps && steps.length > 0 && (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="mt-8 space-y-4"
              >
                {steps.map((step, index) => (
                  <motion.div key={index} variants={itemVariants} className="flex gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white text-sm font-bold shadow-md shadow-brand-500/30">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy-800">{step.title}</h4>
                      <p className="text-sm text-slate-600">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
          
          {/* Process Image or Custom Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            {customContent ? (
              customContent
            ) : (
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl shadow-brand-500/10 border border-stone-200">
                {image ? (
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/50 flex items-center justify-center">
                        <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-500">Process image placeholder</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
