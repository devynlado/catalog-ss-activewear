'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SectionWrapperProps {
  children: ReactNode;
  /** Background style */
  background?: 'light' | 'dark' | 'gradient';
  /** Include grain texture overlay */
  grain?: boolean;
  /** Include decorative blur orbs */
  orbs?: boolean;
  /** Orb color theme */
  orbColor?: 'brand' | 'navy' | 'mixed';
  /** Padding size */
  padding?: 'sm' | 'md' | 'lg';
  /** Add soft transition at top (from dark section above) */
  transitionTop?: boolean;
  /** Add soft transition at bottom (to dark section below) */
  transitionBottom?: boolean;
  /** Additional className */
  className?: string;
  /** HTML element to render */
  as?: 'section' | 'div';
}

const backgroundStyles = {
  light: 'bg-gradient-to-b from-white via-stone-50/30 to-white',
  dark: 'bg-gradient-to-br from-navy-800 via-navy-800 to-navy-700',
  gradient: 'bg-gradient-to-b from-stone-50 via-white to-stone-50/50',
};

const paddingStyles = {
  sm: 'py-12 sm:py-16',
  md: 'py-20',
  lg: 'py-24',
};

const grainOpacity = {
  light: 'opacity-[0.015]',
  dark: 'opacity-[0.03]',
  gradient: 'opacity-[0.015]',
};

/**
 * SectionWrapper - Reusable section container with Soft Craft styling
 * 
 * @example
 * <SectionWrapper background="light" grain orbs padding="lg">
 *   <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
 *     Content here
 *   </div>
 * </SectionWrapper>
 */
export function SectionWrapper({
  children,
  background = 'light',
  grain = true,
  orbs = true,
  orbColor = 'mixed',
  padding = 'md',
  transitionTop = false,
  transitionBottom = false,
  className = '',
  as: Component = 'section',
}: SectionWrapperProps) {
  const isDark = background === 'dark';
  
  return (
    <Component className={`relative overflow-hidden ${backgroundStyles[background]} ${paddingStyles[padding]} ${className}`}>
      {/* Soft transition from dark section above */}
      {transitionTop && !isDark && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-navy-800/[0.03] to-transparent" />
      )}
      {transitionTop && isDark && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-stone-50/[0.04] to-transparent" />
      )}
      
      {/* Soft transition to dark section below */}
      {transitionBottom && !isDark && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-navy-800/[0.03] to-transparent" />
      )}
      {transitionBottom && isDark && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-50/[0.03] to-transparent" />
      )}
      
      {/* Grain texture */}
      {grain && (
        <div 
          className={`pointer-events-none absolute inset-0 ${grainOpacity[background]}`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      )}
      
      {/* Decorative orbs */}
      {orbs && orbColor === 'brand' && (
        <>
          <div className="pointer-events-none absolute -left-32 top-20 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl" />
          <div className="pointer-events-none absolute -right-32 bottom-20 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl" />
        </>
      )}
      {orbs && orbColor === 'navy' && (
        <>
          <div className="pointer-events-none absolute -left-32 top-20 h-64 w-64 rounded-full bg-navy-800/5 blur-3xl" />
          <div className="pointer-events-none absolute -right-32 bottom-20 h-64 w-64 rounded-full bg-navy-800/5 blur-3xl" />
        </>
      )}
      {orbs && orbColor === 'mixed' && (
        <>
          <div className="pointer-events-none absolute -left-32 top-20 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl" />
          <div className="pointer-events-none absolute -right-32 bottom-20 h-64 w-64 rounded-full bg-navy-800/5 blur-3xl" />
        </>
      )}
      
      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </Component>
  );
}

/**
 * Animated section header with Soft Craft styling
 */
interface SectionHeaderProps {
  label?: string;
  title: string;
  description?: string;
  centered?: boolean;
  dark?: boolean;
}

export function SectionHeader({
  label,
  title,
  description,
  centered = true,
  dark = false,
}: SectionHeaderProps) {
  return (
    <motion.div 
      className={centered ? 'text-center' : ''}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {label && (
        <p className={`text-sm font-semibold uppercase tracking-wider ${dark ? 'text-brand-400' : 'text-brand-500'}`}>
          {label}
        </p>
      )}
      <h2 className={`mt-2 text-3xl font-bold sm:text-4xl ${dark ? 'text-white' : 'text-navy-800'}`}>
        {title}
      </h2>
      {description && (
        <p className={`mx-auto mt-4 max-w-2xl text-lg ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
          {description}
        </p>
      )}
    </motion.div>
  );
}
