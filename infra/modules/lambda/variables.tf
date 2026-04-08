variable "environment" {
  description = "Entorno de despliegue (dev | prod)"
  type        = string
}

variable "aws_region" {
  description = "Región AWS"
  type        = string
  default     = "us-east-1"
}

variable "lambda_role_arn" {
  description = "ARN del IAM role de ejecución (output del módulo ai-services)"
  type        = string
}

variable "dynamodb_table_name" {
  description = "Nombre de la tabla DynamoDB (output del módulo dynamodb)"
  type        = string
}

variable "s3_bucket_name" {
  description = "Nombre del bucket S3 de imágenes (output del módulo s3-cdn)"
  type        = string
}
