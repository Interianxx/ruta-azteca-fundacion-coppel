import { NextRequest, NextResponse } from 'next/server'
import { invokeLambda } from '@/lib/lambda-invoke'

interface ChatRequest  { mensaje: string; historial?: { rol: string; contenido: string }[] }
interface ChatResponse { respuesta: string }

// POST /api/chat — delega al Lambda de Bedrock (Claude)
export async function POST(req: NextRequest) {
  const body: ChatRequest = await req.json()

  const result = await invokeLambda<ChatResponse>(
    process.env.LAMBDA_CHATBOT_NAME ?? 'ruta-azteca-chatbot',
    body,
  )

  return NextResponse.json({ data: result })
}
