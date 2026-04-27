'use client';

interface SectionDividerProps {
  /** Direction: 'up' fades from transparent at top to color at bottom, 'down' is opposite */
  direction?: 'up' | 'down';
  /** Color of the divider - matches section it transitions to */
  color?: 'white' | 'slate' | 'navy';
  /** Height of the gradient */
  height?: 'sm' | 'md' | 'lg';
  /** Position within parent */
  position?: 'top' | 'bottom';
}

const colorMap = {
  white: 'from-white',
  slate: 'from-slate-50',
  navy: 'from-navy-800',
};

const heightMap = {
  sm: 'h-12',
  md: 'h-20',
  lg: 'h-32',
};

/**
 * Soft gradient divider for smooth section transitions
 * Place inside the section that needs a soft edge
 */
export function SectionDivider({
  direction = 'down',
  color = 'white',
  height = 'md',
  position = 'top',
}: SectionDividerProps) {
  const gradientDirection = direction === 'down' ? 'bg-gradient-to-b' : 'bg-gradient-to-t';
  const positionClass = position === 'top' ? 'top-0' : 'bottom-0';
  
  return (
    <div
      className={`pointer-events-none absolute left-0 right-0 ${positionClass} ${heightMap[height]} ${gradientDirection} ${colorMap[color]} to-transparent`}
      aria-hidden="true"
    />
  );
}
