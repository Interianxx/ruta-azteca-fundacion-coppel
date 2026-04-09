import { NextRequest, NextResponse } from 'next/server'
import {
  CognitoIdentityProviderClient,
  ForgotPasswordCommand,
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
  UserNotFoundException:     'No existe una cuenta con ese correo.',
  NotAuthorizedException:    'No se puede enviar el código a esta cuenta.',
  LimitExceededException:    'Demasiados intentos. Espera un momento.',
  InvalidParameterException: 'El correo no está verificado aún.',
}

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  try {
    await client.send(new ForgotPasswordCommand({
      ClientId:   CLIENT_ID,
      SecretHash: secretHash(email),
      Username:   email,
    }))
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: MSG[e.name] ?? e.message ?? 'Error al enviar el código.' }, { status: 400 })
  }
}
