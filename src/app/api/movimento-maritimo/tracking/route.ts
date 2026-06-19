import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import { resolveActiveServiceStationId } from "@/lib/station-selection";
import { APP_CONFIG, normalizeStationMatchToken } from "@/lib/app-config";
import { extrairPortoDeMatricula } from "@/utils/portosRegisto";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";

export const runtime = "nodejs";

type LocalNavio = {
  id: number;
  nome: string;
  matricula: string | null;
  portoRegisto: string | null;
  ilha: string | null;
  tipoPesca: string | null;
  tipoNavio: string | null;
  mmsi: string | null;
  imo: string | null;
  callSignal: string | null;
  lat?: number | null;
  lng?: number | null;
  speedKnots?: number | null;
  course?: number | null;
  heading?: number | null;
  eta?: string | null;
  etd?: string | null;
  cliente: { id?: number; nome?: string | null; ilha?: string | null } | null;
};

type TrackingVessel = {
  id?: number | string;
  mmsi?: string | null;
  imo_number?: string | null;
  name?: string | null;
  type?: string | null;
  flag?: string | null;
  last_position_lat?: number | null;
  last_position_lon?: number | null;
  speed?: number | null;
  course?: number | null;
  last_update?: string | null;
};

type PortMovementResponse = {
  port?: { code?: string; name?: string };
  targetDate?: string;
  summary?: {
    expected_arrivals_count?: number;
    in_port_count?: number;
    expected_departures_count?: number;
    history_count?: number;
    total_passengers_expected?: number;
    total_crew_expected?: number;
    top_vessel_types?: Array<{ type?: string; count?: number }>;
    next_arrival?: Record<string, unknown> | null;
    next_departure?: Record<string, unknown> | null;
  };
  movements?: {
    expected_arrivals?: Array<Record<string, unknown>>;
    in_port?: Array<Record<string, unknown>>;
    expected_departures?: Array<Record<string, unknown>>;
    history?: Array<Record<string, unknown>>;
  };
  error?: string;
};

type PortActivityResponse = {
  port?: { code?: string; name?: string };
  days?: number;
  labels?: string[];
  dates?: string[];
  series?: {
    activity?: number[];
    arrivals?: number[];
    in_port?: number[];
    departures?: number[];
  };
  error?: string;
};

type AllPortsMovementsResponse = {
  ports: Array<{
    port: { code: string; name: string };
    targetDate?: string;
    summary: {
      expected_arrivals_count: number;
      in_port_count: number;
      expected_departures_count: number;
      history_count: number;
      total_passengers_expected: number;
      total_crew_expected: number;
      top_vessel_types: Array<{ type?: string; count?: number }>;
      next_arrival?: Record<string, unknown> | null;
      next_departure?: Record<string, unknown> | null;
    };
    movements: {
      expected_arrivals: Array<Record<string, unknown>>;
      in_port: Array<Record<string, unknown>>;
      expected_departures: Array<Record<string, unknown>>;
      history: Array<Record<string, unknown>>;
    };
    activity: {
      days: number;
      labels: string[];
      dates: string[];
      series: {
        activity: number[];
        arrivals: number[];
        in_port: number[];
        departures: number[];
      };
    };
  }>;
  totals: {
    ports: number;
    portsWithActivity: number;
    expectedArrivals: number;
    inPort: number;
    expectedDepartures: number;
    cruiseCalls: number;
    passengers: number;
    crew: number;
  };
  generatedAt: string;
};

type PortosAcoresMovementRow = {
  escala: string;
  contramarca: string;
  imo: string;
  vessel_name: string;
  vessel_type: string;
  pax: number;
  tripulantes: number;
  origem: string;
  destino: string;
  ata?: string;
  atd?: string;
  eta?: string;
  etd?: string;
  scheduled_time?: string;
};

type AllPortsCacheEntry = {
  targetDate: string;
  expiresAt: number;
  value: AllPortsMovementsResponse;
};

