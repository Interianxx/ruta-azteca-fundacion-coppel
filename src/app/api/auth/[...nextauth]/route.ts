import NextAuth from 'next-auth'
import CognitoProvider from 'next-auth/providers/cognito'

const handler = NextAuth({
  providers: [
    CognitoProvider({
      clientId:     process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
      clientSecret: '', // PKCE — sin secret
      issuer:       `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID}`,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.idToken      = account.id_token
        token.accessToken  = account.access_token
        // Leer grupos de Cognito del id_token
        const groups = (profile as { 'cognito:groups'?: string[] })?.['cognito:groups'] ?? []
        token.rol    = groups[0] ?? 'turista'
      }
      return token
    },
    async session({ session, token }) {
      // Exponer rol y sub al cliente
      ;(session as { rol?: string }).rol              = token.rol as string
      ;(session.user as { sub?: string }).sub         = token.sub
      ;(session as { idToken?: string }).idToken      = token.idToken as string
      return session
    },
  },
})

export { handler as GET, handler as POST }
