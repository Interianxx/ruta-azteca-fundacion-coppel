variable "environment" {
  description = "Entorno de despliegue (dev, prod)"
  type        = string
}

variable "aws_region" {
  description = "Región AWS"
  type        = string
  default     = "us-east-1"
}

variable "lambda_chatbot_name" {
  description = "Nombre de la Lambda chatbot"
  type        = string
}

variable "lambda_traduccion_name" {
  description = "Nombre de la Lambda traduccion"
  type        = string
}

variable "lambda_voz_name" {
  description = "Nombre de la Lambda voz"
  type        = string
}

variable "alarm_errors_threshold" {
  description = "Número de errores Lambda para activar la alarma"
  type        = number
  default     = 5
}
