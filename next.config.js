/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Bypass Vercel's Image Optimization - SS Activewear images are already CDN-optimized
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.ssactivewear.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdnm.ssactivewear.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.ssactivewear.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      // Location pages
      {
        source: '/custom-apparel-hollywood',
        destination: '/locations/hollywood',
        permanent: true,
      },
      {
        source: '/custom-apparel-hollywood/',
        destination: '/locations/hollywood',
        permanent: true,
      },
      {
        source: '/orange-county-custom-apparel',
        destination: '/locations/orange-county',
        permanent: true,
      },
      {
        source: '/orange-county-custom-apparel/',
        destination: '/locations/orange-county',
        permanent: true,
      },
      {
        source: '/santa-barbara-custom-merch-apparel',
        destination: '/locations/santa-barbara',
        permanent: true,
      },
      {
        source: '/santa-barbara-custom-merch-apparel/',
        destination: '/locations/santa-barbara',
        permanent: true,
      },
      // Service pages
      {
        source: '/jumbo-screen-printing-page',
        destination: '/services/jumbo-screen-printing',
        permanent: true,
      },
      {
        source: '/jumbo-screen-printing-page/',
        destination: '/services/jumbo-screen-printing',
        permanent: true,
      },
      {
        source: '/plastisol-screen-printing',
        destination: '/services/screen-printing',
        permanent: true,
      },
      {
        source: '/plastisol-screen-printing/',
        destination: '/services/screen-printing',
        permanent: true,
      },
      {
        source: '/puff-screen-printing',
        destination: '/services/puff-screen-printing',
        permanent: true,
      },
      {
        source: '/puff-screen-printing/',
        destination: '/services/puff-screen-printing',
        permanent: true,
      },
      {
        source: '/digital-screen-printing',
        destination: '/services/digital-screen-printing',
        permanent: true,
      },
      {
        source: '/digital-screen-printing/',
        destination: '/services/digital-screen-printing',
        permanent: true,
      },
      {
        source: '/wholesale-custom-embroidery',
        destination: '/services/embroidery',
        permanent: true,
      },
      {
        source: '/wholesale-custom-embroidery/',
        destination: '/services/embroidery',
        permanent: true,
      },
      // Generic custom apparel page
      {
        source: '/custom-apparel',
        destination: '/services/screen-printing',
        permanent: true,
      },
      {
        source: '/custom-apparel/',
        destination: '/services/screen-printing',
        permanent: true,
      },
      // Portfolio pages (pattern match)
      {
        source: '/portfolio/jumbo-screen-printing-and-embroidery-on-la-apparel-1801gd-t-shirts',
        destination: '/portfolio/jumbo-screen-printing-black-wall-street',
        permanent: true,
      },
      {
        source: '/portfolio/custom-wholesale-puff-print-hoodies-for-awful-cloth',
        destination: '/portfolio/puff-print-hoodies-awful-cloth',
        permanent: true,
      },
      {
        source: '/portfolio/puff-embroidery-hats-ideas-will-inspire',
        destination: '/portfolio/puff-embroidery-hats',
        permanent: true,
      },
      {
        source: '/portfolio/custom-embroidery-for-otto-cap-31-069-perfect-for-streetwear-brands',
        destination: '/portfolio/otto-cap-embroidery-cactus-club',
        permanent: true,
      },
      {
        source: '/portfolio/custom-jumbo-screen-prints-on-independent-trading-ind420xd-hoodies',
        destination: '/portfolio/born-raised-online-ceramics',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
