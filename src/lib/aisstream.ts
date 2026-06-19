import prisma from "@/lib/prisma";

const AISTREAM_URL = "wss://stream.aisstream.io/v0/stream";
const AISHUB_URL = "https://data.aishub.net/ws.php";
const WORLD_BOUNDING_BOX = [[[-90, -180], [90, 180]]];
const FILTER_MESSAGE_TYPES = [
  "PositionReport",
  "StandardClassBPositionReport",
  "ExtendedClassBPositionReport",
  "ShipStaticData",
  "StaticDataReport",
];

function sanitizeEnvValue(value?: string | null) {
  if (!value) return "";
  return String(value).replace(/[\r\n]/g, "").trim();
}

export function getAisStreamApiKey() {
  // Compatibilidade: alguns ambientes antigos usavam AISTREAM_API_KEY (sem S após AI).
  return sanitizeEnvValue(process.env.AISSTREAM_API_KEY) || sanitizeEnvValue(process.env.AISTREAM_API_KEY);
}

function normalizeMmsiFilters(mmsis: string[]) {
  return Array.from(new Set(
    mmsis
      .map((value) => String(value || "").trim())
      .filter(Boolean)
  )).slice(0, 50);
}

export function createAisStreamSubscriptionMessage(apiKey: string, mmsis: string[], messageTypes = FILTER_MESSAGE_TYPES) {
  const filtersShipMmsi = normalizeMmsiFilters(mmsis);

  return {
    APIKey: apiKey,
    BoundingBoxes: WORLD_BOUNDING_BOX,
    ...(filtersShipMmsi.length > 0 ? { FiltersShipMMSI: filtersShipMmsi } : {}),
    ...(messageTypes.length > 0 ? { FilterMessageTypes: messageTypes } : {}),
  };
}

export type AisSnapshot = {
  mmsi: string | null;
  imo: string | null;
  name: string | null;
  callSign: string | null;
  latitude: number | null;
  longitude: number | null;
  speedKnots: number | null;
  course: number | null;
  heading: number | null;
  timestamp: string | null;
  navStatus: string | null;
};

export type AisLivePayload = {
  ok: boolean;
  fetchedAt: string;
  noData?: boolean;
  configMissing?: boolean;
  error?: string;
  source?: string;
  lookup?: {
    strategy?: string | null;
    shipName?: string | null;
    mmsi?: string | null;
    imo?: string | null;
  } | null;
  vessel?: {
    mmsi?: string | null;
    imo?: string | null;
    name?: string | null;
    callSign?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    speedKnots?: number | null;
    course?: number | null;
    heading?: number | null;
    timestamp?: string | null;
    navStatus?: string | null;
  } | null;
};

export type BulkAisLiveResult = {
  navioId: number;
  status: number;
  body: AisLivePayload;
};


function parseOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalString(value: unknown) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function normalizeText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
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

function firstDefined(...values: unknown[]) {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}


