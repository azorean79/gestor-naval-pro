import prisma from "@/lib/prisma";
import {
  normalizeAisPayload,
  AisLivePayload,
  createAisStreamSubscriptionMessage,
  getAisStreamApiKey,
  getNavioAisLiveResult,
} from "@/lib/aisstream";

export const runtime = "nodejs";

function formatSseMessage(data: unknown, event = "message") {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function normalizeMmsiComparable(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw;
  const normalized = digits.replace(/^0+(?=\d)/, "");
  return normalized || "0";
}

function mmsiEquals(a: unknown, b: unknown) {
  const left = normalizeMmsiComparable(a);
  const right = normalizeMmsiComparable(b);
  if (!left || !right) return false;
  return left === right;
}

async function readSocketPayload(raw: unknown) {
  if (typeof raw === "string") return raw;
  if (raw instanceof ArrayBuffer) return Buffer.from(new Uint8Array(raw)).toString("utf8");
  if (ArrayBuffer.isView(raw)) return Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength).toString("utf8");
  if (raw && typeof (raw as Blob).text === "function") return await (raw as Blob).text();
  return String(raw ?? "");
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);

  if (!Number.isFinite(id)) {
    return new Response("ID inválido.", { status: 400 });
  }

  const navio = await prisma.navio.findUnique({
    where: { id },
    select: { id: true, mmsi: true, nome: true, imo: true, callSignal: true },
  });

  const mmsi = navio?.mmsi?.trim();
  if (!navio) return new Response("Navio não encontrado.", { status: 404 });

  const apiKey = getAisStreamApiKey();

  const encoder = new TextEncoder();
  const { WebSocket } = await import("undici");
  const navioData = navio;

  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let socket: any = null;
      let keepAliveId: ReturnType<typeof setInterval> | undefined;
      let reconnectTimeoutId: ReturnType<typeof setTimeout> | undefined;

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

      const cleanupSocket = () => {
        if (!socket) return;
        try {
          socket.close();
        } catch {}
        socket = null;
      };

      const closeStream = () => {
        if (closed) return;
        closed = true;
        if (keepAliveId) clearInterval(keepAliveId);
        if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
        cleanupSocket();
        try {
          controller.close();
        } catch {}
      };

      const scheduleReconnect = () => {
        if (closed || reconnectTimeoutId) return;
        reconnectTimeoutId = setTimeout(() => {
          reconnectTimeoutId = undefined;
          connectSocket();
        }, 2500);
      };

      const connectSocket = () => {
        if (closed) return;

        if (!mmsi) {
          safeEnqueue(formatSseMessage({
            type: "error",
            status: 400,
            payload: {
              ok: false,
              fetchedAt: new Date().toISOString(),
              error: "MMSI não configurado na ficha do navio.",
              source: "AISStream",
            },
          }));
          return;
        }

        if (!apiKey) {
          safeEnqueue(formatSseMessage({
            type: "error",
            status: 503,
            payload: {
              ok: false,
              fetchedAt: new Date().toISOString(),
              configMissing: true,
              error: "AISSTREAM_API_KEY/AISTREAM_API_KEY não configurada no servidor.",
              source: "AISStream",
            },
          }));
          return;
        }

        cleanupSocket();
        socket = new WebSocket("wss://stream.aisstream.io/v0/stream");

        socket.addEventListener("open", () => {
          safeEnqueue("retry: 2500\n\n");
          socket?.send(JSON.stringify(
            createAisStreamSubscriptionMessage(apiKey, [mmsi], [
              "PositionReport",
              "StandardClassBPositionReport",
              "ExtendedClassBPositionReport",
            ])
          ));
          safeEnqueue(formatSseMessage({ status: 202, connected: true }, "connected"));
        });

        socket.addEventListener("message", async (event: any) => {
          try {
            const raw = await readSocketPayload(event.data);
            const payload = JSON.parse(raw);

            if (payload?.error) {
              safeEnqueue(formatSseMessage({ type: "error", status: 500, payload: { error: payload.error, ok: false } }));
              return;
            }

            const snapshot = normalizeAisPayload(payload);
            // FiltersShipMMSI no subscription garante que só chegam mensagens deste navio.
            // Se o MMSI não foi extraído do payload (snapshot.mmsi === null), confia no filtro do servidor.
            if (!snapshot) return;
            if (snapshot.mmsi !== null && !mmsiEquals(snapshot.mmsi, mmsi)) return;

            if (
              typeof snapshot.latitude === "number" &&
              Number.isFinite(snapshot.latitude) &&
              typeof snapshot.longitude === "number" &&
              Number.isFinite(snapshot.longitude)
            ) {
              void prisma.navio.update({
                where: { id: navioData.id },
                data: {
                  lat: snapshot.latitude,
                  lng: snapshot.longitude,
                },
              }).catch(() => undefined);

              const body: AisLivePayload = {
                ok: true,
                fetchedAt: new Date().toISOString(),
                source: "AISStream",
                vessel: {
                  ...snapshot,
                  name: snapshot.name || navioData.nome || null,
                  callSign: snapshot.callSign || navioData.callSignal || null,
                  imo: snapshot.imo || navioData.imo || null,
                },
              };
              safeEnqueue(formatSseMessage({ type: "snapshot", status: 200, payload: body }));
            }
          } catch {}
        });

        const handleDisconnect = () => {
          if (closed) return;
          socket = null;
          safeEnqueue(formatSseMessage({ connected: false }, "disconnected"));
          scheduleReconnect();
        };

        socket.addEventListener("close", handleDisconnect);
        socket.addEventListener("error", handleDisconnect);
      };

      safeEnqueue("retry: 2500\n\n");

      // Snapshot inicial: melhora UX e garante fallback mesmo antes do WS ficar pronto.
      void getNavioAisLiveResult(navioData.id)
        .then((result) => {
          if (closed) return;
          safeEnqueue(formatSseMessage({
            type: result.body?.ok ? "snapshot" : "error",
            status: result.status,
            payload: result.body,
          }));
        })
        .catch(() => {
          if (closed) return;
          safeEnqueue(formatSseMessage({
            type: "error",
            status: 500,
            payload: {
              ok: false,
              fetchedAt: new Date().toISOString(),
              error: "Falha ao carregar snapshot AIS inicial.",
              source: "AISStream",
            } satisfies AisLivePayload,
          }));
        });

      connectSocket();
      keepAliveId = setInterval(() => {
        safeEnqueue(":\n\n");
      }, 15000);

      req.signal.addEventListener("abort", closeStream);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}