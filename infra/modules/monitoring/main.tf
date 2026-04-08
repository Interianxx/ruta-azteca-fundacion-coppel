# ---------------------------------------------------------------------------
# Monitoring — CloudWatch Dashboard + Alarmas para las 3 Lambdas
# ---------------------------------------------------------------------------

locals {
  prefix = "ruta-azteca-${var.environment}"
}

# ---------------------------------------------------------------------------
# Dashboard principal — métricas de las 3 Lambdas en una sola vista
# ---------------------------------------------------------------------------

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 8
        height = 6
        properties = {
          title  = "Invocaciones por Lambda"
          region = var.aws_region
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_chatbot_name, { label = "Chatbot" }],
            ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_traduccion_name, { label = "Traducción" }],
            ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_voz_name, { label = "Voz" }],
          ]
          period = 300
          stat   = "Sum"
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 0
        width  = 8
        height = 6
        properties = {
          title  = "Errores por Lambda"
          region = var.aws_region
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", var.lambda_chatbot_name, { label = "Chatbot", color = "#d62728" }],
            ["AWS/Lambda", "Errors", "FunctionName", var.lambda_traduccion_name, { label = "Traducción", color = "#ff7f0e" }],
            ["AWS/Lambda", "Errors", "FunctionName", var.lambda_voz_name, { label = "Voz", color = "#9467bd" }],
          ]
          period = 300
          stat   = "Sum"
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 0
        width  = 8
        height = 6
        properties = {
          title  = "Duración promedio (ms)"
          region = var.aws_region
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", var.lambda_chatbot_name, { label = "Chatbot" }],
            ["AWS/Lambda", "Duration", "FunctionName", var.lambda_traduccion_name, { label = "Traducción" }],
            ["AWS/Lambda", "Duration", "FunctionName", var.lambda_voz_name, { label = "Voz" }],
          ]
          period = 300
          stat   = "Average"
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Throttles"
          region = var.aws_region
          metrics = [
            ["AWS/Lambda", "Throttles", "FunctionName", var.lambda_chatbot_name, { label = "Chatbot" }],
            ["AWS/Lambda", "Throttles", "FunctionName", var.lambda_traduccion_name, { label = "Traducción" }],
            ["AWS/Lambda", "Throttles", "FunctionName", var.lambda_voz_name, { label = "Voz" }],
          ]
          period = 300
          stat   = "Sum"
          view   = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Ejecuciones concurrentes"
          region = var.aws_region
          metrics = [
            ["AWS/Lambda", "ConcurrentExecutions", "FunctionName", var.lambda_chatbot_name, { label = "Chatbot" }],
            ["AWS/Lambda", "ConcurrentExecutions", "FunctionName", var.lambda_traduccion_name, { label = "Traducción" }],
            ["AWS/Lambda", "ConcurrentExecutions", "FunctionName", var.lambda_voz_name, { label = "Voz" }],
          ]
          period = 300
          stat   = "Maximum"
          view   = "timeSeries"
        }
      }
    ]
  })
}

# ---------------------------------------------------------------------------
# Alarmas — errores excesivos en cualquier Lambda
# ---------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "chatbot_errors" {
  alarm_name          = "${local.prefix}-chatbot-errors"
  alarm_description   = "Lambda chatbot con más de ${var.alarm_errors_threshold} errores en 5 minutos"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = var.alarm_errors_threshold
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = var.lambda_chatbot_name
  }

  tags = {
    Name = "${local.prefix}-chatbot-errors"
  }
}

resource "aws_cloudwatch_metric_alarm" "traduccion_errors" {
  alarm_name          = "${local.prefix}-traduccion-errors"
  alarm_description   = "Lambda traduccion con más de ${var.alarm_errors_threshold} errores en 5 minutos"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = var.alarm_errors_threshold
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = var.lambda_traduccion_name
  }

  tags = {
    Name = "${local.prefix}-traduccion-errors"
  }
}

resource "aws_cloudwatch_metric_alarm" "voz_errors" {
  alarm_name          = "${local.prefix}-voz-errors"
  alarm_description   = "Lambda voz con más de ${var.alarm_errors_threshold} errores en 5 minutos"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = var.alarm_errors_threshold
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = var.lambda_voz_name
  }

  tags = {
    Name = "${local.prefix}-voz-errors"
  }
}

# ---------------------------------------------------------------------------
# Alarma — latencia del chatbot (Bedrock puede ser lento)
# ---------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "chatbot_duration" {
  alarm_name          = "${local.prefix}-chatbot-duration"
  alarm_description   = "Lambda chatbot con latencia promedio mayor a 25 segundos"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Average"
  threshold           = 25000 # 25 segundos en milisegundos
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = var.lambda_chatbot_name
  }

  tags = {
    Name = "${local.prefix}-chatbot-duration"
  }
}
