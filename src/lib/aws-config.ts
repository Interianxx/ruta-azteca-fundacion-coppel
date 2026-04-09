// Amplify WEB_COMPUTE does not inject Lambda execution role credentials into
// process.env. Instead, we use a dedicated IAM user whose credentials are
// inlined into the server bundle at build time via next.config.ts env.
export const AWS_REGION = process.env.SSR_AWS_REGION ?? 'us-east-1'

export const awsCredentials =
  process.env.SSR_AWS_ACCESS_KEY_ID && process.env.SSR_AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId:     process.env.SSR_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.SSR_AWS_SECRET_ACCESS_KEY,
      }
    : undefined
