import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME } from '@/lib/dynamo'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

function getUid(session: Session | null): string | null {
  if (!session?.user) return null
  return (session.user as { sub?: string }).sub ?? session.user.email ?? null
}

// GET /api/favoritos — list negocioIds favorited by current user
export async function GET() {
  const session = await getServerSession(authOptions)
  const uid = getUid(session)
  if (!uid) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const result = await dynamo.send(new QueryCommand({
    TableName:              TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: {
      ':pk':     `USER#${uid}`,
      ':prefix': 'FAV#',
    },
  }))

  const ids = (result.Items ?? []).map(item => (item.SK as string).replace('FAV#', ''))
  return NextResponse.json({ data: ids })
}

// POST /api/favoritos — { negocioId }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const uid = getUid(session)
  if (!uid) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { negocioId } = await req.json()
  if (!negocioId) return NextResponse.json({ error: 'negocioId requerido' }, { status: 400 })

  await dynamo.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK:      `USER#${uid}`,
      SK:      `FAV#${negocioId}`,
      negocioId,
      addedAt: new Date().toISOString(),
    },
  }))

  return NextResponse.json({ ok: true })
}

// DELETE /api/favoritos — { negocioId }
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const uid = getUid(session)
  if (!uid) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { negocioId } = await req.json()
  if (!negocioId) return NextResponse.json({ error: 'negocioId requerido' }, { status: 400 })

  await dynamo.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { PK: `USER#${uid}`, SK: `FAV#${negocioId}` },
  }))

  return NextResponse.json({ ok: true })
}
