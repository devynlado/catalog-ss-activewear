'use client';

import { motion, Variants, HTMLMotionProps } from 'framer-motion';
import { ReactNode, forwardRef } from 'react';

/**
 * Animation variants for staggered children
 */
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const slideInLeftVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const slideInRightVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

interface AnimatedContainerProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  /** Stagger delay between children */
  stagger?: number;
  /** Delay before animation starts */
  delay?: number;
  /** Animation direction */
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
  /** Additional className */
  className?: string;
  /** Render as different element */
  as?: 'div' | 'ul' | 'section' | 'article';
}

/**
 * AnimatedContainer - Container that animates children with stagger effect
 * 
 * @example
 * <AnimatedContainer stagger={0.1}>
 *   <AnimatedItem>Item 1</AnimatedItem>
 *   <AnimatedItem>Item 2</AnimatedItem>
 *   <AnimatedItem>Item 3</AnimatedItem>
 * </AnimatedContainer>
 */
export const AnimatedContainer = forwardRef<HTMLDivElement, AnimatedContainerProps>(({
  children,
  stagger = 0.1,
  delay = 0.2,
  className = '',
  as = 'div',
  ...motionProps
}, ref) => {
  const Component = motion[as] as typeof motion.div;
  
  const variants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  };
  
  return (
    <Component
      ref={ref}
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      {...motionProps}
    >
      {children}
    </Component>
  );
});

AnimatedContainer.displayName = 'AnimatedContainer';

interface AnimatedItemProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  /** Animation direction */
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
  /** Additional className */
  className?: string;
  /** Render as different element */
  as?: 'div' | 'li' | 'article';
}

const directionVariants = {
  up: itemVariants,
  down: {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  },
  left: slideInLeftVariants,
  right: slideInRightVariants,
  scale: scaleInVariants,
};

/**
 * AnimatedItem - Child component for AnimatedContainer with individual animation
 * 
 * @example
 * <AnimatedItem direction="up">
 *   Content here
 * </AnimatedItem>
 */
export const AnimatedItem = forwardRef<HTMLDivElement, AnimatedItemProps>(({
  children,
  direction = 'up',
  className = '',
  as = 'div',
  ...motionProps
}, ref) => {
  const Component = motion[as] as typeof motion.div;
  
  return (
    <Component
      ref={ref}
      className={className}
      variants={directionVariants[direction]}
      {...motionProps}
    >
      {children}
    </Component>
  );
});

AnimatedItem.displayName = 'AnimatedItem';

/**
 * FadeIn - Simple fade-in animation wrapper
 * 
 * @example
 * <FadeIn delay={0.2}>
 *   <h2>Title</h2>
 * </FadeIn>
 */
interface FadeInProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  /** Delay before animation */
  delay?: number;
  /** Duration of animation */
  duration?: number;
  /** Animation direction */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** Additional className */
  className?: string;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  direction = 'up',
  className = '',
  ...motionProps
}: FadeInProps) {
  const offsets = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: -20 },
    right: { x: 20 },
    none: {},
  };
  
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offsets[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
