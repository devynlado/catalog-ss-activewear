/**
 * Centralized service images configuration
 * 
 * To update images: Simply replace the file in /public/images/services/{service}/
 * with a new file of the same name, or update the path here.
 * 
 * Image naming convention: kebab-case, descriptive names
 * Example: custom-screen-printing-for-la-apparel-1801gd.webp
 */

export interface ServiceImage {
  src: string;
  alt: string;
  /** Optional: Use for hero/featured images */
  featured?: boolean;
}

export interface ServiceImages {
  hero: ServiceImage;
  gallery: ServiceImage[];
}

const BASE_PATH = '/images/services';

export const serviceImages: Record<string, ServiceImages> = {
  'screen-printing': {
    hero: {
      src: `${BASE_PATH}/screen-printing/screen-printing-workshop.webp`,
      alt: 'Screen printing production workshop at Garment Decor',
      featured: true,
    },
    gallery: [
      {
        src: `${BASE_PATH}/screen-printing/custom-screen-printing-for-la-apparel-1801gd-elevate-streetwear-style.webp`,
        alt: 'Custom screen printing on LA Apparel 1801GD t-shirts',
      },
      {
        src: `${BASE_PATH}/screen-printing/custom-screen-printing-for-independent-trading-ss4500-hoodies.webp`,
        alt: 'Custom screen printed Independent Trading SS4500 hoodies',
      },
      {
        src: `${BASE_PATH}/screen-printing/custom-screen-printed-lane-seven-ls14001-hoodies-and-lst006-joggers.webp`,
        alt: 'Custom screen printed Lane Seven hoodies and joggers',
      },
      {
        src: `${BASE_PATH}/screen-printing/custom-screen-print-on-champion-t425-tees-elevate-your-streetwear-brand.webp`,
        alt: 'Custom screen print on Champion T425 tees',
      },
      {
        src: `${BASE_PATH}/screen-printing/custom-jumbo-screen-printed-los-angeles-apparel-style-1801gd-t-shirts.webp`,
        alt: 'Custom jumbo screen printed LA Apparel t-shirts',
      },
      {
        src: `${BASE_PATH}/screen-printing/custom-streetwear-printing-lane-seven-ls16005-lunar-rock-by-garment-decor.webp`,
        alt: 'Custom streetwear printing on Lane Seven LS16005',
      },
      {
        src: `${BASE_PATH}/screen-printing/boost-your-tour-merch-game-custom-digital-squeegee-for-comfort-colors-tees.webp`,
        alt: 'Tour merch custom printing on Comfort Colors tees',
      },
      {
        src: `${BASE_PATH}/screen-printing/custom-screen-printing-for-alternative-apparel-aa1070-tees-stand-out.webp`,
        alt: 'Custom screen printing on Alternative Apparel AA1070',
      },
    ],
  },

  'digital-screen-printing': {
    hero: {
      src: `${BASE_PATH}/digital-screen-printing/the-digital-squeegee.jpeg`,
      alt: 'Digital Squeegee screen printing technology',
      featured: true,
    },
    gallery: [
      {
        src: `${BASE_PATH}/digital-screen-printing/digital-screen-printing-by-garment-decor-on-la-apparel-tee.webp`,
        alt: 'Digital screen printing on LA Apparel tee',
      },
      {
        src: `${BASE_PATH}/digital-screen-printing/digital-screen-printing-by-garment-decor-on-la-apparel-tee-3.webp`,
        alt: 'Digital screen printing example on LA Apparel',
      },
      {
        src: `${BASE_PATH}/digital-screen-printing/comfort-colors-1717-garment-dyed-heavyweight-t-shirt-black-custom-digital-squeegee-front-view.webp`,
        alt: 'Digital squeegee print on Comfort Colors 1717',
      },
      {
        src: `${BASE_PATH}/digital-screen-printing/as-colour-5080-heavy-tee-custom-digital-squeegee-front-view.webp`,
        alt: 'Digital squeegee print on AS Colour 5080 heavy tee',
      },
      {
        src: `${BASE_PATH}/digital-screen-printing/independent-trading-style-ind420xd-pullover-hoodie-black-custom-digitial-squeegee-back-view-1.webp`,
        alt: 'Digital squeegee print on Independent Trading hoodie',
      },
      {
        src: `${BASE_PATH}/digital-screen-printing/la-apparel-1801gd-garmnt-dye-crew-neck-6.5oz-white-custom-digital-squeegee-print-back-view.webp`,
        alt: 'Digital squeegee print on LA Apparel 1801GD',
      },
      {
        src: `${BASE_PATH}/digital-screen-printing/oad-large-canvas-tote-oad117-natural-custom-digital-squeegee-front-view.webp`,
        alt: 'Digital squeegee print on canvas tote bag',
      },
      {
        src: `${BASE_PATH}/digital-screen-printing/gildan-heavy-cotton-long-sleeve-t-shirt-5400-black-custom-digital-squeegee-front-view.webp`,
        alt: 'Digital squeegee print on Gildan long sleeve',
      },
    ],
  },

  'puff-printing': {
    hero: {
      src: `${BASE_PATH}/puff-printing/custom-3d-puff-screen-printed-la-apparel-1801gd-t-shirts-with-vibrant-orange-ink.webp`,
      alt: '3D puff screen printing with vibrant orange ink',
      featured: true,
    },
    gallery: [
      {
        src: `${BASE_PATH}/puff-printing/3d-puff-screen-printed-los-angeles-apparel-1801gd-t-shirts-ls14001-hoodies-for-swish-studios.webp`,
        alt: '3D puff screen printed LA Apparel t-shirts and hoodies',
      },
      {
        src: `${BASE_PATH}/puff-printing/custom-screen-printed-independent-ss4500-midweight-hoodies-with-puff-pink-ink.webp`,
        alt: 'Puff pink ink on Independent SS4500 hoodies',
      },
      {
        src: `${BASE_PATH}/puff-printing/custom-tonal-puff-screen-printed-lavender-crewnecks-for-kulti-clothing.jpg`,
        alt: 'Tonal puff print on lavender crewnecks',
      },
      {
        src: `${BASE_PATH}/puff-printing/custom-puff-screen-printed-teestyled-ts7000-t-shirts-for-the-saddest-faction-clothing-company.jpg`,
        alt: 'Puff screen print on TeeStyled TS7000 t-shirts',
      },
      {
        src: `${BASE_PATH}/puff-printing/customized-screen-printed-independent-ind20pnt-fleece-pants-with-puff-ink.webp`,
        alt: 'Puff ink on Independent fleece pants',
      },
      {
        src: `${BASE_PATH}/puff-printing/custom-screen-printed-and-embroidered-made-blanks-ready-to-dye-varsity-crewneck-for-archangel.jpg`,
        alt: 'Custom puff print on varsity crewneck',
      },
      {
        src: `${BASE_PATH}/puff-printing/custom-screen-printed-embroidered-retail-finished-next-level-3601-t-shirts.jpg`,
        alt: 'Puff print with retail finishing on Next Level 3601',
      },
      {
        src: `${BASE_PATH}/puff-printing/custom-puff-screen-printing-for-saddest-faction-clothing.jpg`,
        alt: 'Custom puff screen printing for Saddest Faction',
      },
    ],
  },

  'jumbo-screen-printing': {
    hero: {
      src: `${BASE_PATH}/jumbo-screen-printing/jumbo-screen-printed-hoodies-for-spirit-wear-uniforms.webp`,
      alt: 'Jumbo screen printed hoodies for spirit wear',
      featured: true,
    },
    gallery: [
      {
        src: `${BASE_PATH}/jumbo-screen-printing/custom-jumbo-screen-printing-for-jpeg-mafia-american-apparel-1304-long-sleeve.webp`,
        alt: 'Jumbo screen printing for JPEG Mafia on American Apparel',
      },
      {
        src: `${BASE_PATH}/jumbo-screen-printing/los-angeles-apparel-1801gd-6.5oz-garment-dye-crew-neck-t-shirt-white-custom-jumbo-screen-print-back-view.webp`,
        alt: 'Jumbo screen print on LA Apparel 1801GD white tee',
      },
      {
        src: `${BASE_PATH}/jumbo-screen-printing/independent-trading-ind420xd-mainstreet-420gm-heavyweight-pullover-hood-pigment-black-custom-jumbo-screen-print-front-view.webp`,
        alt: 'Jumbo screen print on Independent Trading heavyweight hoodie',
      },
      {
        src: `${BASE_PATH}/jumbo-screen-printing/shaka-wear-7.5oz-max-heavyweight-garment-dye-shadow-custom-jumbo-screen-print-front-view.webp`,
        alt: 'Jumbo screen print on Shaka Wear heavyweight tee',
      },
      {
        src: `${BASE_PATH}/jumbo-screen-printing/custom-distressed-shirt-natural-custom-jumbo-screen-printing-front-view-front-view.webp`,
        alt: 'Custom distressed jumbo screen print',
      },
      {
        src: `${BASE_PATH}/jumbo-screen-printing/custom-made-t-shirt-natural-custom-jumbo-screen-print-front-view.webp`,
        alt: 'Custom made jumbo screen printed t-shirt',
      },
      {
        src: `${BASE_PATH}/jumbo-screen-printing/eye-catching-jumbo-sleeve-prints-for-your-movie-merch-by-garment-decor-1.webp`,
        alt: 'Jumbo sleeve prints for movie merch',
      },
      {
        src: `${BASE_PATH}/jumbo-screen-printing/cal-state-fullerton-custom-t-shirts-gildan2000-navy-two-color-print4.jpg`,
        alt: 'Cal State Fullerton custom jumbo print on Gildan',
      },
    ],
  },

  'simulated-process': {
    hero: {
      src: `${BASE_PATH}/simulated-process/vibrant-goat-fuel-print-why-brands-trust-garment-decor-for-screen-printing-4.webp`,
      alt: 'Vibrant simulated process print for GOAT Fuel',
      featured: true,
    },
    gallery: [
      {
        src: `${BASE_PATH}/simulated-process/los-angeles-apparel-1801gd-6.5oz-garment-dye-crew-neck-t-shirt-black-custom-screen-print-front-view-1.webp`,
        alt: 'Simulated process print on LA Apparel 1801GD',
      },
      {
        src: `${BASE_PATH}/simulated-process/los-angeles-apparel-1801gd-6.5oz-garment-dye-crew-neck-t-shirt-black-custom-screen-print-back-view.webp`,
        alt: 'Simulated process back print on LA Apparel',
      },
      {
        src: `${BASE_PATH}/simulated-process/champion-t425-short-sleeve-t-shirt-black-custom-screen-print-front-view.webp`,
        alt: 'Simulated process print on Champion T425',
      },
      {
        src: `${BASE_PATH}/simulated-process/custom-screen-printed-t-shirt-by-garment-decor-for-be-out-day.webp`,
        alt: 'Simulated process print for Be Out Day event',
      },
      {
        src: `${BASE_PATH}/simulated-process/custom-screen-printed-t-shirt-by-garment-decor-for-be-out-day-2.webp`,
        alt: 'Simulated process print for Be Out Day',
      },
      {
        src: `${BASE_PATH}/simulated-process/independent-trading-co-mainstreet-hooded-sweatshirt-ind420xd-black-custom-embroidery-and-screen-print-back-view.webp`,
        alt: 'Simulated process print on Independent hoodie',
      },
      {
        src: `${BASE_PATH}/simulated-process/madrugada-4.webp`,
        alt: 'Madrugada simulated process print',
      },
      {
        src: `${BASE_PATH}/simulated-process/eye-catching-jumbo-sleeve-prints-for-your-movie-merch-by-garment-decor-1.webp`,
        alt: 'Simulated process sleeve print for movie merch',
      },
    ],
  },

  'embroidery': {
    hero: {
      src: `${BASE_PATH}/embroidery/elevate-your-brand-with-custom-embroidered-hoodies-by-garment-decor-2-1.webp`,
      alt: 'Custom embroidered hoodies by Garment Decor',
      featured: true,
    },
    gallery: [
      {
        src: `${BASE_PATH}/embroidery/otto-cap-31-069-65-panel-mid-profile-baseball-cap-dark-green-white-custom-embroidery-front-view-2.webp`,
        alt: 'Custom embroidery on Otto Cap baseball cap',
      },
      {
        src: `${BASE_PATH}/embroidery/otto-cap-39-165-5-panel-high-crown-mesh-back-trucker-hat-kelly-white-kelly-custom-embroidery-front-view.webp`,
        alt: 'Custom embroidery on Otto Cap trucker hat',
      },
      {
        src: `${BASE_PATH}/embroidery/yupoong-classics-6089-premium-flat-bill-snapback-cap-black-custom-puff-embroidery-front-view-2.webp`,
        alt: 'Puff embroidery on Yupoong snapback cap',
      },
      {
        src: `${BASE_PATH}/embroidery/valucap-chino-cap-vc600-white-custom-embroidery-front-view-1.webp`,
        alt: 'Custom embroidery on Valucap chino cap',
      },
      {
        src: `${BASE_PATH}/embroidery/custom-embroidered-cm6245-olive-green-hats2.jpg`,
        alt: 'Custom embroidered olive green hats',
      },
      {
        src: `${BASE_PATH}/embroidery/as-colours-5161-relax-hood-bone-custom-puff-embroidery-front-view.webp`,
        alt: 'Puff embroidery on AS Colour relax hoodie',
      },
      {
        src: `${BASE_PATH}/embroidery/dlx5-custom-embroidered-bag-1.webp`,
        alt: 'Custom embroidered bag',
      },
      {
        src: `${BASE_PATH}/embroidery/custom-made-5-panel-flat-bill-snapback-caps-waterproof-laser-cut-hole-perforated-hat-for-green-ball-hooligans-pickleball-front-view-mass-production.webp`,
        alt: 'Custom embroidered 5-panel snapback caps',
      },
    ],
  },

  'retail-finishing': {
    hero: {
      src: `${BASE_PATH}/retail-finishing/essential-finishing-services-3.webp`,
      alt: 'Retail finishing services - tags, labels, and packaging',
      featured: true,
    },
    gallery: [
      // Add more images as they become available
      {
        src: `${BASE_PATH}/retail-finishing/essential-finishing-services-3.webp`,
        alt: 'Essential finishing services for retail-ready apparel',
      },
    ],
  },

  'live-screen-printing': {
    hero: {
      src: `${BASE_PATH}/live-screen-printing/live-screen-printing-event.webp`,
      alt: 'Live screen printing at a corporate event',
      featured: true,
    },
    gallery: [
      {
        src: `${BASE_PATH}/live-screen-printing/live-screen-printing-event.webp`,
        alt: 'Live screen printing setup at event',
      },
      {
        src: `${BASE_PATH}/live-screen-printing/on-site-screen-printing-trade-show.webp`,
        alt: 'On-site screen printing at trade show',
      },
      {
        src: `${BASE_PATH}/live-screen-printing/event-screen-printing-crowd.webp`,
        alt: 'Guests watching live screen printing',
      },
      {
        src: `${BASE_PATH}/live-screen-printing/live-printing-station.webp`,
        alt: 'Live printing station with equipment',
      },
    ],
  },

  'rush': {
    hero: {
      src: `${BASE_PATH}/rush-order/why-jumbo-screen-printing-is-a-game-changer-and-how-we-can-help.webp`,
      alt: 'Rush order turnaround - fast delivery',
      featured: true,
    },
    gallery: [
      {
        src: `${BASE_PATH}/rush-order/custom-screen-printed-jumbo-prints-for-clothing-brands-on-a-black-la-apparel-1801-e1732950666274-1.webp`,
        alt: 'Rush order jumbo prints on LA Apparel',
      },
      {
        src: `${BASE_PATH}/rush-order/freak-show-t-shirt-bold-custom-screen-printing-with-vintage-horror-vibes-1.webp`,
        alt: 'Rush order custom screen printing',
      },
      {
        src: `${BASE_PATH}/rush-order/custom-puff-embroidery-on-trucker-hats.webp`,
        alt: 'Rush order puff embroidery on trucker hats',
      },
      {
        src: `${BASE_PATH}/rush-order/custom-pom-pom-navy-embroidered-beanies-white-thread-amazon-peak3.jpg`,
        alt: 'Rush order embroidered beanies',
      },
      {
        src: `${BASE_PATH}/rush-order/mesh-jersey-with-custom-spot-screen-printing-by-garment-decor-3-1.webp`,
        alt: 'Rush order mesh jersey screen printing',
      },
      {
        src: `${BASE_PATH}/rush-order/offroad-culture-hats-1.webp`,
        alt: 'Rush order custom hats for Offroad Culture',
      },
      {
        src: `${BASE_PATH}/rush-order/otto-cap-31-069-65-panel-mid-profile-baseball-cap-dark-green-white-custom-embroidery-front-view-2.webp`,
        alt: 'Rush order custom embroidery on Otto caps',
      },
    ],
  },
};

