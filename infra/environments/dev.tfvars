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

callback_urls = [
  "http://localhost:3000/api/auth/callback/cognito",
]

logout_urls = [
  "http://localhost:3000",
]
