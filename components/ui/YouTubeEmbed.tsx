'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

interface YouTubeEmbedProps {
  /** The YouTube video ID (the part after `v=` in the URL). */
  videoId: string;
  /** Text shown over the thumbnail before the video plays. */
  title: string;
  /** Optional custom thumbnail URL. Defaults to the video's maxres thumbnail. */
  thumbnail?: string;
}

/**
 * Lightweight click-to-play YouTube embed ("facade").
 *
 * Shows the video thumbnail with a title overlay + play button. The heavy
 * YouTube iframe is only loaded after the user clicks play, which keeps the
 * page fast. Uses the privacy-friendly youtube-nocookie domain.
 */
export function YouTubeEmbed({ videoId, title, thumbnail }: YouTubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbSrc, setThumbSrc] = useState(
    thumbnail ?? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  );

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-xl ring-1 ring-stone-200">
      {isPlaying ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerated-sensors; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsPlaying(true)}
          aria-label={`Play video: ${title}`}
          className="group absolute inset-0 h-full w-full cursor-pointer"
        >
          {/* Thumbnail */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbSrc}
            alt={title}
            loading="lazy"
            onError={() =>
              setThumbSrc(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)
            }
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Scrim for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40 transition-colors group-hover:from-black/75" />

          {/* Play button + title */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-brand-600 shadow-lg transition-all group-hover:scale-110 group-hover:bg-white sm:h-20 sm:w-20">
              <Play className="ml-1 h-7 w-7 fill-current sm:h-9 sm:w-9" />
            </span>
            <span className="text-2xl font-bold text-white drop-shadow-md sm:text-3xl">
              {title}
            </span>
          </div>
        </button>
      )}
    </div>
  );
}
