import { NextRequest, NextResponse } from 'next/server'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { invokeLambda } from '@/lib/lambda-invoke'
import { dynamo, TABLE_NAME, GSI_STATUS } from '@/lib/dynamo'

interface ChatRequest  { mensaje: string; historial?: { rol: string; contenido: string }[]; idioma?: string }
interface ChatResponse { respuesta: string }

// Cache en memoria — se refresca cada 5 minutos
let negociosCache: object[] = []
let cacheTimestamp = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos

async function getNegociosCache(): Promise<object[]> {
  if (negociosCache.length > 0 && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return negociosCache
  }
  try {
    const result = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI_STATUS,
      KeyConditionExpression: 'GSI1PK = :status',
      ExpressionAttributeValues: { ':status': 'STATUS#ACTIVE' },
      Limit: 100,
    }))
    negociosCache = (result.Items ?? []).map(n => ({
      id: n.id, nombre: n.nombre, descripcion: n.descripcion,
      categoria: n.categoria, direccion: n.direccion,
      tags: n.tags, calificacion: n.calificacion,
    }))
    cacheTimestamp = Date.now()
  } catch {
    // Si falla, devolver cache anterior (o vacío en el primer intento)
  }
  return negociosCache
}

// POST /api/chat — delega al Lambda de Bedrock (Claude)
export async function POST(req: NextRequest) {
  const body: ChatRequest = await req.json()

  const negocios = await getNegociosCache()

  const result = await invokeLambda<ChatResponse>(
    process.env.LAMBDA_CHATBOT_NAME ?? 'ruta-azteca-chatbot',
    { ...body, negocios },
  )

  return NextResponse.json({ data: result })
}
