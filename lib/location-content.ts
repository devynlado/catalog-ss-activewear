/**
 * Location-based content for landing page personalization.
 *
 * Resolution priority:
 *   1. URL ?location= param (from Google Ads keyword targeting)
 *   2. IP geo-detection (mapped to service area)
 *   3. Default fallback
 *
 * For ads keywords, any recognized city name gets a template-based headline
 * using the exact city name (e.g. "Screen Printing in Pasadena").
 * Service-area cities (Los Angeles, Orange County, etc.) use curated copy
 * with richer regional detail.
 *
 * Google Ads URL contract:
 *   ?location={city}                       — dynamic copy for that city
 *   ?variant=dynamic                       — dynamic copy via geo-detection
 *   ?variant=dynamic&location={city}       — city overrides geo
 *   (no params)                            — default static copy
 *
 * Recommended Google Ads Final URL Suffix:
 *   location={custom_location}&gclid={gclid}&utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}
 *   where {custom_location} is set per ad group to the target city name.
 */

export type ResolutionSource = 'url_param' | 'geo_ip' | 'fallback';
export type CopyVariant = 'keyword_location' | 'geo_location' | 'default';

export interface LocationContent {
  headline: string;
  subhead: string;
  serviceAreaText: string;
  localBenefit: string;
}

export interface LocationResolution {
  content: LocationContent;
  resolvedCity: string | null;
  serviceArea: string | null;
  resolutionSource: ResolutionSource;
  copyVariant: CopyVariant;
}

export type ServiceType =
  | 'screen-printing'
  | 'embroidery'
  | 't-shirt-printing'
  | 'jumbo-screen-printing'
  | 'digital-screen-printing'
  | 'puff-screen-printing';

// ── City Alias Normalization ───────────────────────────────────────────
// Lowercase input → canonical display name. Handles abbreviations, common
// misspellings, and URL-friendly slugs from ad platforms.

const CITY_ALIASES: Record<string, string> = {
  // Los Angeles metro
  'la': 'Los Angeles',
  'los angeles': 'Los Angeles',
  'hollywood': 'Hollywood',
  'west hollywood': 'West Hollywood',
  'pasadena': 'Pasadena',
  'santa monica': 'Santa Monica',
  'long beach': 'Long Beach',
  'burbank': 'Burbank',
  'glendale': 'Glendale',
  'torrance': 'Torrance',
  'compton': 'Compton',
  'inglewood': 'Inglewood',
  'culver city': 'Culver City',
  'beverly hills': 'Beverly Hills',
  'south gate': 'South Gate',
  'downey': 'Downey',
  'whittier': 'Whittier',
  'el monte': 'El Monte',
  'alhambra': 'Alhambra',
  'pomona': 'Pomona',
  'west covina': 'West Covina',
  'montclair': 'Montclair',
  'monrovia': 'Monrovia',
  'azusa': 'Azusa',
  'covina': 'Covina',
  'glendora': 'Glendora',
  'claremont': 'Claremont',
  'la verne': 'La Verne',
  // Orange County
  'anaheim': 'Anaheim',
  'irvine': 'Irvine',
  'santa ana': 'Santa Ana',
  'huntington beach': 'Huntington Beach',
  'newport beach': 'Newport Beach',
  'costa mesa': 'Costa Mesa',
  'fullerton': 'Fullerton',
  'orange': 'Orange',
  'orange county': 'Orange County',
  'oc': 'Orange County',
  'garden grove': 'Garden Grove',
  'westminster': 'Westminster',
  'lake forest': 'Lake Forest',
  'mission viejo': 'Mission Viejo',
  'laguna beach': 'Laguna Beach',
  'tustin': 'Tustin',
  'yorba linda': 'Yorba Linda',
  'brea': 'Brea',
  'placentia': 'Placentia',
  // San Diego
  'san diego': 'San Diego',
  'la jolla': 'La Jolla',
  'chula vista': 'Chula Vista',
  'oceanside': 'Oceanside',
  'carlsbad': 'Carlsbad',
  'escondido': 'Escondido',
  'vista': 'Vista',
  'san marcos': 'San Marcos',
  'encinitas': 'Encinitas',
  'el cajon': 'El Cajon',
  'national city': 'National City',
  'poway': 'Poway',
  // Riverside
  'riverside': 'Riverside',
  'corona': 'Corona',
  'moreno valley': 'Moreno Valley',
  'temecula': 'Temecula',
  'murrieta': 'Murrieta',
  'palm springs': 'Palm Springs',
  'hemet': 'Hemet',
  'menifee': 'Menifee',
  'perris': 'Perris',
  'lake elsinore': 'Lake Elsinore',
  'beaumont': 'Beaumont',
  'indio': 'Indio',
  // San Bernardino / Inland Empire
  'san bernardino': 'San Bernardino',
  'ontario': 'Ontario',
  'rancho cucamonga': 'Rancho Cucamonga',
  'fontana': 'Fontana',
  'rialto': 'Rialto',
  'upland': 'Upland',
  'redlands': 'Redlands',
  'chino': 'Chino',
  'chino hills': 'Chino Hills',
  'inland empire': 'Inland Empire',
  'ie': 'Inland Empire',
  'victorville': 'Victorville',
  'hesperia': 'Hesperia',
  'apple valley': 'Apple Valley',
  // Santa Barbara / Ventura
  'santa barbara': 'Santa Barbara',
  'ventura': 'Ventura',
  'oxnard': 'Oxnard',
  'thousand oaks': 'Thousand Oaks',
  'simi valley': 'Simi Valley',
  'camarillo': 'Camarillo',
  'santa clarita': 'Santa Clarita',
  'palmdale': 'Palmdale',
  'lancaster': 'Lancaster',
  // Regional
  'southern california': 'Southern California',
  'socal': 'Southern California',
  'california': 'California',
  'so cal': 'Southern California',
};

