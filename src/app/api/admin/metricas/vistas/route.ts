import { NextResponse } from 'next/server'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME, GSI_STATUS } from '@/lib/dynamo'

// GET /api/admin/metricas/vistas
export async function GET() {
  try {
    // 1. Obtener todos los negocios activos
    const activos = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI_STATUS,
      KeyConditionExpression: 'GSI1PK = :s',
      ExpressionAttributeValues: { ':s': 'STATUS#ACTIVE' },
      ProjectionExpression: 'id, nombre',
    }))

    const negocios = (activos.Items ?? []) as { id: string; nombre: string }[]

    // 2. Contar eventos de tipo 'vista' por negocio en paralelo
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
