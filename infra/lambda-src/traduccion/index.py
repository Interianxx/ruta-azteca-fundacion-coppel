"""
Lambda: traduccion
Traduce texto con Amazon Translate + detección de idioma con Comprehend.
Cachea resultados en DynamoDB con TTL de 30 días para evitar costos repetidos.
"""

import hashlib
import json
import os
import time

import boto3
from botocore.exceptions import ClientError

translate   = boto3.client("translate",   region_name=os.environ.get("AWS_REGION", "us-east-1"))
comprehend  = boto3.client("comprehend",  region_name=os.environ.get("AWS_REGION", "us-east-1"))
dynamodb    = boto3.resource("dynamodb",  region_name=os.environ.get("AWS_REGION", "us-east-1"))

TABLE_NAME = os.environ.get("DYNAMODB_TABLE_NAME", "ruta-azteca-dev")
TTL_DIAS   = 30


def cache_key(texto: str, idioma_destino: str) -> str:
    contenido = f"{texto}|{idioma_destino}"
    return hashlib.md5(contenido.encode()).hexdigest()


def get_cache(table, key: str) -> str | None:
    try:
        resp = table.get_item(Key={"PK": f"TRANSLATE#{key}", "SK": "CACHE"})
        item = resp.get("Item")
        if item and int(item.get("ttl", 0)) > int(time.time()):
            return item["traduccion"]
    except ClientError:
        pass
    return None


def put_cache(table, key: str, traduccion: str):
    ttl = int(time.time()) + (TTL_DIAS * 86400)
    try:
        table.put_item(Item={
            "PK":         f"TRANSLATE#{key}",
            "SK":         "CACHE",
            "traduccion": traduccion,
            "ttl":        ttl,
        })
    except ClientError:
        pass  # caché no crítico — si falla, no interrumpir la traducción


def detectar_idioma(texto: str) -> str:
    try:
        resp = comprehend.detect_dominant_language(Text=texto[:300])
        langs = resp.get("Languages", [])
        if langs:
            return langs[0]["LanguageCode"]
    except ClientError:
        pass
    return "auto"


def lambda_handler(event, context):
    try:
        texto          = event.get("texto", "").strip()
        idioma_destino = event.get("idiomaDestino", "es")
        idioma_origen  = event.get("idiomaOrigen")  # None → detección automática

        if not texto:
            return {"statusCode": 400, "error": "texto requerido"}

        # 1. Revisar caché
        table = dynamodb.Table(TABLE_NAME)
        key   = cache_key(texto, idioma_destino)
        cached = get_cache(table, key)

        if cached:
            return {"statusCode": 200, "traduccion": cached, "cached": True}

        # 2. Detectar idioma si no se especificó
        if not idioma_origen:
            idioma_origen = detectar_idioma(texto)
            if idioma_origen == idioma_destino:
                return {"statusCode": 200, "traduccion": texto, "cached": False}

        # 3. Traducir
        params = {
            "Text":               texto,
            "TargetLanguageCode": idioma_destino,
        }
        if idioma_origen and idioma_origen != "auto":
            params["SourceLanguageCode"] = idioma_origen
        else:
            params["SourceLanguageCode"] = "auto"

        resp       = translate.translate_text(**params)
        traduccion = resp["TranslatedText"]

        # 4. Guardar en caché
        put_cache(table, key, traduccion)

        return {"statusCode": 200, "traduccion": traduccion, "cached": False}

    except ClientError as e:
        return {"statusCode": 500, "error": str(e)}
    except Exception as e:
        return {"statusCode": 500, "error": str(e)}
