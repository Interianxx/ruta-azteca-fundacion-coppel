// Bracket notation prevents Turbopack from statically replacing these with
// undefined at build time. At Lambda runtime the execution role injects
// AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_SESSION_TOKEN.
const env = process.env as Record<string, string | undefined>

export const AWS_REGION = env['AWS_REGION'] ?? 'us-east-1'

export const awsCredentials =
  env['AWS_ACCESS_KEY_ID'] && env['AWS_SECRET_ACCESS_KEY']
    ? {
        accessKeyId:     env['AWS_ACCESS_KEY_ID'],
        secretAccessKey: env['AWS_SECRET_ACCESS_KEY'],
        sessionToken:    env['AWS_SESSION_TOKEN'],
      }
    : undefined
