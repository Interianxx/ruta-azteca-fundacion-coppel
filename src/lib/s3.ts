import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { AWS_REGION, awsCredentials } from '@/lib/aws-config'

const s3 = new S3Client({
  region:                     AWS_REGION,
  credentials:                awsCredentials,
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