const PORTOS_DOS_ACORES_MOVIMENTO_URL = "https://portosdosacores.pt/movimento-portuario/";
const ALL_PORTS_CACHE_TTL_MS = 5 * 60 * 1000;

const PORT_CODE_NAME_MAP: Record<string, string> = {
  PTVDP: "Vila do Porto - Santa Maria",
  PTPDL: "Ponta Delgada - São Miguel",
  PTPRV: "Praia da Vitória - Terceira",
  PTADH: "Angra do Heroísmo - Terceira",
  PTPRG: "Praia da Graciosa - Graciosa",
  PTCAL: "Calheta - São Jorge",
  PTVEL: "Velas - São Jorge",
  PTLDP: "Lajes do Pico - Pico",
  PTCDP: "São Roque do Pico - Pico",
  PTMAD: "Madalena - Pico",
  PTHOR: "Horta - Faial",
  PTLAJ: "Lajes das Flores - Flores",
  PTVNC: "Corvo - Corvo",
};

const ALL_AZORES_PORT_CODES = Object.keys(PORT_CODE_NAME_MAP);
let allPortsMovementsCache: AllPortsCacheEntry | null = null;

function normalizeText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function looksLikeCruiseMovement(item: { vessel_name?: string; vessel_type?: string }) {
  const vesselType = normalizeText(item.vessel_type || "");
  const vesselName = normalizeText(item.vessel_name || "");
  return vesselType.includes("cruzeiro")
    || vesselType.includes("cruise")
    || vesselType.includes("passageiro")
    || vesselType.includes("passenger")
    || vesselName.includes("cruise")
    || vesselName.includes("cruzeiro");
}

function isMissingDatabaseColumnError(error: unknown) {
  const message = String(error || "").toLowerCase();
  return (
    message.includes("does not exist in the current database")
    || (message.includes("column") && message.includes("does not exist"))
    || message.includes("unknown field")
  );
}

function toOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function mergeNavioWithTracking(navio: LocalNavio, trackingVessel: TrackingVessel | null): LocalNavio {
  const trackingLat = toOptionalNumber(trackingVessel?.last_position_lat);
  const trackingLng = toOptionalNumber(trackingVessel?.last_position_lon);
  const trackingSpeed = toOptionalNumber(trackingVessel?.speed);
  const trackingCourse = toOptionalNumber(trackingVessel?.course);

  return {
    ...navio,
    lat: trackingLat ?? navio.lat,
    lng: trackingLng ?? navio.lng,
    speedKnots: trackingSpeed ?? navio.speedKnots,
    course: trackingCourse ?? navio.course,
  };
}

async function findNaviosForTracking(where: Record<string, unknown>) {
  try {
    return await prisma.navio.findMany({
      where,
      select: {
        id: true,
        serviceStationId: true,
        nome: true,
        matricula: true,
        portoRegisto: true,
        ilha: true,
        tipoPesca: true,
        tipoNavio: true,
        mmsi: true,
        imo: true,
        callSignal: true,
        lat: true,
        lng: true,
        cliente: {
          select: {
            id: true,
            nome: true,
            ilha: true,
          },
        },
      },
      orderBy: { nome: "asc" },
    });
  } catch (error) {
    if (!isMissingDatabaseColumnError(error)) throw error;

    return prisma.navio.findMany({
      where,
      select: {
        id: true,
        serviceStationId: true,
        nome: true,
        matricula: true,
        portoRegisto: true,
        ilha: true,
        tipoPesca: true,
        tipoNavio: true,
        mmsi: true,
        imo: true,
        callSignal: true,
        lat: true,
        lng: true,
        cliente: {
          select: {
            id: true,
            nome: true,
            ilha: true,
          },
        },
      },
      orderBy: { nome: "asc" },
    });
  }
}

