variable "environment" {
  description = "Entorno de despliegue (dev | prod)"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "ARN de la tabla DynamoDB principal (output del módulo dynamodb)"
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN del bucket S3 de imágenes (output del módulo s3-cdn)"
  type        = string
}

variable "cognito_user_pool_arn" {
  description = "ARN del Cognito User Pool (output del módulo cognito)"
  type        = string
}
