import { NextRequest, NextResponse } from 'next/server'
import { invokeLambda } from '@/lib/lambda-invoke'

interface VozResponse { texto: string; confianza: number }

// POST /api/voz — fallback con AWS Transcribe cuando Web Speech API falla
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const audio    = formData.get('audio') as File
  const idioma   = (formData.get('idioma') as string) ?? 'es-MX'

  const buffer = Buffer.from(await audio.arrayBuffer()).toString('base64')

  const result = await invokeLambda<VozResponse>(
    process.env.LAMBDA_VOZ_NAME ?? 'ruta-azteca-voz',
    { audio: buffer, idioma },
  )

  return NextResponse.json({ data: result })
}
