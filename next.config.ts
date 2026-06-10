import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Prevent Turbopack from bundling next/og through its shared module context,
  // which causes the "Next.js package not found" HMR panic on dynamic routes.
  serverExternalPackages: ['next/og', '@resvg/resvg-js'],
  // Allow the local network IP to access dev resources without cross-origin warnings
  allowedDevOrigins: ['172.31.128.1'],
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
      },
    ],
  },
};

export default nextConfig;