async function resolveScopedStationIdsForApp(access: Awaited<ReturnType<typeof getAccessContext>>, req: NextRequest) {
  if (!access) return [] as number[];

  const activeStationId = resolveActiveServiceStationId(req, access);
  if (activeStationId) return [activeStationId];

  if (!access.isAdmin) {
    return access.allowedStationIds.length ? access.allowedStationIds : [-1];
  }

  const targetToken = normalizeStationMatchToken(APP_CONFIG.defaultServiceStationCode);
  if (!targetToken) return [] as number[];

  const stations = await prisma.serviceStation.findMany({
    where: { ativo: true },
    select: { id: true, codigo: true, nome: true, regiaoOperacional: true },
  });

  return stations
    .filter((station) => (
      normalizeStationMatchToken(station.codigo) === targetToken
      || normalizeStationMatchToken(station.nome) === targetToken
      || normalizeStationMatchToken(station.regiaoOperacional) === targetToken
    ))
    .map((station) => station.id);
}

function getTrackingApiBaseUrl() {
  return (process.env.MARITIME_TRACKING_API_BASE_URL?.trim() || "https://maritime-backend-0521.onrender.com/api").replace(/\/$/, "");
}

function getTrackingHeaders() {
  const token = process.env.MARITIME_TRACKING_API_TOKEN?.trim();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function safeFetchJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${getTrackingApiBaseUrl()}${path}`, {
      headers: getTrackingHeaders(),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCharCode(parseInt(code, 16)));
}

function stripHtml(value: string) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function parseInteger(value: string) {
  const normalized = value.replace(/\./g, "").replace(/,/g, ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getCurrentAzoresDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Atlantic/Azores",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getDateKeyFromMovementTimestamp(value?: string) {
  const trimmed = String(value || "").trim();
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] || null;
}

function filterMovementsForDate(
  rows: PortosAcoresMovementRow[],
  mode: "arrivals" | "inPort" | "departures" | "history",
  targetDateKey: string
) {
  return rows.filter((row) => {
    if (mode === "arrivals") {
      return getDateKeyFromMovementTimestamp(row.eta) === targetDateKey;
    }

    if (mode === "departures") {
      return getDateKeyFromMovementTimestamp(row.etd) === targetDateKey;
    }

    if (mode === "history") {
      return getDateKeyFromMovementTimestamp(row.ata) === targetDateKey
        || getDateKeyFromMovementTimestamp(row.atd) === targetDateKey;
    }

    const startDate = getDateKeyFromMovementTimestamp(row.ata) || getDateKeyFromMovementTimestamp(row.eta);
    const endDate = getDateKeyFromMovementTimestamp(row.etd) || getDateKeyFromMovementTimestamp(row.atd) || startDate;

    if (!startDate && !endDate) return true;
    if (!startDate) return endDate === targetDateKey;
    if (!endDate) return startDate === targetDateKey;

    return startDate <= targetDateKey && targetDateKey <= endDate;
  });
}

function extractTableRows(html: string, sectionId: string, tableClass: string) {
  const sectionMatch = html.match(new RegExp(`<div id=["']${sectionId}["'][\\s\\S]*?<table[^>]*class=["'][^"']*${tableClass}[^"']*["'][^>]*>([\\s\\S]*?)</table>`, "i"));
  const tableHtml = sectionMatch?.[1];
  if (!tableHtml) return [] as string[][];

  const rows = Array.from(tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi));
  return rows
    .map((row) => Array.from(row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)).map((cell) => stripHtml(cell[1])))
    .filter((cells) => cells.length > 0);
}

function mapMovementRows(rows: string[][], mode: "arrivals" | "inPort" | "departures" | "history") {
  const dataRows = rows.slice(1);

  return dataRows.map((cells) => {
    const base: PortosAcoresMovementRow = {
      escala: cells[0] || "",
      contramarca: cells[1] || "",
      imo: cells[2] || "",
      vessel_name: cells[3] || "",
      vessel_type: cells[4] || "",
      pax: parseInteger(cells[5] || "0"),
      tripulantes: parseInteger(cells[6] || "0"),
      origem: cells[7] || "",
      destino: cells[8] || "",
    };

    if (mode === "arrivals") {
      return {
        ...base,
        eta: cells[9] || "",
        etd: cells[10] || "",
        scheduled_time: cells[9] || "",
      };
    }

    if (mode === "history") {
      return {
        ...base,
        ata: cells[9] || "",
        atd: cells[10] || "",
        scheduled_time: cells[10] || cells[9] || "",
      };
    }

    return {
      ...base,
      ata: cells[9] || "",
      etd: cells[10] || "",
      scheduled_time: cells[10] || cells[9] || "",
    };
  });
}

function buildPortActivityFromMovements(days: number, arrivals: PortosAcoresMovementRow[], inPort: PortosAcoresMovementRow[], departures: PortosAcoresMovementRow[]) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    days,
    labels: [today],
    dates: [today],
    series: {
      activity: [arrivals.length + inPort.length + departures.length],
      arrivals: [arrivals.length],
      in_port: [inPort.length],
      departures: [departures.length],
    },
  } satisfies PortActivityResponse;
}

function buildEmptyPortMovementsPayload(selectedPortCode: string, days: number) {
  const portName = PORT_CODE_NAME_MAP[selectedPortCode] || selectedPortCode;
  const targetDate = getCurrentAzoresDateKey();
  return {
    portMovements: {
      port: { code: selectedPortCode, name: portName },
      targetDate,
      summary: {
        expected_arrivals_count: 0,
        in_port_count: 0,
        expected_departures_count: 0,
        history_count: 0,
        total_passengers_expected: 0,
        total_crew_expected: 0,
        top_vessel_types: [],
        next_arrival: null,
        next_departure: null,
      },
      movements: {
        expected_arrivals: [],
        in_port: [],
        expected_departures: [],
        history: [],
      },
    } satisfies PortMovementResponse,
    portActivity: {
      port: { code: selectedPortCode, name: portName },
      days,
      labels: [],
      dates: [],
      series: { activity: [], arrivals: [], in_port: [], departures: [] },
    } satisfies PortActivityResponse,
  };
}

async function fetchPortosDosAcoresSectionHtml(
  body: Record<string, string>
) {
  const response = await fetch(PORTOS_DOS_ACORES_MOVIMENTO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Portos dos Açores respondeu com ${response.status}.`);
  }

  return response.text();
}

