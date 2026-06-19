"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Station = {
  id: number;
  codigo: string;
  nome: string;
  empresa: string | null;
  localizacao: string | null;
  territorioTipo: string | null;
  regiaoOperacional: string | null;
};

type ActiveStationPayload = {
  activeStationId: number | null;
  activeStation: Station | null;
  availableStations: Station[];
  canSelectStation: boolean;
  canViewAllStations: boolean;
  profile?: {
    label?: string;
  } | null;
};

type QueueStatus = "aguardar" | "agendada" | "progresso" | "a_secar" | "finalizada";
type BoardColumnKey = "aguardar" | "agendada" | "progresso" | "finalizada" | "entregues";
type DeliveryMethod = "cliente" | "transitario" | "navio";
type WorkflowStatus =
  | "entrada_estacao"
  | "agendada"
  | "em_inspecao"
  | "secagem"
  | "finalizada"
  | string;

type ServiceStationQueueItem = {
  queueId: number;
  raftId: number;
  serviceStationId: number | null;
  serviceStation?: {
    id: number;
    codigo?: string | null;
    nome?: string | null;
  } | null;
  serial: string;
  model: string;
  shipName: string;
  tecnico?: string;
  observacao?: string;
  status: QueueStatus;
  workflowStatus?: WorkflowStatus | null;
  arrivedViaForwarder?: boolean;
  arrivalDate?: string;
  readyForDelivery?: boolean;
  deliveryMethod?: DeliveryMethod | null;
  saoMiguelPortCall?: string | null;
  delivered?: boolean;
  deliveredAt?: string | null;
  receivedAt?: string;
  scheduledAt?: string;
  startedAt?: string;
  finishedAt?: string;
  expectedDeliveryDate?: string | null;
  ordemServicoId?: number | null;
  numeroOrdem?: string;
  ordemStatus?: string | null;
  updatedAt?: string;
};

type RaftOption = {
  id: number;
  serial: string;
  brand?: string | null;
  model?: string | null;
  linkedShipName?: string | null;
  shipNameManual?: string | null;
  owner?: string | null;
  status?: string | null;
  serviceStationId?: number | null;
  capacity?: number | null;
  receivedAt?: string | null;
  serviceStation?: {
    id: number;
    codigo?: string | null;
    nome?: string | null;
  } | null;
};

type TecnicoOption = {
  id: number;
  nome: string;
  email?: string | null;
  ativo?: boolean;
  serviceStationId?: number | null;
};

type TecnicosPayload = {
  activeStationId: number | null;
  stations: Array<{
    id: number;
    nome: string;
    tecnicos: TecnicoOption[];
  }>;
  unassigned?: TecnicoOption[];
};

const STATUS_LABELS: Record<QueueStatus, string> = {
  aguardar: "Aguardar inspeção",
  agendada: "Agendada",
  progresso: "Em inspeção",
  a_secar: "Secagem",
  finalizada: "Pronta para entrega",
};

const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  cliente: "Entregar ao cliente",
  transitario: "Entregar ao transitário",
  navio: "Entregar no navio",
};

const STATUS_BADGE_CLASSES: Record<QueueStatus, string> = {
  aguardar: "border-slate-300 bg-slate-100 text-slate-700",
  agendada: "border-blue-200 bg-blue-100 text-blue-700",
  progresso: "border-amber-200 bg-amber-100 text-amber-700",
  a_secar: "border-cyan-200 bg-cyan-100 text-cyan-700",
  finalizada: "border-emerald-200 bg-emerald-100 text-emerald-700",
};

const BOARD_COLUMNS: Array<{
  status: BoardColumnKey;
  title: string;
  description: string;
  accent: string;
}> = [
  {
    status: "aguardar",
    title: "A aguardar",
    description: "Receções prontas para entrar em bancada.",
    accent: "from-slate-700 to-slate-600",
  },
  {
    status: "agendada",
    title: "Agendadas",
    description: "Com plano e técnico definido.",
    accent: "from-blue-700 to-indigo-700",
  },
  {
    status: "progresso",
    title: "Em inspeção",
    description: "Trabalho em curso, incluindo secagem e validações intermédias.",
    accent: "from-amber-600 to-orange-600",
  },
  {
    status: "finalizada",
    title: "Prontas para entrega",
    description: "Inspeção concluída, já sincronizada com a logística para saída.",
    accent: "from-emerald-700 to-teal-700",
  },
  {
    status: "entregues",
    title: "Entregues",
    description: "Fecho logístico confirmado com data real de entrega.",
    accent: "from-violet-700 to-fuchsia-700",
  },
];

function normalizeSearchText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getRaftShipLabel(raft: Partial<RaftOption>) {
  return raft.linkedShipName || raft.shipNameManual || raft.owner || "Sem navio";
}