export function normalizeAisPayload(payload: any): AisSnapshot | null {
  const fallbackMessageType = payload?.Message && typeof payload.Message === "object"
    ? Object.keys(payload.Message)[0]
    : null;
  const messageType = parseOptionalString(payload?.MessageType) || parseOptionalString(fallbackMessageType);
  const meta = payload?.MetaData || payload?.Metadata || {};
  const message = messageType ? payload?.Message?.[messageType] || {} : {};
  const reportA = message?.ReportA || message?.reportA || {};
  const reportB = message?.ReportB || message?.reportB || {};

  const snapshot: AisSnapshot = {
    mmsi: parseOptionalString(firstDefined(meta?.MMSI, message?.UserID, reportA?.UserID, reportB?.UserID)),
    imo: parseOptionalString(message?.ImoNumber ?? reportB?.ImoNumber ?? meta?.IMO),
    name: parseOptionalString(meta?.ShipName ?? message?.Name ?? message?.ShipName ?? message?.ReportA?.Name),
    callSign: parseOptionalString(message?.CallSign ?? reportB?.CallSign ?? meta?.CallSign),
    latitude: parseOptionalNumber(firstDefined(
      meta?.latitude,
      meta?.Latitude,
      meta?.lat,
      meta?.LAT,
      message?.Latitude,
      message?.latitude,
      message?.lat,
      reportA?.Latitude,
      reportA?.latitude,
      reportA?.lat,
      reportB?.Latitude,
      reportB?.latitude,
      reportB?.lat,
    )),
    longitude: parseOptionalNumber(firstDefined(
      meta?.longitude,
      meta?.Longitude,
      meta?.lon,
      meta?.lng,
      meta?.LON,
      message?.Longitude,
      message?.longitude,
      message?.lon,
      message?.lng,
      reportA?.Longitude,
      reportA?.longitude,
      reportA?.lon,
      reportA?.lng,
      reportB?.Longitude,
      reportB?.longitude,
      reportB?.lon,
      reportB?.lng,
    )),
    speedKnots: parseOptionalNumber(firstDefined(
      message?.Sog,
      message?.SOG,
      message?.sog,
      message?.Speed,
      message?.speed,
      message?.SpeedOverGround,
      message?.speedOverGround,
      reportA?.Sog,
      reportA?.SOG,
      reportA?.sog,
      reportA?.Speed,
      reportA?.speed,
      reportA?.SpeedOverGround,
      reportA?.speedOverGround,
      reportB?.Sog,
      reportB?.SOG,
      reportB?.sog,
      reportB?.Speed,
      reportB?.speed,
      reportB?.SpeedOverGround,
      reportB?.speedOverGround,
      meta?.Sog,
      meta?.SOG,
      meta?.sog,
      meta?.speed,
      meta?.Speed,
    )),
    course: parseOptionalNumber(firstDefined(
      message?.Cog,
      message?.COG,
      message?.cog,
      message?.Course,
      message?.course,
      message?.CourseOverGround,
      message?.courseOverGround,
      reportA?.Cog,
      reportA?.COG,
      reportA?.cog,
      reportA?.Course,
      reportA?.course,
      reportA?.CourseOverGround,
      reportA?.courseOverGround,
      reportB?.Cog,
      reportB?.COG,
      reportB?.cog,
      reportB?.Course,
      reportB?.course,
      reportB?.CourseOverGround,
      reportB?.courseOverGround,
      meta?.Cog,
      meta?.COG,
      meta?.cog,
      meta?.course,
      meta?.Course,
    )),
    heading: parseOptionalNumber(firstDefined(
      message?.TrueHeading,
      message?.trueHeading,
      message?.Heading,
      message?.HEADING,
      message?.heading,
      message?.hdg,
      reportA?.TrueHeading,
      reportA?.trueHeading,
      reportA?.Heading,
      reportA?.HEADING,
      reportA?.heading,
      reportA?.hdg,
      reportB?.TrueHeading,
      reportB?.trueHeading,
      reportB?.Heading,
      reportB?.HEADING,
      reportB?.heading,
      reportB?.hdg,
      meta?.TrueHeading,
      meta?.trueHeading,
      meta?.Heading,
      meta?.HEADING,
      meta?.heading,
      meta?.hdg,
    )),
    timestamp: parseOptionalString(firstDefined(
      meta?.time_utc,
      meta?.Timestamp,
      meta?.timestamp,
      message?.Timestamp,
      message?.timestamp,
      reportA?.Timestamp,
      reportA?.timestamp,
      reportB?.Timestamp,
      reportB?.timestamp,
    )),
    navStatus: parseOptionalString(firstDefined(
      message?.NavigationalStatus,
      message?.navigationalStatus,
      message?.NavStatus,
      message?.navStatus,
      reportA?.NavigationalStatus,
      reportA?.navigationalStatus,
      reportA?.NavStatus,
      reportA?.navStatus,
      reportB?.NavigationalStatus,
      reportB?.navigationalStatus,
      reportB?.NavStatus,
      reportB?.navStatus,
    )),
  };

  const hasUsefulData = Object.values(snapshot).some((value) => value !== null && value !== "");
  return hasUsefulData ? snapshot : null;
}

