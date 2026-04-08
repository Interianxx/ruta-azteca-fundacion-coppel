output "app_id" {
  description = "ID de la Amplify App"
  value       = aws_amplify_app.frontend.id
}

output "app_url" {
  description = "URL pública de la app desplegada — úsala como nextauth_url en el segundo apply"
  value       = "https://${aws_amplify_branch.main.branch_name}.${aws_amplify_app.frontend.default_domain}"
}

output "default_domain" {
  description = "Dominio base generado por Amplify"
  value       = aws_amplify_app.frontend.default_domain
}
