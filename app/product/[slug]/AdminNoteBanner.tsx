import { Fragment } from 'react';
import { AlertCircle } from 'lucide-react';

interface AdminNoteBannerProps {
  note: string | null | undefined;
}

/**
 * Customer-visible note rendered above the fold on the PDP. Plain text only —
 * no HTML interpretation. URLs are auto-linked. Returns null when no note is
 * set so the layout collapses cleanly.
 */
export function AdminNoteBanner({ note }: AdminNoteBannerProps) {
  if (!note) return null;
  const trimmed = note.trim();
  if (!trimmed) return null;

  return (
    <div
      role="note"
      aria-label="Notice from the seller"
      className="mt-4 lg:mt-5 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-sm text-amber-900 shadow-[0_1px_0_rgba(0,0,0,0.02)]"
    >
      <AlertCircle
        className="mt-0.5 h-4 w-4 flex-none text-amber-600"
        aria-hidden="true"
      />
      <p className="whitespace-pre-line break-words leading-relaxed">
        {linkifyText(trimmed)}
      </p>
    </div>
  );
}

/**
 * Splits text by URL boundaries and renders each URL as an anchor. Trailing
 * sentence punctuation (.,;:!?) is kept outside the link so it reads naturally
 * and doesn't break the destination URL.
 */
function linkifyText(text: string): React.ReactNode[] {
  // Capture group ⇒ split() emits the matched URLs as alternating items.
  const URL_RE = /(https?:\/\/[^\s<>"')\]]+)/g;
  return text.split(URL_RE).map((part, i) => {
    if (i % 2 === 0) {
      return <Fragment key={i}>{part}</Fragment>;
    }
    const trailingMatch = part.match(/[.,;:!?]+$/);
    const trailing = trailingMatch?.[0] || '';
    const url = trailing ? part.slice(0, -trailing.length) : part;
    return (
      <Fragment key={i}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="font-medium underline underline-offset-2 hover:text-amber-950"
        >
          {url}
        </a>
        {trailing}
      </Fragment>
    );
  });
}
