# ---------------------------------------------------------------------------
# Dev — valores no-sensibles
# Bootstrap del bucket de estado (una sola vez, antes de terraform init):
#   aws s3api create-bucket --bucket ruta-azteca-tfstate --region us-east-1
#   aws s3api put-bucket-versioning --bucket ruta-azteca-tfstate \
#     --versioning-configuration Status=Enabled
#
# Sensibles (google_client_id, etc.) van en variables de entorno:
#   export TF_VAR_google_client_id="..."
#   export TF_VAR_google_client_secret="..."
#   export TF_VAR_apple_client_id="..."
#   export TF_VAR_apple_team_id="..."
#   export TF_VAR_apple_key_id="..."
#   export TF_VAR_apple_private_key="$(cat AuthKey_XXXXXXXX.p8)"
# ---------------------------------------------------------------------------

environment = "dev"
aws_region  = "us-east-1"

# ---------------------------------------------------------------------------
# GitHub — reemplaza con tu repo y rama
# github_token va en variable de entorno: export TF_VAR_github_token="ghp_..."
# ---------------------------------------------------------------------------
github_repo   = "https://github.com/Interianxx/ruta-azteca-fundacion-coppel"
github_branch = "main"

# ---------------------------------------------------------------------------
# NextAuth
# nextauth_secret va en variable de entorno: export TF_VAR_nextauth_secret="..."
# nextauth_url: vacío en el primer apply.
#   Después del primer apply, copia el output amplify_app_url aquí y vuelve a aplicar.
# ---------------------------------------------------------------------------
nextauth_url = ""

# ---------------------------------------------------------------------------
# Mapbox — va en variable de entorno: export TF_VAR_mapbox_token="pk.eyJ1..."
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Cognito callbacks — se actualizan en el segundo apply con la URL de Amplify
# ---------------------------------------------------------------------------
callback_urls = [
  "http://localhost:3000/api/auth/callback/cognito",
  "https://main.dq7orj9s3fr7v.amplifyapp.com/api/auth/callback/cognito",
]

logout_urls = [
  "http://localhost:3000",
  "http://localhost:3000/login",
  "https://main.dq7orj9s3fr7v.amplifyapp.com",
]
