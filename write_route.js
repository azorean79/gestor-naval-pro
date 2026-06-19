const fs = require('fs');
fs.writeFileSync('src/app/api/navios/[id]/ais-live/stream/route.ts', \import prisma from "@/lib/prisma";
import { normalizeAisPayload, AisLivePayload } from "@/lib/aisstream";

export const runtime = "nodejs";

function formatSseMessage(data: unknown, event = "message") {
  return \\\event: \\\ndata: \\\n\\n\\\;
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);

  if (!Number.isFinite(id)) {
    return new Response("ID inválido.", { status: 400 });
  }

  const navio = await prisma.navio.findUnique({
    where: { id },
    select: { id: true, mmsi: true, nome: true, imo: true, callSignal: true }
  });

  const mmsi = navio?.mmsi?.trim();
  if (!mmsi) return new Response("MMSI não configurado.", { status: 400 });

  const apiKey = process.env.AISSTREAM_API_KEY?.trim();
  if (!apiKey) return new Response("API Key missing", { status: 503 });

  const encoder = new TextEncoder();
  let closed = false;
  let keepAliveId: ReturnType<typeof setInterval> | null = null;

  const { WebSocket } = await import("undici");

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const socket: any = new WebSocket("wss://stream.aisstream.io/v0/stream");

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

      const closeStream = () => {
        if (closed) return;
        closed = true;
        try { socket.close(); } catch {}
        if (keepAliveId) clearInterval(keepAliveId);
        try { controller.close(); } catch {}
      };

      socket.addEventListener("open", () => {
        socket.send(JSON.stringify({
          APIKey: apiKey,
          BoundingBoxes: [[[-90, -180], [90, 180]]],
          FiltersShipMMSI: [mmsi],
          FilterMessageTypes: ["PositionReport", "StandardClassBPositionReport", "ExtendedClassBPositionReport"]
        }));
        safeEnqueue(formatSseMessage({ status: 202, connected: true }, "connected"));
      });

      socket.addEventListener("message", async (event: any) => {
        try {
          let raw = event.data;
          if (typeof raw !== "string") {
              if (raw instanceof Buffer || raw instanceof ArrayBuffer) {
                  raw = Buffer.from(raw).toString("utf8");
              } else if (raw && typeof raw.text === "function") {
                  raw = await raw.text();
              }
          }

          const payload = JSON.parse(String(raw));
          if (payload?.error) {
            safeEnqueue(formatSseMessage({ type: "error", status: 500, payload: { error: payload.error, ok: false } }));
            return;
          }

          const snapshot = normalizeAisPayload(payload);
          if (snapshot && snapshot.mmsi === mmsi) {
            if (snapshot.latitude && snapshot.longitude) {
              const body: AisLivePayload = {
                ok: true,
                fetchedAt: new Date().toISOString(),
                source: "AISStream",
                vessel: {
                  ...snapshot,
                  name: snapshot.name || navio.nome || null,
                  callSign: snapshot.callSign || navio.callSignal || null,
                  imo: snapshot.imo || navio.imo || null,
                }
              };
              safeEnqueue(formatSseMessage({ type: "snapshot", status: 200, payload: body }));
            }
          }
        } catch (e) {}
      });

      socket.addEventListener("close", closeStream);
      socket.addEventListener("error", closeStream);
      req.signal.addEventListener("abort", closeStream);

      keepAliveId = setInterval(() => {
        safeEnqueue(":\\n\\n");
      }, 15000);
    },
    cancel() {
      closed = true;
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}\);
