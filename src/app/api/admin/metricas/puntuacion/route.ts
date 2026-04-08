import { NextResponse } from 'next/server'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME, GSI_STATUS } from '@/lib/dynamo'

// GET /api/admin/metricas/puntuacion
export async function GET() {
  try {
    const activos = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI_STATUS,
      KeyConditionExpression: 'GSI1PK = :s',
      ExpressionAttributeValues: { ':s': 'STATUS#ACTIVE' },
      ProjectionExpression: 'id, nombre, calificacion, totalReviews',
    }))

    const items = (activos.Items ?? []) as {
      id: string; nombre: string; calificacion?: number; totalReviews?: number
    }[]

    const conResenas = items.filter(n => n.calificacion != null && (n.totalReviews ?? 0) > 0)

    const totalResenas = conResenas.reduce((sum, n) => sum + (n.totalReviews ?? 0), 0)
    const sumaPonderada = conResenas.reduce((sum, n) => sum + (n.calificacion ?? 0) * (n.totalReviews ?? 0), 0)
    const promedioGlobal = totalResenas > 0
      ? Math.round((sumaPonderada / totalResenas) * 10) / 10
      : 0

    const porNegocio = conResenas
      .map(n => ({ negocioId: n.id, nombre: n.nombre, calificacion: n.calificacion!, totalReviews: n.totalReviews! }))
      .sort((a, b) => b.calificacion - a.calificacion)

    return NextResponse.json({ data: { promedioGlobal, totalResenas, porNegocio } })
  } catch (e) {
    console.error('[metricas/puntuacion]', e)
    return NextResponse.json({ error: 'Error al obtener métricas de puntuación' }, { status: 500 })
  }
}
