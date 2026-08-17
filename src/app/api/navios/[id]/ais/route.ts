import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import WebSocket from "ws";

type WsMessageData = Buffer | ArrayBuffer | Buffer[];

type AisPositionResult = {
  found: boolean;
  lat?: number | null;
  lng?: number | null;
  speed?: number | null;
  course?: number | null;
  heading?: number | null;
  navStatus?: string | null;
  name?: string | null;
  updatedAt?: string | null;
  source: string;
};

function normalizeMmsi(value: unknown): string | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 7 ? digits : null;
}

function normalizeCallSignal(value: unknown): string | null {
  const raw = String(value ?? '').trim().toUpperCase();
  return raw || null;
}

function parseNumeric(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

async function queryAisStream(mmsi: string): Promise<AisPositionResult> {
  const apiKey = process.env.AISSTREAM_API_KEY;
  if (!apiKey || !mmsi) {
    return { found: false, source: 'aisstream' };
  }

  return new Promise((resolve) => {
    let ws: WebSocket | null = null;
    const timeoutMs = 5000;
    const timer = setTimeout(() => {
      try {
        if (ws) ws.close();
      } catch {}
      resolve({ found: false, source: 'aisstream' });
    }, timeoutMs);

    try {
      ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

      ws.on("open", () => {
        const subMsg = {
          APIKey: apiKey,
          BoundingBoxes: [[[-90, -180], [90, 180]]],
          FiltersShipMMSI: [mmsi],
          FilterMessageTypes: ["PositionReport", "StandardClassBPositionReport", "ExtendedClassBPositionReport"]
        };
        try {
          ws?.send(JSON.stringify(subMsg));
        } catch {
          clearTimeout(timer);
          resolve({ found: false, source: 'aisstream' });
        }
      });

      ws.on("message", (data: WsMessageData) => {
        try {
          const buf = Array.isArray(data) ? Buffer.concat(data) : Buffer.isBuffer(data) ? data : Buffer.from(data);
          const parsed = JSON.parse(buf.toString());
          const msgType = parsed.MessageType;
          const msgBody = parsed.Message?.[msgType];
          const meta = parsed.MetaData;

          if (msgBody && (msgBody.Latitude !== undefined || msgBody.Longitude !== undefined || meta?.latitude !== undefined)) {
            const lat = parseNumeric(msgBody.Latitude ?? meta?.latitude);
            const lng = parseNumeric(msgBody.Longitude ?? meta?.longitude);
            if (lat !== null && lng !== null) {
              clearTimeout(timer);
              try { ws?.close(); } catch {}
              resolve({
                found: true,
                lat,
                lng,
                speed: parseNumeric(msgBody.Sog ?? msgBody.sog),
                course: parseNumeric(msgBody.Cog ?? msgBody.cog),
                heading: parseNumeric(msgBody.TrueHeading ?? msgBody.trueHeading),
                navStatus: typeof msgBody.NavigationalStatus === 'number' ? String(msgBody.NavigationalStatus) : null,
                name: typeof meta?.ShipName === 'string' ? meta.ShipName.trim() : null,
                updatedAt: typeof meta?.time_utc === 'string' ? meta.time_utc : new Date().toISOString(),
                source: 'aisstream',
              });
            }
          }
        } catch {}
      });

      ws.on("error", () => {});
      ws.on("close", () => {});
    } catch {
      clearTimeout(timer);
      resolve({ found: false, source: 'aisstream' });
    }
  });
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!Number.isFinite(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const navio = await prisma.navio.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        matricula: true,
        mmsi: true,
        callSignal: true,
        lat: true,
        lng: true,
      },
    });

    if (!navio) return NextResponse.json({ error: 'Navio não encontrado' }, { status: 404 });

    const mmsi = normalizeMmsi(navio.mmsi);
    const callSignal = normalizeCallSignal(navio.callSignal);

    let live: AisPositionResult = { found: false, source: 'aisstream' };
    if (mmsi) {
      live = await queryAisStream(mmsi);
    }

    const savedLat = parseNumeric(navio.lat);
    const savedLng = parseNumeric(navio.lng);

    const hasLiveCoords = live.found && Number.isFinite(live.lat) && Number.isFinite(live.lng);

    // Fallback to Azores center (Ponta Delgada) if no live or saved coordinates exist
    const finalLat = hasLiveCoords ? live.lat : savedLat !== null ? savedLat : 37.7412;
    const finalLng = hasLiveCoords ? live.lng : savedLng !== null ? savedLng : -25.6756;

    return NextResponse.json({
      navioId: navio.id,
      nome: navio.nome,
      matricula: navio.matricula,
      mmsi,
      callSignal,
      position: {
        lat: finalLat,
        lng: finalLng,
        speed: live.speed ?? null,
        course: live.course ?? null,
        heading: live.heading ?? null,
        navStatus: live.navStatus ?? null,
        name: live.name ?? null,
        updatedAt: live.updatedAt ?? null,
        source: hasLiveCoords ? live.source : savedLat !== null ? 'saved' : 'default-azores',
        live: hasLiveCoords,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar posição AIS:', error);
    return NextResponse.json({ error: 'Erro ao buscar posição AIS' }, { status: 500 });
  }
}
