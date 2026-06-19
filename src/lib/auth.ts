import { UserRole } from "@prisma/client";

const ADMIN_FALLBACK_EMAILS = ["julio.correia@orey.com"];

function parseEmailList(rawValue: string | undefined, fallback: string[] = []) {
  if (!rawValue) return fallback;
  return rawValue
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function normalizeEmail(email: string | null | undefined) {
  return (email || "").trim().toLowerCase();
}

export function getAllowedEmails() {
  return parseEmailList(process.env.AUTH_ALLOWED_EMAILS, ADMIN_FALLBACK_EMAILS);
}

export function getAdminEmails() {
  return parseEmailList(process.env.AUTH_ADMIN_EMAILS, ADMIN_FALLBACK_EMAILS);
}

export function isEmailAllowed(email: string | null | undefined) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;

  const allowedEmails = getAllowedEmails();
  return allowedEmails.length === 0 || allowedEmails.includes(normalizedEmail);
}

export function resolveUserRole(email: string | null | undefined) {
  const normalizedEmail = normalizeEmail(email);
  return getAdminEmails().includes(normalizedEmail) ? UserRole.ADMIN : UserRole.USER;
}

export function getAuthSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-only-change-me";
}

export function getBaseUrl() {
  return process.env.AUTH_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
}