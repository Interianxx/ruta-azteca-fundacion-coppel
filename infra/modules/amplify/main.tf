# ---------------------------------------------------------------------------
# AWS Amplify — hosting SSR para Next.js (Ruta Azteca frontend)
#
# Flujo de deploy:
#   1. terraform apply   → crea la app, output amplify_app_url
#   2. Copia la URL en tfvars como nextauth_url
#   3. terraform apply   → actualiza NEXTAUTH_URL + Cognito callbacks
# ---------------------------------------------------------------------------

locals {
  prefix = "ruta-azteca-${var.environment}"

  # NEXTAUTH_URL: si se proporcionó una URL real, úsala; si no, usa placeholder
  # (el primer apply crea la app; el segundo actualiza la URL)
  nextauth_url_effective = var.nextauth_url != "" ? var.nextauth_url : "https://placeholder.amplifyapp.com"
}

# ---------------------------------------------------------------------------
# IAM Service Role — Amplify necesita permisos para desplegar
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "amplify_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["amplify.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "amplify" {
  name               = "${local.prefix}-amplify-role"
  assume_role_policy = data.aws_iam_policy_document.amplify_assume.json

  tags = { Name = "${local.prefix}-amplify-role" }
}

resource "aws_iam_role_policy_attachment" "amplify_managed" {
  role       = aws_iam_role.amplify.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess-Amplify"
}

# Permisos del BFF (DynamoDB, Lambda invoke, S3, Cognito) en runtime SSR
resource "aws_iam_role_policy_attachment" "amplify_bff" {
  role       = aws_iam_role.amplify.name
  policy_arn = var.nextjs_bff_policy_arn
}

# ---------------------------------------------------------------------------
# Amplify App
# ---------------------------------------------------------------------------

resource "aws_amplify_app" "frontend" {
  name         = local.prefix
  repository   = var.github_repo
  access_token = var.github_token
  platform     = "WEB_COMPUTE" # SSR — Next.js App Router

  iam_service_role_arn = aws_iam_role.amplify.arn

  build_spec = <<-YAML
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - yarn install --frozen-lockfile
        build:
          commands:
            - yarn build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - .next/cache/**/*
          - node_modules/**/*
  YAML

  # Variables de entorno — inyectadas desde outputs de otros módulos
  environment_variables = {
    NEXT_PUBLIC_COGNITO_USER_POOL_ID = var.cognito_user_pool_id
    NEXT_PUBLIC_COGNITO_CLIENT_ID    = var.cognito_client_id
    COGNITO_CLIENT_SECRET            = var.cognito_client_secret
    NEXT_PUBLIC_COGNITO_DOMAIN       = var.cognito_domain
    NEXT_PUBLIC_COGNITO_JWKS_URI     = var.cognito_jwks_uri
    DYNAMODB_TABLE_NAME              = var.dynamodb_table_name
    S3_BUCKET_NAME                   = var.s3_bucket_name
    CLOUDFRONT_URL                   = var.cloudfront_url
    NEXT_PUBLIC_MAPBOX_TOKEN         = var.mapbox_token
    LAMBDA_CHATBOT_NAME              = var.lambda_chatbot_name
    LAMBDA_TRADUCCION_NAME           = var.lambda_traduccion_name
    LAMBDA_VOZ_NAME                  = var.lambda_voz_name
    NEXTAUTH_SECRET                  = var.nextauth_secret
    NEXTAUTH_URL                     = local.nextauth_url_effective
    SSR_AWS_REGION                   = var.ssr_aws_region
    SSR_AWS_ACCESS_KEY_ID            = var.ssr_aws_access_key_id
    SSR_AWS_SECRET_ACCESS_KEY        = var.ssr_aws_secret_access_key
  }

  tags = { Name = local.prefix }
}

# ---------------------------------------------------------------------------
# Amplify Branch — rama conectada a GitHub
# ---------------------------------------------------------------------------

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.frontend.id
  branch_name = var.github_branch
  stage       = var.environment == "prod" ? "PRODUCTION" : "DEVELOPMENT"
  framework   = "Next.js - SSR"

  enable_auto_build            = true
  enable_pull_request_preview  = var.environment != "prod"

  tags = { Name = "${local.prefix}-${var.github_branch}" }
}
