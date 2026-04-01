output "user_pool_id" {
  description = "ID del Cognito User Pool — NEXT_PUBLIC_COGNITO_USER_POOL_ID"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "ARN del User Pool (para políticas IAM)"
  value       = aws_cognito_user_pool.main.arn
}

output "client_id" {
  description = "App Client ID de Next.js — NEXT_PUBLIC_COGNITO_CLIENT_ID"
  value       = aws_cognito_user_pool_client.nextjs.id
}

output "client_secret" {
  description = "App Client Secret — COGNITO_CLIENT_SECRET (nunca exponer al browser)"
  value       = aws_cognito_user_pool_client.nextjs.client_secret
  sensitive   = true
}

output "domain" {
  description = "Dominio del hosted UI (sin https://) — NEXT_PUBLIC_COGNITO_DOMAIN"
  value       = "${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
}

output "jwks_uri" {
  description = "URI JWKS para verificar tokens JWT en el middleware de Next.js"
  value       = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}/.well-known/jwks.json"
}

output "issuer" {
  description = "Issuer del JWT (para NextAuth / jose)"
  value       = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}"
}

# Data source para la región actual
data "aws_region" "current" {}
