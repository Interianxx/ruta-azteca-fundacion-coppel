import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME } from '@/lib/dynamo'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET /api/admin/metricas/idiomas
export async function GET() {
  const session = await getServerSession(authOptions)
  if ((session as any)?.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const result = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': 'METRICS#IDIOMAS' },
    }))

    const items = (result.Items ?? []) as { idioma: string; visitas: number }[]
    const total = items.reduce((sum, i) => sum + (i.visitas ?? 0), 0)

    const porIdioma = items
      .map(i => ({
        idioma: i.idioma,
        visitas: i.visitas ?? 0,
        porcentaje: total > 0 ? Math.round((i.visitas / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.visitas - a.visitas)

    return NextResponse.json({ data: { total, porIdioma } })
  } catch (e) {
    console.error('[metricas/idiomas]', e)
    return NextResponse.json({ error: 'Error al obtener métricas de idiomas' }, { status: 500 })
  }
}
