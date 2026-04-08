output "bucket_name" {
  description = "Nombre del bucket S3 — S3_BUCKET_NAME"
  value       = aws_s3_bucket.images.id
}

output "bucket_arn" {
  description = "ARN del bucket (para políticas IAM)"
  value       = aws_s3_bucket.images.arn
}

output "cloudfront_url" {
  description = "URL base de CloudFront — CLOUDFRONT_URL"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "ID de la distribución CloudFront (para invalidaciones de caché)"
  value       = aws_cloudfront_distribution.main.id
}
