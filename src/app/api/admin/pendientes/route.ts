import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME, GSI_STATUS } from '@/lib/dynamo'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET /api/admin/pendientes
export async function GET() {
  const session = await getServerSession(authOptions)
  if ((session as any)?.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const result = await dynamo.send(new QueryCommand({
    TableName:              TABLE_NAME,
    IndexName:              GSI_STATUS,
    KeyConditionExpression: 'GSI1PK = :status',
    ExpressionAttributeValues: { ':status': 'STATUS#PENDING' },
    ScanIndexForward: true, // más antiguos primero
  }))

  return NextResponse.json({ data: { items: result.Items ?? [], count: result.Count ?? 0 } })
}
