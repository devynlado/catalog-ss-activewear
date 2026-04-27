'use client';

import { useSearchParams } from 'next/navigation';
import { useGeoLocation, mapToServiceArea } from '@/hooks/useGeoLocation';
import {
  resolveLocationContent,
  type ServiceType,
  type LocationResolution,
} from '@/lib/location-content';

export interface LPLocationResult extends LocationResolution {
  isLoading: boolean;
}

/**
 * Resolves location for LP copy personalization.
 *
 * Priority:
 *   1. ?location= URL param (from Google Ads) → keyword_location
 *   2. IP geolocation when dynamic mode → geo_location
 *   3. Default fallback
 *
 * Dynamic mode activates when ?location= is present OR ?variant=dynamic.
 * Renders default copy immediately, then swaps once location is resolved
 * (URL param: synchronous; geo: async with session cache).
 */
export function useLPLocation(service: ServiceType): LPLocationResult {
  const searchParams = useSearchParams();
  const urlLocation = searchParams.get('location');
  const urlVariant = searchParams.get('variant');

  const isDynamic = !!urlLocation || urlVariant === 'dynamic';
  const { city, region, isLoading: geoLoading } = useGeoLocation();

  // Priority 1: explicit URL param (synchronous, zero-cost)
  if (urlLocation) {
    const resolution = resolveLocationContent(urlLocation, service, 'url_param');
    if (resolution.resolvedCity) {
      return { ...resolution, isLoading: false };
    }
    // Unrecognized URL value: fall through to geo, then default
  }

  // Priority 2: geo-detection (only when dynamic mode is active)
  if (isDynamic) {
    if (geoLoading) {
      return {
        ...resolveLocationContent(null, service, 'fallback'),
        isLoading: true,
      };
    }
    const serviceArea = mapToServiceArea(city, region);
    if (serviceArea) {
      return {
        ...resolveLocationContent(serviceArea, service, 'geo_ip'),
        isLoading: false,
      };
    }
  }

  // Priority 3: default
  return {
    ...resolveLocationContent(null, service, 'fallback'),
    isLoading: false,
  };
}
