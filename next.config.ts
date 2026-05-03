import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Prevent Turbopack from bundling next/og through its shared module context,
  // which causes the "Next.js package not found" HMR panic on dynamic routes.
  serverExternalPackages: ['next/og'],
  // Allow the local network IP to access dev resources without cross-origin warnings
  allowedDevOrigins: ['172.31.128.1'],
};

export default nextConfig;
