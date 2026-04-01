import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Prefijo de ruta → roles que pueden acceder
// NOTA: /turista no está protegido — los guests pueden ver el mapa sin cuenta.
// Las features que requieren auth (favoritos, perfil) se bloquean dentro de cada componente.
const RUTAS_PROTEGIDAS: Record<string, string[]> = {
  '/negocio':  ['negocio_pendiente', 'negocio_activo', 'admin'],
  '/admin':    ['admin'],
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const prefijo = Object.keys(RUTAS_PROTEGIDAS).find((p) =>
    pathname.startsWith(p),
  )
  if (!prefijo) return NextResponse.next()

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) return NextResponse.redirect(new URL('/login', req.url))

  // Usuarios nuevos sin grupo asignado → acceso como turista por defecto
  const rol = (token.rol as string) ?? 'turista'
  const permitidos = RUTAS_PROTEGIDAS[prefijo]

  if (!permitidos.includes(rol)) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/negocio/:path*', '/admin/:path*'],
}
