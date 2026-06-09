import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { login } from './api'

// Demo user for when backend is unavailable
const DEMO_USER = {
  id: 'demo_user_123',
  name: 'Demo User',
  email: 'demo@levelup.ai',
  accessToken: 'demo_access_token',
  avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Demo',
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'levelup-super-secret-jwt-key-dev-2024',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Demo mode bypass — always works even if backend is down
        if (
          credentials.email === 'demo@levelup.ai' &&
          credentials.password === 'demo123'
        ) {
          return DEMO_USER
        }

        try {
          const res = await login(credentials.email, credentials.password)
          if (res.user && res.access_token) {
            return {
              id: res.user.id,
              name: res.user.name,
              email: res.user.email,
              accessToken: res.access_token,
              avatar: res.user.avatar,
            }
          }
          return null
        } catch (e: any) {
          // Specific error message from backend
          const detail = e?.response?.data?.detail
          throw new Error(detail || 'Invalid email or password')
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.accessToken = (user as any).accessToken
        token.avatar = (user as any).avatar
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session as any).accessToken = token.accessToken
        ;(session.user as any).avatar = token.avatar
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
}