function mergeSnapshots(base: AisSnapshot | null, next: AisSnapshot | null): AisSnapshot | null {
  if (!base) return next;
  if (!next) return base;

  return {
    mmsi: next.mmsi ?? base.mmsi,
    imo: next.imo ?? base.imo,
    name: next.name ?? base.name,
    callSign: next.callSign ?? base.callSign,
    latitude: next.latitude ?? base.latitude,
    longitude: next.longitude ?? base.longitude,
    speedKnots: next.speedKnots ?? base.speedKnots,
    course: next.course ?? base.course,
    heading: next.heading ?? base.heading,
    timestamp: next.timestamp ?? base.timestamp,
    navStatus: next.navStatus ?? base.navStatus,
  };
}

function hasCoordinates(snapshot: AisSnapshot | null) {
  return Boolean(snapshot && snapshot.latitude !== null && snapshot.longitude !== null);
}

async function persistNavioCoordinates(navioId: number, snapshot: AisSnapshot | null) {
  if (!hasCoordinates(snapshot)) return;

  try {
    await prisma.navio.update({
      where: { id: navioId },
      data: {
        lat: snapshot?.latitude ?? undefined,
        lng: snapshot?.longitude ?? undefined,
      },
    });
  } catch {
    // Persistência best-effort: o objetivo principal continua a ser devolver o snapshot ao UI.
  }
}

async function readSocketData(data: unknown) {
  if (typeof data === "string") return data;
  if (data && typeof (data as Blob).text === "function") return await (data as Blob).text();
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString("utf8");
  return String(data ?? "");
}

async function fetchAisStreamSnapshot(apiKey: string, mmsi: string, signal?: AbortSignal) {
  const { WebSocket } = await import("undici");

  return await new Promise<AisSnapshot | null>((resolve, reject) => {
    if (signal?.aborted) { resolve(null); return; }

    const socket: any = new WebSocket(AISTREAM_URL);
    let settled = false;
    let latestSnapshot: AisSnapshot | null = null;

    const timeout = setTimeout(() => {
      finalizeResolve(latestSnapshot);
    }, 6500);

    function cleanup() {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", onAbort);
      try { socket.close(); } catch {}
    }

    function finalizeResolve(snapshot: AisSnapshot | null) {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(snapshot);
    }

    function finalizeReject(error: Error) {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    }

    const onAbort = () => finalizeResolve(latestSnapshot);
    signal?.addEventListener("abort", onAbort, { once: true });

    socket.addEventListener("open", () => {
      socket.send(JSON.stringify(createAisStreamSubscriptionMessage(apiKey, [mmsi])));
    });

    socket.addEventListener("message", (event: MessageEvent) => {
      void (async () => {
        try {
          const raw = await readSocketData(event.data);
          const payload = JSON.parse(raw);

          if (payload?.error) {
            finalizeReject(new Error(String(payload.error)));
            return;
          }

          const snapshot = normalizeAisPayload(payload);
          if (!snapshot) return;
          if (snapshot.mmsi && !mmsiEquals(snapshot.mmsi, mmsi)) return;

          latestSnapshot = mergeSnapshots(latestSnapshot, snapshot);

          if (hasCoordinates(latestSnapshot)) {
            finalizeResolve(latestSnapshot);
          }
        } catch (error) {
          finalizeReject(error instanceof Error ? error : new Error("Mensagem AIS inválida."));
        }
      })();
    });

    socket.addEventListener("error", () => {
      finalizeReject(new Error("Falha na ligação websocket ao AISStream."));
    });

    socket.addEventListener("close", () => {
      if (!settled) finalizeResolve(latestSnapshot);
    });
  });
}

type ExternalTrackingVessel = {
  mmsi?: string | null;
  imo_number?: string | null;
  name?: string | null;
  last_position_lat?: number | string | null;
  last_position_lon?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  speed?: number | string | null;
  sog?: number | string | null;
  course?: number | string | null;
  cog?: number | string | null;
  heading?: number | string | null;
  true_heading?: number | string | null;
  hdg?: number | string | null;
  last_update?: string | null;
  timestamp?: string | null;
};

type AisHubMeta = {
  ERROR?: boolean | string;
  USERNAME?: string;
  FORMAT?: string;
  RECORDS?: number;
};

