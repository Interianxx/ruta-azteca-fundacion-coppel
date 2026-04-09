import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { createHmac } from 'crypto'
import { AWS_REGION, awsCredentials } from '@/lib/aws-config'

// Decode a JWT payload without cryptographic verification (safe for trusted Cognito tokens)
function decodeJwtPayload(jwt: string): Record<string, unknown> {
  try {
    return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf-8'))
  } catch {
    return {}
  }
}

const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!
const CLIENT_ID      = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!
const SECRET         = process.env.COGNITO_CLIENT_SECRET!

const cognitoClient = new CognitoIdentityProviderClient({ region: AWS_REGION, credentials: awsCredentials })

function secretHash(username: string) {
  return createHmac('sha256', SECRET).update(username + CLIENT_ID).digest('base64')
}

// Orden de mayor a menor privilegio — se usa para elegir el rol dominante
// cuando un usuario pertenece a varios grupos (ej: admin + turista).
const ROLES_PROPIOS = ['admin', 'negocio_activo', 'negocio_pendiente', 'turista']

const COGNITO_ERRORS: Record<string, string> = {
  NotAuthorizedException:          'Correo o contraseña incorrectos.',
  UserNotFoundException:           'No existe una cuenta con este correo.',
  UserNotConfirmedException:       'Verifica tu correo antes de iniciar sesión.',
  PasswordResetRequiredException:  'Debes restablecer tu contraseña.',
  TooManyRequestsException:        'Demasiados intentos. Espera un momento.',
}

// En HTTP (localhost) las cookies no llevan prefijo __Secure- ni flag secure.
// En HTTPS (producción) se activan automáticamente.
const useSecure = process.env.NEXTAUTH_URL?.startsWith('https://') ?? false

const pfx = useSecure ? '__Secure-' : ''

const cookieOpts = (extra?: object) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: useSecure,
  ...extra,
})

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    // ── Google via Cognito Hosted UI ──────────────────────────────────────────
    // Custom provider con endpoints explícitos: evita la llamada de OIDC discovery
    // que hace next-auth al iniciar sesión (y que timing-out contra cognito-idp).
    {
      id:           'cognito',
      name:         'Cognito',
      type:         'oauth' as const,
      clientId:     CLIENT_ID,
      clientSecret: SECRET,
      authorization: {
        url:    `https://${COGNITO_DOMAIN}/oauth2/authorize`,
        params: { scope: 'openid email profile', response_type: 'code' },
      },
      // Token exchange manual: evita que openid-client intente validar el id_token
      // (la validación requiere JWKS de cognito-idp.amazonaws.com, dominio inaccesible aquí).
      token: {
        url: `https://${COGNITO_DOMAIN}/oauth2/token`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async request(context: any) {
          const body = new URLSearchParams({
            grant_type:   'authorization_code',
            code:         context.params.code,
            redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/cognito`,
            ...(context.checks.code_verifier
              ? { code_verifier: context.checks.code_verifier }
              : {}),
          })
          const res = await fetch(`https://${COGNITO_DOMAIN}/oauth2/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization:  `Basic ${Buffer.from(`${CLIENT_ID}:${SECRET}`).toString('base64')}`,
            },
            body: body.toString(),
          })
          const tokens = await res.json()
          // Quitar id_token para que openid-client no intente buscar el JWKS
          const { id_token: _removed, ...rest } = tokens
          return { tokens: rest }
        },
      },
      userinfo: `https://${COGNITO_DOMAIN}/oauth2/userInfo`,
      // Desactiva el procesamiento del id_token — el perfil viene del userinfo endpoint.
      idToken:  false,
      checks:   ['pkce', 'state'],
      profile(profile: Record<string, string>) {
        return {
          id:    profile.sub,
          name:  profile.name ?? profile.email,
          email: profile.email,
          image: profile.picture ?? null,
        }
      },
    },

    // ── Email + contraseña (USER_PASSWORD_AUTH) ───────────────────────────────
    CredentialsProvider({
      id:   'credentials',
      name: 'Email',
      credentials: {
        email:    { label: 'Email',      type: 'email'    },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const { email, password } = credentials as { email: string; password: string }

        const res = await cognitoClient.send(new InitiateAuthCommand({
          AuthFlow:   'USER_PASSWORD_AUTH',
          ClientId:   CLIENT_ID,
          AuthParameters: {
            USERNAME:    email,
            PASSWORD:    password,
            SECRET_HASH: secretHash(email),
          },
        })).catch((e: { name: string; message: string }) => {
          throw new Error(COGNITO_ERRORS[e.name] ?? e.message ?? 'Error al iniciar sesión.')
        })

        if (!res.AuthenticationResult?.AccessToken) return null

        const payload = decodeJwtPayload(res.AuthenticationResult.AccessToken)
        const groups  = (payload['cognito:groups'] as string[] | undefined) ?? []
        const rol     = ROLES_PROPIOS.find(r => groups.includes(r)) ?? 'turista'
        return {
          id:    payload.sub as string,
          email,
          name:  (payload.name as string | undefined) ?? email.split('@')[0],
          rol,   // picked up in jwt callback
        }
      },
    }),
  ],

  // Configuración explícita de cookies para garantizar que sobrevivan el
  // flujo de redirecciones cross-site: app → Cognito → Google → Cognito → app
  cookies: {
    pkceCodeVerifier: {
      name: `${pfx}next-auth.pkce.code_verifier`,
      options: cookieOpts(),
    },
    state: {
      name: `${pfx}next-auth.state`,
      options: cookieOpts({ maxAge: 900 }),
    },
    nonce: {
      name: `${pfx}next-auth.nonce`,
      options: cookieOpts(),
    },
    callbackUrl: {
      name: `${pfx}next-auth.callback-url`,
      options: { httpOnly: false, sameSite: 'lax' as const, path: '/', secure: useSecure },
    },
    sessionToken: {
      name: `${pfx}next-auth.session-token`,
      options: cookieOpts({ maxAge: 30 * 24 * 60 * 60 }), // 30 días
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  callbacks: {
    async jwt({ token, account, user }) {
      if (account?.type === 'oauth') {
        // OAuth flow (Google via Cognito Hosted UI)
        const payload   = account.access_token ? decodeJwtPayload(account.access_token) : {}
        const allGroups = (payload['cognito:groups'] as string[] | undefined) ?? []
        token.rol = ROLES_PROPIOS.find(r => allGroups.includes(r)) ?? 'turista'
      } else if (user && (user as { rol?: string }).rol) {
        token.rol = (user as { rol?: string }).rol
      }
      return token
    },
    async session({ session, token }) {
      ;(session as { rol?: string }).rol      = token.rol as string
      ;(session.user as { sub?: string }).sub = token.sub
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
