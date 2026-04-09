import { NextRequest, NextResponse } from 'next/server'
import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { createHmac } from 'crypto'
import { AWS_REGION, awsCredentials } from '@/lib/aws-config'

const client    = new CognitoIdentityProviderClient({ region: AWS_REGION, credentials: awsCredentials })
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!
const SECRET    = process.env.COGNITO_CLIENT_SECRET!

function secretHash(username: string) {
  return createHmac('sha256', SECRET).update(username + CLIENT_ID).digest('base64')
}

const MSG: Record<string, string> = {
  CodeMismatchException:    'Código incorrecto.',
  ExpiredCodeException:     'El código expiró. Solicita uno nuevo.',
  InvalidPasswordException: 'La contraseña debe tener al menos 8 caracteres, mayúsculas, minúsculas y números.',
  LimitExceededException:   'Demasiados intentos. Espera un momento.',
}

export async function POST(req: NextRequest) {
  const { email, code, password } = await req.json()
  try {
    await client.send(new ConfirmForgotPasswordCommand({
      ClientId:         CLIENT_ID,
      SecretHash:       secretHash(email),
      Username:         email,
      ConfirmationCode: code,
      Password:         password,
    }))
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: MSG[e.name] ?? e.message ?? 'Error al cambiar la contraseña.' }, { status: 400 })
  }
}
