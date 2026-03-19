import { NextRequest, NextResponse } from 'next/server'
import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME, GSI_STATUS, GSI_CATEGORIA } from '@/lib/dynamo'
import type { NegocioInput } from '@/types/negocio'
import { randomUUID } from 'crypto'

// GET /api/negocios?categoria=comida&lastKey=...
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const categoria = searchParams.get('categoria')
  const lastKey   = searchParams.get('lastKey')

  try {
    let result

    if (categoria) {
      // Filtrar por categoría (GSI2)
      result = await dynamo.send(new QueryCommand({
        TableName:              TABLE_NAME,
        IndexName:              GSI_CATEGORIA,
        KeyConditionExpression: 'GSI2PK = :cat',
        ExpressionAttributeValues: { ':cat': `CAT#${categoria}` },
        Limit: 50,
        ExclusiveStartKey: lastKey ? JSON.parse(lastKey) : undefined,
      }))
    } else {
      // Listar todos los activos (GSI1)
      result = await dynamo.send(new QueryCommand({
        TableName:              TABLE_NAME,
        IndexName:              GSI_STATUS,
        KeyConditionExpression: 'GSI1PK = :status',
        ExpressionAttributeValues: { ':status': 'STATUS#ACTIVE' },
        Limit: 100,
        ExclusiveStartKey: lastKey ? JSON.parse(lastKey) : undefined,
      }))
    }

    return NextResponse.json({
      data: {
        items:   result.Items ?? [],
        lastKey: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined,
        count:   result.Count ?? 0,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Error al obtener negocios' }, { status: 500 })
  }
}

// POST /api/negocios — crear negocio (requiere auth)
export async function POST(req: NextRequest) {
  const body: NegocioInput = await req.json()
  const id        = randomUUID()
  const createdAt = new Date().toISOString()

  const item = {
    PK:        `NEGOCIO#${id}`,
    SK:        'METADATA',
    GSI1PK:   'STATUS#PENDING',
    GSI1SK:   createdAt,
    GSI2PK:   `CAT#${body.categoria}`,
    GSI2SK:   `NEGOCIO#${id}`,
    id,
    estado:    'PENDING',
    createdAt,
    updatedAt: createdAt,
    ...body,
  }

  await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: item }))

  return NextResponse.json({ data: item }, { status: 201 })
}
