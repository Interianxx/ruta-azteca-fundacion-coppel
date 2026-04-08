import { NextRequest, NextResponse } from 'next/server'
import { invokeLambda } from '@/lib/lambda-invoke'

interface TraduccionRequest  { texto: string; idiomaOrigen?: string; idiomaDestino: string }
interface TraduccionResponse { traduccion: string; cached: boolean }

// POST /api/traduccion — delega al Lambda de Amazon Translate
export async function POST(req: NextRequest) {
  const body: TraduccionRequest = await req.json()

  const result = await invokeLambda<TraduccionResponse>(
    process.env.LAMBDA_TRADUCCION_NAME ?? 'ruta-azteca-traduccion',
    body,
  )

  return NextResponse.json({ data: result })
}
