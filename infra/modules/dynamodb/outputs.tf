output "table_name" {
  description = "Nombre de la tabla DynamoDB — DYNAMODB_TABLE_NAME"
  value       = aws_dynamodb_table.main.name
}

output "table_arn" {
  description = "ARN de la tabla — usado en políticas IAM de Lambda y Next.js"
  value       = aws_dynamodb_table.main.arn
}

output "table_stream_arn" {
  description = "ARN del DynamoDB Stream (null si stream no está habilitado)"
  value       = aws_dynamodb_table.main.stream_arn
}

output "gsi_status_name" {
  description = "Nombre del GSI de status (para queries en código)"
  value       = "status-index"
}

output "gsi_categoria_name" {
  description = "Nombre del GSI de categoría (para queries en código)"
  value       = "categoria-index"
}
