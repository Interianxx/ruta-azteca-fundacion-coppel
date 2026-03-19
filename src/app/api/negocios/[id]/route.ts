import { NextRequest, NextResponse } from 'next/server'
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME } from '@/lib/dynamo'

// GET /api/negocios/:id
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const result = await dynamo.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: `NEGOCIO#${params.id}`, SK: 'METADATA' },
  }))

  if (!result.Item) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ data: result.Item })
}

// PUT /api/negocios/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const updatedAt = new Date().toISOString()

  // Construir expresión de actualización dinámica
  const entries = Object.entries(body).filter(([k]) => !['PK', 'SK', 'id'].includes(k))
  const updateExpr = 'SET ' + entries.map(([k]) => `#${k} = :${k}`).join(', ') + ', updatedAt = :updatedAt'
  const names  = Object.fromEntries(entries.map(([k]) => [`#${k}`, k]))
  const values = Object.fromEntries([...entries.map(([k, v]) => [`:${k}`, v]), [':updatedAt', updatedAt]])

  await dynamo.send(new UpdateCommand({
    TableName:                 TABLE_NAME,
    Key:                       { PK: `NEGOCIO#${params.id}`, SK: 'METADATA' },
    UpdateExpression:          updateExpr,
    ExpressionAttributeNames:  names,
    ExpressionAttributeValues: values,
  }))

  return NextResponse.json({ message: 'Negocio actualizado' })
}
