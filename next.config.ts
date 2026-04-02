import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dbhrgxqbctm9b.cloudfront.net',
        pathname: '/negocios/**',
      },
    ],
  },
};

export default nextConfig;
