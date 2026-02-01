'use client';

import { useState, useEffect } from 'react';

interface GeoLocation {
  city: string | null;
  region: string | null;
  country: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to detect user's location via IP geolocation
 * Uses ip-api.com (free tier: 45 requests/minute)
 * 
 * For production with high traffic, consider:
 * - ipinfo.io (paid)
 * - MaxMind GeoIP (self-hosted)
 * - Cloudflare headers (if using CF)
 */
export function useGeoLocation(): GeoLocation {
  const [location, setLocation] = useState<GeoLocation>({
    city: null,
    region: null,
    country: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Check if we have cached location
    const cached = sessionStorage.getItem('geo_location');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setLocation({
          ...parsed,
          isLoading: false,
          error: null,
        });
        return;
      } catch {
        // Invalid cache, continue with fetch
      }
    }

    // Fetch location from IP
    const fetchLocation = async () => {
      try {
        // Using ip-api.com (free, no API key needed)
        // Note: HTTPS requires paid plan, HTTP works for development
        // For production, use a paid service or server-side detection
        const response = await fetch('https://ipapi.co/json/');
        
        if (!response.ok) {
          throw new Error('Failed to fetch location');
        }

        const data = await response.json();
        
        const locationData = {
          city: data.city || null,
          region: data.region || null,
          country: data.country_name || null,
        };

        // Cache for this session
        sessionStorage.setItem('geo_location', JSON.stringify(locationData));

        setLocation({
          ...locationData,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        setLocation({
          city: null,
          region: null,
          country: null,
          isLoading: false,
          error: 'Could not detect location',
        });
      }
    };

    fetchLocation();
  }, []);

  return location;
}

/**
 * Maps detected cities to our known service area cities
 * Returns the closest/most relevant city for content personalization
 */
export function mapToServiceArea(detectedCity: string | null, detectedRegion: string | null): string | null {
  if (!detectedCity && !detectedRegion) return null;

  const city = (detectedCity || '').toLowerCase();
  const region = (detectedRegion || '').toLowerCase();

  // Los Angeles area
  if (
    city.includes('los angeles') ||
    city.includes('hollywood') ||
    city.includes('burbank') ||
    city.includes('glendale') ||
    city.includes('pasadena') ||
    city.includes('santa monica') ||
    city.includes('long beach') ||
    city.includes('torrance') ||
    city.includes('compton') ||
    city.includes('inglewood')
  ) {
    return 'Los Angeles';
  }

  // Orange County
  if (
    city.includes('anaheim') ||
    city.includes('irvine') ||
    city.includes('santa ana') ||
    city.includes('huntington beach') ||
    city.includes('newport') ||
    city.includes('costa mesa') ||
    city.includes('fullerton') ||
    city.includes('orange')
  ) {
    return 'Orange County';
  }

  // San Diego area
  if (
    city.includes('san diego') ||
    city.includes('la jolla') ||
    city.includes('chula vista') ||
    city.includes('oceanside') ||
    city.includes('carlsbad') ||
    city.includes('escondido')
  ) {
    return 'San Diego';
  }

  // Riverside area
  if (
    city.includes('riverside') ||
    city.includes('corona') ||
    city.includes('moreno valley') ||
    city.includes('temecula') ||
    city.includes('murrieta')
  ) {
    return 'Riverside';
  }

  // San Bernardino area
  if (
    city.includes('san bernardino') ||
    city.includes('ontario') ||
    city.includes('rancho cucamonga') ||
    city.includes('fontana') ||
    city.includes('rialto')
  ) {
    return 'San Bernardino';
  }

  // Check if in California
  if (region.includes('california') || region === 'ca') {
    return 'Southern California';
  }

  // Out of state
  return null;
}
