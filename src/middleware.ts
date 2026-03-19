import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, createRemoteJWKSet } from 'jose'

const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? ''
const REGION       = process.env.AWS_REGION ?? 'us-east-1'
const JWKS_URI     = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`
const JWKS         = createRemoteJWKSet(new URL(JWKS_URI))

// Prefijo de ruta → roles que pueden acceder
const RUTAS_PROTEGIDAS: Record<string, string[]> = {
  '/turista':  ['turista', 'negocio_activo', 'admin'],
  '/negocio':  ['negocio_pendiente', 'negocio_activo', 'admin'],
  '/admin':    ['admin'],
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const prefijo = Object.keys(RUTAS_PROTEGIDAS).find((p) =>
    pathname.startsWith(p),
  )
  if (!prefijo) return NextResponse.next()

  const token = req.cookies.get('idToken')?.value
  if (!token) return NextResponse.redirect(new URL('/', req.url))

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`,
    })

    const grupos = (payload['cognito:groups'] as string[]) ?? []
    const permitidos = RUTAS_PROTEGIDAS[prefijo]

    if (!grupos.some((g) => permitidos.includes(g))) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/', req.url))
  }
}

export const config = {
  matcher: ['/turista/:path*', '/negocio/:path*', '/admin/:path*'],
}