// ── City → Service Area mapping ────────────────────────────────────────
// Maps any canonical city name to its regional service area, which determines
// which curated content block to pull regional details from.

const CITY_TO_SERVICE_AREA: Record<string, string> = {
  // LA metro
  'Los Angeles': 'Los Angeles',
  'Hollywood': 'Los Angeles',
  'West Hollywood': 'Los Angeles',
  'Pasadena': 'Los Angeles',
  'Santa Monica': 'Los Angeles',
  'Long Beach': 'Los Angeles',
  'Burbank': 'Los Angeles',
  'Glendale': 'Los Angeles',
  'Torrance': 'Los Angeles',
  'Compton': 'Los Angeles',
  'Inglewood': 'Los Angeles',
  'Culver City': 'Los Angeles',
  'Beverly Hills': 'Los Angeles',
  'South Gate': 'Los Angeles',
  'Downey': 'Los Angeles',
  'Whittier': 'Los Angeles',
  'El Monte': 'Los Angeles',
  'Alhambra': 'Los Angeles',
  'Pomona': 'Los Angeles',
  'West Covina': 'Los Angeles',
  'Monrovia': 'Los Angeles',
  'Azusa': 'Los Angeles',
  'Covina': 'Los Angeles',
  'Glendora': 'Los Angeles',
  'Claremont': 'Los Angeles',
  'La Verne': 'Los Angeles',
  'Santa Clarita': 'Los Angeles',
  'Palmdale': 'Los Angeles',
  'Lancaster': 'Los Angeles',
  // SB/IE border cities
  'Montclair': 'San Bernardino',
  // OC
  'Anaheim': 'Orange County',
  'Irvine': 'Orange County',
  'Santa Ana': 'Orange County',
  'Huntington Beach': 'Orange County',
  'Newport Beach': 'Orange County',
  'Costa Mesa': 'Orange County',
  'Fullerton': 'Orange County',
  'Orange': 'Orange County',
  'Orange County': 'Orange County',
  'Garden Grove': 'Orange County',
  'Westminster': 'Orange County',
  'Lake Forest': 'Orange County',
  'Mission Viejo': 'Orange County',
  'Laguna Beach': 'Orange County',
  'Tustin': 'Orange County',
  'Yorba Linda': 'Orange County',
  'Brea': 'Orange County',
  'Placentia': 'Orange County',
  // SD
  'San Diego': 'San Diego',
  'La Jolla': 'San Diego',
  'Chula Vista': 'San Diego',
  'Oceanside': 'San Diego',
  'Carlsbad': 'San Diego',
  'Escondido': 'San Diego',
  'Vista': 'San Diego',
  'San Marcos': 'San Diego',
  'Encinitas': 'San Diego',
  'El Cajon': 'San Diego',
  'National City': 'San Diego',
  'Poway': 'San Diego',
  // Riverside
  'Riverside': 'Riverside',
  'Corona': 'Riverside',
  'Moreno Valley': 'Riverside',
  'Temecula': 'Riverside',
  'Murrieta': 'Riverside',
  'Palm Springs': 'Riverside',
  'Hemet': 'Riverside',
  'Menifee': 'Riverside',
  'Perris': 'Riverside',
  'Lake Elsinore': 'Riverside',
  'Beaumont': 'Riverside',
  'Indio': 'Riverside',
  // San Bernardino
  'San Bernardino': 'San Bernardino',
  'Ontario': 'San Bernardino',
  'Rancho Cucamonga': 'San Bernardino',
  'Fontana': 'San Bernardino',
  'Rialto': 'San Bernardino',
  'Upland': 'San Bernardino',
  'Redlands': 'San Bernardino',
  'Chino': 'San Bernardino',
  'Chino Hills': 'San Bernardino',
  'Inland Empire': 'San Bernardino',
  'Victorville': 'San Bernardino',
  'Hesperia': 'San Bernardino',
  'Apple Valley': 'San Bernardino',
  // SB / Ventura
  'Santa Barbara': 'Southern California',
  'Ventura': 'Southern California',
  'Oxnard': 'Southern California',
  'Thousand Oaks': 'Southern California',
  'Simi Valley': 'Southern California',
  'Camarillo': 'Southern California',
  // Regional
  'Southern California': 'Southern California',
  'California': 'Southern California',
};

