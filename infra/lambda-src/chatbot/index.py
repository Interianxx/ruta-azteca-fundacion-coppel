"""
Lambda: chatbot
Invoca Amazon Bedrock (Claude) para el asistente de Ruta Azteca.

PREREQUISITO: Habilitar acceso al modelo en la consola de Bedrock:
  AWS Console → Amazon Bedrock → Model access → Anthropic Claude → Request access
"""

import json
import os
import time
import boto3
from botocore.exceptions import ClientError

bedrock = boto3.client("bedrock-runtime", region_name=os.environ.get("AWS_REGION", "us-east-1"))

MODEL_ID    = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")
MAX_RETRIES = 2  # reintentos ante ThrottlingException

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
        # Bedrock exige: roles deben alternar user/assistant, y el primero debe ser user.
        raw = [
            {"role": h.get("rol", "user"), "content": str(h.get("contenido", "")).strip()}
            for h in historial[-10:]
            if str(h.get("contenido", "")).strip()
        ]

        # 1. Quitar mensajes con rol idéntico al anterior (evita consecutivos)
        clean: list[dict] = []
        for item in raw:
            if not clean or clean[-1]["role"] != item["role"]:
                clean.append(item)

        # 2. El primer mensaje debe ser 'user'
        while clean and clean[0]["role"] == "assistant":
            clean.pop(0)

        # 3. El historial no debe terminar en 'user' (el mensaje actual lo añadimos al final)
        while clean and clean[-1]["role"] == "user":
            clean.pop()

        messages = clean
        messages.append({"role": "user", "content": mensaje})

        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens":        512,
            "system":            SYSTEM_PROMPT,
            "messages":          messages,
        }

        for attempt in range(MAX_RETRIES + 1):
            try:
                response = bedrock.invoke_model(
                    modelId     = MODEL_ID,
                    body        = json.dumps(payload),
                    contentType = "application/json",
                    accept      = "application/json",
                )
                break  # éxito — salir del loop
            except ClientError as e:
                code = e.response["Error"]["Code"]
                if code == "ThrottlingException" and attempt < MAX_RETRIES:
                    wait = 2 ** attempt  # 1s, 2s
                    print(f"[chatbot] ThrottlingException — reintento {attempt + 1}/{MAX_RETRIES} en {wait}s")
                    time.sleep(wait)
                    continue
                raise  # otros errores o reintentos agotados → captura el bloque exterior

        body      = json.loads(response["body"].read())
        respuesta = body["content"][0]["text"]

        return {"statusCode": 200, "respuesta": respuesta}

    except ClientError as e:
        code = e.response["Error"]["Code"]
        print(f"[chatbot] ClientError: {code} — {e}")
        if code == "AccessDeniedException":
            return {
                "statusCode": 403,
                "error": "Acceso a Bedrock no habilitado. Habilita el modelo en la consola de AWS.",
            }
        if code == "ThrottlingException":
            return {
                "statusCode": 429,
                "error": "Demasiadas solicitudes. Espera un momento e intenta de nuevo.",
            }
        return {"statusCode": 500, "error": str(e)}

    except Exception as e:
        print(f"[chatbot] Error inesperado: {type(e).__name__}: {e}")
        return {"statusCode": 500, "error": str(e)}
