variable "environment" {
  description = "Entorno de despliegue (dev | prod)"
  type        = string
}

variable "google_client_id" {
  description = "Client ID de Google OAuth 2.0"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Client Secret de Google OAuth 2.0"
  type        = string
  sensitive   = true
}

# ---------------------------------------------------------------------------
# Apple Sign In — fase 2 (descomentar junto con el provider en main.tf)
# ---------------------------------------------------------------------------
# variable "apple_client_id" {
#   description = "Services ID de Apple Sign In"
#   type        = string
#   sensitive   = true
# }
#
# variable "apple_team_id" {
#   description = "Team ID de Apple Developer"
#   type        = string
#   sensitive   = true
# }
#
# variable "apple_key_id" {
#   description = "Key ID de la llave privada Apple"
#   type        = string
#   sensitive   = true
# }
#
# variable "apple_private_key" {
#   description = "Contenido PEM de la llave privada Apple (.p8)"
#   type        = string
#   sensitive   = true
# }

variable "callback_urls" {
  description = "URLs de callback OAuth permitidas"
  type        = list(string)
}

variable "logout_urls" {
  description = "URLs de logout permitidas"
  type        = list(string)
}
