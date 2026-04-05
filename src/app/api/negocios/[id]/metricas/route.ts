import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME } from '@/lib/dynamo'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET /api/negocios/:id/metricas — métricas del negocio para su dueño
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params

  try {
    // 1. Verificar que el negocio existe y pertenece al usuario
    const negocioRes = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `NEGOCIO#${id}`, SK: 'METADATA' },
      ProjectionExpression: 'id, propietarioId, calificacion, totalReviews',
    }))

    const negocio = negocioRes.Item
    if (!negocio) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

    const uid = (session.user as { sub?: string }).sub ?? session.user.email
    if (negocio.propietarioId !== uid) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }

    // 2. Contar eventos por tipo en paralelo
    const countEvento = (tipo: string) =>
      dynamo.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        FilterExpression: '#tipo = :tipo',
        ExpressionAttributeNames: { '#tipo': 'tipo' },
        ExpressionAttributeValues: {
          ':pk':   `NEGOCIO#${id}`,
          ':sk':   'EVENTO#',
          ':tipo': tipo,
        },
        Select: 'COUNT',
      })).then(r => r.Count ?? 0)

    const [vistas, clicks_whatsapp, clicks_telefono] = await Promise.all([
      countEvento('vista'),
      countEvento('click_whatsapp'),
      countEvento('click_telefono'),
    ])

    return NextResponse.json({
      data: {
        vistas,
        calificacion:  negocio.calificacion  ?? null,
        totalReviews:  negocio.totalReviews  ?? 0,
        clicks_whatsapp,
        clicks_telefono,
      },
    })
  } catch (e) {
    console.error('[negocios/metricas]', e)
    return NextResponse.json({ error: 'Error al obtener métricas' }, { status: 500 })
  }
}
