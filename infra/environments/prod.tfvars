# ---------------------------------------------------------------------------
# Prod — actualizar callback_urls cuando el dominio esté definido
# ---------------------------------------------------------------------------

environment = "prod"
aws_region  = "us-east-1"

callback_urls = [
  "https://rutaazteca.com/api/auth/callback/cognito",
  # Agregar URL de Vercel/Amplify cuando se defina
]

logout_urls = [
  "https://rutaazteca.com",
]
