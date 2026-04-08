terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }


  # Lock nativo de S3 (Terraform >= 1.10) — no requiere tabla DynamoDB
  backend "s3" {
    bucket       = "ruta-azteca-tfstate"
    key          = "terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "ruta-azteca"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ---------------------------------------------------------------------------
# Módulos (se activan conforme se crean)
# ---------------------------------------------------------------------------

module "cognito" {
  source = "./modules/cognito"

  environment          = var.environment
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret
  # apple_client_id      = var.apple_client_id      # fase 2
  # apple_team_id        = var.apple_team_id        # fase 2
  # apple_key_id         = var.apple_key_id         # fase 2
  # apple_private_key    = var.apple_private_key    # fase 2
  callback_urls        = var.callback_urls
  logout_urls          = var.logout_urls
}

module "dynamodb" {
  source = "./modules/dynamodb"

  environment = var.environment
}

module "s3_cdn" {
  source = "./modules/s3-cdn"

  environment     = var.environment
  allowed_origins = var.cors_origins
}

module "ai_services" {
  source = "./modules/ai-services"

  environment           = var.environment
  dynamodb_table_arn    = module.dynamodb.table_arn
  s3_bucket_arn         = module.s3_cdn.bucket_arn
  cognito_user_pool_arn = module.cognito.user_pool_arn
}

module "lambda" {
  source = "./modules/lambda"

  environment         = var.environment
  aws_region          = var.aws_region
  lambda_role_arn     = module.ai_services.lambda_role_arn
  dynamodb_table_name = module.dynamodb.table_name
  s3_bucket_name      = module.s3_cdn.bucket_name
}

module "monitoring" {
  source = "./modules/monitoring"

  environment            = var.environment
  aws_region             = var.aws_region
  lambda_chatbot_name    = module.lambda.chatbot_name
  lambda_traduccion_name = module.lambda.traduccion_name
  lambda_voz_name        = module.lambda.voz_name
}
