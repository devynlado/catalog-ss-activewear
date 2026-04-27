'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Clock, FileCheck, Palette, Truck, DollarSign, Eye, ShieldCheck, Scissors, Sparkles, Droplets, LucideIcon } from 'lucide-react';
import { PackageHeroProps, IconName } from './types';

// Map icon names to actual icon components
const iconMap: Record<IconName, LucideIcon> = {
  Clock,
  FileCheck,
  Palette,
  Truck,
  DollarSign,
  Eye,
  ShieldCheck,
  Scissors,
  Sparkles,
  Droplets,
};

export function PackageHero({
  badge,
  title,
  titleLine2,
  subtitle,
  description,
  priceFrom,
  priceUnit,
  priceNote,
  image,
  imageAlt,
  colorCount,
  trustBadges,
  ctaText = 'Build Your Package',
  secondaryCta = { text: "See What's Included", href: '#whats-included' },
}: PackageHeroProps) {
  const scrollToBuilder = () => {
    const builder = document.getElementById('builder');
    if (builder) {
      builder.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-brand-500/20 text-brand-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              {badge}
            </div>
            
            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              {title}
              {titleLine2 && <span className="block">{titleLine2}</span>}
              {subtitle && (
                <span className="block text-brand-400 text-2xl sm:text-3xl lg:text-4xl mt-2">{subtitle}</span>
              )}
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg text-stone-300 mb-6 max-w-lg">
              {description}
            </p>
            
            {/* Price anchor */}
            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-stone-400 text-lg">From</span>
                <span className="text-4xl sm:text-5xl font-bold text-white">${priceFrom.toFixed(2)}</span>
                <span className="text-stone-400 text-lg">/{priceUnit}</span>
              </div>
              <p className="text-stone-500 text-sm mt-1">{priceNote}</p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={scrollToBuilder}
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-xl hover:from-brand-600 hover:to-brand-700 transition-all text-lg shadow-lg shadow-brand-500/30"
              >
                {ctaText}
              </button>
              <a
                href={secondaryCta.href}
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-lg backdrop-blur-sm border border-white/20"
              >
                {secondaryCta.text}
              </a>
            </div>
            
            {/* Trust badges - mobile */}
            <div className="flex flex-wrap gap-3 lg:hidden">
              {trustBadges.map((trustBadge) => {
                const Icon = iconMap[trustBadge.icon];
                return (
                  <div
                    key={trustBadge.text}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg"
                  >
                    <Icon className="h-4 w-4 text-brand-400" />
                    <span className="text-sm text-white">{trustBadge.text}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
          
          {/* Right: Product Image */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-brand-500/20 rounded-full blur-3xl" />
              
              {/* Main product image */}
              <div className="relative rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm p-8">
                <Image
                  src={image}
                  alt={imageAlt}
                  width={500}
                  height={500}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              
              {/* Floating badges */}
              <div className="absolute -top-2 -right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                {colorCount} Colors
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Trust badges - desktop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="hidden lg:flex justify-center gap-6 mt-12 pt-8 border-t border-white/10"
        >
          {trustBadges.map((trustBadge) => {
            const Icon = iconMap[trustBadge.icon];
            return (
              <div
                key={trustBadge.text}
                className="flex items-center gap-3 text-white"
              >
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-brand-500/20">
                  <Icon className="h-5 w-5 text-brand-400" />
                </div>
                <span className="font-medium">{trustBadge.text}</span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