// ── Service-type headline/subhead templates ────────────────────────────
// Used for cities that don't have curated per-service-area content.

const SERVICE_TEMPLATES: Record<ServiceType, {
  headline: (city: string) => string;
  subhead: (city: string) => string;
}> = {
  'screen-printing': {
    headline: (city) => `Local Screen Printing in ${city}`,
    subhead: (city) => `Your nearby screen printing company serving ${city}, Los Angeles, Orange County, and all of California. Factory-direct pricing, same week turnaround, 50 piece minimum.`,
  },
  'embroidery': {
    headline: (city) => `Custom Embroidery in ${city}`,
    subhead: (city) => `Professional embroidery for ${city} businesses. Premium threads, expert digitizing.`,
  },
  't-shirt-printing': {
    headline: (city) => `Custom T-Shirt Printing in ${city}`,
    subhead: (city) => `${city}'s factory-direct custom t-shirt printer. Bulk orders from 50 to 10,000+ pieces.`,
  },
  'jumbo-screen-printing': {
    headline: (city) => `Jumbo & Oversized Screen Printing in ${city}`,
    subhead: (city) => `Custom oversized prints up to 18" x 23" in ${city}. Factory-direct pricing, 50 piece minimum.`,
  },
  'digital-screen-printing': {
    headline: (city) => `Digital Screen Printing in ${city}`,
    subhead: (city) => `Full-color digital screen printing in ${city}. Unlimited colors, soft water-based feel, factory-direct pricing.`,
  },
  'puff-screen-printing': {
    headline: (city) => `Puff Screen Printing in ${city}`,
    subhead: (city) => `Custom 3D puff printing in ${city}. Raised texture, premium finish, factory-direct pricing.`,
  },
};

// ── Curated service-area content ───────────────────────────────────────
// Rich, hand-written copy for the major service areas. Used directly when
// the resolved city IS a service area, and as a source of regional details
// (serviceAreaText, localBenefit) for sub-cities within that area.

interface LocationContentMap {
  [location: string]: {
    [service in ServiceType]: LocationContent;
  };
}

