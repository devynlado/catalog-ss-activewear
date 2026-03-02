'use client';

import Image from 'next/image';
import { useState } from 'react';

type Props = {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
};

/**
 * Renders project card image with fallback to "No image" on load error,
 * so we never show a broken image placeholder.
 */
export function PortfolioCardImage({ src, alt, fill = true, className, sizes }: Props) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-stone-200 text-stone-500 text-sm">
        No image
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      onError={() => setError(true)}
      unoptimized
    />
  );
}
