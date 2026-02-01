/**
 * Location-based content for landing page personalization
 */

export interface LocationContent {
  headline: string;
  subhead: string;
  serviceAreaText: string;
  localBenefit: string;
}

type ServiceType = 'screen-printing' | 'embroidery';

interface LocationContentMap {
  [location: string]: {
    [service in ServiceType]: LocationContent;
  };
}

const locationContent: LocationContentMap = {
  'Los Angeles': {
    'screen-printing': {
      headline: 'Screen Printing in Los Angeles',
      subhead: 'LA\'s factory-direct print shop. Same week turnaround, 50 piece minimum.',
      serviceAreaText: 'Serving Downtown LA, Hollywood, West LA, South LA, and surrounding areas',
      localBenefit: 'Local pickup available in LA',
    },
    'embroidery': {
      headline: 'Custom Embroidery in Los Angeles',
      subhead: 'Professional embroidery for LA businesses. Premium threads, expert digitizing.',
      serviceAreaText: 'Serving Downtown LA, Hollywood, West LA, South LA, and surrounding areas',
      localBenefit: 'Local pickup available in LA',
    },
  },
  'Orange County': {
    'screen-printing': {
      headline: 'Screen Printing in Orange County',
      subhead: 'Factory-direct screen printing near OC. Same week turnaround available.',
      serviceAreaText: 'Serving Anaheim, Irvine, Santa Ana, Newport Beach, and all of Orange County',
      localBenefit: 'Quick delivery to Orange County',
    },
    'embroidery': {
      headline: 'Custom Embroidery in Orange County',
      subhead: 'Professional embroidery for Orange County businesses. Premium quality.',
      serviceAreaText: 'Serving Anaheim, Irvine, Santa Ana, Newport Beach, and all of Orange County',
      localBenefit: 'Quick delivery to Orange County',
    },
  },
  'San Diego': {
    'screen-printing': {
      headline: 'Screen Printing in San Diego',
      subhead: 'San Diego\'s trusted print partner. Factory-direct pricing, fast turnaround.',
      serviceAreaText: 'Serving San Diego, La Jolla, Chula Vista, Oceanside, and North County',
      localBenefit: 'Regular shipping to San Diego',
    },
    'embroidery': {
      headline: 'Custom Embroidery in San Diego',
      subhead: 'Professional embroidery for San Diego businesses. Premium threads included.',
      serviceAreaText: 'Serving San Diego, La Jolla, Chula Vista, Oceanside, and North County',
      localBenefit: 'Regular shipping to San Diego',
    },
  },
  'Riverside': {
    'screen-printing': {
      headline: 'Screen Printing in Riverside',
      subhead: 'Inland Empire\'s factory-direct print shop. Same week rush available.',
      serviceAreaText: 'Serving Riverside, Corona, Moreno Valley, Temecula, and the Inland Empire',
      localBenefit: 'Fast delivery to the Inland Empire',
    },
    'embroidery': {
      headline: 'Custom Embroidery in Riverside',
      subhead: 'Professional embroidery for Inland Empire businesses. Expert digitizing included.',
      serviceAreaText: 'Serving Riverside, Corona, Moreno Valley, Temecula, and the Inland Empire',
      localBenefit: 'Fast delivery to the Inland Empire',
    },
  },
  'San Bernardino': {
    'screen-printing': {
      headline: 'Screen Printing in San Bernardino',
      subhead: 'Factory-direct screen printing in the Inland Empire. Volume discounts available.',
      serviceAreaText: 'Serving Ontario, Rancho Cucamonga, Fontana, and San Bernardino County',
      localBenefit: 'Fast delivery to San Bernardino area',
    },
    'embroidery': {
      headline: 'Custom Embroidery in San Bernardino',
      subhead: 'Professional embroidery near San Bernardino. Premium quality guaranteed.',
      serviceAreaText: 'Serving Ontario, Rancho Cucamonga, Fontana, and San Bernardino County',
      localBenefit: 'Fast delivery to San Bernardino area',
    },
  },
  'Southern California': {
    'screen-printing': {
      headline: 'Screen Printing in Southern California',
      subhead: 'Factory-direct pricing, same week turnaround available, 50 piece minimum.',
      serviceAreaText: 'Serving Los Angeles, Orange County, Riverside, San Bernardino, and San Diego',
      localBenefit: 'Local to Southern California',
    },
    'embroidery': {
      headline: 'Custom Embroidery in Southern California',
      subhead: 'Professional embroidery with premium threads and expert digitizing.',
      serviceAreaText: 'Serving Los Angeles, Orange County, Riverside, San Bernardino, and San Diego',
      localBenefit: 'Local to Southern California',
    },
  },
  'default': {
    'screen-printing': {
      headline: 'Screen Printing in Southern California',
      subhead: 'Factory-direct pricing, same week turnaround available, 50 piece minimum. Get vibrant, durable prints that last.',
      serviceAreaText: 'Serving Los Angeles, Orange County, Riverside, San Bernardino, and San Diego',
      localBenefit: 'Nationwide shipping available',
    },
    'embroidery': {
      headline: 'Custom Embroidery in Southern California',
      subhead: 'Professional embroidery with premium threads, expert digitizing, and factory-direct pricing.',
      serviceAreaText: 'Serving Los Angeles, Orange County, Riverside, San Bernardino, and San Diego',
      localBenefit: 'Nationwide shipping available',
    },
  },
};

/**
 * Get location-specific content for a landing page
 */
export function getLocationContent(
  location: string | null,
  service: ServiceType
): LocationContent {
  // If we have content for this specific location, use it
  if (location && locationContent[location]) {
    return locationContent[location][service];
  }

  // Otherwise return default
  return locationContent['default'][service];
}

/**
 * Get all available locations for testing
 */
export function getAvailableLocations(): string[] {
  return Object.keys(locationContent).filter(k => k !== 'default');
}
