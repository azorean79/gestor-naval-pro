import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getBulkAisLiveResults } from "@/lib/aisstream";

export const runtime = "nodejs";

const STREAM_INTERVAL_MS = 15000; // 15 segs
const FLEET_SOURCE_POLICY = {
  preferredLiveSource: "AISStream",
  bulkSource: "TrackingBackend",
  fallbackOrder: ["AISStream", "AISHub", "TrackingBackendFallback"],
} as const;

function formatSseMessage(data: unknown, event = "message") {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const clearStream = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const closeStream = () => {
    closed = true;
    clearStream();
  };

  req.signal.addEventListener("abort", () => {
    closeStream();
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const safeEnqueue = (payload: string) => {
        if (closed) return false;
        try {
          controller.enqueue(encoder.encode(payload));
          return true;
        } catch {
          closeStream();
          return false;
        }
      };

      const pushAll = async () => {
        if (closed) return;

        try {
          // Busca todos os navios que têm MMSI
          const navios = await prisma.navio.findMany({
            where: {
              AND: [
                { mmsi: { not: null } },
                { mmsi: { not: "" } }
              ],
              ativo: true,
            },
            select: { id: true, nome: true, mmsi: true },
          });

          if (navios.length === 0) {
            safeEnqueue(formatSseMessage({ type: "ping", empty: true }));
            return;
          }

          const selectedNavios = navios.slice(0, 150);
          // Bulk lookup mantém estabilidade via HTTP backend; a ficha individual continua AISStream WS.
          const updates = await getBulkAisLiveResults(selectedNavios.map((n) => n.id));

          if (updates.length > 0) {
            safeEnqueue(formatSseMessage({
              type: "fleet_update",
              sourcePolicy: FLEET_SOURCE_POLICY,
              scope: {
                selectedNavios: selectedNavios.length,
                updatedNavios: updates.length,
              },
              updates,
            }));
          } else {
            safeEnqueue(formatSseMessage({
              type: "ping",
              sourcePolicy: FLEET_SOURCE_POLICY,
              scope: {
                selectedNavios: selectedNavios.length,
                updatedNavios: 0,
              },
            }));
          }
        } catch (error) {
          safeEnqueue(formatSseMessage({
            type: "error",
            error: error instanceof Error ? error.message : "Erro no stream da frota.",
          }));
        }
      };

      safeEnqueue(": connected\n\n");
      await pushAll();
      
      intervalId = setInterval(() => {
        void pushAll();
      }, STREAM_INTERVAL_MS);
    },
    cancel() {
      closeStream();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
