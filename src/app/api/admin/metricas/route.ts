import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME, GSI_STATUS } from '@/lib/dynamo'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET /api/admin/metricas
export async function GET() {
  const session = await getServerSession(authOptions)
  if ((session as any)?.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const [activos, pendientes] = await Promise.all([
    dynamo.send(new QueryCommand({
      TableName: TABLE_NAME, IndexName: GSI_STATUS,
      KeyConditionExpression: 'GSI1PK = :s',
      ExpressionAttributeValues: { ':s': 'STATUS#ACTIVE' },
      Select: 'COUNT',
    })),
    dynamo.send(new QueryCommand({
      TableName: TABLE_NAME, IndexName: GSI_STATUS,
      KeyConditionExpression: 'GSI1PK = :s',
      ExpressionAttributeValues: { ':s': 'STATUS#PENDING' },
      Select: 'COUNT',
    })),
  ])

  return NextResponse.json({
    data: {
      negociosActivos:    activos.Count ?? 0,
      negociosPendientes: pendientes.Count ?? 0,
    },
  })
}
