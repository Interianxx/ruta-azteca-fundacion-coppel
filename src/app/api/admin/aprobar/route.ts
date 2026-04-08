import { NextRequest, NextResponse } from 'next/server'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME } from '@/lib/dynamo'
import { moverAGrupo } from '@/lib/cognito'

// PUT /api/admin/aprobar — aprueba o rechaza un negocio
export async function PUT(req: NextRequest) {
  const { negocioId, propietarioId, propietarioEmail, accion }: {
    negocioId: string
    propietarioId: string
    propietarioEmail?: string
    accion: 'aprobar' | 'rechazar'
  } = await req.json()

  const nuevoEstado = accion === 'aprobar' ? 'ACTIVE' : 'REJECTED'
  const updatedAt   = new Date().toISOString()

  // 1. Actualizar estado en DynamoDB
  await dynamo.send(new UpdateCommand({
    TableName:                 TABLE_NAME,
    Key:                       { PK: `NEGOCIO#${negocioId}`, SK: 'METADATA' },
    UpdateExpression:          'SET #estado = :estado, GSI1PK = :gsi1pk, updatedAt = :updatedAt',
    ExpressionAttributeNames:  { '#estado': 'estado' },
    ExpressionAttributeValues: {
      ':estado':    nuevoEstado,
      ':gsi1pk':   `STATUS#${nuevoEstado}`,
      ':updatedAt': updatedAt,
    },
  }))

  // 2. Mover usuario en Cognito (usar email como username; fallback al sub)
  if (accion === 'aprobar') {
    await moverAGrupo(propietarioEmail ?? propietarioId, 'negocio_pendiente', 'negocio_activo')
  }

  return NextResponse.json({ message: `Negocio ${accion === 'aprobar' ? 'aprobado' : 'rechazado'}` })
}