async function fetchPortosDosAcoresSectionHtmlWithRetry(
  body: Record<string, string>,
  retries = 1
) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchPortosDosAcoresSectionHtml(body);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Falha ao obter dados do portal portuário.");
}

async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  concurrency: number,
  mapper: (item: TInput, index: number) => Promise<TOutput>
) {
  const results = new Array<TOutput>(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  };

  const workers = Array.from(
    { length: Math.max(1, Math.min(concurrency, items.length)) },
    () => worker()
  );

  await Promise.all(workers);
  return results;
}

async function fetchPortosDosAcoresMovements(selectedPortCode: string, days: number): Promise<{ portMovements: PortMovementResponse; portActivity: PortActivityResponse } | null> {
  try {
    const targetDate = getCurrentAzoresDateKey();
    const arrivalsHtml = await fetchPortosDosAcoresSectionHtmlWithRetry({
        typeform: "frmprevisaodechegadas",
        pdcsearchportos: selectedPortCode,
      });
    const inPortHtml = await fetchPortosDosAcoresSectionHtmlWithRetry({
        typeform: "frmnaviosemporto",
        npsearchportos: selectedPortCode,
      });
    const departuresHtml = await fetchPortosDosAcoresSectionHtmlWithRetry({
        typeform: "frmprevisaodepartidas",
        pdpsearchportos: selectedPortCode,
      });
    const historyHtml = await fetchPortosDosAcoresSectionHtmlWithRetry({
        typeform: "frmhistorico",
        htsearchportos: selectedPortCode,
        htsearchdatainicial: "",
        htsearchdatafinal: "",
      });

    const expectedArrivals = filterMovementsForDate(
      mapMovementRows(extractTableRows(arrivalsHtml, "previsaodechegadas-4", "table_previsaodechegadas"), "arrivals"),
      "arrivals",
      targetDate
    );
    const inPort = filterMovementsForDate(
      mapMovementRows(extractTableRows(inPortHtml, "naviosemporto-5", "table_naviosemporto"), "inPort"),
      "inPort",
      targetDate
    );
    const expectedDepartures = filterMovementsForDate(
      mapMovementRows(extractTableRows(departuresHtml, "previsaodepartidas-6", "table_previsaodepartidas"), "departures"),
      "departures",
      targetDate
    );
    const history = filterMovementsForDate(
      mapMovementRows(extractTableRows(historyHtml, "historico-7", "table_historico"), "history"),
      "history",
      targetDate
    );

    const combined = [...expectedArrivals, ...inPort, ...expectedDepartures];
    const vesselTypeCounts = combined.reduce<Map<string, number>>((acc, item) => {
      const key = item.vessel_type || "Sem tipo";
      acc.set(key, (acc.get(key) || 0) + 1);
      return acc;
    }, new Map());

    const portName = PORT_CODE_NAME_MAP[selectedPortCode] || selectedPortCode;

    return {
      portMovements: {
        port: { code: selectedPortCode, name: portName },
        targetDate,
        summary: {
          expected_arrivals_count: expectedArrivals.length,
          in_port_count: inPort.length,
          expected_departures_count: expectedDepartures.length,
          history_count: history.length,
          total_passengers_expected: combined.reduce((sum, item) => sum + item.pax, 0),
          total_crew_expected: combined.reduce((sum, item) => sum + item.tripulantes, 0),
          top_vessel_types: Array.from(vesselTypeCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([type, count]) => ({ type, count })),
          next_arrival: expectedArrivals[0] || null,
          next_departure: expectedDepartures[0] || null,
        },
        movements: {
          expected_arrivals: expectedArrivals,
          in_port: inPort,
          expected_departures: expectedDepartures,
          history,
        },
      },
      portActivity: {
        port: { code: selectedPortCode, name: portName },
        ...buildPortActivityFromMovements(days, expectedArrivals, inPort, expectedDepartures),
      },
    };
  } catch {
    return null;
  }
}

