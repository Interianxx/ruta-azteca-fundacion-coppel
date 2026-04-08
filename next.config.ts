import type { NextConfig } from "next";
import WithSerwistInit from "@serwist/next";

const withSerwist = WithSerwistInit({
  swSrc: 'src/app/service_worker.ts',
  swDest: 'public/service-worker.js',
  reloadOnOnline: true,
})

const nextConfig: NextConfig = {
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
    // IAM user credentials for DynamoDB/S3/Cognito access from SSR Lambda
    SSR_AWS_REGION:             process.env.SSR_AWS_REGION,
    SSR_AWS_ACCESS_KEY_ID:      process.env.SSR_AWS_ACCESS_KEY_ID,
    SSR_AWS_SECRET_ACCESS_KEY:  process.env.SSR_AWS_SECRET_ACCESS_KEY,
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