type AisHubRecord = {
  MMSI?: string | number | null;
  TIME?: string | null;
  TSTAMP?: string | null;
  LONGITUDE?: string | number | null;
  LATITUDE?: string | number | null;
  COG?: string | number | null;
  SOG?: string | number | null;
  HEADING?: string | number | null;
  NAVSTAT?: string | number | null;
  IMO?: string | number | null;
  NAME?: string | null;
  CALLSIGN?: string | null;
};

function getTrackingApiBaseUrl() {
  return (process.env.MARITIME_TRACKING_API_BASE_URL?.trim() || "https://maritime-backend-0521.onrender.com/api").replace(/\/$/, "");
}

function getAisHubUsername() {
  return (
    process.env.AISHUB_USERNAME?.trim() ||
    process.env.AISHUB_USER?.trim() ||
    ""
  );
}

function getTrackingHeaders() {
  const token = process.env.MARITIME_TRACKING_API_TOKEN?.trim();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizeIdentifier(value: unknown) {
  return String(value || "").trim();
}

function buildAisHubUrl(identifiers: { mmsi?: string | null; imo?: string | null }) {
  const username = getAisHubUsername();
  if (!username) return null;

  const params = new URLSearchParams({
    username,
    format: "1",
    output: "json",
    compress: "0",
    interval: "60",
  });

  const mmsi = normalizeIdentifier(identifiers.mmsi);
  const imo = normalizeIdentifier(identifiers.imo);

  if (mmsi) params.set("mmsi", mmsi);
  if (imo) params.set("imo", imo);

  if (!mmsi && !imo) return null;
  return `${AISHUB_URL}?${params.toString()}`;
}

function extractAisHubPayload(payload: unknown): { meta: AisHubMeta | null; records: AisHubRecord[] } {
  if (Array.isArray(payload)) {
    const meta = payload[0] && typeof payload[0] === "object" && !Array.isArray(payload[0])
      ? payload[0] as AisHubMeta
      : null;
    const second = payload[1];
    if (Array.isArray(second)) {
      return { meta, records: second as AisHubRecord[] };
    }
    return { meta, records: payload.filter((item) => item && typeof item === "object" && !Array.isArray(item)) as AisHubRecord[] };
  }

  if (payload && typeof payload === "object") {
    const raw = payload as { records?: unknown; data?: unknown; vessels?: unknown } & AisHubMeta;
    if (Array.isArray(raw.records)) return { meta: raw, records: raw.records as AisHubRecord[] };
    if (Array.isArray(raw.data)) return { meta: raw, records: raw.data as AisHubRecord[] };
    if (Array.isArray(raw.vessels)) return { meta: raw, records: raw.vessels as AisHubRecord[] };
  }

  return { meta: null, records: [] };
}

function mapAisHubRecordToSnapshot(record: AisHubRecord, fallbackName?: string | null, fallbackImo?: string | null): AisSnapshot | null {
  const snapshot: AisSnapshot = {
    mmsi: parseOptionalString(record.MMSI),
    imo: parseOptionalString(record.IMO) || parseOptionalString(fallbackImo),
    name: parseOptionalString(record.NAME) || parseOptionalString(fallbackName),
    callSign: parseOptionalString(record.CALLSIGN),
    latitude: parseOptionalNumber(record.LATITUDE),
    longitude: parseOptionalNumber(record.LONGITUDE),
    speedKnots: parseOptionalNumber(record.SOG),
    course: parseOptionalNumber(record.COG),
    heading: parseOptionalNumber(record.HEADING),
    timestamp: parseOptionalString(firstDefined(record.TIME, record.TSTAMP)),
    navStatus: parseOptionalString(record.NAVSTAT),
  };

  return hasCoordinates(snapshot) ? snapshot : null;
}

async function fetchAisHubSnapshot(
  navio: { nome: string | null; mmsi: string | null; imo: string | null; callSignal: string | null },
  signal?: AbortSignal,
) {
  const url = buildAisHubUrl({ mmsi: navio.mmsi, imo: navio.imo });
  if (!url) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5500);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) return null;

    const rawPayload = await response.json() as unknown;
    const { meta, records } = extractAisHubPayload(rawPayload);
    if (!records.length) return null;

    if (meta?.ERROR === true || String(meta?.ERROR || "").toLowerCase() === "true") {
      return null;
    }

    const navioMmsi = normalizeIdentifier(navio.mmsi);
    const navioImo = normalizeIdentifier(navio.imo);
    const navioName = normalizeText(navio.nome);

    let matched: AisHubRecord | null = null;
    let strategy: "mmsi" | "imo" | "name" | null = null;

    if (navioMmsi) {
      matched = records.find((item) => normalizeIdentifier(item.MMSI) === navioMmsi) || null;
      if (matched) strategy = "mmsi";
    }

    if (!matched && navioImo) {
      matched = records.find((item) => normalizeIdentifier(item.IMO) === navioImo) || null;
      if (matched) strategy = "imo";
    }

    if (!matched && navioName && navioName.length >= 3) {
      matched = records.find((item) => normalizeText(item.NAME) === navioName) || null;
      if (matched) strategy = "name";
    }

    if (!matched || !strategy) return null;

    const snapshot = mapAisHubRecordToSnapshot(matched, navio.nome, navio.imo);
    if (!snapshot) return null;

    return {
      snapshot,
      strategy,
      mmsi: normalizeIdentifier(matched.MMSI) || navioMmsi || null,
      imo: normalizeIdentifier(matched.IMO) || navioImo || null,
      source: "AISHub",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onAbort);
  }
}

