import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getUploadUrl, getCdnUrl } from '@/lib/s3'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const uid = (session.user as { sub?: string }).sub ?? session.user.email
  if (!uid) return NextResponse.json({ error: 'Sin identidad' }, { status: 400 })

  const { filename, contentType } = await req.json()

  if (!filename || typeof filename !== 'string')
    return NextResponse.json({ error: 'filename requerido' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(contentType))
    return NextResponse.json({ error: 'Solo JPG, PNG o WebP.' }, { status: 400 })

  const sanitized = filename
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.\-_]/g, '')
    .slice(0, 100)
  const key = `negocios/${uid}/${Date.now()}-${sanitized}`

  try {
    const uploadUrl = await getUploadUrl(key, contentType)
    const cdnUrl    = getCdnUrl(key)
    return NextResponse.json({ uploadUrl, cdnUrl })
  } catch {
    return NextResponse.json({ error: 'Error al generar URL de subida' }, { status: 500 })
  }
}
