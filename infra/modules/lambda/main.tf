# ---------------------------------------------------------------------------
# Lambda — 3 funciones pesadas de Ruta Azteca
#
#   chatbot    → Amazon Bedrock (Claude) — asistente IA
#   traduccion → Amazon Translate + Comprehend + caché DynamoDB
#   voz        → Amazon Transcribe — fallback de voz a texto
#
# El código Python se empaqueta con archive_file y se sube con aws_lambda_function.
# La IAM role viene del módulo ai-services.
# ---------------------------------------------------------------------------

locals {
  prefix   = "ruta-azteca-${var.environment}"
  src_path = "${path.root}/lambda-src"
}

# ---------------------------------------------------------------------------
# Empaquetar código Python → ZIP
# ---------------------------------------------------------------------------

data "archive_file" "chatbot" {
  type        = "zip"
  source_dir  = "${local.src_path}/chatbot"
  output_path = "${local.src_path}/chatbot.zip"
}

data "archive_file" "traduccion" {
  type        = "zip"
  source_dir  = "${local.src_path}/traduccion"
  output_path = "${local.src_path}/traduccion.zip"
}

data "archive_file" "voz" {
  type        = "zip"
  source_dir  = "${local.src_path}/voz"
  output_path = "${local.src_path}/voz.zip"
}

# ---------------------------------------------------------------------------
# CloudWatch Log Groups — retención controlada
# ---------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "chatbot" {
  name              = "/aws/lambda/${local.prefix}-chatbot"
  retention_in_days = var.environment == "prod" ? 30 : 7
}

resource "aws_cloudwatch_log_group" "traduccion" {
  name              = "/aws/lambda/${local.prefix}-traduccion"
  retention_in_days = var.environment == "prod" ? 30 : 7
}

resource "aws_cloudwatch_log_group" "voz" {
  name              = "/aws/lambda/${local.prefix}-voz"
  retention_in_days = var.environment == "prod" ? 30 : 7
}

# ---------------------------------------------------------------------------
# Lambda: chatbot — Bedrock (Claude)
# ---------------------------------------------------------------------------

resource "aws_lambda_function" "chatbot" {
  function_name    = "${local.prefix}-chatbot"
  description      = "Asistente IA de Ruta Azteca — Amazon Bedrock (Claude)"
  role             = var.lambda_role_arn
  runtime          = "python3.12"
  handler          = "index.lambda_handler"
  filename         = data.archive_file.chatbot.output_path
  source_code_hash = data.archive_file.chatbot.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      AWS_REGION_NAME    = var.aws_region
      BEDROCK_MODEL_ID   = "anthropic.claude-3-haiku-20240307-v1:0"
      DYNAMODB_TABLE_NAME = var.dynamodb_table_name
    }
  }

  depends_on = [aws_cloudwatch_log_group.chatbot]

  tags = {
    Name = "${local.prefix}-chatbot"
  }
}

# ---------------------------------------------------------------------------
# Lambda: traduccion — Translate + Comprehend + caché DynamoDB
# ---------------------------------------------------------------------------

resource "aws_lambda_function" "traduccion" {
  function_name    = "${local.prefix}-traduccion"
  description      = "Traducción de textos con Amazon Translate + caché DynamoDB"
  role             = var.lambda_role_arn
  runtime          = "python3.12"
  handler          = "index.lambda_handler"
  filename         = data.archive_file.traduccion.output_path
  source_code_hash = data.archive_file.traduccion.output_base64sha256
  timeout          = 15
  memory_size      = 128

  environment {
    variables = {
      AWS_REGION_NAME     = var.aws_region
      DYNAMODB_TABLE_NAME = var.dynamodb_table_name
    }
  }

  depends_on = [aws_cloudwatch_log_group.traduccion]

  tags = {
    Name = "${local.prefix}-traduccion"
  }
}

# ---------------------------------------------------------------------------
# Lambda: voz — Transcribe fallback
# ---------------------------------------------------------------------------

resource "aws_lambda_function" "voz" {
  function_name    = "${local.prefix}-voz"
  description      = "Reconocimiento de voz fallback con Amazon Transcribe"
  role             = var.lambda_role_arn
  runtime          = "python3.12"
  handler          = "index.lambda_handler"
  filename         = data.archive_file.voz.output_path
  source_code_hash = data.archive_file.voz.output_base64sha256
  timeout          = 60   # Transcribe puede tardar hasta 50s (ver MAX_ESPERA_S en index.py)
  memory_size      = 128

  environment {
    variables = {
      AWS_REGION_NAME = var.aws_region
      S3_BUCKET_NAME  = var.s3_bucket_name
    }
  }

  depends_on = [aws_cloudwatch_log_group.voz]

  tags = {
    Name = "${local.prefix}-voz"
  }
}
