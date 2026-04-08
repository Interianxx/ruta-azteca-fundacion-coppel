# ---------------------------------------------------------------------------
# DynamoDB — Single-Table Design para Ruta Azteca
#
# ESQUEMA DE ACCESO:
#
#  Entidad         | PK                  | SK                        | GSI1PK              | GSI1SK    | GSI2PK            | GSI2SK
#  --------------- | ------------------- | ------------------------- | ------------------- | --------- | ----------------- | ---------
#  Negocio         | NEGOCIO#<id>        | METADATA                  | STATUS#<status>     | createdAt | CAT#<categoria>   | NEGOCIO#<id>
#  User profile    | USER#<cognitoSub>   | PROFILE                   | —                   | —         | —                 | —
#  Favorito        | USER#<turistaId>    | FAV#<negocioId>           | —                   | —         | —                 | —
#  Evento analyt.  | NEGOCIO#<id>        | EVENTO#<ts>#<tipo>        | —                   | —         | —                 | —
#  Traduccion cache| TRANSLATE#<hash>    | CACHE                     | —                   | —         | —                 | —
#  Categoria       | CAT#<slug>          | METADATA                  | —                   | —         | —                 | —
#
# PATRONES DE ACCESO:
#   1. Get negocio por ID          → Table: PK=NEGOCIO#id, SK=METADATA
#   2. Listar negocios ACTIVOS     → GSI1: GSI1PK=STATUS#ACTIVE,   GSI1SK sort (recientes)
#   3. Listar negocios PENDIENTES  → GSI1: GSI1PK=STATUS#PENDING,  GSI1SK sort (más antiguos primero)
#   4. Listar negocios por cat.    → GSI2: GSI2PK=CAT#comida,      GSI2SK begins_with NEGOCIO#
#   5. Favoritos de un turista     → Table: PK=USER#id, SK begins_with FAV#
#   6. Eventos analyt. de negocio  → Table: PK=NEGOCIO#id, SK begins_with EVENTO#
#   7. Cache de traducción         → Table: PK=TRANSLATE#hash, SK=CACHE
# ---------------------------------------------------------------------------

locals {
  table_name = "ruta-azteca-${var.environment}"
}

resource "aws_dynamodb_table" "main" {
  name         = local.table_name
  billing_mode = "PAY_PER_REQUEST" # Free Tier + escala automática

  hash_key  = "PK"
  range_key = "SK"

  # Atributos usados como keys (solo los que aparecen en índices)
  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  attribute {
    name = "GSI2PK"
    type = "S"
  }

  attribute {
    name = "GSI2SK"
    type = "S"
  }

  # GSI1 — Índice por STATUS para admin y listado de activos
  # Uso: listar negocios pendientes (admin) o activos (turistas)
  global_secondary_index {
    name            = "status-index"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  # GSI2 — Índice por CATEGORÍA para filtrado en el mapa
  # Uso: listar negocios activos de una categoría específica
  global_secondary_index {
    name            = "categoria-index"
    hash_key        = "GSI2PK"
    range_key       = "GSI2SK"
    projection_type = "ALL"
  }

  # TTL para cache de traducciones (atributo "ttl" en items TRANSLATE#)
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  # Backups — PITR solo en prod (cost-effective)
  point_in_time_recovery {
    enabled = var.environment == "prod" ? true : false
  }

  # Encriptación con llave administrada por AWS (gratis)
  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = local.table_name
  }
}
