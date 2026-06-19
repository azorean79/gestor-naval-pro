"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { APP_CONFIG } from "@/lib/app-config";
import { inferAzoresIslandFromPort } from "@/lib/azores-islands";
import { normalizeNavioTipoCategoria } from "@/lib/navio-legal-types";
import { getNavioIslandLabel } from "@/lib/navios-grouping";
import { sortNaviosAlphabetically } from "@/lib/navios-sort";
import { getPortosDisponiveis } from "@/utils/portosRegisto";
import VistaLiveMap from "./components/VistaLiveMap";

type Navio = {
  id: number;
  nome: string;
  matricula?: string | null;
  tipoPesca?: string | null;
  tipoNavio?: string | null;
  ilha?: string | null;
  portoRegisto?: string | null;
  mmsi?: string | null;
  imo?: string | null;
  callSignal?: string | null;
  lat?: number | null;
  lng?: number | null;
  speedKnots?: number | null;
  course?: number | null;
  heading?: number | null;
  eta?: string | null;
  etd?: string | null;
  cliente?: { id?: number; nome?: string | null; ilha?: string | null } | null;
};

type TrackingPayload = {
  ok?: boolean;
  error?: string;
  navios: Navio[];
  selectedPortCode?: string;
  portMovements?: {
    port?: { code?: string; name?: string };
    targetDate?: string;
    summary?: {
      expected_arrivals_count?: number;
      in_port_count?: number;
      expected_departures_count?: number;
    };
    movements?: {
      expected_arrivals?: Array<Record<string, unknown>>;
      in_port?: Array<Record<string, unknown>>;
      expected_departures?: Array<Record<string, unknown>>;
    };
  };
  allPortMovements?: {
    ports?: Array<{
      port?: { code?: string; name?: string };
      targetDate?: string;
      summary?: {
        expected_arrivals_count?: number;
        in_port_count?: number;
        expected_departures_count?: number;
        history_count?: number;
        total_passengers_expected?: number;
        total_crew_expected?: number;
        next_arrival?: Record<string, unknown> | null;
        next_departure?: Record<string, unknown> | null;
        top_vessel_types?: Array<{ type?: string; count?: number }>;
      };
      movements?: {
        expected_arrivals?: Array<Record<string, unknown>>;
        in_port?: Array<Record<string, unknown>>;
        expected_departures?: Array<Record<string, unknown>>;
        history?: Array<Record<string, unknown>>;
      };
      activity?: {
        days?: number;
        labels?: string[];
        dates?: string[];
        series?: {
          activity?: number[];
          arrivals?: number[];
          in_port?: number[];
          departures?: number[];
        };
      };
    }>;
    totals?: {
      ports?: number;
      portsWithActivity?: number;
      expectedArrivals?: number;
      inPort?: number;
      expectedDepartures?: number;
      cruiseCalls?: number;
      passengers?: number;
      crew?: number;
    };
    generatedAt?: string;
  };
};

type PortMovementItem = {
  vessel_name: string;
  vessel_type: string;
  pax: number;
  tripulantes: number;
  origem: string;
  destino: string;
  eta: string;
  etd: string;
  ata: string;
  atd: string;
};

type PortMovementDataset = NonNullable<NonNullable<TrackingPayload["allPortMovements"]>["ports"]>[number];

type TimelineMovementItem = PortMovementItem & {
  portCode: string;
  portName: string;
  movementKind: Exclude<MovementTab, "cruzeiros">;
  scheduledTime: string;
};

type ViewMode = "portos" | "ilhas" | "lista" | "mapa";
type MovementTab = "inPort" | "arrivals" | "departures" | "cruzeiros";

type PortSummary = {
  porto: string;
  total: number;
  ilhaPrincipal: string;
  ilhasLigadas: string[];
  prontosTracking: number;
  navios: Navio[];
};

type IslandSummary = {
  ilha: string;
  total: number;
  portos: string[];
  prontosTracking: number;
  tipologias: Array<{ tipo: string; total: number }>;
  navios: Navio[];
};

const VIEW_OPTIONS: Array<{ key: ViewMode; label: string }> = [
  { key: "portos", label: "Portos" },
  { key: "ilhas", label: "Ilhas" },
  { key: "lista", label: "Lista" },
  { key: "mapa", label: "Mapa AIS" },
];

const PORTOS_AZORES = getPortosDisponiveis();

function normalizeText(value?: string | null) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getShipIsland(navio: Navio) {
  const label = getNavioIslandLabel({ ilha: navio.ilha, cliente: navio.cliente });
  return label === "Sem ilha" ? "Sem ilha" : label;
}

