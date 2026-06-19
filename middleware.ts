import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAuthSecret } from "./src/lib/auth";

const PUBLIC_PATHS = new Set(["/login", "/registar"]);

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname);
}

function isStaticOrInternal(pathname: string) {
  return pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/public") || /\.[a-zA-Z0-9]+$/.test(pathname);
}

function pathMatchesPrefix(pathname: string, prefix: string) {
  if (prefix === "/") return pathname === "/";
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function canUserAccessPath(pathname: string, visiblePages: string[]) {
  if (visiblePages.length === 0) {
    if (pathname === "/") return true;
    if (pathname.startsWith("/dashboard")) return true;
    if (pathname.startsWith("/estacao-servico")) return true;
    if (pathname.startsWith("/jangadas")) return true;
    if (pathname.startsWith("/inspecoes")) return true;
    return false;
  }

  return visiblePages.some((prefix) => pathMatchesPrefix(pathname, prefix));
}

export default async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = await getToken({ req, secret: getAuthSecret() });

  if (pathname.startsWith("/api/auth") || isStaticOrInternal(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL("/login", req.nextUrl);
    if (pathname && pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    }
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role === "ADMIN" ? "ADMIN" : "USER";
  const permissions = (token as any)?.permissions || {};
  const visiblePages = Array.isArray(permissions.visiblePages) 
    ? permissions.visiblePages.map((item: unknown) => String(item))
    : [];
  const visibleModules = Array.isArray(permissions.visibleModules) 
    ? permissions.visibleModules
    : [];
  const hasOverrides = visiblePages.length > 0 || visibleModules.length > 0;

  if (role !== "ADMIN" && !canUserAccessPath(pathname, visiblePages)) {
    return NextResponse.redirect(new URL("/estacao-servico", req.nextUrl));
  }
  
  if (role === "ADMIN" && hasOverrides && !canUserAccessPath(pathname, visiblePages)) {
    return NextResponse.redirect(new URL("/estacao-servico", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js).*)"],
};