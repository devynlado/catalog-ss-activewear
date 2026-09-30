/**
 * Parse a video URL (Instagram / YouTube / Vimeo) into an embeddable iframe URL.
 * Returns null when the URL is not recognised.
 */
export type VideoProvider = 'instagram' | 'youtube' | 'vimeo';

export interface VideoEmbed {
  provider: VideoProvider;
  embedUrl: string;
}

export function parseVideoUrl(url: string | null | undefined): VideoEmbed | null {
  if (!url) return null;
  const clean = url.trim();

  // --- YouTube ---
  // https://www.youtube.com/watch?v=ID, https://youtu.be/ID, /shorts/ID, /embed/ID
  const yt =
    clean.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (yt?.[1]) {
    return { provider: 'youtube', embedUrl: `https://www.youtube.com/embed/${yt[1]}` };
  }

  // --- Vimeo ---
  // https://vimeo.com/123456789, https://player.vimeo.com/video/123456789
  const vimeo = clean.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo?.[1]) {
    return { provider: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vimeo[1]}` };
  }

  // --- Instagram ---
  // https://www.instagram.com/{p|reel|reels|tv}/{code}/
  const ig = clean.match(/instagram\.com\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  if (ig?.[2]) {
    const kind = ig[1] === 'reels' ? 'reel' : ig[1];
    return {
      provider: 'instagram',
      embedUrl: `https://www.instagram.com/${kind}/${ig[2]}/embed`,
    };
  }

  return null;
}
