'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  /** Card padding size */
  padding?: 'sm' | 'md' | 'lg' | 'none';
  /** Enable hover lift animation */
  hover?: boolean;
  /** Enable click/press animation */
  pressable?: boolean;
  /** Border radius size */
  rounded?: 'lg' | 'xl' | '2xl' | '3xl';
  /** Glass intensity */
  intensity?: 'light' | 'medium' | 'heavy';
  /** Additional className */
  className?: string;
  /** Render as a different element */
  as?: 'div' | 'article' | 'li';
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const roundedStyles = {
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
};

const intensityStyles = {
  light: 'bg-white/60 backdrop-blur-sm border-stone-100',
  medium: 'bg-white/70 backdrop-blur-sm border-stone-200',
  heavy: 'bg-white/80 backdrop-blur-md border-stone-200',
};

/**
 * GlassCard - Glassmorphism card component with Soft Craft styling
 * 
 * @example
 * <GlassCard hover padding="md">
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </GlassCard>
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(({
  children,
  padding = 'md',
  hover = false,
  pressable = false,
  rounded = '2xl',
  intensity = 'medium',
  className = '',
  as = 'div',
  ...motionProps
}, ref) => {
  const Component = motion[as] as typeof motion.div;
  
  return (
    <Component
      ref={ref}
      className={cn(
        roundedStyles[rounded],
        intensityStyles[intensity],
        paddingStyles[padding],
        'border shadow-sm transition-shadow',
        hover && 'hover:shadow-xl hover:shadow-brand-500/5',
        className
      )}
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      whileTap={pressable ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      {...motionProps}
    >
      {children}
    </Component>
  );
});

GlassCard.displayName = 'GlassCard';

/**
 * GlassCardLink - Glassmorphism card as a clickable link
 */
interface GlassCardLinkProps extends GlassCardProps {
  href: string;
}

export function GlassCardLink({
  href,
  children,
  className = '',
  ...props
}: GlassCardLinkProps) {
  return (
    <a href={href} className="block">
      <GlassCard 
        hover 
        pressable 
        className={cn('cursor-pointer', className)} 
        {...props}
      >
        {children}
      </GlassCard>
    </a>
  );
}

/**
 * IconCircle - Soft Craft styled icon container
 */
interface IconCircleProps {
  children: ReactNode;
  /** Color theme */
  color?: 'brand' | 'navy' | 'light' | 'custom';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className for custom colors */
  className?: string;
}

const iconSizes = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-14 w-14',
};

const iconColorStyles = {
  brand: 'bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/30 text-white',
  navy: 'bg-gradient-to-br from-navy-800 to-navy-700 shadow-lg shadow-navy-800/20 text-white',
  light: 'bg-white/5 backdrop-blur-sm border border-white/10 text-brand-400',
  custom: '',
};

export function IconCircle({
  children,
  color = 'brand',
  size = 'md',
  className = '',
}: IconCircleProps) {
  return (
    <div className={cn(
      'flex items-center justify-center rounded-2xl',
      iconSizes[size],
      iconColorStyles[color],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * FloatingBadge - Soft Craft floating badge component
 */
interface FloatingBadgeProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  /** Icon background color */
  iconColor?: 'brand' | 'navy';
}

export function FloatingBadge({
  icon,
  title,
  subtitle,
  iconColor = 'brand',
}: FloatingBadgeProps) {
  return (
    <div className="rounded-2xl bg-white/95 backdrop-blur-sm p-4 shadow-xl border border-stone-200">
      <div className="flex items-center gap-3">
        <IconCircle color={iconColor} size="md">
          {icon}
        </IconCircle>
        <div>
          <p className="font-semibold text-navy-800">{title}</p>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
