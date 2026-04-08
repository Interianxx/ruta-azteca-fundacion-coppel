import type { NextConfig } from "next";
import WithSerwistInit from "@serwist/next";

const withSerwist = WithSerwistInit({
  swSrc: 'src/app/service_worker.ts',
  swDest: 'public/service-worker.js',
  reloadOnOnline: true,
})

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

export default withSerwist(nextConfig);
