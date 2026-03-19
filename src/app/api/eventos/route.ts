import { NextRequest, NextResponse } from 'next/server'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME } from '@/lib/dynamo'

type TipoEvento = 'vista' | 'click_whatsapp' | 'click_telefono' | 'favorito' | 'chat'

// POST /api/eventos — registrar interacción analytics
export async function POST(req: NextRequest) {
  const { negocioId, tipo, turistaId }: { negocioId: string; tipo: TipoEvento; turistaId?: string } =
    await req.json()

  const ts = new Date().toISOString()

  await dynamo.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK:        `NEGOCIO#${negocioId}`,
      SK:        `EVENTO#${ts}#${tipo}`,
      negocioId,
      tipo,
      turistaId,
      ts,
    },
  }))

  return NextResponse.json({ message: 'Evento registrado' }, { status: 201 })
}
