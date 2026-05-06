/**
 * Security headers applied to every response.
 *
 * What each one does and why it's safe to start with these:
 * - Strict-Transport-Security: locks browsers into HTTPS for 6 months so a
 *   man-in-the-middle on coffee-shop wifi can't downgrade to HTTP.
 *   `preload` is intentionally omitted — once you preload it's a bear to
 *   undo. Add it later when you're confident.
 * - X-Content-Type-Options: stops browsers from MIME-sniffing responses,
 *   blocks a class of XSS where an uploaded "image" is actually JS.
 * - X-Frame-Options: SAMEORIGIN prevents other sites from iframing yours
 *   (clickjacking protection). DENY would also work but SAMEORIGIN keeps
 *   /studio happy if Sanity ever opens self-iframed previews.
 * - Referrer-Policy: doesn't leak the full URL of the page the user came
 *   from to third-party resources. Helps with privacy and prevents leaking
 *   tokens that some apps stick in URLs.
 * - Permissions-Policy: disables APIs the site doesn't use. Cheap defense
 *   in depth: if a third-party script ever gets compromised it can't
 *   silently turn on the camera/mic.
 * - X-DNS-Prefetch-Control: small perf win, not security.
 *
 * NOTE: Content-Security-Policy is intentionally NOT set here. CSP needs
 * careful per-app testing (Stripe, Google Analytics, Sanity, Supabase,
 * styled-components inline styles all need explicit allowlisting) and is
 * trivially easy to break with a wrong directive. We'll layer it in as a
 * separate, tested change.
 */
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=15552000; includeSubDomains',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'browsing-topics=()',
      'interest-cohort=()',
    ].join(', '),
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes. The Sanity Studio at /studio is on the same
        // origin so SAMEORIGIN doesn't break it; revisit if you ever embed
        // the studio elsewhere.
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
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
      // Otto Cap images
      {
        protocol: 'https',
        hostname: 's3-us-west-2.amazonaws.com',
        pathname: '/ottocap/**',
      },
      {
        protocol: 'https',
        hostname: 'drive.usercontent.google.com',
        pathname: '/**',
      },
      // Sanity CDN (portfolio images)
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
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