const locationContent: LocationContentMap = {
  'Los Angeles': {
    'screen-printing': {
      headline: 'Local Screen Printing in Los Angeles',
      subhead: 'Your nearby screen printing company serving Los Angeles, Orange County, and all of California. Factory-direct pricing, same week turnaround, 50 piece minimum.',
      serviceAreaText: 'Serving Downtown LA, Hollywood, West LA, South LA, and surrounding areas',
      localBenefit: 'Local pickup available in LA',
    },
    'embroidery': {
      headline: 'Custom Embroidery in Los Angeles',
      subhead: 'Professional embroidery for LA businesses. Premium threads, expert digitizing.',
      serviceAreaText: 'Serving Downtown LA, Hollywood, West LA, South LA, and surrounding areas',
      localBenefit: 'Local pickup available in LA',
    },
    't-shirt-printing': {
      headline: 'Custom T-Shirt Printing in Los Angeles',
      subhead: 'LA\'s factory-direct custom t-shirt printer. Bulk orders from 50 to 10,000+ pieces.',
      serviceAreaText: 'Serving Downtown LA, Hollywood, West LA, South LA, and surrounding areas',
      localBenefit: 'Local pickup available in LA',
    },
    'jumbo-screen-printing': {
      headline: 'Jumbo & Oversized Screen Printing in Los Angeles',
      subhead: 'LA\'s factory-direct jumbo printer. Oversized prints up to 18" x 23" on tees, hoodies, and long sleeves.',
      serviceAreaText: 'Serving Downtown LA, Hollywood, West LA, South LA, and surrounding areas',
      localBenefit: 'Local pickup available in LA',
    },
    'digital-screen-printing': {
      headline: 'Digital Screen Printing in Los Angeles',
      subhead: 'LA\'s hybrid digital screen printer. Unlimited colors, photo-realistic prints at bulk speed. 50 piece minimum.',
      serviceAreaText: 'Serving Downtown LA, Hollywood, West LA, South LA, and surrounding areas',
      localBenefit: 'Local pickup available in LA',
    },
    'puff-screen-printing': {
      headline: 'Puff Screen Printing in Los Angeles',
      subhead: 'LA\'s factory-direct puff printer. Raised 3D texture, premium hand feel, 50 piece minimum.',
      serviceAreaText: 'Serving Downtown LA, Hollywood, West LA, South LA, and surrounding areas',
      localBenefit: 'Local pickup available in LA',
    },
  },
  'Orange County': {
    'screen-printing': {
      headline: 'Local Screen Printing in Orange County',
      subhead: 'Your nearby screen printing company serving Orange County, Los Angeles, and all of California. Factory-direct pricing, same week turnaround, 50 piece minimum.',
      serviceAreaText: 'Serving Anaheim, Irvine, Santa Ana, Newport Beach, and all of Orange County',
      localBenefit: 'Quick delivery to Orange County',
    },
    'embroidery': {
      headline: 'Custom Embroidery in Orange County',
      subhead: 'Professional embroidery for Orange County businesses. Premium quality.',
      serviceAreaText: 'Serving Anaheim, Irvine, Santa Ana, Newport Beach, and all of Orange County',
      localBenefit: 'Quick delivery to Orange County',
    },
    't-shirt-printing': {
      headline: 'Custom T-Shirt Printing in Orange County',
      subhead: 'Factory-direct custom t-shirts near OC. Same week turnaround available.',
      serviceAreaText: 'Serving Anaheim, Irvine, Santa Ana, Newport Beach, and all of Orange County',
      localBenefit: 'Quick delivery to Orange County',
    },
    'jumbo-screen-printing': {
      headline: 'Jumbo & Oversized Screen Printing in Orange County',
      subhead: 'Custom oversized prints up to 18" x 23" near OC. Factory-direct pricing, same week rush available.',
      serviceAreaText: 'Serving Anaheim, Irvine, Santa Ana, Newport Beach, and all of Orange County',
      localBenefit: 'Quick delivery to Orange County',
    },
    'digital-screen-printing': {
      headline: 'Digital Screen Printing in Orange County',
      subhead: 'Full-color digital screen printing near OC. Unlimited colors, soft water-based feel, factory-direct pricing.',
      serviceAreaText: 'Serving Anaheim, Irvine, Santa Ana, Newport Beach, and all of Orange County',
      localBenefit: 'Quick delivery to Orange County',
    },
    'puff-screen-printing': {
      headline: 'Puff Screen Printing in Orange County',
      subhead: 'Custom 3D puff printing near OC. Raised texture, premium finish, factory-direct pricing.',
      serviceAreaText: 'Serving Anaheim, Irvine, Santa Ana, Newport Beach, and all of Orange County',
      localBenefit: 'Quick delivery to Orange County',
    },
  },
  'San Diego': {
    'screen-printing': {
      headline: 'Local Screen Printing in San Diego',
      subhead: 'Your nearby screen printing company serving San Diego, Los Angeles, Orange County, and all of California. Factory-direct pricing, same week turnaround, 50 piece minimum.',
      serviceAreaText: 'Serving San Diego, La Jolla, Chula Vista, Oceanside, and North County',
      localBenefit: 'Regular shipping to San Diego',
    },
    'embroidery': {
      headline: 'Custom Embroidery in San Diego',
      subhead: 'Professional embroidery for San Diego businesses. Premium threads included.',
      serviceAreaText: 'Serving San Diego, La Jolla, Chula Vista, Oceanside, and North County',
      localBenefit: 'Regular shipping to San Diego',
    },
    't-shirt-printing': {
      headline: 'Custom T-Shirt Printing in San Diego',
      subhead: 'San Diego\'s trusted t-shirt printer. Factory-direct pricing, fast turnaround.',
      serviceAreaText: 'Serving San Diego, La Jolla, Chula Vista, Oceanside, and North County',
      localBenefit: 'Regular shipping to San Diego',
    },
    'jumbo-screen-printing': {
      headline: 'Jumbo & Oversized Screen Printing for San Diego',
      subhead: 'Custom oversized prints up to 18" x 23". Factory-direct jumbo screen printing with fast turnaround.',
      serviceAreaText: 'Serving San Diego, La Jolla, Chula Vista, Oceanside, and North County',
      localBenefit: 'Regular shipping to San Diego',
    },
    'digital-screen-printing': {
      headline: 'Digital Screen Printing for San Diego',
      subhead: 'Full-color hybrid screen printing for San Diego. Photo-realistic prints, 400 garments/hour, soft water-based feel.',
      serviceAreaText: 'Serving San Diego, La Jolla, Chula Vista, Oceanside, and North County',
      localBenefit: 'Regular shipping to San Diego',
    },
    'puff-screen-printing': {
      headline: 'Puff Screen Printing for San Diego',
      subhead: 'Custom 3D puff printing for San Diego brands. Raised texture, premium finish, factory-direct pricing.',
      serviceAreaText: 'Serving San Diego, La Jolla, Chula Vista, Oceanside, and North County',
      localBenefit: 'Regular shipping to San Diego',
    },
  },
  'Riverside': {
    'screen-printing': {
      headline: 'Local Screen Printing in Riverside',
      subhead: 'Your nearby screen printing company serving Riverside, Los Angeles, Orange County, and all of California. Factory-direct pricing, same week turnaround, 50 piece minimum.',
      serviceAreaText: 'Serving Riverside, Corona, Moreno Valley, Temecula, and the Inland Empire',
      localBenefit: 'Fast delivery to the Inland Empire',
    },
    'embroidery': {
      headline: 'Custom Embroidery in Riverside',
      subhead: 'Professional embroidery for Inland Empire businesses. Expert digitizing included.',
      serviceAreaText: 'Serving Riverside, Corona, Moreno Valley, Temecula, and the Inland Empire',
      localBenefit: 'Fast delivery to the Inland Empire',
    },
    't-shirt-printing': {
      headline: 'Custom T-Shirt Printing in Riverside',
      subhead: 'Inland Empire\'s factory-direct t-shirt printer. Same week rush available.',
      serviceAreaText: 'Serving Riverside, Corona, Moreno Valley, Temecula, and the Inland Empire',
      localBenefit: 'Fast delivery to the Inland Empire',
    },
    'jumbo-screen-printing': {
      headline: 'Jumbo & Oversized Screen Printing in Riverside',
      subhead: 'Inland Empire\'s oversized print specialists. Jumbo prints up to 18" x 23", same week rush available.',
      serviceAreaText: 'Serving Riverside, Corona, Moreno Valley, Temecula, and the Inland Empire',
      localBenefit: 'Fast delivery to the Inland Empire',
    },
    'digital-screen-printing': {
      headline: 'Digital Screen Printing in Riverside',
      subhead: 'Inland Empire\'s full-color digital screen printer. Unlimited colors, soft hand feel, same week rush available.',
      serviceAreaText: 'Serving Riverside, Corona, Moreno Valley, Temecula, and the Inland Empire',
      localBenefit: 'Fast delivery to the Inland Empire',
    },
    'puff-screen-printing': {
      headline: 'Puff Screen Printing in Riverside',
      subhead: 'Inland Empire\'s puff screen printing specialists. Raised 3D texture, premium finish, same week rush available.',
      serviceAreaText: 'Serving Riverside, Corona, Moreno Valley, Temecula, and the Inland Empire',
      localBenefit: 'Fast delivery to the Inland Empire',
    },
  },
  'San Bernardino': {
    'screen-printing': {
      headline: 'Local Screen Printing in San Bernardino',
      subhead: 'Your nearby screen printing company serving San Bernardino, Los Angeles, Orange County, and all of California. Factory-direct pricing, same week turnaround, 50 piece minimum.',
      serviceAreaText: 'Serving Ontario, Rancho Cucamonga, Fontana, and San Bernardino County',
      localBenefit: 'Fast delivery to San Bernardino area',
    },
    'embroidery': {
      headline: 'Custom Embroidery in San Bernardino',
      subhead: 'Professional embroidery near San Bernardino. Premium quality guaranteed.',
      serviceAreaText: 'Serving Ontario, Rancho Cucamonga, Fontana, and San Bernardino County',
      localBenefit: 'Fast delivery to San Bernardino area',
    },
    't-shirt-printing': {
      headline: 'Custom T-Shirt Printing in San Bernardino',
      subhead: 'Factory-direct custom t-shirts in the Inland Empire. Volume discounts available.',
      serviceAreaText: 'Serving Ontario, Rancho Cucamonga, Fontana, and San Bernardino County',
      localBenefit: 'Fast delivery to San Bernardino area',
    },
    'jumbo-screen-printing': {
      headline: 'Jumbo & Oversized Screen Printing in San Bernardino',
      subhead: 'Factory-direct oversized printing in the Inland Empire. Jumbo prints up to 18" x 23".',
      serviceAreaText: 'Serving Ontario, Rancho Cucamonga, Fontana, and San Bernardino County',
      localBenefit: 'Fast delivery to San Bernardino area',
    },
    'digital-screen-printing': {
      headline: 'Digital Screen Printing in San Bernardino',
      subhead: 'Full-color digital screen printing in the Inland Empire. Factory-direct, unlimited colors, soft hand feel.',
      serviceAreaText: 'Serving Ontario, Rancho Cucamonga, Fontana, and San Bernardino County',
      localBenefit: 'Fast delivery to San Bernardino area',
    },
    'puff-screen-printing': {
      headline: 'Puff Screen Printing in San Bernardino',
      subhead: 'Factory-direct 3D puff printing in the Inland Empire. Raised texture, premium finish, volume discounts.',
      serviceAreaText: 'Serving Ontario, Rancho Cucamonga, Fontana, and San Bernardino County',
      localBenefit: 'Fast delivery to San Bernardino area',
    },
  },
  'Southern California': {
    'screen-printing': {
      headline: 'Local Screen Printing in Southern California',
      subhead: 'Your nearby screen printing company serving Southern California, Los Angeles, Orange County, and all of California. Factory-direct pricing, same week turnaround, 50 piece minimum.',
      serviceAreaText: 'Serving Los Angeles, Orange County, Riverside, San Bernardino, and San Diego',
      localBenefit: 'Local to Southern California',
    },
    'embroidery': {
      headline: 'Custom Embroidery in Southern California',
      subhead: 'Professional embroidery with premium threads and expert digitizing.',
      serviceAreaText: 'Serving Los Angeles, Orange County, Riverside, San Bernardino, and San Diego',
      localBenefit: 'Local to Southern California',
    },
    't-shirt-printing': {
      headline: 'Custom T-Shirt Printing in Southern California',
      subhead: 'Factory-direct custom t-shirts. Same week turnaround, 50 piece minimum.',
      serviceAreaText: 'Serving Los Angeles, Orange County, Riverside, San Bernardino, and San Diego',
      localBenefit: 'Local to Southern California',
    },
    'jumbo-screen-printing': {
      headline: 'Jumbo & Oversized Screen Printing in Southern California',
      subhead: 'Custom oversized prints up to 18" x 23". Factory-direct pricing, 50 piece minimum.',
      serviceAreaText: 'Serving Los Angeles, Orange County, Riverside, San Bernardino, and San Diego',
      localBenefit: 'Local to Southern California',
    },
    'digital-screen-printing': {
      headline: 'Digital Screen Printing in Southern California',
      subhead: 'Full-color hybrid screen printing with unlimited colors. Factory-direct pricing, 50 piece minimum.',
      serviceAreaText: 'Serving Los Angeles, Orange County, Riverside, San Bernardino, and San Diego',
      localBenefit: 'Local to Southern California',
    },
    'puff-screen-printing': {
      headline: 'Puff Screen Printing in Southern California',
      subhead: 'Custom 3D puff printing with raised tactile texture. Factory-direct pricing, 50 piece minimum.',
      serviceAreaText: 'Serving Los Angeles, Orange County, Riverside, San Bernardino, and San Diego',
      localBenefit: 'Local to Southern California',
    },
  },
  'default': {
    'screen-printing': {
      headline: 'Screen Printing Near You',
      subhead: 'Your nearby screen printing company \u2014 serving LA, Orange County, Hollywood, and all of California. Factory-direct pricing, same week turnaround, 50 piece minimum.',
      serviceAreaText: 'Serving Los Angeles, Orange County, Riverside, San Bernardino, and San Diego',
      localBenefit: 'Nationwide shipping available',
    },
    'embroidery': {
      headline: 'Custom Embroidery Near You',
      subhead: 'Professional embroidery with premium threads, expert digitizing, and factory-direct pricing.',
      serviceAreaText: 'Serving Los Angeles, Orange County, Riverside, San Bernardino, and San Diego',
      localBenefit: 'Nationwide shipping available',
    },
    't-shirt-printing': {
      headline: 'Custom T-Shirt Printing Near You',
      subhead: 'Factory-direct pricing on custom printed t-shirts. Same week turnaround available, 50 piece minimum.',
      serviceAreaText: 'Serving Los Angeles, Orange County, Riverside, San Bernardino, and San Diego',
      localBenefit: 'Nationwide shipping available',
    },
    'jumbo-screen-printing': {
      headline: 'Jumbo & Oversized Screen Printing Near You',
      subhead: 'Custom oversized prints up to 18" x 23". Large-format screen printing with factory-direct pricing, 50 piece minimum.',
      serviceAreaText: 'Serving Los Angeles, Orange County, Riverside, San Bernardino, and San Diego',
      localBenefit: 'Nationwide shipping available',
    },
    'digital-screen-printing': {
      headline: 'Digital Screen Printing — Full Color, Bulk Speed',
      subhead: 'Hybrid screen + digital printing for unlimited colors and photo-realistic detail. Factory-direct pricing, 50 piece minimum.',
      serviceAreaText: 'Serving Los Angeles, Orange County, Riverside, San Bernardino, and San Diego',
      localBenefit: 'Nationwide shipping available',
    },
    'puff-screen-printing': {
      headline: 'Puff Screen Printing — Bold 3D Raised Prints',
      subhead: 'Heat-activated puff ink for raised, tactile 3D texture. Factory-direct pricing, 50 piece minimum.',
      serviceAreaText: 'Serving Los Angeles, Orange County, Riverside, San Bernardino, and San Diego',
      localBenefit: 'Nationwide shipping available',
    },
  },
};

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Normalize a raw location string to a canonical city name.
 * Returns null if the input is unrecognized.
 */
