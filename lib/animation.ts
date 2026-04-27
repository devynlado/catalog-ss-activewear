/**
 * Shared animation utilities for framer-motion
 * Properly typed ease curves and variants
 */

// Standard ease curve (cubic-bezier) - properly typed as tuple
export const EASE_OUT_QUART: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

// Fade up animation variants
export const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: EASE_OUT_QUART,
    },
  },
};

// Fade in animation variants
export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: EASE_OUT_QUART,
    },
  },
};

// Slide in from left variants
export const slideInLeftVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: EASE_OUT_QUART,
    },
  },
};

// Slide in from right variants
export const slideInRightVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: EASE_OUT_QUART,
    },
  },
};

// Container variants with stagger
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Scale up variants
export const scaleUpVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: EASE_OUT_QUART,
    },
  },
};
