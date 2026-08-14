import { NextRequest, NextResponse } from "next/server";
import { getAccessContext } from "@/lib/access-control";
import type { OfflineSyncOperation, OfflineSyncPushResponse, OfflineSyncResult } from "@/lib/offline-sync/types";

const ALLOWED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const MAX_OPERATIONS_PER_PUSH = 100;

const TRANSIENT_STATUSES = new Set([500, 502, 503, 504, 408, 429]);

function isTransientError(status: number) {
  return TRANSIENT_STATUSES.has(status);
}

function normalizeOperation(input: unknown): OfflineSyncOperation | null {
  if (!input || typeof input !== "object") return null;
  const row = input as Record<string, unknown>;
  const method = String(row.method || "").trim().toUpperCase();
  const path = String(row.path || "").trim();
  const id = String(row.id || "").trim();
  const deviceId = String(row.deviceId || "").trim();
  const createdAt = String(row.createdAt || "").trim();

  if (!id || !deviceId || !createdAt || !path.startsWith("/api/") || path.startsWith("/api/sync/") || !ALLOWED_METHODS.has(method)) {
    return null;
  }

  return {
    id,
    path,
    method: method as OfflineSyncOperation["method"],
    headers: row.headers && typeof row.headers === "object" ? row.headers as Record<string, string> : undefined,
    body: row.body,
    createdAt,
    deviceId,
    entityType: row.entityType ? String(row.entityType) : undefined,
    entityId: row.entityId ? String(row.entityId) : undefined,
    summary: row.summary ? String(row.summary) : undefined,
  } satisfies OfflineSyncOperation;
}

async function parseResponseBody(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function POST(request: NextRequest) {
  const access = await getAccessContext();
  if (!access) {
    return NextResponse.json({ error: "Sessão obrigatória para sincronização offline." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const rawOperations = Array.isArray(payload.operations) ? payload.operations : [];
  if (rawOperations.length === 0) {
    return NextResponse.json({ ok: true, processedCount: 0, successCount: 0, results: [] } satisfies OfflineSyncPushResponse);
  }
  if (rawOperations.length > MAX_OPERATIONS_PER_PUSH) {
    return NextResponse.json({ error: `Máximo de ${MAX_OPERATIONS_PER_PUSH} operações por sincronização.` }, { status: 400 });
  }

  const operations = rawOperations.map(normalizeOperation);
  if (operations.some((item) => !item)) {
    return NextResponse.json({ error: "Payload de sincronização inválido." }, { status: 400 });
  }

  const cookie = request.headers.get("cookie");
  const origin = new URL(request.url).origin;
  const results: OfflineSyncResult[] = [];
  let stopProcessing = false;

  for (const operation of operations as OfflineSyncOperation[]) {
    if (stopProcessing) {
      results.push({
        id: operation.id,
        ok: false,
        status: 424,
        skipped: true,
        error: "Operação não processada porque uma operação anterior falhou.",
      });
      continue;
    }

    try {
      const headers = new Headers(operation.headers || {});
      headers.set("Content-Type", "application/json");
      headers.set("x-offline-sync-replay", "1");
      headers.set("x-offline-sync-device", operation.deviceId);
      headers.set("x-offline-sync-operation-id", operation.id);
      headers.set("x-idempotency-key", operation.id);
      if (cookie) {
        headers.set("cookie", cookie);
      }

      const targetUrl = new URL(operation.path, origin);
      const replayResponse = await fetch(targetUrl, {
        method: operation.method,
        headers,
        body: operation.body == null ? undefined : JSON.stringify(operation.body),
        cache: "no-store",
      });
      const replayBody = await parseResponseBody(replayResponse);

      if (!replayResponse.ok) {
        results.push({
          id: operation.id,
          ok: false,
          status: replayResponse.status,
          body: replayBody,
          error: typeof replayBody === "object" && replayBody && "error" in (replayBody as Record<string, unknown>)
            ? String((replayBody as Record<string, unknown>).error || "Falha ao aplicar operação offline.")
            : `Falha ao aplicar operação offline (${replayResponse.status}).`,
        });
        if (!isTransientError(replayResponse.status)) {
          stopProcessing = true;
        }
        continue;
      }

      results.push({
        id: operation.id,
        ok: true,
        status: replayResponse.status,
        body: replayBody,
      });
    } catch (error) {
      results.push({
        id: operation.id,
        ok: false,
        status: 500,
        error: error instanceof Error ? error.message : "Erro inesperado ao processar operação offline.",
      });
      stopProcessing = true;
    }
  }

  const successCount = results.filter((result) => result.ok).length;
  return NextResponse.json({
    ok: successCount === results.length,
    processedCount: results.length,
    successCount,
    results,
  } satisfies OfflineSyncPushResponse);
}
