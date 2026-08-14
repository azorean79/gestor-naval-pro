import { NextResponse } from "next/server";

const DATABASE_UNAVAILABLE_PATTERNS = [
  "planlimitreached",
  "failed to identify your database",
  "can't reach database server",
  "server has closed the connection",
  "database_url or supabase_database_url is not set",
];

export function isDatabaseUnavailableError(error: unknown) {
  const message = [
    error instanceof Error ? error.message : "",
    typeof error === "string" ? error : "",
    typeof error === "object" && error !== null && "code" in error ? String(error.code || "") : "",
    typeof error === "object"
      && error !== null
      && "meta" in error
      && typeof error.meta === "object"
      && error.meta !== null
      && "message" in error.meta
      ? String(error.meta.message || "")
      : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return DATABASE_UNAVAILABLE_PATTERNS.some((pattern) => message.includes(pattern));
}

export function getDatabaseUnavailableMessage() {
  return "Base de dados temporariamente indisponível. A ligação ao serviço de dados está bloqueada ou sem acesso neste momento.";
}

export function buildDatabaseErrorResponse(error: unknown, fallbackMessage: string) {
  if (isDatabaseUnavailableError(error)) {
    return NextResponse.json(
      {
        error: getDatabaseUnavailableMessage(),
        code: "DATABASE_UNAVAILABLE",
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: fallbackMessage },
    { status: 500 }
  );
}