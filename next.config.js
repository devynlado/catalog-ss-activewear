/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
    ],
  },
};

module.exports = nextConfig;
