import "server-only"

import NextAuth, { type DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authorizeCredentials } from "@/lib/auth/authorize"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id?: string; sessionVersion?: number }
  }
  interface User {
    sessionVersion?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sessionVersion?: number
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  providers: [
    Credentials({
      credentials: { email: { type: "email" }, password: { type: "password" } },
      authorize: authorizeCredentials,
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.sessionVersion = user.sessionVersion
      return token
    },
    session({ session, token }) {
      session.user.id = token.sub
      session.user.sessionVersion = token.sessionVersion
      return session
    },
  },
})
