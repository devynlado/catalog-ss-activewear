'use client';

import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { GalleryItem } from '@/lib/sanity';
import { getDecorationTitles } from '@/sanity/schema/decorationOptions';
import { getBlankTitle } from '@/sanity/schema/blankOptions';
import { parseVideoUrl } from './videoEmbed';

type Props = {
  items: GalleryItem[];
};

/** Rows of metadata, skipping any field that isn't filled in. */
function MetaRows({ item, compact = false }: { item: GalleryItem; compact?: boolean }) {
  const decoration = getDecorationTitles(item.decoration);
  const blank = getBlankTitle(item.blankCategory);
  const rows: { label: string; value: string }[] = [];
  if (decoration) rows.push({ label: 'Decoration', value: decoration });
  if (blank) rows.push({ label: 'Blank', value: blank });
  if (item.client) rows.push({ label: 'Client', value: item.client });
  if (item.turnaround) rows.push({ label: 'Turnaround', value: item.turnaround });
  if (item.quantity) rows.push({ label: 'Quantity', value: item.quantity });

  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      <p className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>{item.title}</p>
      {rows.map((r) => (
        <p key={r.label} className={compact ? 'text-xs leading-snug' : 'text-sm leading-snug'}>
          <span className="opacity-70">{r.label}:</span> {r.value}
        </p>
      ))}
    </div>
  );
}

export function GalleryGrid({ items }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goPrev = useCallback(
    () => setLightboxIndex((i) => (i == null ? i : (i - 1 + items.length) % items.length)),
    [items.length]
  );
  const goNext = useCallback(
    () => setLightboxIndex((i) => (i == null ? i : (i + 1) % items.length)),
    [items.length]
  );

  useEffect(() => {
    if (lightboxIndex == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, closeLightbox, goNext, goPrev]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 p-12 text-center">
        <p className="text-slate-600">No items match your filters. Try clearing them.</p>
      </div>
    );
  }

  const active = lightboxIndex != null ? items[lightboxIndex] : null;
  const activeEmbed = active?.contentType === 'video' ? parseVideoUrl(active.videoUrl) : null;

  // Video lightbox aspect ratio: prefer the uploaded cover's ratio (matches the
  // video orientation), fall back to a sensible per-provider default.
  const videoAspect =
    active?.coverAspect ??
    (activeEmbed?.provider === 'instagram' ? 9 / 16 : 16 / 9);
  const videoPortrait = videoAspect < 1;
  const videoStyle: CSSProperties = videoPortrait
    ? { aspectRatio: String(videoAspect), height: 'min(78vh, 860px)', maxWidth: '92vw' }
    : { aspectRatio: String(videoAspect), width: 'min(92vw, 960px)', maxHeight: '78vh' };

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => {
          const isVideo = item.contentType === 'video';
          const thumb = isVideo ? item.coverImage : item.image;
          const alt = (isVideo ? item.coverImageAlt : item.imageAlt) || item.title;
          return (
            <button
              key={item._id}
              type="button"
              onClick={() => openLightbox(i)}
              className="group relative block aspect-square w-full overflow-hidden rounded-2xl bg-stone-100 ring-1 ring-stone-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label={`View ${item.title}`}
            >
              {thumb ? (
                <Image
                  src={thumb}
                  alt={alt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-stone-400 text-sm">
                  No image
                </div>
              )}

              {/* Play badge for videos */}
              {isVideo && (
                <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-transform group-hover:scale-110">
                  <Play className="h-6 w-6 translate-x-0.5 fill-white" />
                </span>
              )}

              {/* Hover overlay with metadata */}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 text-left text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                <MetaRows item={item} compact />
              </div>
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`${active.title} lightbox`}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-8 w-8" />
          </button>

          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Previous"
              >
                <ChevronLeft className="h-10 w-10" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Next"
              >
                <ChevronRight className="h-10 w-10" />
              </button>
            </>
          )}

          <div
            className="relative flex h-full w-full max-w-6xl flex-col items-center justify-center gap-4 p-4 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {active.contentType === 'photo' ? (
              active.image && (
                <Image
                  src={active.image}
                  alt={active.imageAlt || active.title}
                  width={active.imageWidth ?? 1200}
                  height={active.imageHeight ?? 1200}
                  className="h-auto max-h-[80vh] w-auto max-w-[92vw] rounded-lg object-contain"
                  sizes="92vw"
                  unoptimized
                />
              )
            ) : activeEmbed ? (
              <div
                className="relative overflow-hidden rounded-lg bg-black"
                style={videoStyle}
              >
                <iframe
                  src={activeEmbed.embedUrl}
                  title={active.title}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  scrolling="no"
                />
              </div>
            ) : (
              <a
                href={active.videoUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-white/10 px-6 py-4 text-white hover:bg-white/20"
              >
                Open video in new tab
              </a>
            )}

            {/* Metadata caption */}
            <div className="max-w-2xl text-center text-white">
              <MetaRows item={active} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
