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

BASE_SYSTEM_PROMPT = """You are the official assistant of Ruta Azteca, a platform that connects
FIFA World Cup 2026 tourists with verified local businesses from the Ola México program in Mexico City.

Your role:
- Help tourists find local businesses (food, crafts, tours, accommodation, transport)
- Give cultural recommendations about Mexico City
- Be friendly, brief and helpful

Limits:
- Only discuss topics related to tourism in Mexico City and Ola México businesses
- Do not invent specific business information
- If you do not know something, redirect to the Ruta Azteca map

CRITICAL LANGUAGE RULE: You MUST ALWAYS reply in the EXACT SAME language the user writes in.
- If the user writes in English → reply in English
- If the user writes in Spanish → reply in Spanish
- If the user writes in French → reply in French
- If the user writes in Portuguese → reply in Portuguese
- If the user writes in German → reply in German
- If the user writes in any other language → reply in that same language
NEVER switch languages. NEVER default to Spanish. Match the user's language exactly.

PLACE RECOMMENDATIONS FORMAT:
When the user asks about places to visit, restaurants, food, tacos, businesses, experiences, crafts, accommodation, or ANY location/business recommendations, you MUST respond with ONLY a valid JSON object. No text before or after the JSON.

Use this exact format:
{
  "type": "cards",
  "title": "<short title describing the recommendations, in user's language>",
  "items": [
    {
      "id": "<slug-style-unique-id>",
      "name": "<business name>",
      "description": "<short description, max 100 characters, in user's language>",
      "address": "<neighborhood or street, Mexico City>",
      "image": "https://via.placeholder.com/300",
      "rating": 4.5,
      "tags": ["<tag1>", "<tag2>"],
      "action": { "type": "navigate", "target": "<same as id>" }
    }
  ]
}

Rules for JSON responses:
- Return 3 to 5 items
- Output ONLY the JSON — zero extra text, no markdown, no backticks
- All text fields (title, name, description, tags) must be in the user's language
- ratings must be realistic numbers between 3.5 and 5.0
- If no places found: {"type":"empty","message":"<message in user's language>"}
"""


def lambda_handler(event, context):
    try:
        mensaje    = event.get("mensaje", "")
        historial  = event.get("historial", [])
        idioma     = event.get("idioma", "")

        system_prompt = BASE_SYSTEM_PROMPT
        if idioma and idioma != "es":
            system_prompt += f"\nThe user's browser language is '{idioma}'. Prioritize replying in that language."

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
            "system":            system_prompt,
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
