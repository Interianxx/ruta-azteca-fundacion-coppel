import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PutCommand, QueryCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME } from '@/lib/dynamo'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { randomUUID } from 'crypto'

function getUid(session: Awaited<ReturnType<typeof getServerSession>>): string | null {
  if (!session?.user) return null
  return (session.user as { sub?: string }).sub ?? session.user.email ?? null
}

export interface Resena {
  id:          string
  negocioId:   string
  userId:      string
  userName:    string
  userImage?:  string
  calificacion: number   // 1–5
  comentario:  string
  createdAt:   string
}

// GET /api/resenas?negocioId=xxx
export async function GET(req: NextRequest) {
  const negocioId = req.nextUrl.searchParams.get('negocioId')
  if (!negocioId) return NextResponse.json({ error: 'negocioId requerido' }, { status: 400 })

  const result = await dynamo.send(new QueryCommand({
    TableName:              TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: {
      ':pk':     `NEGOCIO#${negocioId}`,
      ':prefix': 'REVIEW#',
    },
    ScanIndexForward: false,  // más recientes primero
    Limit: 20,
  }))

  return NextResponse.json({ data: result.Items ?? [] })
}

// POST /api/resenas — { negocioId, calificacion, comentario }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const uid = getUid(session)
  if (!uid) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { negocioId, calificacion, comentario } = await req.json()
  if (!negocioId || !calificacion || !comentario?.trim()) {
    return NextResponse.json({ error: 'negocioId, calificacion y comentario requeridos' }, { status: 400 })
  }
  if (calificacion < 1 || calificacion > 5) {
    return NextResponse.json({ error: 'calificacion debe ser entre 1 y 5' }, { status: 400 })
  }

  const createdAt = new Date().toISOString()
  const id        = randomUUID()

  // 1. Guardar la reseña
  await dynamo.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK:          `NEGOCIO#${negocioId}`,
      SK:          `REVIEW#${createdAt}#${uid}`,
      id,
      negocioId,
      userId:      uid,
      userName:    session!.user?.name ?? 'Anónimo',
      userImage:   session!.user?.image ?? null,
      calificacion,
      comentario:  comentario.trim(),
      createdAt,
    },
    // Un usuario solo puede tener una reseña por negocio (opcional: quitar para permitir múltiples)
  }))

  // 2. Recalcular calificación promedio del negocio
  const negocio = await dynamo.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: `NEGOCIO#${negocioId}`, SK: 'METADATA' },
  }))

  if (negocio.Item) {
    const oldTotal = (negocio.Item.totalReviews as number) ?? 0
    const oldCal   = (negocio.Item.calificacion as number) ?? 0
    const newTotal = oldTotal + 1
    const newCal   = parseFloat(((oldCal * oldTotal + calificacion) / newTotal).toFixed(1))

    await dynamo.send(new UpdateCommand({
      TableName:       TABLE_NAME,
      Key:             { PK: `NEGOCIO#${negocioId}`, SK: 'METADATA' },
      UpdateExpression: 'SET calificacion = :cal, totalReviews = :total, updatedAt = :ts',
      ExpressionAttributeValues: {
        ':cal':   newCal,
        ':total': newTotal,
        ':ts':    createdAt,
      },
    }))
  }

  return NextResponse.json({ ok: true, data: { id, calificacion, comentario, createdAt } }, { status: 201 })
}
