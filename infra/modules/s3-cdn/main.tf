# ---------------------------------------------------------------------------
# S3 + CloudFront — Imágenes de negocios Ruta Azteca
#
# Flujo:
#   1. Next.js genera URL pre-firmada → cliente sube imagen directo a S3
#   2. CloudFront sirve las imágenes con caché (OAC — sin URLs públicas de S3)
# ---------------------------------------------------------------------------

locals {
  bucket_name = "ruta-azteca-images-${var.environment}"
}

# ---------------------------------------------------------------------------
# S3 Bucket — privado, solo accesible vía CloudFront
# ---------------------------------------------------------------------------

resource "aws_s3_bucket" "images" {
  bucket = local.bucket_name

  tags = {
    Name = local.bucket_name
  }
}

resource "aws_s3_bucket_public_access_block" "images" {
  bucket = aws_s3_bucket.images.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "images" {
  bucket = aws_s3_bucket.images.id
  versioning_configuration {
    status = var.environment == "prod" ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "images" {
  bucket = aws_s3_bucket.images.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CORS — permite uploads pre-firmados desde el navegador
resource "aws_s3_bucket_cors_configuration" "images" {
  bucket = aws_s3_bucket.images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# ---------------------------------------------------------------------------
# CloudFront Origin Access Control (OAC) — reemplaza el OAI obsoleto
# ---------------------------------------------------------------------------

resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "ruta-azteca-${var.environment}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ---------------------------------------------------------------------------
# CloudFront Distribution
# ---------------------------------------------------------------------------

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  comment             = "Ruta Azteca imágenes (${var.environment})"
  default_root_object = ""
  price_class         = "PriceClass_100" # US + Europa + Canadá — más barato

  origin {
    domain_name              = aws_s3_bucket.images.bucket_regional_domain_name
    origin_id                = "s3-${local.bucket_name}"
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-${local.bucket_name}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    # Caché agresiva — las imágenes no cambian (se sube con nuevo key)
    min_ttl     = 0
    default_ttl = 86400   # 1 día
    max_ttl     = 604800  # 7 días
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true # HTTPS con dominio *.cloudfront.net
  }

  tags = {
    Name = "ruta-azteca-${var.environment}-cdn"
  }
}

# ---------------------------------------------------------------------------
# Bucket Policy — solo CloudFront puede leer (vía OAC)
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "cloudfront_oac" {
  statement {
    sid    = "AllowCloudFrontOAC"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.images.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.main.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "images" {
  bucket = aws_s3_bucket.images.id
  policy = data.aws_iam_policy_document.cloudfront_oac.json

  depends_on = [aws_s3_bucket_public_access_block.images]
}
