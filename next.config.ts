import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  compress: true,
  experimental: {
    viewTransition: true,
    optimizePackageImports: ['sonner'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig
