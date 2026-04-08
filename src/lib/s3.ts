import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'us-east-1',
  // Disable automatic checksum — presigned PUT URLs are used by the browser
  // which cannot calculate SDK-generated checksums (CRC32, SHA256, etc.)
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

const BUCKET = process.env.S3_BUCKET_NAME ?? 'ruta-azteca-images'
const CDN    = process.env.CLOUDFRONT_URL ?? ''

/** Genera URL pre-firmada para que el cliente suba la imagen directo a S3 */
export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(s3, command, { expiresIn: 300 }) // 5 minutos
}

/** Retorna la URL pública de CloudFront (o S3 si no hay CDN configurado) */
export function getCdnUrl(key: string): string {
  if (CDN) return `${CDN}/${key}`
  return `https://${BUCKET}.s3.amazonaws.com/${key}`
}
