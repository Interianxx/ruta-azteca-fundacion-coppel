"""
Lambda: voz
Fallback de reconocimiento de voz cuando Web Speech API no está disponible.
Recibe audio en base64, lo sube a S3, inicia job de Transcribe y espera el resultado.

Flujo:
  Browser → /api/voz (Next.js) → Lambda → S3 → Transcribe → texto
"""

import base64
import json
import os
import time
import uuid

import boto3
from botocore.exceptions import ClientError

s3         = boto3.client("s3",         region_name=os.environ.get("AWS_REGION", "us-east-1"))
transcribe = boto3.client("transcribe", region_name=os.environ.get("AWS_REGION", "us-east-1"))

BUCKET_NAME  = os.environ.get("S3_BUCKET_NAME", "ruta-azteca-images-dev")
MAX_ESPERA_S = 45   # segundos máximos esperando el job
INTERVALO_S  = 3    # polling cada 3 segundos


def lambda_handler(event, context):
    try:
        audio_b64 = event.get("audio", "")
        idioma    = event.get("idioma", "es-MX")
        media_fmt = event.get("formato", "webm")  # webm | mp3 | wav | ogg

        if not audio_b64:
            return {"statusCode": 400, "error": "audio requerido (base64)"}

        # 1. Decodificar y subir a S3
        audio_bytes = base64.b64decode(audio_b64)
        job_id      = str(uuid.uuid4())
        s3_key      = f"voz-temp/{job_id}.{media_fmt}"

        s3.put_object(
            Bucket      = BUCKET_NAME,
            Key         = s3_key,
            Body        = audio_bytes,
            ContentType = f"audio/{media_fmt}",
        )

        s3_uri = f"s3://{BUCKET_NAME}/{s3_key}"

        # 2. Iniciar job de Transcribe
        job_name = f"ruta-azteca-{job_id}"

        transcribe.start_transcription_job(
            TranscriptionJobName = job_name,
            LanguageCode         = idioma,
            MediaFormat          = media_fmt,
            Media                = {"MediaFileUri": s3_uri},
            Settings             = {
                "ShowSpeakerLabels": False,
                "ChannelIdentification": False,
            },
        )

        # 3. Esperar resultado (polling)
        transcrito = None
        confianza  = 0.0
        inicio     = time.time()

        while time.time() - inicio < MAX_ESPERA_S:
            resp   = transcribe.get_transcription_job(TranscriptionJobName=job_name)
            estado = resp["TranscriptionJob"]["TranscriptionJobStatus"]

            if estado == "COMPLETED":
                uri = resp["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]
                import urllib.request
                with urllib.request.urlopen(uri) as r:
                    resultado  = json.loads(r.read())
                    items      = resultado["results"]["items"]
                    palabras   = [i["alternatives"][0] for i in items if i["type"] == "pronunciation"]
                    transcrito = " ".join(p["content"] for p in palabras)
                    confianza  = (
                        sum(float(p.get("confidence", 0)) for p in palabras) / len(palabras)
                        if palabras else 0.0
                    )
                break

            elif estado == "FAILED":
                raise Exception(f"Transcription job failed: {resp['TranscriptionJob'].get('FailureReason')}")

            time.sleep(INTERVALO_S)

        # 4. Limpiar archivo temporal de S3
        try:
            s3.delete_object(Bucket=BUCKET_NAME, Key=s3_key)
        except ClientError:
            pass

        if not transcrito:
            return {"statusCode": 504, "error": "Transcripción tardó demasiado. Intenta con un audio más corto."}

        return {
            "statusCode": 200,
            "texto":      transcrito,
            "confianza":  round(confianza, 3),
        }

    except ClientError as e:
        return {"statusCode": 500, "error": str(e)}
    except Exception as e:
        return {"statusCode": 500, "error": str(e)}
