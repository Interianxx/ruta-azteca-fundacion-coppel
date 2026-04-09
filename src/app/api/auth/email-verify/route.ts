import { NextRequest, NextResponse } from 'next/server'
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { createHmac } from 'crypto'
import { agregarAGrupo } from '@/lib/cognito'
import { AWS_REGION, awsCredentials } from '@/lib/aws-config'

const client    = new CognitoIdentityProviderClient({ region: AWS_REGION, credentials: awsCredentials })
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!
const SECRET    = process.env.COGNITO_CLIENT_SECRET!

function secretHash(username: string) {
  return createHmac('sha256', SECRET).update(username + CLIENT_ID).digest('base64')
}

const MSG: Record<string, string> = {
  CodeMismatchException:    'Código incorrecto. Verifica e intenta de nuevo.',
  ExpiredCodeException:     'El código expiró. Solicita uno nuevo.',
  TooManyRequestsException: 'Demasiados intentos. Espera un momento.',
  LimitExceededException:   'Demasiados intentos. Espera un momento.',
  NotAuthorizedException:   'La cuenta ya fue confirmada o no existe.',
  AliasExistsException:     'Este correo ya está en uso.',
}

export async function POST(req: NextRequest) {
  const { email, code, resend, role } = await req.json()

  if (resend) {
    try {
      await client.send(new ResendConfirmationCodeCommand({
        ClientId:   CLIENT_ID,
        SecretHash: secretHash(email),
        Username:   email,
      }))
      return NextResponse.json({ ok: true })
    } catch (e: any) {
      return NextResponse.json({ error: MSG[e.name] ?? e.message ?? 'Error al reenviar el código.' }, { status: 400 })
    }
  }

  try {
    await client.send(new ConfirmSignUpCommand({
      ClientId:         CLIENT_ID,
      SecretHash:       secretHash(email),
      Username:         email,
      ConfirmationCode: code,
    }))
    const group = role === 'negocio' ? 'negocio_pendiente' : 'turista'
    await agregarAGrupo(email, group)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[verify] ERROR:', e.name, e.message)
    return NextResponse.json({ error: MSG[e.name] ?? e.message ?? 'Error al verificar el código.' }, { status: 400 })
  }
}
