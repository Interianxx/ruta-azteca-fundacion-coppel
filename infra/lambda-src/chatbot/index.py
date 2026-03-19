"""
Lambda: chatbot
Invoca Amazon Bedrock (Claude) para el asistente de Ruta Azteca.

PREREQUISITO: Habilitar acceso al modelo en la consola de Bedrock:
  AWS Console → Amazon Bedrock → Model access → Anthropic Claude → Request access
"""

import json
import os
import boto3
from botocore.exceptions import ClientError

bedrock = boto3.client("bedrock-runtime", region_name=os.environ.get("AWS_REGION", "us-east-1"))

MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")

SYSTEM_PROMPT = """Eres el asistente oficial de Ruta Azteca, una plataforma que conecta
turistas del Mundial FIFA 2026 con negocios locales verificados del programa Ola México en CDMX.

Tu rol:
- Ayudar a turistas a encontrar negocios locales (comida, artesanías, tours, hospedaje, transporte)
- Dar recomendaciones culturales sobre CDMX
- Responder en el idioma del usuario (español o inglés)
- Ser amigable, breve y útil

Límites:
- Solo habla de temas relacionados con turismo en CDMX y negocios Ola México
- No inventes información de negocios específicos
- Si no sabes algo, redirige a buscar en el mapa de Ruta Azteca
"""


def lambda_handler(event, context):
    try:
        mensaje    = event.get("mensaje", "")
        historial  = event.get("historial", [])

        if not mensaje:
            return {"statusCode": 400, "error": "mensaje requerido"}

        # Construir mensajes para la API de Bedrock
        messages = []
        for h in historial[-10:]:  # máximo 10 turnos de historial
            messages.append({
                "role":    h.get("rol", "user"),
                "content": h.get("contenido", ""),
            })
        messages.append({"role": "user", "content": mensaje})

        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens":        512,
            "system":            SYSTEM_PROMPT,
            "messages":          messages,
        }

        response = bedrock.invoke_model(
            modelId     = MODEL_ID,
            body        = json.dumps(payload),
            contentType = "application/json",
            accept      = "application/json",
        )

        body      = json.loads(response["body"].read())
        respuesta = body["content"][0]["text"]

        return {"statusCode": 200, "respuesta": respuesta}

    except ClientError as e:
        code = e.response["Error"]["Code"]
        if code == "AccessDeniedException":
            return {
                "statusCode": 403,
                "error": "Acceso a Bedrock no habilitado. Habilita el modelo en la consola de AWS.",
            }
        return {"statusCode": 500, "error": str(e)}

    except Exception as e:
        return {"statusCode": 500, "error": str(e)}
