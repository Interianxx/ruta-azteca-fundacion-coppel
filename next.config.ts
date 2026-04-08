import type { NextConfig } from "next";
import WithSerwistInit from "@serwist/next";

const withSerwist = WithSerwistInit({
  swSrc: 'src/app/service_worker.ts',
  swDest: 'public/service-worker.js',
  reloadOnOnline: true,
})

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling AWS SDK — keeps it as a Node.js external so
  // the Lambda execution role credentials (AWS_ACCESS_KEY_ID etc.) are read
  // from the real process.env at runtime, not replaced at build time.
  serverExternalPackages: [
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/lib-dynamodb',
    '@aws-sdk/client-cognito-identity-provider',
    '@aws-sdk/client-lambda',
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner',
    '@aws-sdk/credential-providers',
  ],

  // Amplify WEB_COMPUTE: env vars are available during `next build` (via SSM)
  // but are NOT injected into the Lambda runtime. Inlining them here bakes
  // them into the server bundle so API routes can read them at runtime.
  env: {
    NEXTAUTH_SECRET:            process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL:               process.env.NEXTAUTH_URL,
    COGNITO_CLIENT_SECRET:      process.env.COGNITO_CLIENT_SECRET,
    DYNAMODB_TABLE_NAME:        process.env.DYNAMODB_TABLE_NAME,
    S3_BUCKET_NAME:             process.env.S3_BUCKET_NAME,
    CLOUDFRONT_URL:             process.env.CLOUDFRONT_URL,
    LAMBDA_CHATBOT_NAME:        process.env.LAMBDA_CHATBOT_NAME,
    LAMBDA_TRADUCCION_NAME:     process.env.LAMBDA_TRADUCCION_NAME,
    LAMBDA_VOZ_NAME:            process.env.LAMBDA_VOZ_NAME,
  },
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