// Factory tour images - for hero, about, and marketing sections
export const factoryTourImages = {
  qualityInspection: {
    src: '/images/factory-tour/quality-inspection-in-shirts-we-trust.webp',
    alt: 'Quality inspection at Garment Decor - In Shirts We Trust',
    featured: true,
  },
  threadWall: {
    src: '/images/factory-tour/thread-wall-color-selection.webp',
    alt: 'Colorful thread wall for embroidery color matching',
    featured: true,
  },
  productionFloorCuring: {
    src: '/images/factory-tour/production-floor-curing-station.webp',
    alt: 'Production floor curing station with stacks of printed apparel',
  },
  teamMember: {
    src: '/images/factory-tour/team-member-embroidery-station.webp',
    alt: 'Team member at embroidery workstation',
  },
  inkMixing: {
    src: '/images/factory-tour/ink-mixing-craftsmanship.webp',
    alt: 'Ink mixing craftsmanship - attention to color detail',
  },
  screenExposure: {
    src: '/images/factory-tour/screen-exposure-room.webp',
    alt: 'Screen exposure room with screen racks',
  },
  screenReclaim: {
    src: '/images/factory-tour/screen-reclaim-station.webp',
    alt: 'Screen reclaiming station',
  },
};

// Warehouse/facility images
export const warehouseImages = {
  facility: {
    src: '/images/warehouse/garment-decor-factory-montclair-ca.webp',
    alt: 'Garment Decor factory and warehouse in Montclair, CA',
  },
  aerialFacility: {
    src: '/images/warehouse/aerial-facility-montclair-ca.webp',
    alt: 'Aerial view of Garment Decor facility in Montclair, California',
  },
  embroideryDepartment: {
    src: '/images/warehouse/embroidery-department-wide.webp',
    alt: 'Embroidery department with multiple machines and workstations',
  },
  productionFloor: {
    src: '/images/warehouse/production-floor-screen-printing.webp',
    alt: 'Screen printing production floor with multiple press stations',
  },
};

// Brand assets
export const brandImages = {
  logoWordmarkDark: '/images/brand/logo-wordmark-dark.svg',
  logoWordmarkWhite: '/images/brand/logo-wordmark-white.svg',
  logoWordmarkWhiteAlt: '/images/brand/logo-wordmark-white-alt.svg',
  logoCircleDark: '/images/brand/logo-circle-dark.svg',
  logoCircleLight: '/images/brand/logo-circle-light.svg',
  logoIconWhite: '/images/brand/logo-icon-white.svg',
  favicon: '/images/brand/favicon.svg',
};

/**
 * Get images for a specific service
 * @param serviceSlug - The service slug (e.g., 'screen-printing', 'embroidery')
 * @returns ServiceImages object with hero and gallery images
 */
export function getServiceImages(serviceSlug: string): ServiceImages | null {
  return serviceImages[serviceSlug] || null;
}

/**
 * Get a random selection of gallery images for a service
 * @param serviceSlug - The service slug
 * @param count - Number of images to return
 * @returns Array of ServiceImage objects
 */
export function getRandomServiceImages(serviceSlug: string, count: number): ServiceImage[] {
  const images = serviceImages[serviceSlug]?.gallery || [];
  const shuffled = [...images].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
