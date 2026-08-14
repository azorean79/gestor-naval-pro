import NextAuth from "next-auth/next";
import { authOptions } from "@/auth";

const handler = NextAuth(authOptions);

export async function GET(req: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  process.env.NEXTAUTH_URL = `${protocol}://${host}`;
  process.env.AUTH_URL = `${protocol}://${host}`;
  return handler(req, context);
}

export async function POST(req: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  process.env.NEXTAUTH_URL = `${protocol}://${host}`;
  process.env.AUTH_URL = `${protocol}://${host}`;
  return handler(req, context);
}