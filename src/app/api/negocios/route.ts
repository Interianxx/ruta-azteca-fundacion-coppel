import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME, GSI_STATUS, GSI_CATEGORIA } from '@/lib/dynamo'
import { cognitoClient } from '@/lib/cognito'
import { AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import type { NegocioInput } from '@/types/negocio'
import { randomUUID } from 'crypto'

const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!

// GET /api/negocios?categoria=comida&lastKey=...
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const categoria = searchParams.get('categoria')
  const lastKey   = searchParams.get('lastKey')

  try {
    let result

    if (categoria) {
      result = await dynamo.send(new QueryCommand({
        TableName:              TABLE_NAME,
        IndexName:              GSI_CATEGORIA,
        KeyConditionExpression: 'GSI2PK = :cat',
        ExpressionAttributeValues: { ':cat': `CAT#${categoria}` },
        Limit: 50,
        ExclusiveStartKey: lastKey ? JSON.parse(lastKey) : undefined,
      }))
    } else {
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
  } catch {
    return NextResponse.json({ error: 'Error al obtener negocios' }, { status: 500 })
  }
}

// POST /api/negocios — registrar negocio (requiere auth)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const uid   = (session.user as { sub?: string }).sub ?? session.user.email ?? null
  const email = session.user.email
  if (!uid) return NextResponse.json({ error: 'No se pudo identificar al usuario' }, { status: 400 })

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
    estado:        'PENDING',
    propietarioId: uid,
    propietarioEmail: email,
    createdAt,
    updatedAt:     createdAt,
    ...body,
  }

  // 1. Guardar en DynamoDB
  await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: item }))

  // 2. Meter al usuario en el grupo negocio_pendiente de Cognito
  if (email) {
    await cognitoClient.send(new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username:   email,
      GroupName:  'negocio_pendiente',
    })).catch(() => {}) // No bloquear si falla (ej. ya está en el grupo)
  }

  return NextResponse.json({ data: item }, { status: 201 })
}
