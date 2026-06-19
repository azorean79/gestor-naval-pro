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
    typeof (error as any)?.code === "string" ? String((error as any).code) : "",
    typeof (error as any)?.meta?.message === "string" ? String((error as any).meta.message) : "",
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
    {
      error: fallbackMessage,
      details: error instanceof Error ? error.message : String(error),
    },
    { status: 500 }
  );
}