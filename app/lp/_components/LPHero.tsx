'use client';

import { useSearchParams } from 'next/navigation';
import { Phone } from 'lucide-react';
import { LPQuoteForm } from './LPQuoteForm';
import { trackPhoneClick } from '@/lib/analytics';
import { useGeoLocation, mapToServiceArea } from '@/hooks/useGeoLocation';
import { getLocationContent } from '@/lib/location-content';
import type { ResolutionSource, CopyVariant } from '@/lib/location-content';

interface LPHeroProps {
  service: 'screen-printing' | 'embroidery' | 't-shirt-printing' | 'jumbo-screen-printing' | 'digital-screen-printing' | 'puff-screen-printing';
  headline: string;
  subheadline: string;
  location?: string;
  variant?: string;
  valuePropOverrides?: string[];
  /** When true, headline/subheadline props are the final resolved values — skip internal resolution. */
  skipDynamicResolution?: boolean;
  resolvedLocation?: string | null;
  resolutionSource?: ResolutionSource;
  copyVariant?: CopyVariant;
}

export function LPHero({
  service,
  headline: propHeadline,
  subheadline: propSubheadline,
  location: propLocation,
  variant: propVariant,
  valuePropOverrides,
  skipDynamicResolution,
  resolvedLocation: parentResolvedLocation,
  resolutionSource: parentResolutionSource,
  copyVariant: parentCopyVariant,
}: LPHeroProps) {
  const searchParams = useSearchParams();
  const urlVariant = searchParams.get('variant');
  const urlLocation = searchParams.get('location');

  // ── Internal resolution (legacy path for pages that haven't adopted useLPLocation) ──
  const variant = propVariant || urlVariant;
  const isDynamic = !skipDynamicResolution && variant === 'dynamic';
  const { city, region, isLoading } = useGeoLocation();

  let headline = propHeadline;
  let subheadline = propSubheadline;
  let effectiveLocation = parentResolvedLocation ?? null;
  let effectiveVariant: string | undefined = parentCopyVariant ?? variant ?? undefined;
  let effectiveSource: ResolutionSource | undefined = parentResolutionSource;

  if (!skipDynamicResolution) {
    let detectedLocation: string | null = null;
    if (urlLocation) {
      detectedLocation = urlLocation;
    } else if (isDynamic && !isLoading) {
      detectedLocation = mapToServiceArea(city, region);
    } else if (propLocation) {
      detectedLocation = propLocation;
    }

    const locationContent = isDynamic
      ? getLocationContent(detectedLocation, service)
      : null;

    headline = locationContent?.headline || propHeadline;
    subheadline = locationContent?.subhead || propSubheadline;
    effectiveLocation = detectedLocation;
    effectiveVariant = variant || undefined;
    effectiveSource = detectedLocation
      ? (urlLocation ? 'url_param' : 'geo_ip')
      : undefined;
  }

  const gradient = service === 'embroidery'
    ? 'from-indigo-500 to-indigo-700'
    : 'from-brand-500 to-brand-700';

  const defaultValueProps = [
    'Save 20-40% with factory-direct pricing',
    'Get your order in as little as 5 days',
    'Perfect for orders 50-10,000+ pieces',
    'Free shipping on orders over $500',
  ];
  const valueProps = valuePropOverrides || defaultValueProps;

  return (
    <section className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="pointer-events-none absolute -left-32 top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-start">
          <div className="text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium mb-6">
              <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              Same Week Turnaround Available
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {headline}
            </h1>

            <p className="mt-4 text-lg sm:text-xl text-white/90">
              {subheadline}
            </p>

            <ul className="mt-8 space-y-3">
              {valueProps.map((prop) => (
                <li key={prop} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">✓</span>
                  <span>{prop}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 hidden lg:block">
              <p className="text-sm text-white/70 mb-2">Prefer to talk?</p>
              <a
                href="tel:+18559427636"
                onClick={() => trackPhoneClick({ source: `lp_${service}_hero` })}
                className="inline-flex items-center gap-3 rounded-xl bg-white px-6 py-4 text-lg font-semibold text-navy-800 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-0.5"
              >
                <Phone className="h-5 w-5 text-brand-500" />
                (855) 942-7636
              </a>
              <p className="mt-2 text-sm text-white/60">Mon-Fri 8am-5pm PST · Average wait: 30 seconds</p>
            </div>
          </div>

          <div className="lg:pl-8">
            <LPQuoteForm
              service={service}
              source={`lp_${service}${effectiveVariant ? `_${effectiveVariant}` : ''}`}
              variant={effectiveVariant}
              resolvedLocation={effectiveLocation}
              copyVariant={parentCopyVariant ?? (effectiveSource === 'url_param' ? 'keyword_location' : effectiveSource === 'geo_ip' ? 'geo_location' : undefined)}
              resolutionSource={effectiveSource}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
