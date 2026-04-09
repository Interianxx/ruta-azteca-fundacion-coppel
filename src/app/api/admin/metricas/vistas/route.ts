import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME, GSI_STATUS } from '@/lib/dynamo'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET /api/admin/metricas/vistas
export async function GET() {
  const session = await getServerSession(authOptions)
  if ((session as any)?.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const activos = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI_STATUS,
      KeyConditionExpression: 'GSI1PK = :s',
      ExpressionAttributeValues: { ':s': 'STATUS#ACTIVE' },
      ProjectionExpression: 'id, nombre',
    }))

    const negocios = (activos.Items ?? []) as { id: string; nombre: string }[]

    const conteos = await Promise.all(
      negocios.map(n =>
        dynamo.send(new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
          FilterExpression: '#tipo = :vista',
          ExpressionAttributeNames: { '#tipo': 'tipo' },
          ExpressionAttributeValues: {
            ':pk': `NEGOCIO#${n.id}`,
            ':sk': 'EVENTO#',
            ':vista': 'vista',
          },
          Select: 'COUNT',
        })).then(r => ({ negocioId: n.id, nombre: n.nombre, vistas: r.Count ?? 0 }))
      )
    )

    const porNegocio = conteos.sort((a, b) => b.vistas - a.vistas)
    const totalVistas = porNegocio.reduce((sum, n) => sum + n.vistas, 0)

    return NextResponse.json({ data: { totalVistas, porNegocio } })
  } catch (e) {
    console.error('[metricas/vistas]', e)
    return NextResponse.json({ error: 'Error al obtener métricas de vistas' }, { status: 500 })
  }
}
