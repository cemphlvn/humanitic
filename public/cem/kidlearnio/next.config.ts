import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Enable server actions for form handling
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Optimize for production
  poweredByHeader: false,
  // Environment variable validation
  env: {
    NEXT_PUBLIC_APP_NAME: 'KidLearnio',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
};

export default nextConfig;
