import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type HealthStatus = "ok" | "warn" | "down";

export async function GET() {
  const startedAt = Date.now();

  let databaseStatus: HealthStatus = "ok";
  let databaseLatencyMs: number | null = null;
  let databaseError: string | null = null;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    databaseLatencyMs = Date.now() - dbStart;
  } catch (error) {
    databaseStatus = "down";
    databaseError = error instanceof Error ? error.message : "Database check failed";
  }

  const sentryEnabled = (process.env.SENTRY_ENABLED ?? "true").trim() !== "false";
  const sentryConfigured = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN);

  const overallStatus: HealthStatus = databaseStatus === "down"
    ? "down"
    : !sentryEnabled || sentryConfigured
      ? "ok"
      : "warn";

  const responseBody = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    latencyMs: Date.now() - startedAt,
    checks: {
      database: {
        status: databaseStatus,
        latencyMs: databaseLatencyMs,
        error: databaseError,
      },
      sentry: {
        status: !sentryEnabled ? "ok" : sentryConfigured ? "ok" : "warn",
        enabled: sentryEnabled,
        configured: sentryConfigured,
      },
    },
  };

  const statusCode = overallStatus === "down" ? 503 : 200;
  return NextResponse.json(responseBody, { status: statusCode });
}
