"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDateDisplay } from "@/lib/date-display";
import { OT_CREATION_ROUTE } from "@/lib/permissions-catalog";

type ServiceOrder = {
  id: number;
  numeroOrdem: string;
  grupoNumeroOrdem?: string | null;
  status: string;
  prioridade: string;
  tipo: string;
  tecnicoId?: number | null;
  tecnicoResponsavel?: string | null;
  slaHoras?: number | null;
  durationMinutes?: number;
  dataPlaneadaInicio?: string | null;
  dataPlaneadaFim?: string | null;
  dataAbertura?: string | null;
  dataPrevista?: string | null;
  createdAt?: string | null;
  shipId?: number | null;
  jangada?: {
    id?: number;
    serial?: string | null;
    brand?: string | null;
    model?: string | null;
    shipNameManual?: string | null;
    owner?: string | null;
  } | null;
  jangadas?: Array<{
    id?: number;
    serial?: string | null;
    brand?: string | null;
    model?: string | null;
    shipNameManual?: string | null;
    owner?: string | null;
  }>;
  cliente?: {
    id?: number;
    nome?: string | null;
  } | null;
  latestInspectionContext?: Array<{
    jangadaId?: number;
    serial?: string | null;
    brand?: string | null;
    model?: string | null;
    certificadoNumero?: string | null;
    dataInspecao?: string | null;
    status?: string | null;
    artigosSubstituidosCount?: number;
  }>;
  latestInspectionSummary?: {
    historyCount?: number;
    replacementCount?: number;
    latestDate?: string | null;
  } | null;

  orcamentoStatus?: string;
  isPesca?: boolean;
  isIsentoIva?: boolean;
  valorPecas?: number;
  valorMaoObra?: number;
  valorDesconto?: number;
  valorTotal?: number;
};

type TechnicianOption = {
  id: number;
  nome: string;
};

type TechnicianCapacityRow = {
  tecnico: string;
  total: number;
  weeklyMinutes: number;
  utilization: number;
  overloaded: boolean;
};

const DAILY_CAPACITY_MINUTES = 8 * 60;
const WEEKLY_CAPACITY_MINUTES = 5 * DAILY_CAPACITY_MINUTES;

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getOrderJangadas(order: ServiceOrder) {
  const rows =
    Array.isArray(order.jangadas) && order.jangadas.length > 0
      ? order.jangadas
      : order.jangada
        ? [order.jangada]
        : [];
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = String(row.id || row.serial || "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatDate(value?: string | null) {
  return formatDateDisplay(value);
}

function getInspectionStatusTone(count: number) {
  if (count > 0) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
}

function isOrderClosed(status?: string | null) {
  const value = String(status || "")
    .trim()
    .toLowerCase();
  return (
    value === "concluida" || value === "concluída" || value === "cancelada"
  );
}

function isOrderLate(order: ServiceOrder, now = new Date()) {
  if (isOrderClosed(order.status)) return false;
  const plannedEnd = String(order.dataPlaneadaFim || "").trim();
  if (!plannedEnd) return false;
  const date = new Date(plannedEnd);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < now.getTime();
}

function getPriorityWeight(priority?: string | null) {
  const value = String(priority || "")
    .trim()
    .toLowerCase();
  if (value === "critica" || value === "crítica") return 4;
  if (value === "alta") return 3;
  if (value === "normal") return 2;
  if (value === "baixa") return 1;
  return 0;
}

function getUrgencyDeadline(order: ServiceOrder) {
  const plannedEnd = String(order.dataPlaneadaFim || "").trim();
  const plannedEndMs = plannedEnd ? new Date(plannedEnd).getTime() : Number.NaN;

  const openedAt = String(order.dataAbertura || order.createdAt || "").trim();
  const openedAtMs = openedAt ? new Date(openedAt).getTime() : Number.NaN;
  const slaHours = Number(order.slaHoras || 0);
  const slaMs =
    Number.isFinite(openedAtMs) && Number.isFinite(slaHours) && slaHours > 0
      ? openedAtMs + slaHours * 60 * 60 * 1000
      : Number.NaN;

  const candidates = [plannedEndMs, slaMs].filter((value) =>
    Number.isFinite(value),
  );
  return candidates.length > 0
    ? Math.min(...candidates)
    : Number.POSITIVE_INFINITY;
}

function getOrderPlanningAnchorMs(order: ServiceOrder) {
  const candidates = [
    order.dataPlaneadaInicio,
    order.dataPlaneadaFim,
    order.dataPrevista,
    order.createdAt,
  ];

  for (const candidate of candidates) {
    const raw = String(candidate || "").trim();
    if (!raw) continue;
    const parsed = new Date(raw).getTime();
    if (Number.isFinite(parsed)) return parsed;
  }

  return Number.NaN;
}

function isInCurrentWeek(order: ServiceOrder, now = new Date()) {
  const day = now.getDay();
  const distanceToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - distanceToMonday);

  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);

  const anchorMs = getOrderPlanningAnchorMs(order);
  return (
    Number.isFinite(anchorMs) &&
    anchorMs >= monday.getTime() &&
    anchorMs < nextMonday.getTime()
  );
}

