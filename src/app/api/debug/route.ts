import { NextResponse } from 'next/server'

// TEMPORARY DEBUG ENDPOINT — remove after diagnosing env var issue
export async function GET() {
  const envKeys = Object.keys(process.env)
  return NextResponse.json({
    has_nextauth_secret:  !!process.env.NEXTAUTH_SECRET,
    has_cognito_secret:   !!process.env.COGNITO_CLIENT_SECRET,
    has_dynamodb_table:   !!process.env.DYNAMODB_TABLE_NAME,
    nextauth_keys:        envKeys.filter(k => k.includes('NEXTAUTH')),
    cognito_keys:         envKeys.filter(k => k.includes('COGNITO')),
    total_env_keys:       envKeys.length,
    node_env:             process.env.NODE_ENV,
  })
}
