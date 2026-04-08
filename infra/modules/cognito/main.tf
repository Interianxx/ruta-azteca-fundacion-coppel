# ---------------------------------------------------------------------------
# Cognito User Pool — Ruta Azteca
#
# Grupos:
#   turista          → usuarios que buscan negocios
#   negocio_pendiente → registros esperando aprobación admin
#   negocio_activo    → negocios verificados y visibles en el mapa
#   admin             → equipo Ola México / DevsVelados
#
# OAuth: Google + Apple Sign In
# Hosted UI con dominio prefix de Cognito (sin certificado custom)
# ---------------------------------------------------------------------------

locals {
  prefix = "ruta-azteca-${var.environment}"
}

# ---------------------------------------------------------------------------
# User Pool
# ---------------------------------------------------------------------------

resource "aws_cognito_user_pool" "main" {
  name = local.prefix

  # Atributos estándar obligatorios
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Política de contraseñas — relajada para hackathon, endurecida en prod
  password_policy {
    minimum_length                   = var.environment == "prod" ? 10 : 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = var.environment == "prod" ? true : false
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  # MFA desactivado (OAuth es el flujo principal)
  mfa_configuration = "OFF"

  # Verificación por email
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Ruta Azteca — Código de verificación"
    email_message        = "Tu código de verificación para Ruta Azteca es: {####}"
  }

  # Atributos customizados del perfil
  schema {
    name                     = "role"
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
  }

  schema {
    name                     = "negocio_id"
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    string_attribute_constraints {
      min_length = 0
      max_length = 100
    }
  }

  # Retención de tokens
  user_pool_add_ons {
    advanced_security_mode = var.environment == "prod" ? "ENFORCED" : "OFF"
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  tags = {
    Name = local.prefix
  }
}

# ---------------------------------------------------------------------------
# Dominio hosted UI (prefix Cognito — sin certificado custom necesario)
# NOTA: El prefix debe ser único en la región. Si falla, cambiar en variables.tf
# ---------------------------------------------------------------------------

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${local.prefix}-auth"
  user_pool_id = aws_cognito_user_pool.main.id
}

# ---------------------------------------------------------------------------
# Identity Providers
# ---------------------------------------------------------------------------

resource "aws_cognito_identity_provider" "google" {
  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id                     = var.google_client_id
    client_secret                 = var.google_client_secret
    authorize_scopes              = "email profile openid"
    attributes_url                = "https://people.googleapis.com/v1/people/me?personFields="
    attributes_url_add_attributes = "true"
    authorize_url                 = "https://accounts.google.com/o/oauth2/v2/auth"
    oidc_issuer                   = "https://accounts.google.com"
    token_request_method          = "POST"
    token_url                     = "https://www.googleapis.com/oauth2/v4/token"
  }

  attribute_mapping = {
    email       = "email"
    name        = "name"
    username    = "sub"
    given_name  = "given_name"
    family_name = "family_name"
    picture     = "picture"
  }
}

# ---------------------------------------------------------------------------
# Apple Sign In — pendiente para fase 2
# Requiere cuenta Apple Developer ($99/año)
# Descomentar cuando se tengan las credenciales
# ---------------------------------------------------------------------------
# resource "aws_cognito_identity_provider" "apple" {
#   user_pool_id  = aws_cognito_user_pool.main.id
#   provider_name = "SignInWithApple"
#   provider_type = "SignInWithApple"
#
#   provider_details = {
#     client_id        = var.apple_client_id
#     team_id          = var.apple_team_id
#     key_id           = var.apple_key_id
#     private_key      = var.apple_private_key
#     authorize_scopes = "email name"
#   }
#
#   attribute_mapping = {
#     email    = "email"
#     name     = "name"
#     username = "sub"
#   }
# }

# ---------------------------------------------------------------------------
# App Client (Next.js / NextAuth)
# ---------------------------------------------------------------------------

resource "aws_cognito_user_pool_client" "nextjs" {
  name         = "${local.prefix}-nextjs"
  user_pool_id = aws_cognito_user_pool.main.id

  # Secret requerido por NextAuth para el intercambio de tokens server-side
  generate_secret = true

  # Flujos permitidos
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  # USER_PASSWORD_AUTH requerido para el flujo de email + contraseña (CredentialsProvider)
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  supported_identity_providers = [
    "COGNITO",
    aws_cognito_identity_provider.google.provider_name,
    # aws_cognito_identity_provider.apple.provider_name, # fase 2
  ]

  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  # Validez de tokens
  access_token_validity  = 1   # hora
  id_token_validity      = 1   # hora
  refresh_token_validity = 30  # días

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Evitar que el frontend lea el refresh token (se maneja server-side)
  prevent_user_existence_errors = "ENABLED"

  # Atributos que el cliente puede leer/escribir
  read_attributes = [
    "email", "email_verified", "name", "given_name", "family_name",
    "picture", "custom:role", "custom:negocio_id"
  ]
  write_attributes = [
    "email", "name", "given_name", "family_name", "picture",
    "custom:role", "custom:negocio_id"
  ]

  depends_on = [
    aws_cognito_identity_provider.google,
    # aws_cognito_identity_provider.apple, # fase 2
  ]
}

# ---------------------------------------------------------------------------
# Grupos de usuarios
# ---------------------------------------------------------------------------

resource "aws_cognito_user_group" "turista" {
  name         = "turista"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Turistas que buscan negocios locales"
  precedence   = 10
}

resource "aws_cognito_user_group" "negocio_pendiente" {
  name         = "negocio_pendiente"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Dueños de negocio pendientes de verificación"
  precedence   = 5
}

resource "aws_cognito_user_group" "negocio_activo" {
  name         = "negocio_activo"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Dueños de negocio verificados — visibles en el mapa"
  precedence   = 4
}

resource "aws_cognito_user_group" "admin" {
  name         = "admin"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Administradores del programa Ola México"
  precedence   = 1
}
