import type { DefaultSession } from "next-auth";

type SessionPermissions = {
  visibleModules?: string[];
  visiblePages?: string[];
  editablePages?: string[];
  editableFields?: Record<string, string[]>;
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "USER";
      sessionId: string;
      permissions?: SessionPermissions;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "ADMIN" | "USER";
    sessionId?: string;
    permissions?: SessionPermissions;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ADMIN" | "USER";
    sessionId?: string;
  }
}