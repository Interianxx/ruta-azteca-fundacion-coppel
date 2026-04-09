import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME, GSI_CATEGORIA } from '@/lib/dynamo'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET /api/admin/categorias — lista categorías con conteo de negocios
export async function GET() {
  const session = await getServerSession(authOptions)
  if ((session as any)?.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    // 1. Obtener todas las categorías (tipo = CATEGORIA)
    const scan = await dynamo.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: '#tipo = :cat',
      ExpressionAttributeNames: { '#tipo': 'tipo' },
      ExpressionAttributeValues: { ':cat': 'CATEGORIA' },
    }))

    const categorias = (scan.Items ?? []) as {
      slug: string; nombre: string; nombre_en: string; emoji: string; descripcion: string
    }[]

    // 2. Contar negocios activos y totales por categoría en paralelo
    const conConteos = await Promise.all(
      categorias.map(async cat => {
        const [activos, todos] = await Promise.all([
          dynamo.send(new QueryCommand({
            TableName:              TABLE_NAME,
            IndexName:              GSI_CATEGORIA,
            KeyConditionExpression: 'GSI2PK = :cat',
            FilterExpression:       'GSI1PK = :active',
            ExpressionAttributeValues: { ':cat': `CAT#${cat.slug}`, ':active': 'STATUS#ACTIVE' },
            Select: 'COUNT',
          })).then(r => r.Count ?? 0).catch(() => 0),
          dynamo.send(new QueryCommand({
            TableName:              TABLE_NAME,
            IndexName:              GSI_CATEGORIA,
            KeyConditionExpression: 'GSI2PK = :cat',
            ExpressionAttributeValues: { ':cat': `CAT#${cat.slug}` },
            Select: 'COUNT',
          })).then(r => r.Count ?? 0).catch(() => 0),
        ])

        return {
          slug:            cat.slug,
          nombre:          cat.nombre,
          nombre_en:       cat.nombre_en ?? '',
          emoji:           cat.emoji,
          descripcion:     cat.descripcion,
          negociosActivos: activos,
          negociosTotales: todos,
        }
      })
    )

    const sorted = conConteos.sort((a, b) => b.negociosActivos - a.negociosActivos)
    return NextResponse.json({ data: { items: sorted } })
  } catch (e) {
    console.error('[admin/categorias]', e)
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 })
  }
}
