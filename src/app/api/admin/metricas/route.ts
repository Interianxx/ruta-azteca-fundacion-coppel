import { NextResponse } from 'next/server'
import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME, GSI_STATUS } from '@/lib/dynamo'

// GET /api/admin/metricas
export async function GET() {
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
      negociosActivos:   activos.Count ?? 0,
      negociosPendientes: pendientes.Count ?? 0,
    },
  })
}
