import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { ScanCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME } from '@/lib/dynamo'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET /api/negocios/mio — negocio del usuario autenticado
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const uid = (session.user as { sub?: string }).sub ?? session.user.email
  if (!uid) return NextResponse.json({ error: 'Sin identidad' }, { status: 400 })

  try {
    const result = await dynamo.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'propietarioId = :uid AND SK = :sk',
      ExpressionAttributeValues: { ':uid': uid, ':sk': 'METADATA' },
    }))
    return NextResponse.json({ data: result.Items?.[0] ?? null })
  } catch {
    return NextResponse.json({ error: 'Error al obtener negocio' }, { status: 500 })
  }
}
