import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { getAuthSecret, normalizeEmail } from "@/lib/auth";
import { resolveEffectivePermissions } from "@/lib/user-permissions";

const authUserSelect = {
  id: true,
  email: true,
  name: true,
  image: true,
  role: true,
  passwordHash: true,
} as const;

export const authOptions: NextAuthOptions = {
  secret: getAuthSecret(),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email);
        if (!email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: authUserSelect,
        });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        await prisma.user.update({
          where: { email },
          data: { lastLoginAt: new Date() },
          select: { id: true },
        });

        return { id: String(user.id), email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async signIn() {
      return true;
    },
    async jwt({ token, user }) {
      if (!token.sessionId) {
        token.sessionId = randomUUID();
      }

      const email = normalizeEmail((user?.email as string | undefined) || (token.email as string | undefined));
      if (!email) return token;

      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
        },
      });
      if (!dbUser) return token;

      token.sub = String(dbUser.id);
      token.email = dbUser.email;
      token.name = dbUser.name;
      token.picture = dbUser.image;
      token.role = dbUser.role;
      token.permissions = await resolveEffectivePermissions({
        userId: dbUser.id,
        role: dbUser.role === "ADMIN" ? "ADMIN" : "USER",
      });

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.email = (token.email as string | undefined) || session.user.email || "";
        session.user.name = (token.name as string | undefined) || session.user.name;
        session.user.image = (token.picture as string | undefined) || session.user.image;
        session.user.role = (token.role as "ADMIN" | "USER" | undefined) || "USER";
        session.user.permissions = (token.permissions as any) || undefined;
        session.user.sessionId = (token.sessionId as string | undefined) || "";
      }

      return session;
    },
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}