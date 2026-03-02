'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES_TO_SHOW = 2;
const GAP_PX = 15;

type Props = {
  images: string[];
  title: string;
};

export function ProjectGallery({ images, title }: Props) {
  const [index, setIndex] = useState(0);
  const [slideStepPx, setSlideStepPx] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayImages = images.length >= 2 ? [...images, ...images] : images;
  const maxIndex = images.length >= 2 ? images.length - 1 : 0;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSlideStepPx((el.offsetWidth - GAP_PX) / SLIDES_TO_SHOW + GAP_PX);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (index >= images.length) setIndex(0);
  }, [index, images.length]);

  const goPrev = () => setIndex((i) => (i <= 0 ? maxIndex : i - 1));
  const goNext = () => setIndex((i) => i + 1);

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);

  useEffect(() => {
    if (lightboxIndex == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, images.length]);

  if (!images.length) return null;

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Gallery</h2>
        {images.length === 1 ? (
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-transparent">
            <button
              type="button"
              className="relative block w-full h-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-inset"
              aria-label="View image"
              onClick={() => openLightbox(0)}
            >
              <Image
                src={images[0]}
                alt={`${title} 1`}
                fill
                className="object-cover"
                unoptimized
                sizes="100vw"
              />
            </button>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="relative w-full max-h-[500px] overflow-hidden rounded-lg bg-transparent"
            style={{ height: 'auto' }}
          >
            <div
              className="flex"
              style={{
                width: `calc(${displayImages.length} * (50% - ${GAP_PX / 2}px) + ${(displayImages.length - 1) * GAP_PX}px)`,
                gap: `${GAP_PX}px`,
                transform: slideStepPx > 0 ? `translateX(-${index * slideStepPx}px)` : `translateX(calc(-${index} * (50% + ${GAP_PX / 2}px)))`,
              }}
            >
              {displayImages.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  className="relative flex-[0_0_auto] min-w-0 aspect-square max-h-[500px] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-inset"
                  style={{ width: `min(calc(50% - ${GAP_PX / 2}px), 500px)` }}
                  onClick={() => openLightbox(i % images.length)}
                  aria-label={`View image ${(i % images.length) + 1}`}
                >
                  <Image
                    src={url}
                    alt={`${title} ${(i % images.length) + 1}`}
                    fill
                    className="object-cover rounded-[12px]"
                    unoptimized
                    sizes="50vw"
                  />
                </button>
              ))}
            </div>
            {/* Bottom: navigation arrows + dots */}
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous slide"
                className="rounded-full p-2 bg-slate-800/80 text-white hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex gap-1.5">
                {Array.from({ length: Math.max(1, images.length - SLIDES_TO_SHOW + 1) }).map((_, i) => {
                  const currentPosition = index >= images.length ? 0 : index;
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Go to slide ${i + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        i === currentPosition ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
                      }`}
                      onClick={() => setIndex(i)}
                    />
                  );
                })}
              </div>
              <button
                type="button"
                onClick={goNext}
                aria-label="Next slide"
                className="rounded-full p-2 bg-slate-800/80 text-white hover:bg-slate-700 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close lightbox"
          >
            <X className="h-8 w-8" />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i - 1 + images.length) % images.length);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-10 w-10" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i + 1) % images.length);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="h-10 w-10" />
              </button>
            </>
          )}
          <div
            className="relative w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIndex]}
              alt={`${title} ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              unoptimized
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </>
  );
}
