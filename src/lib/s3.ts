import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const env = process.env as Record<string, string | undefined>

const credentials = env['AWS_ACCESS_KEY_ID'] && env['AWS_SECRET_ACCESS_KEY']
  ? {
      accessKeyId:     env['AWS_ACCESS_KEY_ID'],
      secretAccessKey: env['AWS_SECRET_ACCESS_KEY'],
      sessionToken:    env['AWS_SESSION_TOKEN'],
    }
  : undefined

const s3 = new S3Client({
  region:                     env['AWS_REGION'] ?? 'us-east-1',
  credentials,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

const BUCKET = process.env.S3_BUCKET_NAME ?? 'ruta-azteca-images'
const CDN    = process.env.CLOUDFRONT_URL ?? ''

export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    ContentType: contentType,
  })
  return getSignedUrl(s3, command, { expiresIn: 300 })
}

export function getCdnUrl(key: string): string {
  if (CDN) return `${CDN}/${key}`
  return `https://${BUCKET}.s3.amazonaws.com/${key}`
}
