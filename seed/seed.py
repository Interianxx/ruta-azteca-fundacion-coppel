#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
seed.py — Poblar DynamoDB con categorías y negocios de Ruta Azteca.

Uso:
    python seed.py                          # usa tabla ruta-azteca-dev en us-east-1
    python seed.py --env prod               # usa tabla ruta-azteca-prod
    python seed.py --region us-west-2       # región distinta
    python seed.py --dry-run               # muestra items sin escribir a DynamoDB
"""

import argparse
import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

import boto3
from botocore.exceptions import ClientError, NoCredentialsError

# ---------------------------------------------------------------------------
# Configuración
# ---------------------------------------------------------------------------

SEED_DIR = Path(__file__).parent

def parse_args():
    parser = argparse.ArgumentParser(description="Seed DynamoDB para Ruta Azteca")
    parser.add_argument("--env",     default="dev",       help="Entorno: dev | prod")
    parser.add_argument("--region",  default="us-east-1", help="Región AWS")
    parser.add_argument("--dry-run", action="store_true", help="Imprime sin escribir")
    return parser.parse_args()


def load_json(filename: str) -> list:
    path = SEED_DIR / filename
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Builders — construyen items con las keys del single-table design
# ---------------------------------------------------------------------------

def build_categoria(cat: dict, now: str) -> dict:
    return {
        "PK":        f"CAT#{cat['slug']}",
        "SK":        "METADATA",
        "tipo":      "CATEGORIA",
        "slug":      cat["slug"],
        "nombre":    cat["nombre"],
        "nombre_en": cat["nombre_en"],
        "emoji":     cat["emoji"],
        "descripcion": cat["descripcion"],
        "createdAt": now,
        "updatedAt": now,
    }


def build_negocio(negocio: dict, now: str) -> dict:
    negocio_id = negocio.get("id") or str(uuid.uuid4())
    cat        = negocio["categoria"]

    return {
        # --- Keys del single-table ---
        "PK":     f"NEGOCIO#{negocio_id}",
        "SK":     "METADATA",
        "GSI1PK": "STATUS#ACTIVE",          # directo a ACTIVE (datos semilla verificados)
        "GSI1SK": now,
        "GSI2PK": f"CAT#{cat}",
        "GSI2SK": f"NEGOCIO#{negocio_id}",

        # --- Datos del negocio ---
        "tipo":             "NEGOCIO",
        "id":               negocio_id,
        "estado":           "ACTIVE",
        "nombre":           negocio["nombre"],
        "descripcion":      negocio["descripcion"],
        "descripcion_en":   negocio.get("descripcion_en", ""),
        "categoria":        cat,
        "telefono":         negocio["telefono"],
        "whatsapp":         negocio.get("whatsapp", ""),
        "direccion":        negocio["direccion"],
        "colonia":          negocio.get("colonia", ""),
        "lat":              str(negocio["lat"]),   # DynamoDB Decimal → str para evitar float issues
        "lng":              str(negocio["lng"]),
        "tags":             negocio.get("tags", []),
        "horario":          negocio.get("horario", {}),
        "precio_promedio":  negocio.get("precio_promedio", ""),
        "imagenUrl":        negocio.get("imagenUrl", ""),
        "imagenes":         negocio.get("imagenes", []),
        "menu":             negocio.get("menu", []),
        "calificacion":     None,
        "totalReviews":     0,
        "propietarioId":    "SEED",           # marcado como seed, sin dueño real
        "createdAt":        now,
        "updatedAt":        now,
    }


# ---------------------------------------------------------------------------
# Writer — escribe en DynamoDB con batch_writer (25 items por llamada)
# ---------------------------------------------------------------------------

def seed_table(table, items: list, label: str, dry_run: bool):
    print(f"\n{'[DRY-RUN] ' if dry_run else ''}Insertando {len(items)} {label}...")

    if dry_run:
        for item in items:
            print(f"  → {item['PK']} | {item['SK']}")
        return

    errores = 0
    with table.batch_writer() as batch:
        for item in items:
            # Limpiar None values (DynamoDB no acepta null explícito en batch)
            clean = {k: v for k, v in item.items() if v is not None}
            try:
                batch.put_item(Item=clean)
                print(f"  ✓ {item['PK']}")
            except ClientError as e:
                print(f"  ✗ Error en {item['PK']}: {e}", file=sys.stderr)
                errores += 1

    if errores:
        print(f"\n⚠  {errores} errores en {label}")
    else:
        print(f"✓  {label} insertadas correctamente")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    args   = parse_args()
    tabla  = f"ruta-azteca-{args.env}"
    now    = datetime.now(timezone.utc).isoformat()

    print(f"{'='*60}")
    print(f"  Ruta Azteca — Seed DynamoDB")
    print(f"  Tabla:   {tabla}")
    print(f"  Región:  {args.region}")
    print(f"  Modo:    {'DRY-RUN' if args.dry_run else 'ESCRITURA REAL'}")
    print(f"{'='*60}")

    # Verificar credenciales
    try:
        boto3.client("sts", region_name=args.region).get_caller_identity()
    except NoCredentialsError:
        print("✗ No se encontraron credenciales AWS. Configura `aws configure` primero.", file=sys.stderr)
        sys.exit(1)

    # Cargar datos
    categorias_raw = load_json("categorias.json")
    negocios_raw   = load_json("negocios.json")

    categoria_items = [build_categoria(c, now) for c in categorias_raw]
    negocio_items   = [build_negocio(n, now) for n in negocios_raw]

    print(f"\nDatos cargados:")
    print(f"  Categorías: {len(categoria_items)}")
    print(f"  Negocios:   {len(negocio_items)}")

    if not args.dry_run:
        dynamodb = boto3.resource("dynamodb", region_name=args.region)
        table    = dynamodb.Table(tabla)

        # Verificar que la tabla existe
        try:
            table.load()
        except ClientError as e:
            if e.response["Error"]["Code"] == "ResourceNotFoundException":
                print(f"✗ Tabla '{tabla}' no existe. Corre `terraform apply` primero.", file=sys.stderr)
            else:
                print(f"✗ Error al conectar con DynamoDB: {e}", file=sys.stderr)
            sys.exit(1)

        seed_table(table, categoria_items, "categorías", dry_run=False)
        seed_table(table, negocio_items,   "negocios",   dry_run=False)
    else:
        seed_table(None, categoria_items, "categorías", dry_run=True)
        seed_table(None, negocio_items,   "negocios",   dry_run=True)

    print(f"\n{'='*60}")
    print(f"  Seed completo — {len(categoria_items) + len(negocio_items)} items procesados")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