async function fetchAllPortosDosAcoresMovements(days: number): Promise<AllPortsMovementsResponse> {
  const targetDate = getCurrentAzoresDateKey();
  if (allPortsMovementsCache && allPortsMovementsCache.targetDate === targetDate && allPortsMovementsCache.expiresAt > Date.now()) {
    return allPortsMovementsCache.value;
  }

  const loadResults = async (concurrency: number) => mapWithConcurrency(
    ALL_AZORES_PORT_CODES,
    concurrency,
    async (portCode) => {
      try {
        return await fetchPortosDosAcoresMovements(portCode, days);
      } catch {
        return null;
      }
    }
  );

  const buildResponseFromResults = (currentResults: Awaited<ReturnType<typeof loadResults>>) => {
    const ports = ALL_AZORES_PORT_CODES.map((portCode, index) => {
      const payload = currentResults[index];
      const fallback = buildEmptyPortMovementsPayload(portCode, days);
      const portMovements = payload?.portMovements || fallback.portMovements;
      const portActivity = payload?.portActivity || fallback.portActivity;

      return {
        port: {
          code: String(portMovements.port?.code || portCode),
          name: String(portMovements.port?.name || PORT_CODE_NAME_MAP[portCode] || portCode),
        },
        targetDate: String(portMovements.targetDate || targetDate),
        summary: {
          expected_arrivals_count: Number(portMovements.summary?.expected_arrivals_count || 0),
          in_port_count: Number(portMovements.summary?.in_port_count || 0),
          expected_departures_count: Number(portMovements.summary?.expected_departures_count || 0),
          history_count: Number(portMovements.summary?.history_count || 0),
          total_passengers_expected: Number(portMovements.summary?.total_passengers_expected || 0),
          total_crew_expected: Number(portMovements.summary?.total_crew_expected || 0),
          top_vessel_types: Array.isArray(portMovements.summary?.top_vessel_types) ? portMovements.summary!.top_vessel_types! : [],
          next_arrival: portMovements.summary?.next_arrival || null,
          next_departure: portMovements.summary?.next_departure || null,
        },
        movements: {
          expected_arrivals: Array.isArray(portMovements.movements?.expected_arrivals) ? portMovements.movements!.expected_arrivals! : [],
          in_port: Array.isArray(portMovements.movements?.in_port) ? portMovements.movements!.in_port! : [],
          expected_departures: Array.isArray(portMovements.movements?.expected_departures) ? portMovements.movements!.expected_departures! : [],
          history: Array.isArray(portMovements.movements?.history) ? portMovements.movements!.history! : [],
        },
        activity: {
          days: Number(portActivity.days || days),
          labels: Array.isArray(portActivity.labels) ? portActivity.labels : [],
          dates: Array.isArray(portActivity.dates) ? portActivity.dates : [],
          series: {
            activity: Array.isArray(portActivity.series?.activity) ? portActivity.series!.activity! : [],
            arrivals: Array.isArray(portActivity.series?.arrivals) ? portActivity.series!.arrivals! : [],
            in_port: Array.isArray(portActivity.series?.in_port) ? portActivity.series!.in_port! : [],
            departures: Array.isArray(portActivity.series?.departures) ? portActivity.series!.departures! : [],
          },
        },
      };
    });

    const totals = ports.reduce<AllPortsMovementsResponse["totals"]>((acc, entry) => {
      const activeCount = entry.summary.expected_arrivals_count + entry.summary.in_port_count + entry.summary.expected_departures_count;
      const cruiseCalls = [
        ...entry.movements.expected_arrivals,
        ...entry.movements.in_port,
        ...entry.movements.expected_departures,
      ].filter((item) => looksLikeCruiseMovement({
        vessel_name: String(item.vessel_name || ""),
        vessel_type: String(item.vessel_type || ""),
      })).length;

      acc.ports += 1;
      acc.portsWithActivity += activeCount > 0 ? 1 : 0;
      acc.expectedArrivals += entry.summary.expected_arrivals_count;
      acc.inPort += entry.summary.in_port_count;
      acc.expectedDepartures += entry.summary.expected_departures_count;
      acc.cruiseCalls += cruiseCalls;
      acc.passengers += entry.summary.total_passengers_expected;
      acc.crew += entry.summary.total_crew_expected;
      return acc;
    }, {
      ports: 0,
      portsWithActivity: 0,
      expectedArrivals: 0,
      inPort: 0,
      expectedDepartures: 0,
      cruiseCalls: 0,
      passengers: 0,
      crew: 0,
    });

    return {
      ports,
      totals,
      generatedAt: new Date().toISOString(),
    } satisfies AllPortsMovementsResponse;
  };

  let results = await loadResults(2);
  let value = buildResponseFromResults(results);

  if (value.totals.portsWithActivity === 0) {
    results = await loadResults(1);
    value = buildResponseFromResults(results);
  }

  allPortsMovementsCache = {
    targetDate,
    expiresAt: Date.now() + ALL_PORTS_CACHE_TTL_MS,
    value,
  };

  return value;
}

