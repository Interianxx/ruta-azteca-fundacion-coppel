import { NextResponse } from 'next/server'

/**
 * Redirige al endpoint de logout de Cognito para limpiar su sesión OAuth.
 * Se llama DESPUÉS de que NextAuth ya borró la sesión local (cookie next-auth.session-token).
 *
 * Flujo: signOut({ callbackUrl: '/api/auth/logout' })
 *   → NextAuth borra cookie
 *   → GET /api/auth/logout
 *   → redirect a Cognito /logout
 *   → Cognito borra su sesión y redirige a /login
 */
export function GET() {
  const domain   = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!
  const logoutUri = encodeURIComponent(process.env.NEXTAUTH_URL!)

  return NextResponse.redirect(
    `https://${domain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`,
  )
}