export function normalizeLocation(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  if (!key) return null;

  if (CITY_ALIASES[key]) return CITY_ALIASES[key];

  // Handle title-case input that matches a known canonical name directly
  const titleCased = raw.trim().replace(/\b\w/g, (c) => c.toUpperCase());
  if (CITY_TO_SERVICE_AREA[titleCased]) return titleCased;

  return null;
}

/**
 * Get the service area for a canonical city name.
 */
export function getServiceArea(normalizedCity: string | null): string | null {
  if (!normalizedCity) return null;
  return CITY_TO_SERVICE_AREA[normalizedCity] || null;
}

/**
 * Build content for a given city and service type.
 * Prefers curated content when the city IS a service area;
 * otherwise generates from templates + regional details.
 */
function getContentForCity(city: string, service: ServiceType): LocationContent {
  if (locationContent[city]?.[service]) {
    return locationContent[city][service];
  }

  const serviceArea = CITY_TO_SERVICE_AREA[city] || null;
  const template = SERVICE_TEMPLATES[service];
  const regional = serviceArea ? locationContent[serviceArea]?.[service] : null;
  const fallback = locationContent['default'][service];

  return {
    headline: template.headline(city),
    subhead: template.subhead(city),
    serviceAreaText: regional?.serviceAreaText || fallback.serviceAreaText,
    localBenefit: regional?.localBenefit || fallback.localBenefit,
  };
}

