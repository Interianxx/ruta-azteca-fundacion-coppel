import { NextRequest, NextResponse } from 'next/server'
import { PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME } from '@/lib/dynamo'

type TipoEvento = 'vista' | 'click_whatsapp' | 'click_telefono' | 'favorito' | 'chat'

// POST /api/eventos — registrar interacción analytics
export async function POST(req: NextRequest) {
  const { negocioId, tipo, turistaId, idioma }: {
    negocioId: string; tipo: TipoEvento; turistaId?: string; idioma?: string
  } = await req.json()

  const ts = new Date().toISOString()

  const ops: Promise<unknown>[] = [
    dynamo.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK:        `NEGOCIO#${negocioId}`,
        SK:        `EVENTO#${ts}#${tipo}`,
        negocioId,
        tipo,
        turistaId,
        idioma,
        ts,
      },
    })),
  ]

  // Incrementar contador de idioma cuando hay vista y se conoce el idioma
  if (tipo === 'vista' && idioma) {
    const lang = idioma.split('-')[0].toLowerCase()
    ops.push(
      dynamo.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: 'METRICS#IDIOMAS', SK: `LANG#${lang}` },
        UpdateExpression: 'SET visitas = if_not_exists(visitas, :z) + :one, idioma = :lang',
        ExpressionAttributeValues: { ':z': 0, ':one': 1, ':lang': lang },
      }))
    )
  }

  await Promise.all(ops)

  return NextResponse.json({ message: 'Evento registrado' }, { status: 201 })
}