export default function OrdensServicoIndexPage() {
  const [activeTab, setActiveTab] = useState<"board" | "table">("board");
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [techFilterId, setTechFilterId] = useState("all");
  const [techFilter, setTechFilter] = useState("");
  const [lateOnly, setLateOnly] = useState(false);
  const [replacementFilter, setReplacementFilter] = useState("all");
  const [planeadoInicioDe, setPlaneadoInicioDe] = useState("");
  const [planeadoInicioAte, setPlaneadoInicioAte] = useState("");
  const [planeadoFimDe, setPlaneadoFimDe] = useState("");
  const [planeadoFimAte, setPlaneadoFimAte] = useState("");
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/tecnicos", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha ao carregar técnicos.");
        return response.json();
      })
      .then((payload) => {
        const stations = Array.isArray(payload?.stations)
          ? payload.stations
          : [];
        const unassigned = Array.isArray(payload?.unassigned)
          ? payload.unassigned
          : [];
        const all = [
          ...stations.flatMap((station: any) =>
            Array.isArray(station?.tecnicos) ? station.tecnicos : [],
          ),
          ...unassigned,
        ];
        const normalized = all
          .map((row: any) => ({
            id: Number(row?.id),
            nome: String(row?.nome || "").trim(),
          }))
          .filter(
            (row: TechnicianOption) =>
              Number.isFinite(row.id) && row.id !== 0 && row.nome,
          );

        const unique = Array.from(
          new Map(
            normalized.map((row: TechnicianOption) => [String(row.id), row]),
          ).values(),
        ).sort((a, b) => a.nome.localeCompare(b.nome, "pt"));

        setTechnicians(unique);
      })
      .catch(() => {
        if (!controller.signal.aborted) setTechnicians([]);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set("includeClosed", "1");
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (priorityFilter !== "all") params.set("prioridade", priorityFilter);
    if (techFilterId !== "all") {
      params.set("tecnicoId", techFilterId);
    } else if (techFilter.trim()) {
      params.set("tecnicoResponsavel", techFilter.trim());
    }
    if (lateOnly) params.set("atraso", "1");
    if (planeadoInicioDe) params.set("planeadoInicioDe", planeadoInicioDe);
    if (planeadoInicioAte) params.set("planeadoInicioAte", planeadoInicioAte);
    if (planeadoFimDe) params.set("planeadoFimDe", planeadoFimDe);
    if (planeadoFimAte) params.set("planeadoFimAte", planeadoFimAte);

    setLoading(true);
    setError(null);

    fetch(`/api/ordens-servico?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok)
          throw new Error(
            payload?.error || "Falha ao carregar ordens de serviço.",
          );
        return payload as ServiceOrder[];
      })
      .then((payload) => setOrders(Array.isArray(payload) ? payload : []))
      .catch((fetchError) => {
        if (controller.signal.aborted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Erro ao carregar ordens de serviço.",
        );
        setOrders([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [
    statusFilter,
    priorityFilter,
    techFilterId,
    techFilter,
    lateOnly,
    planeadoInicioDe,
    planeadoInicioAte,
    planeadoFimDe,
    planeadoFimAte,
  ]);

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData("text/plain", String(id));
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const idStr = e.dataTransfer.getData("text/plain");
    const id = parseInt(idStr, 10);
    if (!id || isNaN(id)) return;

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, orcamentoStatus: newStatus } : o)),
    );

    try {
      await fetch(`/api/ordens-servico/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orcamentoStatus: newStatus }),
      });
    } catch (err) {
      console.error(err);
      // Revert optimistic update ideally, omitted for brevity
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const COLUNAS_COMERCIAIS = [
    "Rascunho",
    "Aguardando Aprovação",
    "Aprovado",
    "Faturado",
  ];

  const sortedOrders = useMemo(() => {
    const now = new Date();
    return [...orders].sort((a, b) => {
      const aLate = isOrderLate(a, now);
      const bLate = isOrderLate(b, now);
      if (aLate !== bLate) return aLate ? -1 : 1;

      const priorityDiff =
        getPriorityWeight(b.prioridade) - getPriorityWeight(a.prioridade);
      if (priorityDiff !== 0) return priorityDiff;

      const aDeadline = getUrgencyDeadline(a);
      const bDeadline = getUrgencyDeadline(b);
      if (aDeadline !== bDeadline) return aDeadline - bDeadline;

      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bCreated - aCreated;
    });
  }, [orders]);

  const visibleOrders = useMemo(() => {
    return sortedOrders.filter((order) => {
      const replacementCount = Number(
        order.latestInspectionSummary?.replacementCount || 0,
      );
      const historyCount = Number(
        order.latestInspectionSummary?.historyCount || 0,
      );

      if (replacementFilter === "with_replacements" && replacementCount <= 0)
        return false;
      if (replacementFilter === "without_replacements" && replacementCount > 0)
        return false;
      if (replacementFilter === "without_history" && historyCount > 0)
        return false;

      return true;
    });
  }, [sortedOrders, replacementFilter]);

  const byTech = useMemo<TechnicianCapacityRow[]>(() => {
    const now = new Date();
    const map = new Map<string, number>();
    const weeklyMinutesMap = new Map<string, number>();
    for (const order of sortedOrders) {
      if (isOrderClosed(order.status)) continue; // Only count active orders
      const key =
        String(order.tecnicoResponsavel || "Sem técnico").trim() ||
        "Sem técnico";
      map.set(key, (map.get(key) || 0) + 1);

      if (isInCurrentWeek(order, now)) {
        const minutes = Math.max(0, Number(order.durationMinutes || 0)) || 210;
        weeklyMinutesMap.set(key, (weeklyMinutesMap.get(key) || 0) + minutes);
      }
    }
    return Array.from(map.entries())
      .map(([tecnico, total]) => {
        const weeklyMinutes = weeklyMinutesMap.get(tecnico) || 0;
        const utilization = weeklyMinutes / WEEKLY_CAPACITY_MINUTES;
        return {
          tecnico,
          total,
          weeklyMinutes,
          utilization,
          overloaded: utilization > 1,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [sortedOrders]);

  const teamCapacityStats = useMemo(() => {
    const assigned = byTech.filter((row) => row.tecnico !== "Sem técnico");
    if (assigned.length === 0) {
      return {
        technicians: 0,
        overloaded: 0,
        averageUtilization: 0,
      };
    }

    const overloaded = assigned.filter((row) => row.overloaded).length;
    const averageUtilization =
      assigned.reduce((acc, row) => acc + row.utilization, 0) / assigned.length;
    return {
      technicians: assigned.length,
      overloaded,
      averageUtilization,
    };
  }, [byTech]);

  const stats = useMemo(() => {
    const now = new Date();
    const total = orders.length;
    const pendentes = orders.filter(
      (o) => o.status.toLowerCase() === "pendente",
    ).length;
    const emProgresso = orders.filter(
      (o) =>
        o.status.toLowerCase() === "em_progresso" ||
        o.status.toLowerCase() === "em progresso",
    ).length;
    const concluidas = orders.filter(
      (o) =>
        o.status.toLowerCase() === "concluida" ||
        o.status.toLowerCase() === "concluída",
    ).length;
    const late = orders.filter((o) => isOrderLate(o, now)).length;
    const criticas = orders.filter(
      (o) =>
        (o.prioridade.toLowerCase() === "critica" ||
          o.prioridade.toLowerCase() === "crítica") &&
        !isOrderClosed(o.status),
    ).length;
    const comSubstituicoes = orders.filter(
      (o) => Number(o.latestInspectionSummary?.replacementCount || 0) > 0,
    ).length;

    const totalOrcamentos = orders.reduce(
      (sum, o) => sum + (o.valorTotal || 0),
      0,
    );
    const orcamentosAbertos = orders.filter(
      (o) => o.orcamentoStatus?.toLowerCase() === "rascunho",
    ).length;
    const aguardandoAprovacao = orders.filter(
      (o) => o.orcamentoStatus?.toLowerCase() === "aguardando aprovação",
    ).length;
    const aprovados = orders.filter(
      (o) => o.orcamentoStatus?.toLowerCase() === "aprovado",
    ).length;
    return {
      total,
      pendentes,
      emProgresso,
      concluidas,
      late,
      criticas,
      comSubstituicoes,
      totalOrcamentos,
      orcamentosAbertos,
      aguardandoAprovacao,
      aprovados,
    };
  }, [orders]);

  return (
    <div className="min-h-screen bg-slate-50 py-8" suppressHydrationWarning>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        {/* HERO PANEL */}
        <div className="app-hero-panel flex flex-col gap-4 rounded-3xl p-6 text-white shadow-xl lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">
                Orey Técnica
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight lg:text-4xl text-white">
                Ordens de Serviço
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-cyan-50">
                Gestão e planeamento de intervenções técnicas na frota, jangadas
                e equipamentos de segurança. Acompanhe o estado operacional, as
                prioridades e as cargas de trabalho dos técnicos.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={OT_CREATION_ROUTE}
                className="rounded-xl ring-1 ring-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-white hover:text-cyan-700"
              >
                + Nova Ordem
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-4">
            <div className="app-hero-card rounded-2xl p-4 border-l-4 border-l-cyan-400">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-cyan-100">
                Total OTs (Volume)
              </p>
              <p className="mt-1 text-3xl font-extrabold text-white">
                {stats.total}
              </p>
            </div>
            <div className="app-hero-card rounded-2xl p-4 border-l-4 border-l-emerald-400">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-emerald-100">
                Valor em Pipeline
              </p>
              <p className="mt-1 text-3xl font-extrabold text-white">
                {new Intl.NumberFormat("pt-PT", {
                  style: "currency",
                  currency: "EUR",
                }).format(stats.totalOrcamentos)}
              </p>
            </div>
            <div className="app-hero-card rounded-2xl p-4 border-l-4 border-l-amber-400">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-amber-100">
                Aguardando Aprovação
              </p>
              <p className="mt-1 text-3xl font-extrabold text-white">
                {stats.aguardandoAprovacao}
              </p>
            </div>
            <div className="app-hero-card rounded-2xl p-4 border-l-4 border-l-green-400">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-green-100">
                Orçamentos Aprovados
              </p>
              <p className="mt-1 text-3xl font-extrabold text-white">
                {stats.aprovados}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_3.5rem] lg:grid-cols-1">
          {/* MAIN CONTENT AREA */}
          <div className="space-y-6">
            {/* CAPACITY CARDS */}
            {byTech.length > 0 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex-shrink-0 flex items-center pr-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Carga Ativa
                  </span>
                </div>
                {byTech.map((row) => (
                  <div
                    key={row.tecnico}
                    className="flex-shrink-0 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600 ring-2 ring-white">
                        {row.tecnico !== "Sem técnico"
                          ? row.tecnico.substring(0, 2).toUpperCase()
                          : "?"}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {row.tecnico}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                            {row.total} OT(s) em curso
                          </span>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block ${row.overloaded ? "text-red-700 bg-red-50" : "text-emerald-700 bg-emerald-50"}`}
                          >
                            {Math.round(row.utilization * 100)}% semana
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {row.weeklyMinutes} min planeados /{" "}
                          {WEEKLY_CAPACITY_MINUTES} min capacidade
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ERROR / LOADING */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-sm text-red-700 shadow-sm">
                {error}
              </div>
            )}

            {/* TABS NAVIGATION */}
            <div className="flex items-center gap-2 mb-4 bg-white p-2 rounded-2xl shadow-sm w-fit border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("board")}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "board"
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Quadro Comercial (Funil)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("table")}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "table"
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Tabela Detalhada
              </button>
            </div>

            {/* TAB CONTENTS */}
            {activeTab === "board" ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                {COLUNAS_COMERCIAIS.map((status) => {
                  const columnOrders = visibleOrders.filter(
                    (o) =>
                      (o.orcamentoStatus || "Rascunho").toLowerCase() ===
                      status.toLowerCase(),
                  );
                  return (
                    <div
                      key={status}
                      onDrop={(e) => handleDrop(e, status)}
                      onDragOver={handleDragOver}
                      className="bg-slate-200/50 rounded-3xl p-4 min-h-[500px] border border-slate-200 flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between px-2 mb-2">
                        <h3 className="font-bold text-slate-800">{status}</h3>
                        <span className="bg-white text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ring-1 ring-slate-200">
                          {columnOrders.length}
                        </span>
                      </div>

                      {columnOrders.map((o) => (
                        <div
                          key={o.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, o.id)}
                          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 cursor-grab hover:shadow-md hover:border-cyan-300 transition-all active:cursor-grabbing relative overflow-hidden group"
                        >
                          {o.isPesca && (
                            <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                              PESCA
                            </div>
                          )}
                          <div className="flex justify-between items-start mb-2">
                            <Link
                              href={`/ordens-servico/${o.id}`}
                              className="font-bold text-cyan-700 hover:underline text-sm truncate pr-8"
                            >
                              {o.numeroOrdem}
                            </Link>
                          </div>

                          <div className="text-xs text-slate-500 mb-3 truncate">
                            {o.cliente?.nome || "Sem cliente"}
                          </div>

                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                            <span className="text-lg font-extrabold text-slate-800">
                              {new Intl.NumberFormat("pt-PT", {
                                style: "currency",
                                currency: "EUR",
                              }).format(o.valorTotal || 0)}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                                o.status === "concluida"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : o.status === "em_progresso"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {o.status.replace("_", " ").toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50/50 p-5">
                  <div className="flex flex-col xl:flex-row xl:items-center gap-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 flex-1">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-xl border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-sm py-2"
                      >
                        <option value="all">Filtro: Todos os Estados</option>
                        <option value="pendente">Pendente</option>
                        <option value="agendada">Agendada</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="em_progresso">Em progresso</option>
                        <option value="pausada">Pausada</option>
                        <option value="concluida">Concluída</option>
                        <option value="cancelada">Cancelada</option>
                      </select>

                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="rounded-xl border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-sm py-2"
                      >
                        <option value="all">Prioridade: Todas</option>
                        <option value="baixa">Baixa</option>
                        <option value="normal">Normal</option>
                        <option value="alta">Alta</option>
                        <option value="critica">Crítica</option>
                      </select>

                      <select
                        value={techFilterId}
                        onChange={(e) => {
                          setTechFilterId(e.target.value);
                          if (e.target.value !== "all") setTechFilter("");
                        }}
                        className="rounded-xl border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-sm py-2"
                      >
                        <option value="all">Técnico: Todos</option>
                        {technicians.map((tech) => (
                          <option key={tech.id} value={String(tech.id)}>
                            {tech.nome}
                          </option>
                        ))}
                      </select>

                      <label className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50 transition">
                        <input
                          type="checkbox"
                          checked={lateOnly}
                          onChange={(e) => setLateOnly(e.target.checked)}
                          className="rounded text-red-600 focus:ring-red-500"
                        />
                        Mostrar Atrasadas ({stats.late})
                      </label>

                      <select
                        value={replacementFilter}
                        onChange={(e) => setReplacementFilter(e.target.value)}
                        className="rounded-xl border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-sm py-2"
                      >
                        <option value="all">Substituições: todas</option>
                        <option value="with_replacements">
                          Com substituições recentes
                        </option>
                        <option value="without_replacements">
                          Sem substituições recentes
                        </option>
                        <option value="without_history">
                          Sem histórico de inspeção
                        </option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("all");
                          setPriorityFilter("all");
                          setTechFilterId("all");
                          setTechFilter("");
                          setLateOnly(false);
                          setReplacementFilter("all");
                          setPlaneadoInicioDe("");
                          setPlaneadoInicioAte("");
                          setPlaneadoFimDe("");
                          setPlaneadoFimAte("");
                        }}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        Limpar Filtros
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                    <input
                      type="date"
                      value={planeadoInicioDe}
                      onChange={(e) => setPlaneadoInicioDe(e.target.value)}
                      className="rounded-xl border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-sm py-2"
                      title="Planeado início de"
                      aria-label="Planeado início de"
                    />
                    <input
                      type="date"
                      value={planeadoInicioAte}
                      onChange={(e) => setPlaneadoInicioAte(e.target.value)}
                      className="rounded-xl border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-sm py-2"
                      title="Planeado início até"
                      aria-label="Planeado início até"
                    />
                    <input
                      type="date"
                      value={planeadoFimDe}
                      onChange={(e) => setPlaneadoFimDe(e.target.value)}
                      className="rounded-xl border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-sm py-2"
                      title="Planeado fim de"
                      aria-label="Planeado fim de"
                    />
                    <input
                      type="date"
                      value={planeadoFimAte}
                      onChange={(e) => setPlaneadoFimAte(e.target.value)}
                      className="rounded-xl border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-sm py-2"
                      title="Planeado fim até"
                      aria-label="Planeado fim até"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-5 py-3.5 text-left font-bold text-slate-900">
                          ID / OT
                        </th>
                        <th className="px-5 py-3.5 text-left font-bold text-slate-900">
                          Estado
                        </th>
                        <th className="px-5 py-3.5 text-left font-bold text-slate-900">
                          Prioridade
                        </th>
                        <th className="px-5 py-3.5 text-left font-bold text-slate-900">
                          Técnico
                        </th>
                        <th className="px-5 py-3.5 text-left font-bold text-slate-900">
                          Intervenção / Ativo
                        </th>
                        <th className="px-5 py-3.5 text-left font-bold text-slate-900">
                          Cliente
                        </th>
                        <th className="px-5 py-3.5 text-left font-bold text-slate-900">
                          Agendamento
                        </th>
                        <th className="px-5 py-3.5 text-right font-bold text-slate-900">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {loading ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-5 py-12 text-center text-slate-500"
                          >
                            <div className="flex justify-center items-center gap-3">
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent"></div>
                              <span className="font-medium">
                                A sincronizar com a base de dados...
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : visibleOrders.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-5 py-16 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
                              <svg
                                className="h-8 w-8 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                />
                              </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">
                              Sem ordens encontradas
                            </h3>
                            <p className="mt-1 text-slate-500">
                              Altere os filtros ou crie uma nova ordem de
                              serviço.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        visibleOrders.map((order) => {
                          const isLate = isOrderLate(order, new Date());
                          const isCrit =
                            order.prioridade.toLowerCase() === "critica" ||
                            order.prioridade.toLowerCase() === "crítica";
                          const inspectionSummary =
                            order.latestInspectionSummary;
                          const inspectionContext = Array.isArray(
                            order.latestInspectionContext,
                          )
                            ? order.latestInspectionContext
                            : [];

                          return (
                            <tr
                              key={order.id}
                              className="transition-colors hover:bg-slate-50 group"
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`h-2 w-2 rounded-full ${isLate ? "bg-red-500" : isOrderClosed(order.status) ? "bg-emerald-500" : "bg-cyan-500"}`}
                                  ></span>
                                  <div className="font-bold text-slate-900 whitespace-nowrap">
                                    {order.numeroOrdem}
                                  </div>
                                </div>
                                {order.grupoNumeroOrdem && (
                                  <div className="ml-4 mt-0.5 text-[11px] font-medium tracking-wide text-slate-500">
                                    GRUPO: {order.grupoNumeroOrdem}
                                  </div>
                                )}
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex flex-col gap-1.5 items-start">
                                  <span
                                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset ${
                                      order.status.toLowerCase() === "pendente"
                                        ? "bg-slate-50 text-slate-600 ring-slate-500/20"
                                        : order.status.toLowerCase() ===
                                              "em_progresso" ||
                                            order.status.toLowerCase() ===
                                              "em progresso"
                                          ? "bg-blue-50 text-blue-700 ring-blue-600/20"
                                          : isOrderClosed(order.status)
                                            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                            : "bg-cyan-50 text-cyan-700 ring-cyan-600/20"
                                    }`}
                                  >
                                    {order.status
                                      .toUpperCase()
                                      .replace("_", " ")}
                                  </span>
                                  {isLate && (
                                    <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-600/20">
                                      ATRASADA
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                {isCrit ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-red-700 bg-red-50 text-xs font-bold ring-1 ring-inset ring-red-600/20">
                                    ⚡ CRÍTICA
                                  </span>
                                ) : (
                                  <span className="text-slate-600 font-medium capitalize text-xs bg-slate-100 px-2 py-1 rounded ring-1 ring-inset ring-slate-200">
                                    {order.prioridade || "Normal"}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  {order.tecnicoResponsavel ? (
                                    <>
                                      <div className="h-6 w-6 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center text-[10px] font-bold ring-1 ring-cyan-200">
                                        {order.tecnicoResponsavel
                                          .substring(0, 2)
                                          .toUpperCase()}
                                      </div>
                                      <span className="font-medium text-slate-900">
                                        {order.tecnicoResponsavel}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-slate-400 italic font-medium">
                                      Não atribuído
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-4 max-w-[200px]">
                                {(() => {
                                  const jangadas = getOrderJangadas(order);
                                  const first =
                                    jangadas[0] || order.jangada || null;
                                  return (
                                    <div className="truncate">
                                      <div className="font-bold text-slate-900 truncate">
                                        {order.tipo
                                          ?.replace("_", " ")
                                          .toUpperCase() || "INTERVENÇÃO"}
                                      </div>
                                      <div className="mt-0.5 text-xs text-slate-500 truncate">
                                        {jangadas.length > 1
                                          ? `${jangadas.length} equipamentos vinculados`
                                          : first
                                            ? `${first.brand || ""} ${first.model || ""} - SN: ${first.serial || "N/A"}`.trim()
                                            : "Ativo não especificado"}
                                      </div>
                                      <div className="mt-2 flex flex-wrap gap-1.5">
                                        <span className="inline-flex items-center rounded-full bg-cyan-50 px-2 py-1 text-[11px] font-semibold text-cyan-700 ring-1 ring-cyan-200">
                                          {inspectionSummary?.historyCount
                                            ? `${inspectionSummary.historyCount} com histórico`
                                            : "Sem histórico"}
                                        </span>
                                        <span
                                          className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${getInspectionStatusTone(Number(inspectionSummary?.replacementCount || 0))}`}
                                        >
                                          {Number(
                                            inspectionSummary?.replacementCount ||
                                              0,
                                          )}{" "}
                                          substituições
                                        </span>
                                        {Number(
                                          inspectionSummary?.replacementCount ||
                                            0,
                                        ) > 0 ? (
                                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
                                            Última inspeção com trocas
                                          </span>
                                        ) : null}
                                      </div>
                                      {inspectionContext.length > 0 ? (
                                        <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                                          {inspectionContext
                                            .slice(0, 2)
                                            .map((item) => (
                                              <div
                                                key={`${order.id}-${item.jangadaId || item.serial}`}
                                                className="truncate"
                                              >
                                                <span className="font-semibold text-slate-600">
                                                  {item.serial || "Sem serial"}
                                                </span>
                                                {" · "}
                                                {item.dataInspecao
                                                  ? `insp. ${formatDate(item.dataInspecao)}`
                                                  : "sem inspeção"}
                                                {item.certificadoNumero
                                                  ? ` · ${item.certificadoNumero}`
                                                  : ""}
                                                {Number(
                                                  item.artigosSubstituidosCount ||
                                                    0,
                                                ) > 0
                                                  ? ` · ${item.artigosSubstituidosCount} art.`
                                                  : ""}
                                              </div>
                                            ))}
                                          {inspectionContext.length > 2 ? (
                                            <div className="text-[11px] text-slate-400">
                                              +{inspectionContext.length - 2}{" "}
                                              jangada(s) com contexto
                                            </div>
                                          ) : null}
                                        </div>
                                      ) : null}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="px-5 py-4">
                                <span className="font-medium text-slate-700">
                                  {order.cliente?.nome || "—"}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <div className="text-slate-900 font-medium">
                                  {formatDate(order.dataPlaneadaInicio)}
                                </div>
                                <div
                                  className="text-xs text-slate-500"
                                  title="Data/Prazo Final"
                                >
                                  {"→ " +
                                    formatDate(
                                      order.dataPlaneadaFim ||
                                        order.dataPrevista,
                                    )}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex flex-col items-end gap-2">
                                  <Link
                                    href={`/ordens-servico/${order.id}`}
                                    className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 transition-all hover:bg-slate-50 group-hover:ring-cyan-400 group-hover:text-cyan-700"
                                  >
                                    Abrir Detalhes
                                  </Link>
                                  {order.jangada?.id ? (
                                    <Link
                                      href={`/jangadas/${order.jangada.id}`}
                                      className="text-[11px] font-semibold text-cyan-700 hover:underline"
                                    >
                                      Abrir ficha da jangada
                                    </Link>
                                  ) : null}
                                  {order.jangada?.id ? (
                                    <Link
                                      href={`${OT_CREATION_ROUTE}?jangadaId=${order.jangada.id}${order.shipId ? `&shipId=${order.shipId}` : ""}`}
                                      className="text-[11px] font-semibold text-emerald-700 hover:underline"
                                    >
                                      Nova OT pré-preenchida
                                    </Link>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
