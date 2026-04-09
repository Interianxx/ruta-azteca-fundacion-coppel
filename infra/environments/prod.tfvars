# ---------------------------------------------------------------------------
# Prod — actualizar después del primer apply con la URL de Amplify
# ---------------------------------------------------------------------------

environment = "prod"
aws_region  = "us-east-1"

github_repo   = "https://github.com/TU_ORG/ruta-azteca"
github_branch = "main"

nextauth_url = "" # Rellenar con output amplify_app_url tras el primer apply

callback_urls = [
  "https://rutaazteca.com/api/auth/callback/cognito",
  # "https://main.XXXXXXXX.amplifyapp.com/api/auth/callback/cognito",
]

logout_urls = [
  "https://rutaazteca.com",
  # "https://main.XXXXXXXX.amplifyapp.com",
]
