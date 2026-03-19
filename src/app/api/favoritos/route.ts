import { NextRequest, NextResponse } from 'next/server'
import { QueryCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME } from '@/lib/dynamo'

// GET /api/favoritos?turistaId=xxx
export async function GET(req: NextRequest) {
  const turistaId = req.nextUrl.searchParams.get('turistaId')
  if (!turistaId) return NextResponse.json({ error: 'turistaId requerido' }, { status: 400 })

  const result = await dynamo.send(new QueryCommand({
    TableName:              TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: {
      ':pk':     `USER#${turistaId}`,
      ':prefix': 'FAV#',
    },
  }))

  return NextResponse.json({ data: { items: result.Items ?? [], count: result.Count ?? 0 } })
}

// POST /api/favoritos — agregar favorito
export async function POST(req: NextRequest) {
  const { turistaId, negocioId } = await req.json()

  await dynamo.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK:        `USER#${turistaId}`,
      SK:        `FAV#${negocioId}`,
      negocioId,
      createdAt: new Date().toISOString(),
    },
  }))

  return NextResponse.json({ message: 'Favorito agregado' }, { status: 201 })
}

// DELETE /api/favoritos?turistaId=xxx&negocioId=yyy
export async function DELETE(req: NextRequest) {
  const turistaId = req.nextUrl.searchParams.get('turistaId')
  const negocioId = req.nextUrl.searchParams.get('negocioId')

  await dynamo.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { PK: `USER#${turistaId}`, SK: `FAV#${negocioId}` },
  }))

  return NextResponse.json({ message: 'Favorito eliminado' })
}