function parseTrackingCoordinate(...values: unknown[]) {
  return parseOptionalNumber(firstDefined(...values));
}

function mapExternalVesselToSnapshot(vessel: ExternalTrackingVessel, fallbackName?: string | null, fallbackImo?: string | null, fallbackCallSign?: string | null): AisSnapshot | null {
  const latitude = parseTrackingCoordinate(vessel.last_position_lat, vessel.latitude, vessel.lat);
  const longitude = parseTrackingCoordinate(vessel.last_position_lon, vessel.longitude, vessel.lng);

  const snapshot: AisSnapshot = {
    mmsi: parseOptionalString(vessel.mmsi),
    imo: parseOptionalString(vessel.imo_number) || parseOptionalString(fallbackImo),
    name: parseOptionalString(vessel.name) || parseOptionalString(fallbackName),
    callSign: parseOptionalString(fallbackCallSign),
    latitude,
    longitude,
    speedKnots: parseOptionalNumber(firstDefined(vessel.speed, vessel.sog)),
    course: parseOptionalNumber(firstDefined(vessel.course, vessel.cog)),
    heading: parseOptionalNumber(firstDefined(vessel.heading, vessel.true_heading, vessel.hdg)),
    timestamp: parseOptionalString(firstDefined(vessel.last_update, vessel.timestamp)),
    navStatus: null,
  };

  return hasCoordinates(snapshot) ? snapshot : null;
}

