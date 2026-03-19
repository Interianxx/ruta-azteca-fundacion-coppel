output "lambda_role_arn" {
  description = "ARN del IAM role para las Lambdas — usado en módulo lambda"
  value       = aws_iam_role.lambda.arn
}

output "lambda_role_name" {
  description = "Nombre del IAM role para las Lambdas"
  value       = aws_iam_role.lambda.name
}

output "nextjs_bff_policy_arn" {
  description = "ARN de la política para el BFF de Next.js — adjuntar al usuario/rol de despliegue"
  value       = aws_iam_policy.nextjs_bff.arn
}

output "nextjs_bff_access_key_id" {
  description = "AWS_ACCESS_KEY_ID para el BFF de Next.js"
  value       = aws_iam_access_key.nextjs_bff.id
  sensitive   = true
}

output "nextjs_bff_secret_access_key" {
  description = "AWS_SECRET_ACCESS_KEY para el BFF de Next.js"
  value       = aws_iam_access_key.nextjs_bff.secret
  sensitive   = true
}