/**
 * Full resolution: normalizes input, builds content, returns metadata
 * for analytics tracking.
 */
export function resolveLocationContent(
  rawLocation: string | null,
  service: ServiceType,
  source: ResolutionSource,
): LocationResolution {
  if (!rawLocation) {
    return {
      content: locationContent['default'][service],
      resolvedCity: null,
      serviceArea: null,
      resolutionSource: 'fallback',
      copyVariant: 'default',
    };
  }

  const normalized = normalizeLocation(rawLocation);

  if (!normalized) {
    return {
      content: locationContent['default'][service],
      resolvedCity: null,
      serviceArea: null,
      resolutionSource: 'fallback',
      copyVariant: 'default',
    };
  }

  return {
    content: getContentForCity(normalized, service),
    resolvedCity: normalized,
    serviceArea: getServiceArea(normalized),
    resolutionSource: source,
    copyVariant: source === 'url_param' ? 'keyword_location' : 'geo_location',
  };
}

/**
 * Backward-compatible: get location-specific content by service area name.
 * Used by callers that haven't migrated to resolveLocationContent.
 */
export function getLocationContent(
  location: string | null,
  service: ServiceType,
): LocationContent {
  if (location && locationContent[location]) {
    return locationContent[location][service];
  }
  return locationContent['default'][service];
}

