# ---------------------------------------------------------------------------
# AI Services — IAM para Lambdas y Next.js BFF
#
# Crea:
#   1. lambda_role       → rol de ejecución para las 3 Lambdas
#   2. lambda_policy     → Bedrock + Translate + Comprehend + Transcribe
#                          + DynamoDB (cache) + S3 + CloudWatch Logs
#   3. nextjs_bff_policy → política para el BFF de Next.js
#                          (DynamoDB CRUD + Lambda invoke + S3 presign + Cognito admin)
# ---------------------------------------------------------------------------

locals {
  prefix = "ruta-azteca-${var.environment}"
}

# ---------------------------------------------------------------------------
# 1. IAM Role — ejecución de Lambdas
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${local.prefix}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json

  tags = {
    Name = "${local.prefix}-lambda-role"
  }
}

# ---------------------------------------------------------------------------
# 2. Política de permisos para las Lambdas
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "lambda_permissions" {

  # CloudWatch Logs — logging estándar de Lambda
  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }

  # Amazon Bedrock — invocar Claude para el chatbot
  statement {
    sid    = "BedrockInvoke"
    effect = "Allow"
    actions = [
      "bedrock:InvokeModel",
      "bedrock:InvokeModelWithResponseStream",
    ]
    resources = [
      "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
      "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
      "arn:aws:bedrock:*::foundation-model/anthropic.claude-opus-4-5-20251001-v1:0",
    ]
  }

  # Amazon Translate — traducción de textos
  statement {
    sid     = "TranslateText"
    effect  = "Allow"
    actions = ["translate:TranslateText"]
    resources = ["*"]
  }

  # Amazon Comprehend — detección de idioma
  statement {
    sid     = "ComprehendDetect"
    effect  = "Allow"
    actions = ["comprehend:DetectDominantLanguage"]
    resources = ["*"]
  }

  # Amazon Transcribe — fallback de voz a texto
  statement {
    sid    = "TranscribeJobs"
    effect = "Allow"
    actions = [
      "transcribe:StartTranscriptionJob",
      "transcribe:GetTranscriptionJob",
      "transcribe:ListTranscriptionJobs",
    ]
    resources = ["*"]
  }

  # DynamoDB — caché de traducciones en la tabla principal
  statement {
    sid    = "DynamoDBCache"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:Query",
      "dynamodb:UpdateItem",
    ]
    resources = [
      var.dynamodb_table_arn,
      "${var.dynamodb_table_arn}/index/*",
    ]
  }

  # S3 — leer/escribir imágenes de negocios (Transcribe necesita S3)
  statement {
    sid    = "S3Images"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]
    resources = ["${var.s3_bucket_arn}/*"]
  }
}

resource "aws_iam_policy" "lambda" {
  name        = "${local.prefix}-lambda-policy"
  description = "Permisos para las Lambdas de Ruta Azteca (Bedrock, Translate, Transcribe, DynamoDB)"
  policy      = data.aws_iam_policy_document.lambda_permissions.json
}

resource "aws_iam_role_policy_attachment" "lambda" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.lambda.arn
}

# ---------------------------------------------------------------------------
# 3. Política para el BFF de Next.js
#    Se adjunta al usuario/rol del entorno de despliegue (Vercel, EC2, etc.)
# ---------------------------------------------------------------------------

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_iam_policy_document" "nextjs_bff" {

  # DynamoDB — CRUD completo en la tabla principal
  statement {
    sid    = "DynamoDBFullAccess"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:BatchWriteItem",
    ]
    resources = [
      var.dynamodb_table_arn,
      "${var.dynamodb_table_arn}/index/*",
    ]
  }

  # Lambda — invocar las 3 funciones pesadas
  statement {
    sid     = "LambdaInvoke"
    effect  = "Allow"
    actions = ["lambda:InvokeFunction"]
    resources = [
      "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${local.prefix}-chatbot",
      "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${local.prefix}-traduccion",
      "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:${local.prefix}-voz",
    ]
  }

  # S3 — generar URLs pre-firmadas para subir imágenes
  statement {
    sid    = "S3PresignedUpload"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
    ]
    resources = ["${var.s3_bucket_arn}/*"]
  }

  # Cognito — mover usuarios entre grupos (aprobar/rechazar negocios)
  statement {
    sid    = "CognitoGroupAdmin"
    effect = "Allow"
    actions = [
      "cognito-idp:AdminAddUserToGroup",
      "cognito-idp:AdminRemoveUserFromGroup",
      "cognito-idp:AdminGetUser",
    ]
    resources = [var.cognito_user_pool_arn]
  }
}

resource "aws_iam_policy" "nextjs_bff" {
  name        = "${local.prefix}-nextjs-bff-policy"
  description = "Permisos para el BFF de Next.js (DynamoDB, Lambda invoke, S3, Cognito admin)"
  policy      = data.aws_iam_policy_document.nextjs_bff.json
}

# ---------------------------------------------------------------------------
# 4. IAM User para el BFF de Next.js
#    Gerardo usa las access keys en .env.local para correr el servidor
# ---------------------------------------------------------------------------

resource "aws_iam_user" "nextjs_bff" {
  name = "${local.prefix}-nextjs-bff"

  tags = {
    Name = "${local.prefix}-nextjs-bff"
  }
}

resource "aws_iam_user_policy_attachment" "nextjs_bff" {
  user       = aws_iam_user.nextjs_bff.name
  policy_arn = aws_iam_policy.nextjs_bff.arn
}

resource "aws_iam_access_key" "nextjs_bff" {
  user = aws_iam_user.nextjs_bff.name
}
