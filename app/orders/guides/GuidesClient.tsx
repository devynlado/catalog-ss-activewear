'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  Layers,
  PenTool,
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type GuideId = 'screen-printing' | 'embroidery';
type SendState = 'idle' | 'sending' | 'sent' | 'error';

interface GuidesClientProps {
  email: string;
}

interface GuideConfig {
  id: GuideId;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  accent: {
    icon: typeof Layers;
    iconBg: string;
    iconColor: string;
    cardBorder: string;
    buttonBg: string;
    buttonHover: string;
    chip: string;
  };
}

const GUIDES: GuideConfig[] = [
  {
    id: 'screen-printing',
    title: 'Screen Printing Prep Guide',
    subtitle: 'For 1–8 color jobs',
    description:
      "Everything we wish every customer knew before sending us artwork — file formats, color separation, halftones, ink choices, and what bumps up your unit price.",
    bullets: [
      'Vector vs raster file checklist',
      'Color matching with Pantone',
      'Ink types — plastisol vs water-based',
      'How design size affects pricing',
    ],
    accent: {
      icon: Layers,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      cardBorder: 'border-blue-100',
      buttonBg: 'bg-blue-600',
      buttonHover: 'hover:bg-blue-700',
      chip: 'bg-blue-50 text-blue-700 ring-blue-100',
    },
  },
  {
    id: 'embroidery',
    title: 'Embroidery Prep Guide',
    subtitle: 'For stitched logos and patches',
    description:
      'What separates a logo that embroiders cleanly from one that turns into a stitched mess. Stitch counts, thread colors, fabric compatibility, and digitizing tips.',
    bullets: [
      'Stitch count estimation',
      'Thread color matching',
      'Fabric vs design compatibility',
      'When to use 3D puff or applique',
    ],
    accent: {
      icon: PenTool,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      cardBorder: 'border-purple-100',
      buttonBg: 'bg-purple-600',
      buttonHover: 'hover:bg-purple-700',
      chip: 'bg-purple-50 text-purple-700 ring-purple-100',
    },
  },
];

const STORAGE_PREFIX = 'orders.guideSent';

export function GuidesClient({ email }: GuidesClientProps) {
  const [state, setState] = useState<Record<GuideId, SendState>>({
    'screen-printing': 'idle',
    embroidery: 'idle',
  });
  const [errors, setErrors] = useState<Partial<Record<GuideId, string>>>({});

  // Re-hydrate "already sent" pill from localStorage so users who left and
  // came back see the right state. Keyed by (email × guide) to support
  // device-sharing scenarios.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const next: Record<GuideId, SendState> = {
      'screen-printing': 'idle',
      embroidery: 'idle',
    };
    for (const guide of GUIDES) {
      const key = `${STORAGE_PREFIX}:${email.toLowerCase()}:${guide.id}`;
      if (window.localStorage.getItem(key)) next[guide.id] = 'sent';
    }
    setState(next);
  }, [email]);

  const handleSend = async (id: GuideId) => {
    setState((s) => ({ ...s, [id]: 'sending' }));
    setErrors((e) => ({ ...e, [id]: undefined }));

    try {
      const res = await fetch('/api/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, guide: id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Could not send the guide. Try again in a minute.');
      }

      setState((s) => ({ ...s, [id]: 'sent' }));
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          `${STORAGE_PREFIX}:${email.toLowerCase()}:${id}`,
          new Date().toISOString()
        );
      }
    } catch (err) {
      setState((s) => ({ ...s, [id]: 'error' }));
      setErrors((e) => ({
        ...e,
        [id]: err instanceof Error ? err.message : 'Something went wrong.',
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-navy-800 sm:text-xl">Free Guides</h1>
            <p className="mt-1 text-sm text-slate-500">
              Two short PDFs we&apos;ve written for customers. Click a guide and we&apos;ll email it
              to{' '}
              <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                <Mail className="h-3 w-3" />
                {email}
              </span>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Two guide cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {GUIDES.map((guide) => {
          const Icon = guide.accent.icon;
          const status = state[guide.id];
          const isSent = status === 'sent';
          const isSending = status === 'sending';
          const hasError = status === 'error';

          return (
            <div
              key={guide.id}
              className={cn(
                'flex flex-col rounded-2xl border bg-white p-5 shadow-sm sm:p-6',
                guide.accent.cardBorder
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                    guide.accent.iconBg
                  )}
                >
                  <Icon className={cn('h-6 w-6', guide.accent.iconColor)} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-navy-800">{guide.title}</h2>
                  <span
                    className={cn(
                      'mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
                      guide.accent.chip
                    )}
                  >
                    {guide.subtitle}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-600">{guide.description}</p>

              <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                {guide.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span className={cn('mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full', guide.accent.iconColor.replace('text-', 'bg-'))} />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex-1" />

              {hasError && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{errors[guide.id] || 'Something went wrong.'}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleSend(guide.id)}
                disabled={isSending}
                className={cn(
                  'inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors',
                  isSent
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : `${guide.accent.buttonBg} ${guide.accent.buttonHover}`,
                  'disabled:cursor-not-allowed disabled:opacity-70'
                )}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : isSent ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Sent — check your inbox
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Email me this guide
                  </>
                )}
              </button>

              {isSent && (
                <button
                  type="button"
                  onClick={() => handleSend(guide.id)}
                  className="mt-2 text-center text-xs text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline"
                >
                  Send again
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footnote */}
      <p className="text-center text-xs text-slate-400">
        Guides are sent from <strong>guides@garmentdecor.com</strong>. If it doesn&apos;t arrive in
        a couple minutes, check your promotions folder.
      </p>
    </div>
  );
}