function hasTrackingReadiness(navio: Navio) {
  return Boolean(
    String(navio.portoRegisto || "").trim()
      && getShipIsland(navio) !== "Sem ilha"
      && (String(navio.mmsi || "").trim() || String(navio.imo || "").trim() || String(navio.callSignal || "").trim())
  );
}

function compareByName<T extends { nome?: string | null }>(a: T, b: T) {
  return String(a.nome || "").localeCompare(String(b.nome || ""), "pt", { sensitivity: "base" });
}

function isCruiseVessel(item: PortMovementItem) {
  const vesselType = normalizeText(item.vessel_type);
  const vesselName = normalizeText(item.vessel_name);
  return vesselType.includes("cruzeiro")
    || vesselType.includes("cruise")
    || vesselType.includes("passageiro")
    || vesselType.includes("passenger")
    || vesselName.includes("cruise")
    || vesselName.includes("cruzeiro");
}

export default function MovimentoMaritimoPage() {
  const [navios, setNavios] = useState<Navio[]>([]);
  const [selectedPortCodeFromApi, setSelectedPortCodeFromApi] = useState<string>("");
  const [portMovements, setPortMovements] = useState<TrackingPayload["portMovements"] | null>(null);
  const [allPortMovements, setAllPortMovements] = useState<TrackingPayload["allPortMovements"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("portos");
  const [search, setSearch] = useState("");
  const [selectedIlha, setSelectedIlha] = useState("");
  const [selectedPorto, setSelectedPorto] = useState("");
  const [selectedTipo, setSelectedTipo] = useState("");
  const [movementTab, setMovementTab] = useState<MovementTab>("arrivals");
  const [selectedMovementPortCode, setSelectedMovementPortCode] = useState("");

  useEffect(() => {
    let active = true;

    async function loadNavios() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/movimento-maritimo/tracking", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as TrackingPayload | null;
        if (!response.ok) {
          throw new Error(payload?.error || "Não foi possível carregar o movimento marítimo.");
        }

        if (!active) return;
        setNavios(Array.isArray(payload?.navios) ? sortNaviosAlphabetically(payload.navios) : []);
        setPortMovements(payload?.portMovements || null);
        setAllPortMovements(payload?.allPortMovements || null);
        setSelectedPortCodeFromApi(String(payload?.selectedPortCode || ""));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar navios.");
        setNavios([]);
        setPortMovements(null);
        setAllPortMovements(null);
        setSelectedPortCodeFromApi("");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadNavios();
    return () => {
      active = false;
    };
  }, []);

  const movementPortEntries = useMemo<PortMovementDataset[]>(() => {
    if (Array.isArray(allPortMovements?.ports) && allPortMovements.ports.length > 0) {
      return allPortMovements.ports;
    }

    if (portMovements?.port) {
      return [{
        port: portMovements.port,
        targetDate: portMovements.targetDate,
        summary: portMovements.summary,
        movements: portMovements.movements,
        activity: {
          days: 0,
          labels: [],
          dates: [],
          series: { activity: [], arrivals: [], in_port: [], departures: [] },
        },
      }];
    }

    return [];
  }, [allPortMovements, portMovements]);

  useEffect(() => {
    if (movementPortEntries.length === 0) {
      setSelectedMovementPortCode("");
      return;
    }

    const requestedPort = normalizeText(selectedPorto);
    const requestedEntry = requestedPort
      ? movementPortEntries.find((entry) => normalizeText(entry.port?.name).startsWith(requestedPort) || normalizeText(entry.port?.name) === requestedPort)
      : null;

    setSelectedMovementPortCode((current) => {
      if (requestedEntry?.port?.code) {
        return String(requestedEntry.port.code);
      }

      if (current && movementPortEntries.some((entry) => entry.port?.code === current)) {
        return current;
      }

      if (selectedPortCodeFromApi && movementPortEntries.some((entry) => entry.port?.code === selectedPortCodeFromApi)) {
        return selectedPortCodeFromApi;
      }

      return String(movementPortEntries[0]?.port?.code || "");
    });
  }, [movementPortEntries, selectedPortCodeFromApi, selectedPorto]);

  const portosDisponiveis = useMemo(() => {
    const movementPortNames = movementPortEntries.map((entry) => String(entry.port?.name || "").trim()).filter(Boolean);
    return Array.from(new Set([...PORTOS_AZORES, ...movementPortNames, ...navios.map((navio) => String(navio.portoRegisto || "").trim()).filter(Boolean)]))
      .sort((a, b) => a.localeCompare(b, "pt", { sensitivity: "base" }));
  }, [movementPortEntries, navios]);

  const ilhasDisponiveis = useMemo(() => {
    return Array.from(new Set(navios.map(getShipIsland).filter((value) => value && value !== "Sem ilha")))
      .sort((a, b) => a.localeCompare(b, "pt", { sensitivity: "base" }));
  }, [navios]);

  const tipologiasDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        navios
          .map((navio) => normalizeNavioTipoCategoria(navio.tipoPesca, navio.matricula, navio.tipoNavio))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "pt", { sensitivity: "base" }));
  }, [navios]);

  const filteredNavios = useMemo(() => {
    return [...navios]
      .filter((navio) => {
        const nome = String(navio.nome || "");
        const porto = String(navio.portoRegisto || "").trim();
        const ilha = getShipIsland(navio);
        const tipo = normalizeNavioTipoCategoria(navio.tipoPesca, navio.matricula, navio.tipoNavio);

        if (search) {
          const haystack = [nome, navio.matricula, porto, ilha, navio.cliente?.nome, navio.mmsi, navio.imo]
            .map((value) => normalizeText(String(value || "")))
            .join(" ");
          if (!haystack.includes(normalizeText(search))) return false;
        }

        if (selectedIlha && ilha !== selectedIlha) return false;
        if (selectedPorto && porto !== selectedPorto) return false;
        if (selectedTipo && tipo !== selectedTipo) return false;
        return true;
      })
      .sort(compareByName);
  }, [navios, search, selectedIlha, selectedPorto, selectedTipo]);

  const portSummaries = useMemo<PortSummary[]>(() => {
    const grouped = filteredNavios.reduce<Map<string, Navio[]>>((acc, navio) => {
      const porto = String(navio.portoRegisto || "").trim() || "Sem porto";
      if (!acc.has(porto)) acc.set(porto, []);
      acc.get(porto)?.push(navio);
      return acc;
    }, new Map());

    return Array.from(grouped.entries())
      .map(([porto, items]) => {
        const ilhaCounts = items.reduce<Map<string, number>>((acc, navio) => {
          const ilha = getShipIsland(navio);
          acc.set(ilha, (acc.get(ilha) || 0) + 1);
          return acc;
        }, new Map());

        const ilhaPrincipal = Array.from(ilhaCounts.entries())
          .sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            return a[0].localeCompare(b[0], "pt", { sensitivity: "base" });
          })[0]?.[0] || "Sem ilha";

        return {
          porto,
          total: items.length,
          ilhaPrincipal,
          ilhasLigadas: Array.from(ilhaCounts.keys()).sort((a, b) => a.localeCompare(b, "pt", { sensitivity: "base" })),
          prontosTracking: items.filter(hasTrackingReadiness).length,
          navios: [...items].sort(compareByName),
        };
      })
      .sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        return a.porto.localeCompare(b.porto, "pt", { sensitivity: "base" });
      });
  }, [filteredNavios]);

  const islandSummaries = useMemo<IslandSummary[]>(() => {
    const grouped = filteredNavios.reduce<Map<string, Navio[]>>((acc, navio) => {
      const ilha = getShipIsland(navio);
      if (!acc.has(ilha)) acc.set(ilha, []);
      acc.get(ilha)?.push(navio);
      return acc;
    }, new Map());

    return Array.from(grouped.entries())
      .map(([ilha, items]) => {
        const portos = Array.from(new Set(items.map((navio) => String(navio.portoRegisto || "").trim()).filter(Boolean)))
          .sort((a, b) => a.localeCompare(b, "pt", { sensitivity: "base" }));

        const tipologiasMap = items.reduce<Map<string, number>>((acc, navio) => {
          const tipo = normalizeNavioTipoCategoria(navio.tipoPesca, navio.matricula, navio.tipoNavio);
          acc.set(tipo, (acc.get(tipo) || 0) + 1);
          return acc;
        }, new Map());

        return {
          ilha,
          total: items.length,
          portos,
          prontosTracking: items.filter(hasTrackingReadiness).length,
          tipologias: Array.from(tipologiasMap.entries())
            .map(([tipo, total]) => ({ tipo, total }))
            .sort((a, b) => {
              if (b.total !== a.total) return b.total - a.total;
              return a.tipo.localeCompare(b.tipo, "pt", { sensitivity: "base" });
            }),
          navios: [...items].sort(compareByName),
        };
      })
      .sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        return a.ilha.localeCompare(b.ilha, "pt", { sensitivity: "base" });
      });
  }, [filteredNavios]);

  const stats = useMemo(() => {
    const comPorto = navios.filter((navio) => String(navio.portoRegisto || "").trim()).length;
    const comIlha = navios.filter((navio) => getShipIsland(navio) !== "Sem ilha").length;
    const prontosTracking = navios.filter(hasTrackingReadiness).length;
    const networkTotals = allPortMovements?.totals;

    return {
      total: navios.length,
      comPorto,
      comIlha,
      portosAtivos: portSummaries.filter((item) => item.porto !== "Sem porto").length,
      ilhasAtivas: islandSummaries.filter((item) => item.ilha !== "Sem ilha").length,
      prontosTracking,
      semBase: navios.filter((navio) => !String(navio.portoRegisto || "").trim() && getShipIsland(navio) === "Sem ilha").length,
      monitoredPorts: Number(networkTotals?.ports || movementPortEntries.length),
      activePorts: Number(networkTotals?.portsWithActivity || 0),
      expectedArrivals: Number(networkTotals?.expectedArrivals || 0),
      inPortNow: Number(networkTotals?.inPort || 0),
      expectedDepartures: Number(networkTotals?.expectedDepartures || 0),
      cruiseCalls: Number(networkTotals?.cruiseCalls || 0),
      passengers: Number(networkTotals?.passengers || 0),
      crew: Number(networkTotals?.crew || 0),
    };
  }, [allPortMovements?.totals, movementPortEntries.length, navios, portSummaries, islandSummaries]);

  const selectedMovementPort = useMemo<PortMovementDataset | null>(() => {
    if (movementPortEntries.length === 0) return null;
    return movementPortEntries.find((entry) => entry.port?.code === selectedMovementPortCode)
      || movementPortEntries.find((entry) => entry.port?.code === selectedPortCodeFromApi)
      || movementPortEntries[0]
      || null;
  }, [movementPortEntries, selectedMovementPortCode, selectedPortCodeFromApi]);

  const movementRows = useMemo(() => {
    const toItem = (row: Record<string, unknown>): PortMovementItem => ({
      vessel_name: String(row.vessel_name || "").trim() || "Sem nome",
      vessel_type: String(row.vessel_type || "").trim() || "Sem tipo",
      pax: Number(row.pax || 0),
      tripulantes: Number(row.tripulantes || 0),
      origem: String(row.origem || "").trim() || "—",
      destino: String(row.destino || "").trim() || "—",
      eta: String(row.eta || "").trim(),
      etd: String(row.etd || "").trim(),
      ata: String(row.ata || "").trim(),
      atd: String(row.atd || "").trim(),
    });

    const inPort = Array.isArray(selectedMovementPort?.movements?.in_port)
      ? selectedMovementPort!.movements!.in_port!.map((row) => toItem(row))
      : [];
    const arrivals = Array.isArray(selectedMovementPort?.movements?.expected_arrivals)
      ? selectedMovementPort!.movements!.expected_arrivals!.map((row) => toItem(row))
      : [];
    const departures = Array.isArray(selectedMovementPort?.movements?.expected_departures)
      ? selectedMovementPort!.movements!.expected_departures!.map((row) => toItem(row))
      : [];

    return { inPort, arrivals, departures };
  }, [selectedMovementPort]);

  const cruiseRows = useMemo(() => {
    const combined = [...movementRows.inPort, ...movementRows.arrivals, ...movementRows.departures];
    const unique = new Map<string, PortMovementItem>();

    for (const item of combined) {
      if (!isCruiseVessel(item)) continue;
      const key = `${normalizeText(item.vessel_name)}::${normalizeText(item.vessel_type)}::${normalizeText(item.eta || item.etd || item.ata || item.atd)}`;
      if (!unique.has(key)) unique.set(key, item);
    }

    return Array.from(unique.values());
  }, [movementRows.arrivals, movementRows.departures, movementRows.inPort]);

  const activeMovementRows = movementTab === "inPort"
    ? movementRows.inPort
    : movementTab === "arrivals"
      ? movementRows.arrivals
      : movementTab === "departures"
        ? movementRows.departures
        : cruiseRows;

  const targetDayLabel = useMemo(() => {
    const targetDate = String(selectedMovementPort?.targetDate || "").trim();
    if (!targetDate) return "Hoje";

    const [year, month, day] = targetDate.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
    if (Number.isNaN(parsedDate.getTime())) return "Hoje";

    return parsedDate.toLocaleDateString("pt-PT", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Atlantic/Azores",
    });
  }, [selectedMovementPort?.targetDate]);

  const timelineRows = useMemo<TimelineMovementItem[]>(() => {
    const rows = movementPortEntries.flatMap((entry) => {
      const portCode = String(entry.port?.code || "");
      const portName = String(entry.port?.name || "Porto sem nome");

      const toItem = (row: Record<string, unknown>, movementKind: Exclude<MovementTab, "cruzeiros">): TimelineMovementItem => ({
        vessel_name: String(row.vessel_name || "").trim() || "Sem nome",
        vessel_type: String(row.vessel_type || "").trim() || "Sem tipo",
        pax: Number(row.pax || 0),
        tripulantes: Number(row.tripulantes || 0),
        origem: String(row.origem || "").trim() || "—",
        destino: String(row.destino || "").trim() || "—",
        eta: String(row.eta || "").trim(),
        etd: String(row.etd || "").trim(),
        ata: String(row.ata || "").trim(),
        atd: String(row.atd || "").trim(),
        portCode,
        portName,
        movementKind,
        scheduledTime: String(
          (movementKind === "arrivals" ? row.eta : movementKind === "departures" ? row.etd : row.ata)
          || row.scheduled_time
          || row.etd
          || row.eta
          || row.ata
          || row.atd
          || "9999-12-31 23:59:59"
        ).trim(),
      });

      return [
        ...(Array.isArray(entry.movements?.expected_arrivals) ? entry.movements!.expected_arrivals!.map((row) => toItem(row, "arrivals")) : []),
        ...(Array.isArray(entry.movements?.in_port) ? entry.movements!.in_port!.map((row) => toItem(row, "inPort")) : []),
        ...(Array.isArray(entry.movements?.expected_departures) ? entry.movements!.expected_departures!.map((row) => toItem(row, "departures")) : []),
      ];
    });

    return rows
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime, "pt", { sensitivity: "base" }))
      .slice(0, 18);
  }, [movementPortEntries]);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
        <section className="app-hero-panel rounded-3xl p-5 text-white lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">Operação</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Movimento Marítimo</h1>
              <p className="mt-3 max-w-3xl text-sm text-sky-50 sm:text-base">Visão simples e útil da frota por porto e ilha em {APP_CONFIG.defaultRegionLabel}.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/navios" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-sky-50">
                Abrir navios
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Portos monitorizados", value: stats.monitoredPorts, hint: `${stats.activePorts} com atividade visível agora.` },
              { label: "Chegadas previstas", value: stats.expectedArrivals, hint: "Leitura viva dos portos dos Açores." },
              { label: "Navios em porto", value: stats.inPortNow, hint: "Vista operacional instantânea." },
              { label: "Partidas previstas", value: stats.expectedDepartures, hint: "Saídas previstas em toda a rede." },
              { label: "Cruzeiros detetados", value: stats.cruiseCalls, hint: `${stats.passengers} pax · ${stats.crew} tripulantes.` },
            ].map((item) => (
              <div key={item.label} className="app-hero-card rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-100">{item.label}</p>
                <p className="mt-1 text-3xl font-bold">{item.value}</p>
                <p className="mt-1 text-xs text-sky-50/90">{item.hint}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Leitura operacional</h2>
              <p className="text-sm text-slate-500">Cruza a frota interna com o radar portuário regional e alterna entre visão por portos, ilhas ou lista detalhada.</p>
            </div>
            <div className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              {filteredNavios.length} navio(s) no recorte atual
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sky-700">Pesquisa</label>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome, matrícula, porto, ilha, cliente, MMSI..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-emerald-700">Ilha</label>
              <select value={selectedIlha} onChange={(event) => setSelectedIlha(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Todas</option>
                {ilhasDisponiveis.map((ilha) => (
                  <option key={ilha} value={ilha}>{ilha}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-violet-700">Porto</label>
              <select value={selectedPorto} onChange={(event) => setSelectedPorto(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Todos</option>
                {portosDisponiveis.map((porto) => (
                  <option key={porto} value={porto}>{porto}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amber-700">Tipologia</label>
              <select value={selectedTipo} onChange={(event) => setSelectedTipo(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">Todas</option>
                {tipologiasDisponiveis.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3 flex flex-wrap gap-2">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setViewMode(option.key)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${viewMode === option.key ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-700"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="md:col-span-1 md:justify-self-end">
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedIlha("");
                  setSelectedPorto("");
                  setSelectedTipo("");
                }}
                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                Limpar filtros
              </button>
            </div>
          </div>
        </section>

        {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">A carregar movimento marítimo...</div> : null}
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900 shadow-sm">{error}</div> : null}

        {!loading && !error && viewMode === "portos" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Radar portuário dos Açores</h2>
                <p className="text-sm text-slate-500">Todos os portos listados no portal oficial, com chegadas, partidas e navios em porto num só painel.</p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Atualizado: {allPortMovements?.generatedAt ? new Date(allPortMovements.generatedAt).toLocaleString("pt-PT") : "agora"}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {movementPortEntries.map((entry) => {
                const isSelected = entry.port?.code === selectedMovementPort?.port?.code;
                const total = Number(entry.summary?.expected_arrivals_count || 0) + Number(entry.summary?.in_port_count || 0) + Number(entry.summary?.expected_departures_count || 0);
                const nextArrival = String((entry.summary?.next_arrival as Record<string, unknown> | null)?.vessel_name || "").trim();
                const nextDeparture = String((entry.summary?.next_departure as Record<string, unknown> | null)?.vessel_name || "").trim();
                const passengers = Number(entry.summary?.total_passengers_expected || 0);
                const crew = Number(entry.summary?.total_crew_expected || 0);

                return (
                  <button
                    key={String(entry.port?.code || entry.port?.name || Math.random())}
                    type="button"
                    onClick={() => setSelectedMovementPortCode(String(entry.port?.code || ""))}
                    className={`rounded-2xl border p-4 text-left transition ${isSelected ? "border-blue-600 bg-blue-50 shadow-md" : "border-slate-200 bg-white hover:border-sky-300 hover:shadow-sm"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{entry.port?.code || "PORTO"}</p>
                        <h3 className="mt-1 text-lg font-bold text-slate-900">{entry.port?.name || "Porto"}</h3>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${total > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {total} mov.
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-emerald-50 px-2 py-3">
                        <p className="text-[10px] uppercase tracking-wide text-emerald-700">Chegadas</p>
                        <p className="mt-1 text-lg font-bold text-emerald-800">{Number(entry.summary?.expected_arrivals_count || 0)}</p>
                      </div>
                      <div className="rounded-xl bg-slate-100 px-2 py-3">
                        <p className="text-[10px] uppercase tracking-wide text-slate-600">Em porto</p>
                        <p className="mt-1 text-lg font-bold text-slate-800">{Number(entry.summary?.in_port_count || 0)}</p>
                      </div>
                      <div className="rounded-xl bg-rose-50 px-2 py-3">
                        <p className="text-[10px] uppercase tracking-wide text-rose-700">Partidas</p>
                        <p className="mt-1 text-lg font-bold text-rose-800">{Number(entry.summary?.expected_departures_count || 0)}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1 text-xs text-slate-600">
                      <p><span className="font-semibold text-slate-900">Hoje:</span> {String(entry.targetDate || "").trim() || "dia atual"}</p>
                      <p><span className="font-semibold text-slate-900">PAX / Trip.:</span> {passengers} / {crew}</p>
                      <p><span className="font-semibold text-slate-900">Próxima chegada:</span> {nextArrival || "Sem escala destacada"}</p>
                      <p><span className="font-semibold text-slate-900">Próxima partida:</span> {nextDeparture || "Sem saída destacada"}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {!loading && !error && viewMode === "portos" ? (
          <section className="grid gap-4 xl:grid-cols-[1.35fr,0.95fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Centro de detalhe por porto</h2>
                  <p className="text-sm text-slate-500">
                    {String(selectedMovementPort?.port?.name || "Porto não identificado")}
                    {selectedMovementPort?.port?.code ? ` (${selectedMovementPort.port.code})` : ""}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Dia em foco: {targetDayLabel}</p>
                </div>
                <div className="text-xs text-slate-500">
                  Em porto: <span className="font-semibold text-slate-800">{selectedMovementPort?.summary?.in_port_count ?? movementRows.inPort.length}</span>
                  {" · "}
                  Chegadas: <span className="font-semibold text-emerald-700">{selectedMovementPort?.summary?.expected_arrivals_count ?? movementRows.arrivals.length}</span>
                  {" · "}
                  Partidas: <span className="font-semibold text-rose-700">{selectedMovementPort?.summary?.expected_departures_count ?? movementRows.departures.length}</span>
                </div>
              </div>

              <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-700">Chegadas</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-900">{selectedMovementPort?.summary?.expected_arrivals_count ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-600">Em porto</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{selectedMovementPort?.summary?.in_port_count ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-rose-700">Partidas</p>
                  <p className="mt-2 text-3xl font-bold text-rose-900">{selectedMovementPort?.summary?.expected_departures_count ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-violet-700">PAX / Trip.</p>
                  <p className="mt-2 text-2xl font-bold text-violet-900">{Number(selectedMovementPort?.summary?.total_passengers_expected || 0)} / {Number(selectedMovementPort?.summary?.total_crew_expected || 0)}</p>
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                {[
                  { key: "inPort" as const, label: "Navios em porto", total: movementRows.inPort.length, className: "border-slate-300 text-slate-700" },
                  { key: "arrivals" as const, label: "Previsão de chegadas", total: movementRows.arrivals.length, className: "border-emerald-200 text-emerald-700" },
                  { key: "departures" as const, label: "Previsão de partidas", total: movementRows.departures.length, className: "border-rose-200 text-rose-700" },
                  { key: "cruzeiros" as const, label: "Cruzeiros", total: cruiseRows.length, className: "border-violet-200 text-violet-700" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setMovementTab(tab.key)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${movementTab === tab.key ? "bg-blue-700 text-white border-blue-700" : `bg-white ${tab.className} hover:bg-slate-50`}`}
                  >
                    {tab.label} ({tab.total})
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
                  {movementTab === "inPort"
                    ? "Navios em porto"
                    : movementTab === "arrivals"
                      ? "Previsão de chegadas"
                      : movementTab === "departures"
                        ? "Previsão de partidas"
                        : "Cruzeiros"}
                </div>
                <div className="max-h-[28rem] overflow-auto divide-y divide-slate-100">
                  {activeMovementRows.slice(0, 40).map((item, idx) => (
                    <div key={`${movementTab}-${item.vessel_name}-${idx}`} className="px-4 py-3 text-sm">
                      <div className="flex flex-col gap-1 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{item.vessel_name}</p>
                          <p className="text-xs text-slate-500">{item.vessel_type}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px]">
                          {item.eta ? <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">ETA {item.eta}</span> : null}
                          {item.ata ? <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">ATA {item.ata}</span> : null}
                          {item.etd ? <span className="rounded-full bg-rose-50 px-2 py-1 font-semibold text-rose-700">ETD {item.etd}</span> : null}
                          {item.atd ? <span className="rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700">ATD {item.atd}</span> : null}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-slate-600">Origem: {item.origem || "—"} · Destino: {item.destino || "—"}</p>
                      <p className="mt-1 text-xs text-slate-600">Passageiros: <span className="font-semibold text-slate-900">{item.pax}</span> · Tripulantes: <span className="font-semibold text-slate-900">{item.tripulantes}</span></p>
                    </div>
                  ))}
                  {activeMovementRows.length === 0 && (
                    <p className="px-4 py-6 text-sm text-slate-400">
                      {movementTab === "cruzeiros" ? "Sem cruzeiros identificados para este porto." : "Sem registos para esta aba neste porto."}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Próximos movimentos em rede</h2>
                <p className="text-sm text-slate-500">Linha temporal rápida com os movimentos mais próximos em todos os portos.</p>
              </div>

              <div className="space-y-3">
                {timelineRows.map((item, index) => (
                  <button
                    key={`${item.portCode}-${item.movementKind}-${item.vessel_name}-${index}`}
                    type="button"
                    onClick={() => {
                      setSelectedMovementPortCode(item.portCode);
                      setMovementTab(item.movementKind);
                    }}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-sky-300 hover:bg-sky-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.portName}</p>
                        <p className="mt-1 font-semibold text-slate-900">{item.vessel_name}</p>
                        <p className="text-xs text-slate-500">{item.vessel_type}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.movementKind === "arrivals" ? "bg-emerald-100 text-emerald-700" : item.movementKind === "departures" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"}`}>
                        {item.movementKind === "arrivals" ? "Chegada" : item.movementKind === "departures" ? "Partida" : "Em porto"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">Origem: {item.origem} · Destino: {item.destino}</p>
                    <p className="mt-1 text-xs font-medium text-slate-700">Hora: {item.scheduledTime || "—"}</p>
                    <p className="mt-1 text-xs text-slate-600">Passageiros: <span className="font-semibold text-slate-900">{item.pax}</span> · Tripulantes: <span className="font-semibold text-slate-900">{item.tripulantes}</span></p>
                  </button>
                ))}

                {timelineRows.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Sem movimentos publicados de momento para a rede portuária.
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {!loading && !error && viewMode === "portos" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Base interna por porto</h2>
                <p className="text-sm text-slate-500">Resumo dos navios da tua base interna, complementando a leitura oficial do portal portuário.</p>
              </div>
              <div className="text-xs text-slate-500">{stats.total} navio(s) internos · {stats.prontosTracking} com tracking pronto</div>
            </div>
          </section>
        ) : null}

        {!loading && !error && viewMode === "portos" ? (
          <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {portSummaries.map((summary) => {
              const portoKey = normalizeText(summary.porto);
              const ilhaEsperada = inferAzoresIslandFromPort(portoKey);
              const sampleNavios = summary.navios.slice(0, 4);
              return (
                <article key={summary.porto} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Porto</p>
                      <h3 className="mt-1 text-xl font-bold text-slate-900">{summary.porto}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {summary.total} navio(s) · {summary.prontosTracking} prontos para tracking
                      </p>
                    </div>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      {ilhaEsperada || summary.ilhaPrincipal}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Ilhas ligadas</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{summary.ilhasLigadas.join(", ")}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Cobertura</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {summary.prontosTracking === summary.total ? "Pronto" : `${summary.total - summary.prontosTracking} ficha(s) por fechar`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Navios em destaque</p>
                    <div className="mt-2 space-y-2">
                      {sampleNavios.map((navio) => (
                        <div key={navio.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                          <div>
                            <Link href={`/navios/${navio.id}`} className="font-semibold text-blue-700 hover:underline">
                              {navio.nome}
                            </Link>
                            <p className="text-xs text-slate-500">{getShipIsland(navio)} · {normalizeNavioTipoCategoria(navio.tipoPesca, navio.matricula, navio.tipoNavio)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${hasTrackingReadiness(navio) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                              {hasTrackingReadiness(navio) ? "Tracking" : "Completar"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}

            {portSummaries.length === 0 ? (
              <div className="lg:col-span-2 2xl:col-span-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                Não há portos para mostrar com os filtros atuais.
              </div>
            ) : null}
          </section>
        ) : null}

        {!loading && !error && viewMode === "ilhas" ? (
          <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {islandSummaries.map((summary) => (
              <article key={summary.ilha} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ilha</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">{summary.ilha}</h3>
                    <p className="mt-1 text-sm text-slate-500">{summary.total} navio(s) · {summary.portos.length} porto(s) ativos</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {summary.prontosTracking}/{summary.total} prontos
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Portos em uso</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{summary.portos.join(", ") || "Sem porto"}</p>
                </div>

                <div className="mt-4 grid gap-2">
                  {summary.tipologias.slice(0, 3).map((item) => (
                    <div key={`${summary.ilha}-${item.tipo}`} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                      <span className="text-slate-600">{item.tipo}</span>
                      <span className="font-semibold text-slate-900">{item.total}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {summary.navios.slice(0, 4).map((navio) => (
                    <span
                      key={navio.id}
                      className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800"
                    >
                      {navio.nome}
                    </span>
                  ))}
                </div>
              </article>
            ))}

            {islandSummaries.length === 0 ? (
              <div className="lg:col-span-2 2xl:col-span-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                Não há ilhas para mostrar com os filtros atuais.
              </div>
            ) : null}
          </section>
        ) : null}

        {!loading && !error && viewMode === "lista" ? (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Navio</th>
                    <th className="px-4 py-3">Porto</th>
                    <th className="px-4 py-3">Ilha</th>
                    <th className="px-4 py-3">Tipologia</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Tracking</th>
                    <th className="px-4 py-3">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNavios.map((navio) => (
                    <tr key={navio.id} className="border-t border-slate-200">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-900">{navio.nome}</p>
                          <p className="text-xs text-slate-500">{navio.matricula || "Sem matrícula"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{navio.portoRegisto || "Sem porto"}</td>
                      <td className="px-4 py-3 text-slate-700">{getShipIsland(navio)}</td>
                      <td className="px-4 py-3 text-slate-700">{normalizeNavioTipoCategoria(navio.tipoPesca, navio.matricula, navio.tipoNavio)}</td>
                      <td className="px-4 py-3 text-slate-700">{navio.cliente?.nome || "Sem cliente"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${hasTrackingReadiness(navio) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                          {hasTrackingReadiness(navio) ? "Pronto" : "Em falta"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/navios/${navio.id}`} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                            Abrir ficha
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredNavios.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">Nenhum navio encontrado para os filtros escolhidos.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {!loading && !error && viewMode === "mapa" ? (
          <VistaLiveMap navios={filteredNavios} />
        ) : null}
      </div>
    </div>
  );
}