/**
 * All curated service-area location keys (for testing/debugging).
 */
export function getAvailableLocations(): string[] {
  return Object.keys(locationContent).filter(k => k !== 'default');
}

// ── SEO City Page Expansion Utilities ──────────────────────────────────
// These utilities support Phase 3: indexable city pages at /locations/[city].
// The existing route already handles Hollywood, Orange County, Santa Barbara.
// Use these to programmatically generate pages for all target cities.

export interface SEOCityEntry {
  slug: string;
  displayName: string;
  serviceArea: string;
  metaTitle: string;
  metaDescription: string;
}

/**
 * Generates SEO city entries from the city alias/service-area maps.
 * Each entry provides the slug, display name, service area, and
 * template metadata suitable for /locations/[city] expansion.
 *
 * To expand: add curated content (target audiences, testimonials, FAQ)
 * per city to the locations page data. The metadata and routing are
 * already handled by this utility + the dynamic [city] route.
 */
export function getSEOCityEntries(): SEOCityEntry[] {
  const seen = new Set<string>();
  const entries: SEOCityEntry[] = [];

  for (const [, canonical] of Object.entries(CITY_ALIASES)) {
    if (seen.has(canonical)) continue;
    seen.add(canonical);

    const serviceArea = CITY_TO_SERVICE_AREA[canonical];
    if (!serviceArea) continue;

    // Skip regional labels (Southern California, California, Inland Empire)
    if (['Southern California', 'California', 'Inland Empire'].includes(canonical)) continue;

    const slug = canonical.toLowerCase().replace(/\s+/g, '-');

    entries.push({
      slug,
      displayName: canonical,
      serviceArea,
      metaTitle: `${canonical} Screen Printing & Embroidery | Garment Decor`,
      metaDescription: `Custom screen printing and embroidery in ${canonical}. Factory-direct pricing, same week turnaround, 50 piece minimum. Get a free quote.`,
    });
  }

  return entries.sort((a, b) => a.displayName.localeCompare(b.displayName));
}