async function fetchExternalTrackingSnapshot(navio: { nome: string | null; mmsi: string | null; imo: string | null; callSignal: string | null; }) {
  const baseUrl = getTrackingApiBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(`${baseUrl}/vessels/`, {
      method: "GET",
      headers: getTrackingHeaders(),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) return null;
    const payload = await response.json() as ExternalTrackingVessel[] | { vessels?: ExternalTrackingVessel[]; results?: ExternalTrackingVessel[] };
    const vessels: ExternalTrackingVessel[] = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { vessels?: ExternalTrackingVessel[] }).vessels)
        ? (payload as { vessels: ExternalTrackingVessel[] }).vessels
        : Array.isArray((payload as { results?: ExternalTrackingVessel[] }).results)
          ? (payload as { results: ExternalTrackingVessel[] }).results
          : [];
    if (!vessels.length) return null;

    const navioMmsi = normalizeIdentifier(navio.mmsi);
    const navioImo = normalizeIdentifier(navio.imo);
    const navioName = normalizeText(navio.nome);

    let matched = null as ExternalTrackingVessel | null;
    let strategy: "mmsi" | "imo" | "name" | null = null;

    if (navioMmsi) {
      matched = vessels.find((item) => normalizeIdentifier(item.mmsi) === navioMmsi) || null;
      if (matched) strategy = "mmsi";
    }

    if (!matched && navioImo) {
      matched = vessels.find((item) => normalizeIdentifier(item.imo_number) === navioImo) || null;
      if (matched) strategy = "imo";
    }

    if (!matched && navioName && navioName.length >= 3) {
      matched = vessels.find((item) => normalizeText(item.name) === navioName) || null;
      if (matched) strategy = "name";
    }

    if (!matched || !strategy) return null;

    const snapshot = mapExternalVesselToSnapshot(matched, navio.nome, navio.imo, navio.callSignal);
    if (!snapshot) return null;

    return {
      snapshot,
      strategy,
      mmsi: normalizeIdentifier(matched.mmsi) || navioMmsi || null,
      imo: normalizeIdentifier(matched.imo_number) || navioImo || null,
      source: "TrackingBackendFallback",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Bulk lookup usa apenas o tracking HTTP para não conflituar com o WS AISStream da ficha individual.
export async function getBulkAisLiveResults(ids: number[]): Promise<BulkAisLiveResult[]> {
  const navioIds = Array.from(new Set(ids.filter((value) => Number.isInteger(value) && value > 0)));
  if (navioIds.length === 0) return [];

  const fetchedAt = new Date().toISOString();

  const navios = await prisma.navio.findMany({
    where: { id: { in: navioIds } },
    select: { id: true, nome: true, mmsi: true, imo: true, callSignal: true },
  });

  if (navios.length === 0) return [];

  // Busca todos os vessels do tracking de uma só vez (1 pedido HTTP)
  const baseUrl = getTrackingApiBaseUrl();
  let trackingVessels: ExternalTrackingVessel[] = [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${baseUrl}/vessels/`, {
      headers: getTrackingHeaders(),
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const raw = await res.json() as ExternalTrackingVessel[] | { vessels?: ExternalTrackingVessel[]; results?: ExternalTrackingVessel[] };
      trackingVessels = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { vessels?: ExternalTrackingVessel[] }).vessels)
          ? (raw as { vessels: ExternalTrackingVessel[] }).vessels
          : Array.isArray((raw as { results?: ExternalTrackingVessel[] }).results)
            ? (raw as { results: ExternalTrackingVessel[] }).results
            : [];
    }
  } catch {
    // tracking indisponível – continua com lista vazia
  }

  const results: BulkAisLiveResult[] = [];

  for (const navio of navios) {
    const navioMmsi = normalizeIdentifier(navio.mmsi);
    const navioImo = normalizeIdentifier(navio.imo);
    const navioName = normalizeText(navio.nome);

    let matched: ExternalTrackingVessel | null = null;
    let strategy: "mmsi" | "imo" | "name" | null = null;

    if (navioMmsi) {
      matched = trackingVessels.find((v) => normalizeIdentifier(v.mmsi) === navioMmsi) || null;
      if (matched) strategy = "mmsi";
    }
    if (!matched && navioImo) {
      matched = trackingVessels.find((v) => normalizeIdentifier(v.imo_number) === navioImo) || null;
      if (matched) strategy = "imo";
    }
    if (!matched && navioName && navioName.length >= 3) {
      matched = trackingVessels.find((v) => normalizeText(v.name) === navioName) || null;
      if (matched) strategy = "name";
    }

    if (!matched || !strategy) continue;

    const snapshot = mapExternalVesselToSnapshot(matched, navio.nome, navio.imo, navio.callSignal);
    if (!snapshot) continue;

    await persistNavioCoordinates(navio.id, snapshot).catch(() => undefined);

    results.push({
      navioId: navio.id,
      status: 200,
      body: {
        ok: true,
        fetchedAt,
        source: "TrackingBackend",
        lookup: { strategy, shipName: navio.nome || null, mmsi: navioMmsi || null, imo: navioImo || null },
        vessel: {
          ...snapshot,
          name: snapshot.name || navio.nome || null,
          callSign: snapshot.callSign || navio.callSignal || null,
          imo: snapshot.imo || navio.imo || null,
        },
      },
    });
  }

  return results;
}

export async function getNavioAisLiveResult(id: number): Promise<{ status: number; body: AisLivePayload }> {
  const apiKey = getAisStreamApiKey();
  const aishubUsername = getAisHubUsername();

  if (!apiKey && !aishubUsername) {
    return {
      status: 503,
      body: {
        error: "Nenhum fornecedor AIS configurado (AISSTREAM_API_KEY/AISTREAM_API_KEY ou AISHUB_USERNAME).",
        configMissing: true,
        ok: false,
        fetchedAt: new Date().toISOString(),
      },
    };
  }

  const navio = await prisma.navio.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      mmsi: true,
      imo: true,
      callSignal: true,
    },
  });

  if (!navio) {
    return {
      status: 404,
      body: {
        error: "Navio não encontrado.",
        ok: false,
        fetchedAt: new Date().toISOString(),
      },
    };
  }

  const mmsi = String(navio.mmsi || "").trim();
  const imo = String(navio.imo || "").trim();
  const shipName = String(navio.nome || "").trim();

  if (!mmsi && !imo && !shipName) {
    return {
      status: 400,
      body: {
        error: "A pesquisa AIS precisa de MMSI, IMO ou nome preenchido na ficha do navio.",
        ok: false,
        fetchedAt: new Date().toISOString(),
      },
    };
  }

  const fetchedAt = new Date().toISOString();

  type ProviderResult = {
    snapshot: AisSnapshot;
    source: string;
    strategy: string;
    mmsiUsed: string | null;
    imoUsed: string | null;
  };

  let result: ProviderResult | null = null;

  if (apiKey && mmsi) {
    try {
      const snapshot = await fetchAisStreamSnapshot(apiKey, mmsi);
      if (snapshot && hasCoordinates(snapshot)) {
        result = {
          snapshot,
          source: "AISStream",
          strategy: "mmsi",
          mmsiUsed: mmsi || null,
          imoUsed: navio.imo || null,
        };
      }
    } catch {
      // fallback para outros fornecedores
    }
  }

  if (!result && aishubUsername && (mmsi || imo)) {
    const fallback = await fetchAisHubSnapshot({
      nome: navio.nome || null,
      mmsi,
      imo: navio.imo || null,
      callSignal: navio.callSignal || null,
    });

    if (fallback?.snapshot && hasCoordinates(fallback.snapshot)) {
      result = {
        snapshot: fallback.snapshot,
        source: fallback.source,
        strategy: fallback.strategy,
        mmsiUsed: fallback.mmsi || null,
        imoUsed: fallback.imo || null,
      };
    }
  }

  if (!result && (mmsi || imo || shipName)) {
    const fallback = await fetchExternalTrackingSnapshot({
      nome: navio.nome || null,
      mmsi,
      imo: navio.imo || null,
      callSignal: navio.callSignal || null,
    });

    if (fallback?.snapshot && hasCoordinates(fallback.snapshot)) {
      result = {
        snapshot: fallback.snapshot,
        source: fallback.source,
        strategy: fallback.strategy,
        mmsiUsed: fallback.mmsi || null,
        imoUsed: fallback.imo || null,
      };
    }
  }

  if (!result) {
    return {
      status: 200,
      body: {
        ok: true,
        noData: true,
        fetchedAt,
        source: "AISStream",
        lookup: { strategy: "mmsi", shipName: null, mmsi: mmsi || null, imo: navio.imo || null },
      },
    };
  }

  await persistNavioCoordinates(navio.id, result.snapshot);

  return {
    status: 200,
    body: {
      ok: true,
      fetchedAt,
      source: result.source,
      lookup: {
        strategy: result.strategy,
        shipName: navio.nome || null,
        mmsi: result.mmsiUsed,
        imo: result.imoUsed,
      },
      vessel: {
        ...result.snapshot,
        name: result.snapshot.name || navio.nome || null,
        callSign: result.snapshot.callSign || navio.callSignal || null,
        imo: result.snapshot.imo || navio.imo || null,
      },
    },
  };
}