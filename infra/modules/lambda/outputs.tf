output "chatbot_arn" {
  description = "ARN de la Lambda chatbot"
  value       = aws_lambda_function.chatbot.arn
}

output "traduccion_arn" {
  description = "ARN de la Lambda traduccion"
  value       = aws_lambda_function.traduccion.arn
}

output "voz_arn" {
  description = "ARN de la Lambda voz"
  value       = aws_lambda_function.voz.arn
}

output "chatbot_name" {
  description = "Nombre de la Lambda chatbot — LAMBDA_CHATBOT_NAME"
  value       = aws_lambda_function.chatbot.function_name
}

output "traduccion_name" {
  description = "Nombre de la Lambda traduccion — LAMBDA_TRADUCCION_NAME"
  value       = aws_lambda_function.traduccion.function_name
}

output "voz_name" {
  description = "Nombre de la Lambda voz — LAMBDA_VOZ_NAME"
  value       = aws_lambda_function.voz.function_name
}
