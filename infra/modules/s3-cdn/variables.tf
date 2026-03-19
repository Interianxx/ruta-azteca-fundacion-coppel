variable "environment" {
  description = "Entorno de despliegue (dev | prod)"
  type        = string
}

variable "allowed_origins" {
  description = "Orígenes permitidos en CORS del bucket (para uploads pre-firmados)"
  type        = list(string)
  default     = ["http://localhost:3000"]
}