function getPortCodeFromName(portoRegisto?: string | null) {
  const normalized = normalizeText(portoRegisto);
  const byLabel = Object.entries(PORT_CODE_NAME_MAP).find(([, label]) => {
    const normalizedLabel = normalizeText(label);
    const normalizedBase = normalizeText(label.split("-")[0]);
    return normalized === normalizedLabel || normalized === normalizedBase;
  });
  if (byLabel) return byLabel[0];

  const mapping: Record<string, string> = {
    "ponta delgada": "PTPDL",
    "ponta delgada - sao miguel": "PTPDL",
    "vila do porto": "PTVDP",
    "vila do porto - santa maria": "PTVDP",
    "praia da vitoria": "PTPRV",
    "praia da vitoria - terceira": "PTPRV",
    "angra do heroismo": "PTADH",
    "angra do heroismo - terceira": "PTADH",
    "praia da graciosa": "PTPRG",
    "praia da graciosa - graciosa": "PTPRG",
    "calheta": "PTCAL",
    "calheta - sao jorge": "PTCAL",
    "velas": "PTVEL",
    "velas - sao jorge": "PTVEL",
    "lajes do pico": "PTLDP",
    "lajes do pico - pico": "PTLDP",
    "sao roque do pico": "PTCDP",
    "são roque do pico": "PTCDP",
    "sao roque do pico - pico": "PTCDP",
    "são roque do pico - pico": "PTCDP",
    "madalena": "PTMAD",
    "madalena - pico": "PTMAD",
    "horta": "PTHOR",
    "horta - faial": "PTHOR",
    "lajes das flores": "PTLAJ",
    "lajes das flores - flores": "PTLAJ",
    "corvo": "PTVNC",
    "corvo - corvo": "PTVNC",
  };
  return mapping[normalized] || null;
}

