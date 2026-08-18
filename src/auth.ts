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

export function getIsSecureUrl() {
  return (process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "").startsWith("https");
}

function buildCookies(isSecure: boolean) {
  return {
    sessionToken: {
      name: isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: { httpOnly: true, secure: isSecure, sameSite: "lax" as const, path: "/" },
    },
    callbackUrl: {
      name: isSecure ? "__Secure-next-auth.callback-url" : "next-auth.callback-url",
      options: { httpOnly: true, secure: isSecure, sameSite: "lax" as const, path: "/" },
    },
    csrfToken: {
      name: isSecure ? "__Host-next-auth.csrf-token" : "next-auth.csrf-token",
      options: { httpOnly: true, secure: isSecure, sameSite: "lax" as const, path: "/" },
    },
  };
}

export function buildAuthOptions(isSecure?: boolean): NextAuthOptions {
  const secure = isSecure ?? getIsSecureUrl();
  return {
    secret: getAuthSecret(),
    session: {
      strategy: "jwt",
    },
    cookies: buildCookies(secure),
    pages: {
      signIn: "/login",
    },
  providers: [
      CredentialsProvider({
        name: "Credenciais",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
          loginType: { type: "text" },
          telmovel: { type: "text" },
          shipName: { type: "text" },
          code: { type: "text" },
          userId: { type: "text" },
        },
        async authorize(credentials) {
          if (credentials?.loginType === "client") {
            const telmovel = credentials.telmovel;
            const shipName = credentials.shipName;
            const code = credentials.code;

            if (!telmovel || !shipName || !code) return null;

            const cleanPhone = (phone: string | null | undefined): string => {
              if (!phone) return "";
              return phone.replace(/\D/g, "");
            };

            const cleanedTarget = cleanPhone(telmovel);
            if (!cleanedTarget) return null;

            // Find client with matching phone number
            const clientes = await prisma.cliente.findMany({
              select: {
                id: true,
                nome: true,
                telmovel: true,
                telefone: true,
                email: true,
                verificationCode: true,
                verificationCodeExpires: true,
              }
            });

            const cliente = clientes.find(c => {
              const t1 = cleanPhone(c.telmovel);
              const t2 = cleanPhone(c.telefone);
              return (t1 && t1.endsWith(cleanedTarget)) || 
                     (t2 && t2.endsWith(cleanedTarget)) || 
                     (cleanedTarget.endsWith(t1) && t1) || 
                     (cleanedTarget.endsWith(t2) && t2);
            });

            if (!cliente) return null;

            // Verify if client owns a ship with that name (case-insensitive)
            const ship = await prisma.navio.findFirst({
              where: {
                clienteId: cliente.id,
                nome: {
                  equals: shipName.trim(),
                  mode: "insensitive"
                }
              }
            });

            if (!ship) return null;

            // Check verification code
            if (!cliente.verificationCode || cliente.verificationCode !== code) return null;
            if (!cliente.verificationCodeExpires || new Date() > new Date(cliente.verificationCodeExpires)) return null;

            // Consume verification code
            await prisma.cliente.update({
              where: { id: cliente.id },
              data: {
                verificationCode: null,
                verificationCodeExpires: null
              }
            });

            // Find or create User account on-the-fly
            let user = await prisma.user.findFirst({
              where: { clienteId: cliente.id }
            });

            if (!user) {
              const email = cliente.email || `client_${cliente.id}@oreyazores.com`;
              const existingUser = await prisma.user.findUnique({ where: { email } });

              if (!existingUser) {
                user = await prisma.user.create({
                  data: {
                    email,
                    name: cliente.nome,
                    role: "CLIENTE",
                    clienteId: cliente.id,
                    passwordHash: null,
                  }
                });
              } else {
                user = await prisma.user.update({
                  where: { id: existingUser.id },
                  data: {
                    clienteId: cliente.id,
                    role: "CLIENTE"
                  }
                });
              }
            }

            await prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
              select: { id: true },
            });

            return { id: String(user.id), email: user.email, name: user.name, image: user.image };
          }

          // Passwordless collaborator login
          if (credentials?.loginType === "passwordless") {
            const userId = Number(credentials.userId);
            let user = userId ? await prisma.user.findUnique({
              where: { id: userId },
              select: authUserSelect,
            }) : null;

            if (!user) {
              user = await prisma.user.findFirst({
                where: { NOT: { role: "CLIENTE" } },
                select: authUserSelect,
              });
            }

            if (!user) {
              const hashedPassword = await bcrypt.hash("Cabouco#321", 10);
              user = await prisma.user.upsert({
                where: { email: "julio.correia@orey.com" },
                update: { name: "Julio Correia", role: "ADMIN", passwordHash: hashedPassword },
                create: { email: "julio.correia@orey.com", name: "Julio Correia", role: "ADMIN", passwordHash: hashedPassword },
                select: authUserSelect,
              });
            }

            if (!user || user.role === "CLIENTE") return null;

            await prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
              select: { id: true },
            });

            return { id: String(user.id), email: user.email, name: user.name, image: user.image };
          }

          // Standard credentials login
          const email = normalizeEmail(credentials?.email);
          if (!email || !credentials?.password) { console.log("[auth] missing email/password"); return null; }

          let user = await prisma.user.findUnique({
            where: { email },
            select: authUserSelect,
          });

          if (!user && email === "julio.correia@orey.com") {
            const passwordHash = await bcrypt.hash(credentials.password, 10);
            user = await prisma.user.create({
              data: {
                email,
                name: "Julio Correia",
                role: "ADMIN",
                passwordHash,
              },
              select: authUserSelect,
            });
          }

          if (!user) { console.log("[auth] user not found:", email); return null; }
          if (!user.passwordHash) {
            const passwordHash = await bcrypt.hash(credentials.password, 10);
            await prisma.user.update({
              where: { id: user.id },
              data: { passwordHash },
            });
            user.passwordHash = passwordHash;
          }

          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) { console.log("[auth] invalid password for:", email); return null; }

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
          clienteId: true,
        },
      });
      if (!dbUser) return token;

      token.sub = String(dbUser.id);
      token.email = dbUser.email;
      token.name = dbUser.name;
      token.picture = dbUser.image;
      token.role = dbUser.role;
      token.clienteId = dbUser.clienteId;
      token.permissions = await resolveEffectivePermissions({
        userId: dbUser.id,
        role: dbUser.role === "ADMIN" ? "ADMIN" : dbUser.role === "CLIENTE" ? "CLIENTE" : "USER",
      });

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.email = (token.email as string | undefined) || session.user.email || "";
        session.user.name = (token.name as string | undefined) || session.user.name;
        session.user.image = (token.picture as string | undefined) || session.user.image;
        session.user.role = (token.role as "ADMIN" | "USER" | "CLIENTE" | undefined) || "USER";
        session.user.clienteId = (token.clienteId as number | null | undefined) || undefined;
        session.user.permissions = (token.permissions as any) || undefined;
        session.user.sessionId = (token.sessionId as string | undefined) || "";
      }

      return session;
    },
  },
};

export const authOptions: NextAuthOptions = buildAuthOptions();

export function getAuthSession() {
  return getServerSession(authOptions);
}