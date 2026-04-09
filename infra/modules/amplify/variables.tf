variable "environment" {
  description = "Entorno de despliegue (dev | prod)"
  type        = string
}

variable "github_repo" {
  description = "URL del repositorio GitHub (https://github.com/owner/repo)"
  type        = string
}

variable "github_branch" {
  description = "Rama de GitHub a desplegar (ej. main, dev)"
  type        = string
  default     = "main"
}

variable "github_token" {
  description = "GitHub Personal Access Token con scope 'repo' — github.com/settings/tokens"
  type        = string
  sensitive   = true
}

# ── Valores inyectados desde otros módulos ───────────────────────────────────

variable "aws_region" {
  type = string
}

variable "aws_access_key_id" {
  description = "AWS_ACCESS_KEY_ID del IAM user nextjs-bff"
  type        = string
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS_SECRET_ACCESS_KEY del IAM user nextjs-bff"
  type        = string
  sensitive   = true
}

variable "cognito_user_pool_id" { type = string }
variable "cognito_client_id"    { type = string }
variable "cognito_client_secret" {
  type      = string
  sensitive = true
}
variable "cognito_domain"   { type = string }
variable "cognito_jwks_uri" { type = string }

variable "dynamodb_table_name" { type = string }
variable "s3_bucket_name"      { type = string }
variable "cloudfront_url"      { type = string }

variable "lambda_chatbot_name"    { type = string }
variable "lambda_traduccion_name" { type = string }
variable "lambda_voz_name"        { type = string }

variable "nextauth_secret" {
  description = "NEXTAUTH_SECRET — genera uno con: openssl rand -hex 32"
  type        = string
  sensitive   = true
}

variable "nextauth_url" {
  description = <<-EOT
    URL pública de la app (NEXTAUTH_URL).
    Primera vez: deja vacío ("") — aplica, copia la URL del output amplify_app_url, vuelve a aplicar.
  EOT
  type    = string
  default = ""
}

variable "mapbox_token" {
  description = "NEXT_PUBLIC_MAPBOX_TOKEN — account.mapbox.com"
  type        = string
  sensitive   = true
}