function selectTrackingPortCode(navios: LocalNavio[], requestedPort?: string | null) {
  const requestedCode = getPortCodeFromName(requestedPort);
  if (requestedCode) return requestedCode;

  const portsByFrequency = navios.reduce<Map<string, number>>((acc, navio) => {
    const code = getPortCodeFromName(navio.portoRegisto);
    if (!code) return acc;
    acc.set(code, (acc.get(code) || 0) + 1);
    return acc;
  }, new Map());

  return Array.from(portsByFrequency.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "PTPDL";
}

function sanitizeNavio(navio: LocalNavio): LocalNavio {
  return {
    ...navio,
    portoRegisto: navio.portoRegisto || extrairPortoDeMatricula(navio.matricula || "") || null,
  };
}

function matchTrackingVessel(navio: LocalNavio, vessels: TrackingVessel[]) {
  const navioMmsi = String(navio.mmsi || "").trim();
  const navioImo = String(navio.imo || "").trim();
  const navioName = normalizeText(navio.nome);

  if (navioMmsi) {
    const byMmsi = vessels.find((vessel) => String(vessel.mmsi || "").trim() === navioMmsi);
    if (byMmsi) return { vessel: byMmsi, strategy: "mmsi" as const };
  }

  if (navioImo) {
    const byImo = vessels.find((vessel) => String(vessel.imo_number || "").trim() === navioImo);
    if (byImo) return { vessel: byImo, strategy: "imo" as const };
  }

  if (navioName.length >= 3) {
    const byName = vessels.find((vessel) => normalizeText(vessel.name) === navioName);
    if (byName) return { vessel: byName, strategy: "name" as const };
  }

  return { vessel: null, strategy: null };
}

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const requestedPort = searchParams.get("porto");
    const days = Math.min(31, Math.max(1, Number(searchParams.get("days") || 7)));
    const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") || 6)));

    const where: Record<string, unknown> = {};
    const scopedStationIds = await resolveScopedStationIdsForApp(access, req);
    if (scopedStationIds.length === 1) {
      where.serviceStationId = scopedStationIds[0];
    } else if (scopedStationIds.length > 1) {
      where.serviceStationId = { in: scopedStationIds };
    }

    const naviosRaw = await findNaviosForTracking(where);
    const navios = naviosRaw.map((navio) => sanitizeNavio(navio as LocalNavio));
    const selectedPortCode = selectTrackingPortCode(navios, requestedPort);

    const [vesselsPayload, dashboardPayload, portMovementsPayload, portActivityPayload, portosDosAcoresPayload, allPortosDosAcoresPayload] = await Promise.all([
      safeFetchJson<{ count?: number; vessels?: TrackingVessel[] }>("/vessels/"),
      safeFetchJson<Record<string, unknown>>("/dashboard/"),
      safeFetchJson<PortMovementResponse>(`/port-movements/?port=${encodeURIComponent(selectedPortCode)}&limit=${limit}&live=true&archive=true`),
      safeFetchJson<PortActivityResponse>(`/port-movements/activity/?port=${encodeURIComponent(selectedPortCode)}&days=${days}&live=true&archive=true`),
      fetchPortosDosAcoresMovements(selectedPortCode, days),
      fetchAllPortosDosAcoresMovements(days),
    ]);

    const selectedPortFromNetwork = allPortosDosAcoresPayload.ports.find((entry) => entry.port.code === selectedPortCode) || null;

    const effectivePortMovements = selectedPortFromNetwork
      ? {
          port: selectedPortFromNetwork.port,
          targetDate: selectedPortFromNetwork.targetDate,
          summary: selectedPortFromNetwork.summary,
          movements: selectedPortFromNetwork.movements,
        }
      : portosDosAcoresPayload?.portMovements || portMovementsPayload || buildEmptyPortMovementsPayload(selectedPortCode, days).portMovements;

    const effectivePortActivity = selectedPortFromNetwork
      ? {
          port: selectedPortFromNetwork.port,
          days: selectedPortFromNetwork.activity.days,
          labels: selectedPortFromNetwork.activity.labels,
          dates: selectedPortFromNetwork.activity.dates,
          series: selectedPortFromNetwork.activity.series,
        }
      : portosDosAcoresPayload?.portActivity || portActivityPayload || buildEmptyPortMovementsPayload(selectedPortCode, days).portActivity;

    const vessels = Array.isArray(vesselsPayload?.vessels) ? vesselsPayload!.vessels! : [];
    const naviosWithTracking = navios.map((navio) => {
      const match = matchTrackingVessel(navio, vessels);
      const navioMerged = mergeNavioWithTracking(navio, match.vessel);
      return {
        navio: navioMerged,
        trackingVessel: match.vessel,
        matchStrategy: match.strategy,
        aisLiveReady: Boolean(String(navio.mmsi || "").trim()),
      };
    });

    const matchedNavios = naviosWithTracking.filter((item) => item.trackingVessel);

    const matchedVesselIds = new Set(matchedNavios.map((item) => String(item.trackingVessel?.id || item.trackingVessel?.mmsi || item.trackingVessel?.imo_number || item.trackingVessel?.name || "")));
    const unmatchedLocal = naviosWithTracking
      .filter((item) => !item.trackingVessel)
      .map((item) => item.navio);
    const externalOnly = vessels.filter((vessel) => !matchedVesselIds.has(String(vessel.id || vessel.mmsi || vessel.imo_number || vessel.name || "")));

    return NextResponse.json({
      ok: true,
      fetchedAt: new Date().toISOString(),
      liveSource: "AISStream",
      externalTrackingSource: portosDosAcoresPayload ? `${getTrackingApiBaseUrl()} + Portos dos Açores` : getTrackingApiBaseUrl(),
      selectedPortCode,
      navios: naviosWithTracking.map((item) => item.navio),
      tracking: {
        available: Boolean(vesselsPayload || effectivePortMovements || effectivePortActivity || dashboardPayload),
        matchedCount: matchedNavios.length,
        unmatchedLocalCount: unmatchedLocal.length,
        externalOnlyCount: externalOnly.length,
        matchedNavios,
        unmatchedLocal: unmatchedLocal.slice(0, 20),
      },
      dashboard: dashboardPayload || {},
      portMovements: effectivePortMovements,
      portActivity: effectivePortActivity,
      allPortMovements: allPortosDosAcoresPayload,
    });
  } catch (error) {
    return buildDatabaseErrorResponse(error, "Erro ao carregar a integração de tracking marítimo.");
  }
}
