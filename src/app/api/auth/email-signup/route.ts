import { NextRequest, NextResponse } from 'next/server'
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
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
  UsernameExistsException:    'Ya existe una cuenta con este correo.',
  InvalidPasswordException:   'La contraseña debe tener al menos 8 caracteres, mayúsculas, minúsculas y números.',
  InvalidParameterException:  'Datos inválidos. Revisa el formulario.',
  LimitExceededException:     'Demasiados intentos. Espera un momento e intenta de nuevo.',
}

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json()

  try {
    await client.send(new SignUpCommand({
      ClientId:     CLIENT_ID,
      SecretHash:   secretHash(email),
      Username:     email,
      Password:     password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name',  Value: name || email.split('@')[0] },
      ],
    }))
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: MSG[e.name] ?? e.message ?? 'Error al crear la cuenta.' }, { status: 400 })
  }
}