function getRaftDisplayLabel(raft: Partial<RaftOption>) {
  return `${raft.serial || "Sem serial"} · ${getRaftShipLabel(raft)} · ${`${raft.brand || ""} ${raft.model || ""}`.trim() || "Modelo não definido"}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function isToday(value?: string | null) {
  if (!value) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  const now = new Date();
  return parsed.getDate() === now.getDate() && parsed.getMonth() === now.getMonth() && parsed.getFullYear() === now.getFullYear();
}

function daysUntil(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startTarget = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  return Math.round((startTarget.getTime() - startToday.getTime()) / (1000 * 60 * 60 * 24));
}

function getExpectedDeliveryTone(value?: string | null) {
  const diff = daysUntil(value);
  if (diff === null) return "text-slate-500";
  if (diff < 0) return "text-rose-700";
  if (diff <= 3) return "text-amber-700";
  return "text-emerald-700";
}

function getExpectedDeliveryMeta(value?: string | null) {
  const diff = daysUntil(value);

  if (diff === null) {
    return {
      label: "Sem prazo",
      className: "border-slate-200 bg-slate-100 text-slate-600",
    };
  }

  if (diff < 0) {
    return {
      label: `${Math.abs(diff)}d em atraso`,
      className: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  if (diff === 0) {
    return {
      label: "Entrega hoje",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (diff <= 3) {
    return {
      label: `${diff}d restantes`,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: `${diff}d restantes`,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

function getBoardStatusPresentation(item: ServiceStationQueueItem) {
  if (item.delivered) {
    return {
      label: "Entregue",
      className: "border-violet-200 bg-violet-100 text-violet-700",
    };
  }

  return {
    label: STATUS_LABELS[item.status],
    className: STATUS_BADGE_CLASSES[item.status],
  };
}

function getNextStatusAction(status: QueueStatus) {
  if (status === "aguardar") return { next: "agendada" as const, label: "Agendar" };
  if (status === "agendada") return { next: "progresso" as const, label: "Iniciar" };
  if (status === "progresso") return { next: "a_secar" as const, label: "Passar a secagem" };
  if (status === "a_secar") return { next: "finalizada" as const, label: "Concluir inspeção" };
  return null;
}

function getPreviousStatusAction(status: QueueStatus) {
  if (status === "agendada") return { prev: "aguardar" as const, label: "Voltar a aguardar" };
  if (status === "progresso") return { prev: "agendada" as const, label: "Voltar a agendada" };
  if (status === "a_secar") return { prev: "progresso" as const, label: "Voltar à inspeção" };
  if (status === "finalizada") return { prev: "a_secar" as const, label: "Reabrir trabalho" };
  return null;
}

async function safeJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return [] as T;
  return JSON.parse(text) as T;
}

function KpiCard({
  title,
  value,
  helper,
  tone,
}: {
  title: string;
  value: string | number;
  helper: string;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-2 text-xs text-slate-600">{helper}</p>
    </div>
  );
}

export default function EstacaoServicoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [loading, setLoading] = useState(true);
  const [savingStation, setSavingStation] = useState(false);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueSaving, setQueueSaving] = useState(false);
  const [tecnicosLoading, setTecnicosLoading] = useState(false);
  const [data, setData] = useState<ActiveStationPayload | null>(null);
  const [queueItems, setQueueItems] = useState<ServiceStationQueueItem[]>([]);
  const [rafts, setRafts] = useState<RaftOption[]>([]);
  const [tecnicos, setTecnicos] = useState<TecnicoOption[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [raftsSearch, setRaftsSearch] = useState("");
  const [raftQuickSearch, setRaftQuickSearch] = useState("");
  const [boardSearch, setBoardSearch] = useState("");
  const [boardTecnicoFilter, setBoardTecnicoFilter] = useState("todos");
  const [boardOnlyUrgent, setBoardOnlyUrgent] = useState(false);
  const [boardOnlyReady, setBoardOnlyReady] = useState(false);
  const [selectedRaftId, setSelectedRaftId] = useState("");
  const [entryTecnico, setEntryTecnico] = useState("");
  const [entryObservacao, setEntryObservacao] = useState("");
  const [entryExpectedDeliveryDate, setEntryExpectedDeliveryDate] = useState("");
  const [activeTab, setActiveTab] = useState<"board" | "table" | "list">("board");
  const [isReceptionModalOpen, setIsReceptionModalOpen] = useState(false);
  const [draggedQueueId, setDraggedQueueId] = useState<number | null>(null);

  const fetchActiveStation = async () => {
    const res = await fetch("/api/active-service-station", { cache: "no-store" });
    if (!res.ok) {
      const payload = await safeJson<{ error?: string }>(res).catch(() => null);
      throw new Error(payload?.error || "Falha ao ler estação ativa.");
    }
    const payload = await safeJson<ActiveStationPayload>(res);
    setData(payload);
    return payload;
  };

  const loadStationQueueAndRafts = async () => {
    setQueueLoading(true);
    try {
      const [queueRes, raftsRes] = await Promise.all([
        fetch("/api/service-station", { cache: "no-store" }),
        fetch("/api/jangadas?scope=all", { cache: "no-store" }),
      ]);

      if (!queueRes.ok) {
        const payload = await safeJson<{ error?: string }>(queueRes).catch(() => null);
        throw new Error(payload?.error || "Falha ao carregar a fila da estação.");
      }

      if (!raftsRes.ok) {
        const payload = await safeJson<{ error?: string }>(raftsRes).catch(() => null);
        throw new Error(payload?.error || "Falha ao carregar jangadas.");
      }

      const queuePayload = await safeJson<ServiceStationQueueItem[]>(queueRes);
      const raftsPayload = await safeJson<RaftOption[]>(raftsRes);
      setQueueItems(Array.isArray(queuePayload) ? queuePayload : []);
      setRafts(Array.isArray(raftsPayload) ? raftsPayload : []);
    } catch (err: any) {
      setError(err?.message || "Não foi possível carregar os dados da estação.");
    } finally {
      setQueueLoading(false);
    }
  };

  const loadTecnicos = async () => {
    setTecnicosLoading(true);
    try {
      const res = await fetch("/api/tecnicos?includeInactive=false", { cache: "no-store" });
      if (!res.ok) {
        const payload = await safeJson<{ error?: string }>(res).catch(() => null);
        throw new Error(payload?.error || "Falha ao carregar técnicos.");
      }

      const payload = await safeJson<TecnicosPayload>(res);
      const unique = new Map<number, TecnicoOption>();

      const pushTech = (tech?: TecnicoOption | null) => {
        if (!tech?.id || !tech?.nome) return;
        unique.set(tech.id, tech);
      };

      if (payload.activeStationId) {
        payload.stations.find((station) => station.id === payload.activeStationId)?.tecnicos.forEach(pushTech);
      } else {
        payload.stations.forEach((station) => station.tecnicos.forEach(pushTech));
        (payload.unassigned || []).forEach(pushTech);
      }

      setTecnicos(
        Array.from(unique.values()).sort((a, b) =>
          String(a.nome || "").localeCompare(String(b.nome || ""), "pt", { sensitivity: "base" }),
        ),
      );
    } catch (err: any) {
      setError(err?.message || "Não foi possível carregar técnicos.");
    } finally {
      setTecnicosLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        await Promise.all([fetchActiveStation(), loadStationQueueAndRafts(), loadTecnicos()]);
      } catch (err: any) {
        if (active) setError(err?.message || "Falha ao carregar a estação de serviço.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleSelectStation = async (stationId: number | null) => {
    setSavingStation(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/active-service-station", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId }),
      });

      if (!res.ok) {
        const payload = await safeJson<{ error?: string }>(res).catch(() => null);
        throw new Error(payload?.error || "Erro ao selecionar a estação.");
      }

      await Promise.all([fetchActiveStation(), loadStationQueueAndRafts(), loadTecnicos()]);
      setSuccess(stationId ? "Estação ativa atualizada." : "Visão global ativada.");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Não foi possível trocar a estação.");
    } finally {
      setSavingStation(false);
    }
  };

  const queueByRaftId = useMemo(() => {
    const activeQueue = new Map<number, ServiceStationQueueItem>();
    for (const item of queueItems) {
      if (!item.delivered) {
        activeQueue.set(item.raftId, item);
      }
    }
    return activeQueue;
  }, [queueItems]);

  const activeQueueCount = useMemo(
    () => queueItems.filter((item) => !item.delivered).length,
    [queueItems],
  );

  const availableRafts = useMemo(() => {
    return rafts
      .filter((raft) => !queueByRaftId.has(raft.id))
      .sort((a, b) => getRaftDisplayLabel(a).localeCompare(getRaftDisplayLabel(b), "pt", { sensitivity: "base" }));
  }, [queueByRaftId, rafts]);

  const selectedRaft = useMemo(
    () => availableRafts.find((raft) => String(raft.id) === String(selectedRaftId)) || null,
    [availableRafts, selectedRaftId],
  );

  const filteredAvailableRafts = useMemo(() => {
    const term = normalizeSearchText(raftQuickSearch);
    if (!term) return availableRafts;

    return availableRafts
      .filter((raft) => {
        const serial = normalizeSearchText(raft.serial);
        const ship = normalizeSearchText(getRaftShipLabel(raft));
        const brandModel = normalizeSearchText(`${raft.brand || ""} ${raft.model || ""}`);
        const owner = normalizeSearchText(raft.owner);
        return serial.includes(term) || ship.includes(term) || brandModel.includes(term) || owner.includes(term);
      })
      .sort((a, b) => getRaftDisplayLabel(a).localeCompare(getRaftDisplayLabel(b), "pt", { sensitivity: "base" }));
  }, [availableRafts, raftQuickSearch]);

  const filteredRafts = useMemo(() => {
    const term = normalizeSearchText(raftsSearch);
    const visible = rafts;
    if (!term) return visible;

    return visible.filter((raft) => {
      const serial = normalizeSearchText(raft.serial);
      const ship = normalizeSearchText(getRaftShipLabel(raft));
      const brandModel = normalizeSearchText(`${raft.brand || ""} ${raft.model || ""}`);
      const station = normalizeSearchText(raft.serviceStation?.nome || "");
      return serial.includes(term) || ship.includes(term) || brandModel.includes(term) || station.includes(term);
    });
  }, [rafts, raftsSearch]);

  const filteredQueueItems = useMemo(() => {
    const term = normalizeSearchText(boardSearch);

    return queueItems.filter((item) => {
      if (boardTecnicoFilter !== "todos" && normalizeSearchText(item.tecnico) !== normalizeSearchText(boardTecnicoFilter)) {
        return false;
      }

      if (boardOnlyUrgent && ((daysUntil(item.expectedDeliveryDate) ?? 999) > 3 || item.delivered)) {
        return false;
      }

      if (boardOnlyReady && !(item.readyForDelivery || item.status === "finalizada")) {
        return false;
      }

      if (!term) return true;

      const haystack = [
        item.serial,
        item.shipName,
        item.model,
        item.tecnico,
        item.numeroOrdem,
        item.observacao,
        STATUS_LABELS[item.status],
      ]
        .map((value) => normalizeSearchText(value))
        .join(" ");

      return haystack.includes(term);
    });
  }, [boardOnlyReady, boardOnlyUrgent, boardSearch, boardTecnicoFilter, queueItems]);

  const boardFilterIsActive = Boolean(boardSearch || boardTecnicoFilter !== "todos" || boardOnlyUrgent || boardOnlyReady);

  useEffect(() => {
    if (!selectedRaftId) return;
    if (!availableRafts.some((raft) => String(raft.id) === String(selectedRaftId))) {
      setSelectedRaftId("");
    }
  }, [availableRafts, selectedRaftId]);

  const boardItems = useMemo(() => {
    return BOARD_COLUMNS.map((column) => ({
      ...column,
      items: filteredQueueItems.filter((item) => {
        if (column.status === "entregues") {
          return item.delivered;
        }

        if (item.delivered) {
          return false;
        }

        if (column.status === "progresso") {
          return item.status === "progresso" || item.status === "a_secar";
        }

        return item.status === column.status;
      }),
    }));
  }, [filteredQueueItems]);

  const waitingInspectionCount = useMemo(
    () => queueItems.filter((item) => item.status === "aguardar").length,
    [queueItems],
  );
  const scheduledCount = useMemo(
    () => queueItems.filter((item) => item.status === "agendada").length,
    [queueItems],
  );
  const runningCount = useMemo(
    () => queueItems.filter((item) => item.status === "progresso" || item.status === "a_secar").length,
    [queueItems],
  );
  const completedCount = useMemo(
    () => queueItems.filter((item) => !item.delivered && item.status === "finalizada").length,
    [queueItems],
  );
  const deliveredCount = useMemo(
    () => queueItems.filter((item) => item.delivered).length,
    [queueItems],
  );
  const todayReceiptsCount = useMemo(
    () => queueItems.filter((item) => isToday(item.receivedAt)).length,
    [queueItems],
  );
  const urgentDeliveryCount = useMemo(
    () => queueItems.filter((item) => !item.delivered && (daysUntil(item.expectedDeliveryDate) ?? 999) <= 3).length,
    [queueItems],
  );
  const overdueDeliveryCount = useMemo(
    () => queueItems.filter((item) => !item.delivered && (daysUntil(item.expectedDeliveryDate) ?? 999) < 0).length,
    [queueItems],
  );
  const readyForDeliveryCount = useMemo(
    () => queueItems.filter((item) => !item.delivered && (item.readyForDelivery || item.status === "finalizada")).length,
    [queueItems],
  );

  const canReceiveOnCurrentContext = Boolean(data?.activeStationId || data?.activeStation || !data?.canViewAllStations);

  const handlePickRaft = (raft: RaftOption) => {
    setSelectedRaftId(String(raft.id));
    setRaftQuickSearch(getRaftDisplayLabel(raft));
  };

  const clearSelectedRaft = () => {
    setSelectedRaftId("");
    setRaftQuickSearch("");
  };

  const handleAddToQueue = async () => {
    const raftId = Number(selectedRaftId);
    if (!raftId || Number.isNaN(raftId)) return;

    setQueueSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/service-station", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raftId,
          status: "aguardar",
          tecnico: entryTecnico || undefined,
          observacao: entryObservacao || undefined,
          expectedDeliveryDate: entryExpectedDeliveryDate || undefined,
        }),
      });

      if (!res.ok) {
        const payload = await safeJson<{ error?: string }>(res).catch(() => null);
        throw new Error(payload?.error || "Falha ao rececionar jangada.");
      }

      clearSelectedRaft();
      setEntryTecnico("");
      setEntryObservacao("");
      setEntryExpectedDeliveryDate("");
      setIsReceptionModalOpen(false);
      await loadStationQueueAndRafts();
      setSuccess("Jangada rececionada com sucesso.");
    } catch (err: any) {
      setError(err?.message || "Não foi possível rececionar a jangada.");
    } finally {
      setQueueSaving(false);
    }
  };

  const handleUpdateQueueStatus = async (item: ServiceStationQueueItem, nextStatus: QueueStatus) => {
    if (item.status === nextStatus) return;

    setQueueSaving(true);
    setError("");
    setSuccess("");

    try {
      const nowIso = new Date().toISOString();
      const body: Record<string, unknown> = { id: item.queueId, status: nextStatus };

      if (nextStatus === "agendada" && !item.scheduledAt) body.scheduledAt = nowIso;
      if (nextStatus === "progresso" && !item.startedAt) body.startedAt = nowIso;
      if (nextStatus === "finalizada") body.finishedAt = nowIso;

      const res = await fetch("/api/service-station", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const payload = await safeJson<{ error?: string }>(res).catch(() => null);
        throw new Error(payload?.error || "Falha ao atualizar estado.");
      }

      await loadStationQueueAndRafts();
      setSuccess(`Estado atualizado para ${STATUS_LABELS[nextStatus].toLowerCase()}.`);
    } catch (err: any) {
      setError(err?.message || "Não foi possível atualizar o estado.");
    } finally {
      setQueueSaving(false);
    }
  };

  const handleRemoveFromQueue = async (queueId: number) => {
    setQueueSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/service-station?id=${queueId}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await safeJson<{ error?: string }>(res).catch(() => null);
        throw new Error(payload?.error || "Falha ao remover entrada.");
      }

      await loadStationQueueAndRafts();
      setSuccess("Entrada removida da estação.");
    } catch (err: any) {
      setError(err?.message || "Não foi possível remover a entrada.");
    } finally {
      setQueueSaving(false);
    }
  };

  const handleDrop = async (e: React.DragEvent, status: QueueStatus) => {
    e.preventDefault();
    if (!draggedQueueId) return;
    const item = queueItems.find(q => q.queueId === draggedQueueId);
    if (item && item.status !== status && !item.delivered) {
      await handleUpdateQueueStatus(item, status);
    }
    setDraggedQueueId(null);
  };

  const selectedStationTitle = data?.activeStation
    ? `${data.activeStation.codigo} · ${data.activeStation.nome}`
    : data?.canViewAllStations
      ? "Vista global · todas as estações"
      : "Estação ativa";

  const backTarget = callbackUrl && callbackUrl !== "/estacao-servico" ? callbackUrl : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="app-hero-panel mb-6 overflow-hidden rounded-3xl text-white">
          <div className="grid gap-6 px-5 py-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.9fr)] lg:px-8 lg:py-8">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/90">
                <span>Estação de Serviço</span>
                <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] normal-case tracking-normal text-white">
                  {data?.profile?.label || "Operação ativa"}
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Receção, bancada e saída sem perder o fio à meada</h1>
              <p className="mt-3 max-w-3xl text-sm text-sky-50 sm:text-base">
                O fluxo ficou mais direto: selecionar estação, encontrar jangada pelo navio, rececionar em segundos e mover o trabalho pelo quadro.
                Menos tabela de castigo, mais cockpit operacional.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="app-hero-card rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-wide text-sky-50">Fila ativa</p>
                  <p className="mt-1 text-3xl font-bold">{activeQueueCount}</p>
                  <p className="mt-1 text-xs text-sky-50/90">Entradas em trabalho, sem misturar histórico já entregue.</p>
                </div>
                <div className="app-hero-card rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-wide text-sky-50">A aguardar inspeção</p>
                  <p className="mt-1 text-3xl font-bold">{waitingInspectionCount}</p>
                  <p className="mt-1 text-xs text-sky-50/90">Fila pronta para entrar em ação.</p>
                </div>
                <div className="app-hero-card rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-wide text-sky-50">Disponíveis para receção</p>
                  <p className="mt-1 text-3xl font-bold">{availableRafts.length}</p>
                  <p className="mt-1 text-xs text-sky-50/90">Jangadas livres para entrar na estação.</p>
                </div>
              </div>
            </div>

            <div className="app-hero-card rounded-3xl p-5">
              <p className="text-sm font-semibold text-white">Pulso rápido</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="app-hero-card-soft rounded-2xl px-4 py-3">
                  <p className="text-sky-50">Estação ativa</p>
                  <p className="mt-1 text-base font-semibold text-white">{selectedStationTitle}</p>
                  <p className="mt-1 text-xs text-sky-50/80">{data?.activeStation?.localizacao || (data?.canViewAllStations ? "Visão transversal" : "Sem localização definida")}</p>
                </div>
                <div className="app-hero-card-soft rounded-2xl px-4 py-3">
                  <p className="text-sky-50">Receções hoje</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{todayReceiptsCount}</p>
                  <p className="mt-1 text-xs text-sky-50/80">Movimento registado no dia atual.</p>
                </div>
                <div className="app-hero-card-soft rounded-2xl px-4 py-3">
                  <p className="text-sky-50">Entregas urgentes</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{urgentDeliveryCount}</p>
                  <p className="mt-1 text-xs text-sky-50/80">Saída prevista até 3 dias.</p>
                </div>
                <div className="app-hero-card-soft rounded-2xl px-4 py-3">
                  <p className="text-sky-50">Prontas para entrega</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{readyForDeliveryCount}</p>
                  <p className="mt-1 text-xs text-sky-50/80">Sinalizadas na componente logística.</p>
                </div>
                <div className="app-hero-card-soft rounded-2xl px-4 py-3">
                  <p className="text-sky-50">Entregues</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{deliveredCount}</p>
                  <p className="mt-1 text-xs text-sky-50/80">Saída confirmada com data real de fecho.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
        ) : null}
        {success ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>
        ) : null}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <KpiCard title="A aguardar" value={waitingInspectionCount} helper="Receções ainda sem arranque." tone="border-slate-200 bg-white" />
          <KpiCard title="Agendadas" value={scheduledCount} helper="Com plano de trabalho definido." tone="border-blue-200 bg-blue-50" />
          <KpiCard title="Em curso" value={runningCount} helper="Inspeção ativa, incluindo secagem interna." tone="border-amber-200 bg-amber-50" />
          <KpiCard title="Prontas para entrega" value={completedCount} helper="Inspeção concluída e à espera de saída." tone="border-emerald-200 bg-emerald-50" />
          <KpiCard title="Entregues" value={deliveredCount} helper="Fecho confirmado na logística." tone="border-violet-200 bg-violet-50" />
          <KpiCard title="Técnicos disponíveis" value={tecnicos.length} helper="Lista carregada para atribuição rápida." tone="border-violet-200 bg-violet-50" />
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Contexto operacional</h2>
              <p className="mt-1 text-sm text-slate-500">Troca de estação sem sair do cockpit. Porque abrir outro ecrã para isto seria só cardio digital.</p>
            </div>
            {backTarget ? (
              <button
                type="button"
                onClick={() => router.push(backTarget)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Voltar
              </button>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {data?.canViewAllStations ? (
              <button
                type="button"
                disabled={savingStation}
                onClick={() => void handleSelectStation(null)}
                className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                  data.activeStationId === null
                    ? "border border-blue-600 bg-blue-600 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                } ${savingStation ? "opacity-50" : ""}`}
              >
                Todas as estações
              </button>
            ) : null}

            {(data?.availableStations || []).map((station) => {
              const active = data?.activeStationId === station.id;
              return (
                <button
                  key={station.id}
                  type="button"
                  disabled={savingStation}
                  onClick={() => void handleSelectStation(station.id)}
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "border border-emerald-600 bg-emerald-600 text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  } ${savingStation ? "opacity-50" : ""}`}
                >
                  {station.codigo} · {station.nome}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <button
            onClick={() => setActiveTab("board")}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === "board" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Quadro Kanban
          </button>
          <button
            onClick={() => setActiveTab("table")}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === "table" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Tabela Operacional
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === "list" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
          >
            Lista Global
          </button>
          <button
            onClick={() => setIsReceptionModalOpen(true)}
            className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            + Rececionar Jangada
          </button>
        </div>

        {activeTab === "board" && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Quadro por estados</h2>
              <p className="mt-1 text-sm text-slate-500">Fluxo alinhado com agenda, logística e ficha da jangada: execução, pronta para entrega e fecho entregue em pista separada.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {boardFilterIsActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setBoardSearch("");
                    setBoardTecnicoFilter("todos");
                    setBoardOnlyUrgent(false);
                    setBoardOnlyReady(false);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Limpar filtros
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void loadStationQueueAndRafts()}
                disabled={queueLoading || queueSaving}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Atualizar quadro
              </button>
            </div>
          </div>

          <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[minmax(0,1.2fr)_220px_auto_auto]">
            <input
              value={boardSearch}
              onChange={(event) => setBoardSearch(event.target.value)}
              placeholder="Filtrar quadro por serial, navio, modelo, técnico, OT ou nota..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            />

            <select
              value={boardTecnicoFilter}
              onChange={(event) => setBoardTecnicoFilter(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="todos">Todos os técnicos</option>
              {tecnicos.map((tecnico) => (
                <option key={tecnico.id} value={tecnico.nome}>
                  {tecnico.nome}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setBoardOnlyUrgent((value) => !value)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                boardOnlyUrgent
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Só SLA crítico
            </button>

            <button
              type="button"
              onClick={() => setBoardOnlyReady((value) => !value)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                boardOnlyReady
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Só prontas a entregar
            </button>
          </div>

          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 font-semibold text-slate-700">
              {filteredQueueItems.length} item(ns) no quadro filtrado
            </span>
            <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-semibold text-rose-700">
              {overdueDeliveryCount} em atraso
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-700">
              {urgentDeliveryCount} com SLA ≤ 3 dias
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
              {readyForDeliveryCount} prontas para entrega
            </span>
            <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 font-semibold text-violet-700">
              {deliveredCount} entregues
            </span>
          </div>

          {queueLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              A carregar quadro operacional...
            </div>
          ) : filteredQueueItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Nenhum item corresponde aos filtros atuais.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-5">
              {boardItems.map((column) => (
                <div key={column.status} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-colors duration-200 hover:bg-slate-100" onDragOver={(e) => e.preventDefault()} onDrop={(e) => void handleDrop(e, column.status as QueueStatus)}>
                  <div className={`rounded-2xl bg-gradient-to-r px-4 py-4 text-white ${column.accent}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{column.title}</p>
                        <p className="mt-1 text-xs text-white/80">{column.description}</p>
                      </div>
                      <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                        {column.items.length}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-3">
                    {column.items.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-5 text-center text-xs text-slate-500">
                        Sem itens nesta etapa.
                      </div>
                    ) : (
                      column.items.map((item) => {
                        const nextAction = item.delivered ? null : getNextStatusAction(item.status);
                        const prevAction = item.delivered ? null : getPreviousStatusAction(item.status);
                        const deliveryMeta = getExpectedDeliveryMeta(item.expectedDeliveryDate);
                        const statusPresentation = getBoardStatusPresentation(item);
                        return (
                          <div 
                            key={item.queueId} 
                            draggable={!item.delivered}
                            onDragStart={() => setDraggedQueueId(item.queueId)}
                            onDragEnd={() => setDraggedQueueId(null)}
                            className={`rounded-2xl border p-3 shadow-sm transition hover:shadow-md ${!item.delivered ? "cursor-grab active:cursor-grabbing" : ""} ${
                              (daysUntil(item.expectedDeliveryDate) ?? 999) < 0 && !item.delivered 
                                ? "border-rose-400 bg-rose-50/80 animate-pulse" 
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-slate-900">{item.serial}</p>
                                <p className="mt-1 text-sm text-slate-700 line-clamp-2">{item.shipName || "Sem navio"}</p>
                              </div>
                              <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${statusPresentation.className}`}>
                                {statusPresentation.label}
                              </span>
                            </div>

                            <div className="mt-3 grid gap-2 text-[11px] text-slate-500 sm:grid-cols-2">
                              <div className="rounded-xl bg-slate-50 px-2.5 py-2">
                                <p className="font-semibold uppercase tracking-wide text-slate-400">Modelo</p>
                                <p className="mt-1 text-slate-700">{item.model || "—"}</p>
                              </div>
                              <div className="rounded-xl bg-slate-50 px-2.5 py-2">
                                <p className="font-semibold uppercase tracking-wide text-slate-400">Técnico</p>
                                <p className="mt-1 text-slate-700">{item.tecnico || "—"}</p>
                              </div>
                              <div className="rounded-xl bg-slate-50 px-2.5 py-2 sm:col-span-2">
                                <p className="font-semibold uppercase tracking-wide text-slate-400">Receção</p>
                                <p className="mt-1 text-slate-700">{formatDateTime(item.receivedAt)}</p>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.deliveredAt ? (
                                <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700">
                                  Entregue em {formatDate(item.deliveredAt)}
                                </span>
                              ) : (
                                <>
                                  <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${deliveryMeta.className}`}>
                                    {deliveryMeta.label}
                                  </span>
                                  {item.expectedDeliveryDate ? (
                                    <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getExpectedDeliveryTone(item.expectedDeliveryDate)} border-current/10 bg-white`}>
                                      {formatDate(item.expectedDeliveryDate)}
                                    </span>
                                  ) : null}
                                </>
                              )}
                              {item.arrivedViaForwarder ? (
                                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                                  Transitário
                                </span>
                              ) : null}
                              {item.readyForDelivery ? (
                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                                  Pronta para entrega
                                </span>
                              ) : null}
                              {item.deliveryMethod ? (
                                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-1 text-[11px] font-semibold text-cyan-700">
                                  {DELIVERY_METHOD_LABELS[item.deliveryMethod]}
                                </span>
                              ) : null}
                              {item.numeroOrdem ? (
                                <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700">
                                  OT {item.numeroOrdem}
                                </span>
                              ) : null}
                            </div>

                            {item.observacao ? (
                              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                {item.observacao}
                              </div>
                            ) : null}

                            {item.status === "a_secar" && !item.delivered ? (
                              <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-medium text-cyan-800">
                                Subfase operacional: secagem em curso, mantida dentro de <span className="font-semibold">Em inspeção</span> para não partir o fluxo do quadro.
                              </div>
                            ) : null}

                            <div className="mt-4 flex flex-wrap gap-2">
                              {prevAction ? (
                                <button
                                  type="button"
                                  onClick={() => void handleUpdateQueueStatus(item, prevAction.prev)}
                                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  {prevAction.label}
                                </button>
                              ) : null}
                              {nextAction ? (
                                <button
                                  type="button"
                                  onClick={() => void handleUpdateQueueStatus(item, nextAction.next)}
                                  className="rounded-lg border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                                >
                                  {nextAction.label}
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => void handleRemoveFromQueue(item.queueId)}
                                className="rounded-lg border border-rose-300 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                              >
                                Remover
                              </button>
                              {item.ordemServicoId ? (
                                <Link
                                  href={`/ordens-servico/${item.ordemServicoId}`}
                                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  Abrir OT
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {activeTab === "table" && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Tabela operacional detalhada</h2>
              <p className="mt-1 text-sm text-slate-500">Mantida para leitura densa, export mental e conferência rápida por quem gosta de linhas alinhadas. Os clássicos nunca morrem.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{queueItems.length} registo(s)</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Serial</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Navio</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Modelo</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Técnico</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Receção</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Entrega</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">OT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredQueueItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-slate-500">Sem registos operacionais para os filtros atuais.</td>
                  </tr>
                ) : (
                  filteredQueueItems.map((item) => (
                    <tr key={`table-${item.queueId}`} className="hover:bg-slate-50/80">
                      <td className="px-3 py-3 font-semibold text-slate-900">{item.serial}</td>
                      <td className="px-3 py-3 text-slate-700">{item.shipName || "Sem navio"}</td>
                      <td className="px-3 py-3 text-slate-700">{item.model || "—"}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${STATUS_BADGE_CLASSES[item.status]}`}>
                          {STATUS_LABELS[item.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{item.tecnico || "—"}</td>
                      <td className="px-3 py-3 text-slate-600">{formatDateTime(item.receivedAt)}</td>
                      <td className={`px-3 py-3 ${getExpectedDeliveryTone(item.expectedDeliveryDate)}`}>{formatDate(item.expectedDeliveryDate)}</td>
                      <td className="px-3 py-3 text-slate-700">{item.numeroOrdem || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {activeTab === "list" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Lista global de jangadas</h2>
              <p className="mt-1 text-sm text-slate-500">Pesquisa por navio, serial, marca, modelo ou estação. A visão completa continua aqui, só mais legível.</p>
            </div>
            <div className="w-full sm:w-80">
              <input
                value={raftsSearch}
                onChange={(event) => setRaftsSearch(event.target.value)}
                placeholder="Pesquisar jangadas..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mb-3 text-xs text-slate-500">
            {filteredRafts.length} de {rafts.length} jangada(s)
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Serial</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Navio</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Marca / Modelo</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estação</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRafts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-500">Sem resultados para este filtro.</td>
                  </tr>
                ) : (
                  filteredRafts.map((raft) => (
                    <tr key={raft.id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-3 font-semibold text-slate-900">{raft.serial || "—"}</td>
                      <td className="px-3 py-3 text-slate-700">{getRaftShipLabel(raft)}</td>
                      <td className="px-3 py-3 text-slate-700">{`${raft.brand || ""} ${raft.model || ""}`.trim() || "—"}</td>
                      <td className="px-3 py-3 text-slate-700">{raft.serviceStation?.nome || "Sem estação"}</td>
                      <td className="px-3 py-3 text-slate-600">{raft.status || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

      {isReceptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-5xl my-8 bg-slate-50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-200 bg-white px-6 py-4 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Rececionar Jangada</h2>
              <button onClick={() => setIsReceptionModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center transition">✕</button>
            </div>
            <div className="p-6 overflow-y-auto">
        <div className="mb-6 grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Receção rápida</h2>
                <p className="mt-1 text-sm text-slate-500">A pesquisa inline usa navio, serial, marca e modelo. O objetivo é escolher sem abrir uma novela modal.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {availableRafts.length} disponível(eis)
              </span>
            </div>

            {!canReceiveOnCurrentContext ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                Seleciona uma estação específica para rececionar jangadas. Em vista global a API protege-te de fazer magia indevida.
              </div>
            ) : null}

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Procurar jangada</label>
                <input
                  value={raftQuickSearch}
                  onChange={(event) => {
                    setRaftQuickSearch(event.target.value);
                    if (selectedRaftId) setSelectedRaftId("");
                  }}
                  placeholder="Escreve o navio, serial, marca, modelo ou proprietário..."
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-slate-500">
                  {filteredAvailableRafts.length} jangada(s) encontrada(s) para receção rápida.
                </p>

                <div className="mt-3 max-h-[28rem] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2">
                  {filteredAvailableRafts.length === 0 ? (
                    <div className="rounded-xl bg-white px-4 py-6 text-center text-sm text-slate-500">
                      Nenhuma jangada disponível para este filtro.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredAvailableRafts.map((raft) => {
                        const isSelected = String(raft.id) === String(selectedRaftId);
                        return (
                          <button
                            key={raft.id}
                            type="button"
                            onClick={() => handlePickRaft(raft)}
                            className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 shadow-sm"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{raft.serial || "Sem serial"}</p>
                                <p className="mt-1 text-sm text-slate-700">{getRaftShipLabel(raft)}</p>
                                <p className="mt-1 text-xs text-slate-500">{`${raft.brand || ""} ${raft.model || ""}`.trim() || "Modelo não definido"}</p>
                              </div>
                              <div className="text-right text-xs text-slate-500">
                                {raft.capacity ? <p>{raft.capacity} pax</p> : null}
                                {raft.serviceStation?.nome ? <p>{raft.serviceStation.nome}</p> : null}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Seleção</p>
                {selectedRaft ? (
                  <>
                    <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                      <p className="text-lg font-bold text-slate-900">{selectedRaft.serial}</p>
                      <p className="mt-1 text-sm text-slate-700">{getRaftShipLabel(selectedRaft)}</p>
                      <p className="mt-1 text-xs text-slate-500">{`${selectedRaft.brand || ""} ${selectedRaft.model || ""}`.trim() || "Modelo não definido"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearSelectedRaft}
                      className="mt-3 text-xs font-semibold text-slate-600 underline underline-offset-2"
                    >
                      Limpar seleção
                    </button>
                  </>
                ) : (
                  <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                    Escolhe uma jangada acima para preencher a receção.
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Técnico</label>
                    <select
                      value={entryTecnico}
                      onChange={(event) => setEntryTecnico(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      disabled={tecnicosLoading}
                    >
                      <option value="">{tecnicosLoading ? "A carregar técnicos..." : "Selecionar técnico..."}</option>
                      {tecnicos.map((tecnico) => (
                        <option key={tecnico.id} value={tecnico.nome}>
                          {tecnico.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Entrega prevista</label>
                    <input
                      type="date"
                      value={entryExpectedDeliveryDate}
                      onChange={(event) => setEntryExpectedDeliveryDate(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Observação</label>
                    <textarea
                      value={entryObservacao}
                      onChange={(event) => setEntryObservacao(event.target.value)}
                      rows={4}
                      placeholder="Notas rápidas para a equipa..."
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleAddToQueue()}
                    disabled={!selectedRaftId || queueSaving || !canReceiveOnCurrentContext}
                    className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {queueSaving ? "A rececionar..." : "Rececionar jangada"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Foco imediato</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                <p className="font-semibold">A aguardar inspeção</p>
                <p className="mt-1 text-xs">{waitingInspectionCount} jangada(s) já rececionada(s) e à espera de começar.</p>
              </div>
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-cyan-900">
                <p className="font-semibold">Em execução</p>
                <p className="mt-1 text-xs">{runningCount} jangada(s) em inspeção ativa, incluindo secagem quando aplicável.</p>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
                <p className="font-semibold">SLA apertado</p>
                <p className="mt-1 text-xs">{urgentDeliveryCount} com entrega prevista em 3 dias ou menos, incluindo {overdueDeliveryCount} em atraso.</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
                <p className="font-semibold">Prontas para entrega</p>
                <p className="mt-1 text-xs">{readyForDeliveryCount} sinalizadas na componente logística.</p>
              </div>
              <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-violet-900">
                <p className="font-semibold">Entregues</p>
                <p className="mt-1 text-xs">{deliveredCount} com entrega registada e já fora da fila ativa.</p>
              </div>
            </div>
          </div>
        </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
