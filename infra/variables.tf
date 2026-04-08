# ---------------------------------------------------------------------------
# Variables globales — valores no-sensibles en environments/*.tfvars
# Valores sensibles: variables de entorno TF_VAR_* o terraform.tfvars (gitignored)
# ---------------------------------------------------------------------------

variable "aws_region" {
  description = "Región AWS donde se despliegan todos los recursos"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Entorno de despliegue (dev | prod)"
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment debe ser 'dev' o 'prod'."
  }
}

# ---------------------------------------------------------------------------
# OAuth — Google
# ---------------------------------------------------------------------------

variable "google_client_id" {
  description = "Client ID de Google OAuth 2.0 (Google Cloud Console → Credentials)"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Client Secret de Google OAuth 2.0"
  type        = string
  sensitive   = true
}

# ---------------------------------------------------------------------------
# OAuth — Apple Sign In (fase 2)
# ---------------------------------------------------------------------------
# variable "apple_client_id" {
#   description = "Services ID de Apple (com.tudominio.rutaazteca)"
#   type        = string
#   sensitive   = true
# }
#
# variable "apple_team_id" {
#   description = "Team ID de Apple Developer Account (10 caracteres)"
#   type        = string
#   sensitive   = true
# }
#
# variable "apple_key_id" {
#   description = "Key ID de la llave privada de Apple Sign In"
#   type        = string
#   sensitive   = true
# }
#
# variable "apple_private_key" {
#   description = "Llave privada PEM de Apple Sign In (contenido completo del archivo .p8)"
#   type        = string
#   sensitive   = true
# }

# ---------------------------------------------------------------------------
# URLs de autenticación
# ---------------------------------------------------------------------------

variable "callback_urls" {
  description = "URLs permitidas como callback OAuth (incluir localhost para dev)"
  type        = list(string)
  default     = ["http://localhost:3000/api/auth/callback/cognito"]
}

variable "logout_urls" {
  description = "URLs permitidas para logout"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "cors_origins" {
  description = "Orígenes permitidos en CORS del bucket S3 (solo protocol://host:port, sin paths)"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

# ---------------------------------------------------------------------------
# Amplify / GitHub
# ---------------------------------------------------------------------------

variable "github_repo" {
  description = "URL del repositorio GitHub (https://github.com/owner/repo)"
  type        = string
}

variable "github_branch" {
  description = "Rama de GitHub a desplegar"
  type        = string
  default     = "main"
}

variable "github_token" {
  description = "GitHub Personal Access Token con scope 'repo'"
  type        = string
  sensitive   = true
}

# ---------------------------------------------------------------------------
# NextAuth
# ---------------------------------------------------------------------------

variable "nextauth_secret" {
  description = "NEXTAUTH_SECRET — genera con: openssl rand -hex 32"
  type        = string
  sensitive   = true
}

variable "nextauth_url" {
  description = "URL pública de la app. Vacío en el primer apply; rellena con el output amplify_app_url y vuelve a aplicar."
  type        = string
  default     = ""
}

# ---------------------------------------------------------------------------
# Mapbox
# ---------------------------------------------------------------------------

variable "mapbox_token" {
  description = "NEXT_PUBLIC_MAPBOX_TOKEN — account.mapbox.com"
  type        = string
  sensitive   = true
}
