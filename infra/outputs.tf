# ---------------------------------------------------------------------------
# Outputs raíz — agregan los outputs de cada módulo
# Útiles para scripts de seed, CI/CD y configuración del frontend
# ---------------------------------------------------------------------------

# --- Cognito ---

output "cognito_user_pool_id" {
  description = "ID del User Pool (NEXT_PUBLIC_COGNITO_USER_POOL_ID)"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Client ID de la app Next.js (NEXT_PUBLIC_COGNITO_CLIENT_ID)"
  value       = module.cognito.client_id
}

output "cognito_client_secret" {
  description = "Client Secret para NextAuth server-side (COGNITO_CLIENT_SECRET)"
  value       = module.cognito.client_secret
  sensitive   = true
}

output "cognito_domain" {
  description = "Dominio del hosted UI de Cognito (NEXT_PUBLIC_COGNITO_DOMAIN)"
  value       = module.cognito.domain
}

output "cognito_jwks_uri" {
  description = "URI de las claves públicas JWT para verificar tokens"
  value       = module.cognito.jwks_uri
}

# --- S3 / CloudFront ---

output "s3_bucket_name" {
  description = "Nombre del bucket de imágenes — S3_BUCKET_NAME"
  value       = module.s3_cdn.bucket_name
}

output "cloudfront_url" {
  description = "URL de CloudFront — CLOUDFRONT_URL"
  value       = module.s3_cdn.cloudfront_url
}

# --- IAM ---

output "lambda_role_arn" {
  description = "ARN del role IAM para las Lambdas"
  value       = module.ai_services.lambda_role_arn
}

output "nextjs_bff_policy_arn" {
  description = "ARN de la política IAM para el BFF de Next.js — adjuntar al usuario de despliegue"
  value       = module.ai_services.nextjs_bff_policy_arn
}

output "nextjs_bff_access_key_id" {
  description = "AWS_ACCESS_KEY_ID para el .env.local del BFF (Gerardo)"
  value       = module.ai_services.nextjs_bff_access_key_id
  sensitive   = true
}

output "nextjs_bff_secret_access_key" {
  description = "AWS_SECRET_ACCESS_KEY para el .env.local del BFF (Gerardo)"
  value       = module.ai_services.nextjs_bff_secret_access_key
  sensitive   = true
}

# --- Monitoring ---

output "cloudwatch_dashboard_url" {
  description = "URL directa al dashboard de CloudWatch"
  value       = module.monitoring.dashboard_url
}

# --- Lambda ---

output "lambda_chatbot_name" {
  description = "Nombre de la Lambda chatbot — LAMBDA_CHATBOT_NAME"
  value       = module.lambda.chatbot_name
}

output "lambda_traduccion_name" {
  description = "Nombre de la Lambda traduccion — LAMBDA_TRADUCCION_NAME"
  value       = module.lambda.traduccion_name
}

output "lambda_voz_name" {
  description = "Nombre de la Lambda voz — LAMBDA_VOZ_NAME"
  value       = module.lambda.voz_name
}

# --- Amplify ---

output "amplify_app_url" {
  description = "URL pública del frontend — úsala como nextauth_url en el segundo apply"
  value       = module.amplify.app_url
}

output "amplify_app_id" {
  description = "ID de la Amplify App"
  value       = module.amplify.app_id
}

# --- DynamoDB ---

output "dynamodb_table_name" {
  description = "Nombre de la tabla principal DynamoDB"
  value       = module.dynamodb.table_name
}

output "dynamodb_table_arn" {
  description = "ARN de la tabla principal DynamoDB (para políticas IAM)"
  value       = module.dynamodb.table_arn
}
