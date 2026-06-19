"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";

const STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "agendada", label: "Agendada" },
  { value: "confirmada", label: "Confirmada" },
  { value: "em_progresso", label: "Em progresso" },
  { value: "pausada", label: "Pausada" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "baixa", label: "Baixa" },
  { value: "normal", label: "Normal" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
] as const;

const TYPE_OPTIONS = [
  { value: "inspecao", label: "Inspeção" },
  { value: "manutencao", label: "Manutenção" },
  { value: "reparacao", label: "Reparação" },
  { value: "outro", label: "Outro" },
] as const;

type OrdemServicoDetail = {
  id: number;
  numeroOrdem: string;
  grupoNumeroOrdem?: string | null;
  tipo: string;
  prioridade: string;
  status: string;
  descricao?: string;
  tecnicoResponsavel?: string;
  slaHoras?: number | null;
  dataPlaneadaInicio?: string | null;
  dataPlaneadaFim?: string | null;
  dataAbertura?: string | null;
  dataPrevista?: string | null;
  dataInicio?: string | null;
  dataConclusao?: string | null;
  updatedAt?: string | null;
  durationMinutes?: number;
  jangadaId?: number | null;
  shipId?: number | null;
  clienteId?: number | null;
  inspecaoId?: number | null;
  metadados?: Record<string, unknown>;
  jangada?: {
    id: number;
    serial: string;
    brand?: string;
    model?: string;
    owner?: string;
    shipId?: number | null;
    shipNameManual?: string;
    numeroObra?: string;
    dataInspecao?: string;
    dataProxInspecao?: string;
  } | null;
  jangadas?: Array<{
    id: number;
    serial: string;
    brand?: string;
    model?: string;
    owner?: string;
    shipNameManual?: string;
    numeroObra?: string;
    dataInspecao?: string;
    dataProxInspecao?: string;
    shipId?: number | null;
  }>;
  cliente?: {
    id: number;
    nome: string;
    ilha?: string;
    numeroCliente?: string;
  } | null;
  inspecao?: {
    id: number;
    certificadoNumero?: string;
    dataInspecao?: string;
    dataProxInspecao?: string;
    status?: string;
  } | null;
};

type ChecklistPhase = "pre" | "intervencao" | "validacao";

type ChecklistItem = {
  id: string;
  phase: ChecklistPhase;
  label: string;
  done: boolean;
  updatedAt?: string;
  updatedBy?: string;
};

type OrdemLogEntry = {
  id?: string;
  at?: string;
  type?: string;
  message?: string;
  user?: string;
};

type TimeEntry = {
  id: string;
  tecnico?: string;
  startedAt?: string;
  endedAt?: string | null;
  durationMinutes?: number;
  notes?: string;
};

type MaterialLine = {
  id: string;
  stockId?: number;
  referencia?: string;
  descricao?: string;
  quantidadePrevista?: number;
  quantidadeUsada?: number;
  precoUnitario?: number;
  disponibilidade?: number;
  reservado?: boolean;
  consumido?: boolean;
};

type StockItem = {
  id: number;
  referencia?: string | null;
  descricao?: string | null;
  precoVenda?: number | null;
  quantidade?: number | null;
};

type JangadaOption = {
  id: number;
  serial: string;
  brand?: string | null;
  model?: string | null;
  owner?: string | null;
  shipNameManual?: string | null;
  shipId?: number | null;
};

type FormState = {
  numeroOrdem: string;
  tipo: string;
  prioridade: string;
  status: string;
  tecnicoResponsavel: string;
  slaHoras: string;
  dataPlaneadaInicio: string;
  dataPlaneadaFim: string;
  descricao: string;
  dataPrevista: string;
  dataInicio: string;
  dataConclusao: string;
  durationMinutes: string;
};

type CloseWizardStep = 1 | 2 | 3 | 4;

function toInputDate(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("pt-PT");
}

function buildDefaultChecklist(tipo?: string) {
  const isInspection = String(tipo || "").toLowerCase() === "inspecao";
  const base: ChecklistItem[] = [
    { id: "pre-1", phase: "pre", label: "Confirmar dados da OT e ativo", done: false },
    { id: "pre-2", phase: "pre", label: "Validar condições de segurança", done: false },
    { id: "int-1", phase: "intervencao", label: "Executar procedimento técnico principal", done: false },
    { id: "int-2", phase: "intervencao", label: "Registar materiais/consumos", done: false },
    { id: "val-1", phase: "validacao", label: "Validar resultado final", done: false },
    { id: "val-2", phase: "validacao", label: "Confirmar documentação e evidências", done: false },
  ];

  if (isInspection) {
    return base.map((item) => {
      if (item.id === "int-1") {
        return { ...item, label: "Executar checklist de inspeção da jangada" };
      }
      return item;
    });
  }

  return base;
}

function parseChecklist(meta?: Record<string, unknown>, tipo?: string) {
  const raw = Array.isArray(meta?.checklistItems) ? meta?.checklistItems : [];
  const parsed = raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const phaseRaw = String(row.phase || "pre").toLowerCase();
      const phase: ChecklistPhase = phaseRaw === "intervencao" || phaseRaw === "validacao" ? phaseRaw : "pre";
      const label = String(row.label || "").trim();
      if (!label) return null;
      return {
        id: String(row.id || `custom-${index + 1}`),
        phase,
        label,
        done: Boolean(row.done),
        updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
        updatedBy: row.updatedBy ? String(row.updatedBy) : undefined,
      } satisfies ChecklistItem;
    })
    .filter(Boolean) as ChecklistItem[];

  return parsed.length > 0 ? parsed : buildDefaultChecklist(tipo);
}

function parseLogs(meta?: Record<string, unknown>) {
  const raw = Array.isArray(meta?.logs) ? meta?.logs : [];
  const parsed = raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      return {
        id: row.id ? String(row.id) : undefined,
        at: row.at ? String(row.at) : undefined,
        type: row.type ? String(row.type) : undefined,
        message: row.message ? String(row.message) : undefined,
        user: row.user ? String(row.user) : undefined,
      } satisfies OrdemLogEntry;
    })
    .filter((entry) => entry && entry.message) as OrdemLogEntry[];

  return parsed.sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime());
}

function parseTimeEntries(meta?: Record<string, unknown>) {
  const raw = Array.isArray(meta?.timeEntries) ? meta.timeEntries : [];
  return raw
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      return {
        id: String(row.id || `tempo-${index + 1}`),
        tecnico: row.tecnico ? String(row.tecnico) : undefined,
        startedAt: row.startedAt ? String(row.startedAt) : undefined,
        endedAt: row.endedAt ? String(row.endedAt) : null,
        durationMinutes: Number(row.durationMinutes || 0),
        notes: row.notes ? String(row.notes) : undefined,
      } satisfies TimeEntry;
    })
    .filter(Boolean) as TimeEntry[];
}

function parseMaterials(meta?: Record<string, unknown>) {
  const raw = Array.isArray(meta?.materials) ? meta.materials : [];
  return raw
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      return {
        id: String(row.id || `material-${index + 1}`),
        stockId: Number.isFinite(Number(row.stockId)) ? Number(row.stockId) : undefined,
        referencia: row.referencia ? String(row.referencia) : undefined,
        descricao: row.descricao ? String(row.descricao) : undefined,
        quantidadePrevista: Number(row.quantidadePrevista || 0),
        quantidadeUsada: Number(row.quantidadeUsada || 0),
        precoUnitario: Number(row.precoUnitario || 0),
        disponibilidade: Number(row.disponibilidade || 0),
        reservado: Boolean(row.reservado),
        consumido: Boolean(row.consumido),
      } satisfies MaterialLine;
    })
    .filter(Boolean) as MaterialLine[];
}

function formatDurationMinutes(value?: number | null) {
  const total = Math.max(0, Number(value || 0));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  return `${minutes} min`;
}

export default function OrdemServicoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params && typeof params === "object" ? (params as Record<string, string | string[]>).id : undefined;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ordem, setOrdem] = useState<OrdemServicoDetail | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [materials, setMaterials] = useState<MaterialLine[]>([]);
  const [selectedJangadaIds, setSelectedJangadaIds] = useState<number[]>([]);
  const [availableJangadas, setAvailableJangadas] = useState<JangadaOption[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [timeNote, setTimeNote] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [selectedStockId, setSelectedStockId] = useState("");
  const [materialQtyPrevista, setMaterialQtyPrevista] = useState("1");
  const [materialQtyUsada, setMaterialQtyUsada] = useState("1");
  const [materialPrice, setMaterialPrice] = useState("");
  const [closeWizardStep, setCloseWizardStep] = useState<CloseWizardStep>(1);
  const [form, setForm] = useState<FormState>({
    numeroOrdem: "",
    tipo: "inspecao",
    prioridade: "normal",
    status: "pendente",
    tecnicoResponsavel: "",
    slaHoras: "",
    dataPlaneadaInicio: "",
    dataPlaneadaFim: "",
    descricao: "",
    dataPrevista: "",
    dataInicio: "",
    dataConclusao: "",
    durationMinutes: "210",
  });

  const loadOrder = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ordens-servico/${id}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Falha ao carregar OT.");

      const order = payload as OrdemServicoDetail;
      setOrdem(order);
      setChecklistItems(parseChecklist(order.metadados, order.tipo));
      setTimeEntries(parseTimeEntries(order.metadados));
      setMaterials(parseMaterials(order.metadados));
      setSelectedJangadaIds(
        Array.isArray(order.jangadas) && order.jangadas.length > 0
          ? order.jangadas.map((jangada) => jangada.id).filter(Boolean)
          : (order.jangada?.id ? [order.jangada.id] : [])
      );
      setForm({
        numeroOrdem: order.numeroOrdem || "",
        tipo: order.tipo || "inspecao",
        prioridade: order.prioridade || "normal",
        status: order.status || "pendente",
        tecnicoResponsavel: order.tecnicoResponsavel || "",
        slaHoras: order.slaHoras ? String(order.slaHoras) : "",
        dataPlaneadaInicio: toInputDate(order.dataPlaneadaInicio),
        dataPlaneadaFim: toInputDate(order.dataPlaneadaFim),
        descricao: order.descricao || "",
        dataPrevista: toInputDate(order.dataPrevista),
        dataInicio: toInputDate(order.dataInicio),
        dataConclusao: toInputDate(order.dataConclusao),
        durationMinutes: String(order.durationMinutes || 210),
      });
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Erro ao carregar OT.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrder();
  }, [id]);

  useEffect(() => {
    fetch("/api/stock?take=2000")
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha ao carregar stock.");
        return response.json();
      })
      .then((payload) => setStockItems(Array.isArray(payload) ? payload as StockItem[] : []))
      .catch(() => setStockItems([]));
  }, []);

  useEffect(() => {
    const shipId = ordem?.shipId || ordem?.jangadas?.[0]?.shipId || ordem?.jangada?.shipId;
    if (!shipId) {
      setAvailableJangadas([]);
      return;
    }

    const controller = new AbortController();
    fetch(`/api/jangadas?shipId=${shipId}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha ao carregar jangadas do navio.");
        return response.json();
      })
      .then((payload) => setAvailableJangadas(Array.isArray(payload) ? payload as JangadaOption[] : []))
      .catch(() => {
        if (!controller.signal.aborted) setAvailableJangadas([]);
      });

    return () => controller.abort();
  }, [ordem?.shipId, ordem?.jangada?.shipId, ordem?.jangadas]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/ordens-servico/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numeroOrdem: form.numeroOrdem,
          tipo: form.tipo,
          prioridade: form.prioridade,
          status: form.status,
          tecnicoResponsavel: form.tecnicoResponsavel,
          slaHoras: form.slaHoras ? Number(form.slaHoras) : null,
          dataPlaneadaInicio: form.dataPlaneadaInicio || null,
          dataPlaneadaFim: form.dataPlaneadaFim || null,
          descricao: form.descricao,
          dataPrevista: form.dataPrevista || null,
          dataInicio: form.dataInicio || null,
          dataConclusao: form.dataConclusao || null,
          durationMinutes: Number(form.durationMinutes || 0),
          jangadaIds: selectedJangadaIds,
          metadados: {
            ...(ordem?.metadados || {}),
            checklistItems,
          },
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Não foi possível guardar a OT.");

      setOrdem(payload);
      setChecklistItems(parseChecklist(payload?.metadados, payload?.tipo));
      setTimeEntries(parseTimeEntries(payload?.metadados));
      setMaterials(parseMaterials(payload?.metadados));
      setForm((prev) => ({
        ...prev,
        slaHoras: payload?.slaHoras ? String(payload.slaHoras) : "",
        dataPlaneadaInicio: toInputDate(payload?.dataPlaneadaInicio),
        dataPlaneadaFim: toInputDate(payload?.dataPlaneadaFim),
        dataPrevista: toInputDate(payload?.dataPrevista),
        dataInicio: toInputDate(payload?.dataInicio),
        dataConclusao: toInputDate(payload?.dataConclusao),
      }));
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Erro ao guardar a OT.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">A carregar ordem de serviço...</div>;
  }

  if (error && !ordem) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  const logs = parseLogs(ordem?.metadados);
  const orderJangadas = Array.isArray(ordem?.jangadas) && ordem.jangadas.length > 0
    ? ordem.jangadas
    : (ordem?.jangada ? [ordem.jangada] : []);
  const orderShipId = ordem?.shipId || orderJangadas[0]?.shipId || ordem?.jangada?.shipId || null;
  const availableSelection = availableJangadas.length > 0 ? availableJangadas : orderJangadas;
  const activeTimeEntry = timeEntries.find((entry) => !entry.endedAt) || null;
  const totalTrackedMinutes = timeEntries.reduce((acc, entry) => acc + Math.max(0, Number(entry.durationMinutes || 0)), 0);
  const checklistByPhase: Record<ChecklistPhase, ChecklistItem[]> = {
    pre: checklistItems.filter((item) => item.phase === "pre"),
    intervencao: checklistItems.filter((item) => item.phase === "intervencao"),
    validacao: checklistItems.filter((item) => item.phase === "validacao"),
  };

  const toggleChecklistItem = (itemId: string, done: boolean) => {
    setChecklistItems((prev) => prev.map((item) => (
      item.id === itemId
        ? {
            ...item,
            done,
            updatedAt: new Date().toISOString(),
            updatedBy: "operador",
          }
        : item
    )));
  };

  const filteredStockItems = stockItems
    .filter((item) => {
      const term = materialSearch.trim().toLowerCase();
      if (!term) return true;
      return String(item.referencia || "").toLowerCase().includes(term) || String(item.descricao || "").toLowerCase().includes(term);
    })
    .slice(0, 100);

  const selectedStockItem = stockItems.find((item) => String(item.id) === selectedStockId) || null;
  const materialsTotal = materials.reduce((acc, item) => acc + Math.max(0, Number(item.quantidadeUsada ?? item.quantidadePrevista ?? 0)) * Math.max(0, Number(item.precoUnitario || 0)), 0);
  const allChecklistDone = checklistItems.length > 0 && checklistItems.every((item) => item.done);
  const materialsReadyForClosure = materials.every((item) => item.consumido || Number(item.quantidadePrevista || 0) === 0);
  const hasTrackedWork = totalTrackedMinutes > 0 || Boolean(activeTimeEntry);
  const closureReady = allChecklistDone && materialsReadyForClosure && hasTrackedWork && !activeTimeEntry;
  const maxReachableCloseStep: CloseWizardStep = allChecklistDone
    ? (materialsReadyForClosure ? ((hasTrackedWork && !activeTimeEntry) ? 4 : 3) : 2)
    : 1;

  const closeWizardSteps: Array<{ step: CloseWizardStep; title: string; done: boolean; blocked?: boolean }> = [
    { step: 1, title: "Checklist", done: allChecklistDone },
    { step: 2, title: "Materiais", done: materialsReadyForClosure, blocked: !allChecklistDone },
    { step: 3, title: "Tempos", done: hasTrackedWork && !activeTimeEntry, blocked: !allChecklistDone || !materialsReadyForClosure },
    { step: 4, title: "Confirmar", done: closureReady, blocked: !closureReady && maxReachableCloseStep < 4 },
  ];
  const firstBlockedStep = closeWizardSteps.find((step) => !step.done)?.step ?? 4;
  const totaisMeta = ordem?.metadados?.totais && typeof ordem.metadados.totais === "object"
    ? ordem.metadados.totais as Record<string, unknown>
    : null;
  const subtotalMeta = Number(totaisMeta?.subtotal || materialsTotal || 0);
  const ivaMeta = Number(totaisMeta?.iva || 0);
  const totalComIvaMeta = Number(totaisMeta?.totalComIva || subtotalMeta + ivaMeta || 0);

  const handleTimeAction = async (action: "start" | "stop") => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/ordens-servico/${id}/tempos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          tecnico: form.tecnicoResponsavel,
          notes: timeNote,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Não foi possível registar o tempo.");
      setTimeNote("");
      await loadOrder();
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Erro ao registar tempo.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!id || !selectedStockItem) {
      setError("Selecione um artigo de stock para adicionar.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/ordens-servico/${id}/materiais`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          stockId: selectedStockItem.id,
          quantidadePrevista: Number(materialQtyPrevista || 1),
          quantidadeUsada: Number(materialQtyUsada || materialQtyPrevista || 1),
          precoUnitario: materialPrice ? Number(materialPrice) : Number(selectedStockItem.precoVenda || 0),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Não foi possível adicionar o material.");
      setSelectedStockId("");
      setMaterialSearch("");
      setMaterialQtyPrevista("1");
      setMaterialQtyUsada("1");
      setMaterialPrice("");
      await loadOrder();
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Erro ao adicionar material.");
    } finally {
      setSaving(false);
    }
  };

  const handleMaterialAction = async (action: "reserve" | "consume" | "remove", materialId: string, quantidadeUsada?: number) => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/ordens-servico/${id}/materiais`, {
        method: action === "remove" ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "remove"
          ? { materialId }
          : { action, materialId, quantidadeUsada }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Não foi possível atualizar o material.");
      await loadOrder();
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Erro ao atualizar material.");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseOrder = async () => {
    if (!id) return;
    if (!closureReady) {
      setError("A OT ainda não cumpre os pré-requisitos de fecho.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/ordens-servico/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "concluida",
          dataConclusao: new Date().toISOString(),
          durationMinutes: totalTrackedMinutes,
          metadados: {
            ...(ordem?.metadados || {}),
            checklistItems,
            materials,
            timeEntries,
            closureSnapshot: {
              closedAt: new Date().toISOString(),
              checklistDone: allChecklistDone,
              materialsReady: materialsReadyForClosure,
              trackedMinutes: totalTrackedMinutes,
              subtotal: subtotalMeta,
              iva: ivaMeta,
              totalComIva: totalComIvaMeta,
            },
          },
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const details = Array.isArray(payload?.details) ? payload.details.join(" ") : "";
        throw new Error([payload?.error || "Não foi possível fechar a OT.", details].filter(Boolean).join(" "));
      }
      await loadOrder();
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Erro ao fechar OT.");
    } finally {
      setSaving(false);
    }
  };

  const goToCloseWizardStep = (step: CloseWizardStep) => {
    if (step > maxReachableCloseStep) return;
    setCloseWizardStep(step);
  };

  const goToNextCloseWizardStep = () => {
    if (closeWizardStep >= 4) return;
    const next = (closeWizardStep + 1) as CloseWizardStep;
    if (next <= maxReachableCloseStep) {
      setCloseWizardStep(next);
      return;
    }
    setCloseWizardStep(firstBlockedStep);
  };

  const goToPreviousCloseWizardStep = () => {
    if (closeWizardStep <= 1) return;
    setCloseWizardStep((closeWizardStep - 1) as CloseWizardStep);
  };

  const goToFirstBlockedCloseWizardStep = () => {
    setCloseWizardStep(firstBlockedStep);
  };

  const handleExportOrderDocument = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/ordens-servico/${id}/documento`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Não foi possível gerar documento da OT.");

      const fileName = `documento_ot_${String(payload?.ordemServico?.numeroOrdem || id).replace(/\s+/g, "_")}.json`;
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Erro ao gerar documento da OT.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportOrderPdf = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/ordens-servico/${id}/documento`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Não foi possível gerar PDF da OT.");

      const doc = new jsPDF();
      let y = 16;

      const addSectionTitle = (title: string) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(title, 14, y);
        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
      };

      const addWrappedLine = (text: string) => {
        const lines = doc.splitTextToSize(text, 180);
        doc.text(lines, 14, y);
        y += (Array.isArray(lines) ? lines.length : 1) * 5;
        if (y > 270) {
          doc.addPage();
          y = 16;
        }
      };

      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(`Documento OT ${String(payload?.ordemServico?.numeroOrdem || id)}`, 14, y);
      y += 9;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      addWrappedLine(`Emitido em: ${new Date().toLocaleString("pt-PT")}`);
      addWrappedLine(`Estado: ${String(payload?.ordemServico?.estado || "—")}`);

      y += 3;
      addSectionTitle("Cliente");
      addWrappedLine(`Nome: ${String(payload?.cliente?.nome || "—")}`);
      addWrappedLine(`NIF: ${String(payload?.cliente?.nif || "—")}`);

      y += 3;
      addSectionTitle("Ativo");
      addWrappedLine(`Jangada: ${String(payload?.ativo?.marca || "")} ${String(payload?.ativo?.modelo || "")}`.trim() || "—");
      addWrappedLine(`Serial: ${String(payload?.ativo?.serial || "—")}`);
      addWrappedLine(`Navio: ${String(payload?.ativo?.navio || "—")}`);

      y += 3;
      addSectionTitle("Linhas");
      const linhas = Array.isArray(payload?.linhas) ? payload.linhas : [];
      if (linhas.length === 0) {
        addWrappedLine("Sem linhas no documento.");
      } else {
        for (const linha of linhas) {
          const ref = String(linha?.referencia || "SEM-REF");
          const desc = String(linha?.descricao || "Linha");
          const qtd = Number(linha?.quantidade || 0);
          const unit = Number(linha?.precoUnitario || 0);
          const total = Number(linha?.total || 0);
          addWrappedLine(`- ${ref} | ${desc} | Qtd ${qtd} | Unit ${unit.toFixed(2)}€ | Total ${total.toFixed(2)}€`);
        }
      }

      y += 3;
      addSectionTitle("Totais");
      addWrappedLine(`Subtotal: ${Number(payload?.totais?.subtotal || 0).toFixed(2)}€`);
      addWrappedLine(`IVA: ${Number(payload?.totais?.iva || 0).toFixed(2)}€`);
      addWrappedLine(`Total: ${Number(payload?.totais?.totalComIva || 0).toFixed(2)}€`);

      doc.save(`documento_ot_${String(payload?.ordemServico?.numeroOrdem || id).replace(/\s+/g, "_")}.pdf`);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Erro ao gerar PDF da OT.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ordem de Serviço {ordem?.numeroOrdem}</h1>
          <p className="text-sm text-gray-600">
            {orderJangadas.length > 1
              ? `${orderJangadas.length} jangadas · ${orderJangadas.map((jangada) => jangada.serial || "—").join(", ")}`
              : `${ordem?.jangada ? `${ordem.jangada.brand || ""} ${ordem.jangada.model || ""}`.trim() : "Jangada"} · ${ordem?.jangada?.serial || "—"}`}
          </p>
          {ordem?.grupoNumeroOrdem ? (
            <p className="text-xs text-gray-500 mt-1">Grupo/obra: {ordem.grupoNumeroOrdem}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => router.back()} className="rounded border border-gray-300 bg-white px-3 py-2 text-sm">Voltar</button>
          <button
            type="button"
            onClick={() => void handleExportOrderDocument()}
            disabled={saving}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 disabled:opacity-50"
          >
            Gerar documento OT
          </button>
          <button
            type="button"
            onClick={() => void handleExportOrderPdf()}
            disabled={saving}
            className="rounded border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm text-indigo-700 disabled:opacity-50"
          >
            Exportar PDF OT
          </button>
          <button type="button" onClick={() => void handleSave()} disabled={saving} className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
            {saving ? "A guardar..." : "Guardar OT"}
          </button>
        </div>
      </div>

      {error ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="xl:col-span-2 rounded-xl border border-gray-200 bg-white p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">N.º OT</label>
              <input value={form.numeroOrdem} onChange={(e) => setForm((prev) => ({ ...prev, numeroOrdem: e.target.value }))} className="w-full rounded border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Técnico responsável</label>
              <input value={form.tecnicoResponsavel} onChange={(e) => setForm((prev) => ({ ...prev, tecnicoResponsavel: e.target.value }))} className="w-full rounded border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">SLA (horas)</label>
              <input type="number" min="1" value={form.slaHoras} onChange={(e) => setForm((prev) => ({ ...prev, slaHoras: e.target.value }))} className="w-full rounded border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))} className="w-full rounded border border-gray-300 px-3 py-2">
                {TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Prioridade</label>
              <select value={form.prioridade} onChange={(e) => setForm((prev) => ({ ...prev, prioridade: e.target.value }))} className="w-full rounded border border-gray-300 px-3 py-2">
                {PRIORITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Estado</label>
              <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))} className="w-full rounded border border-gray-300 px-3 py-2">
                {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Duração (min.)</label>
              <input type="number" min="0" value={form.durationMinutes} onChange={(e) => setForm((prev) => ({ ...prev, durationMinutes: e.target.value }))} className="w-full rounded border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Planeado início</label>
              <input type="date" value={form.dataPlaneadaInicio} onChange={(e) => setForm((prev) => ({ ...prev, dataPlaneadaInicio: e.target.value }))} className="w-full rounded border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Planeado fim</label>
              <input type="date" value={form.dataPlaneadaFim} onChange={(e) => setForm((prev) => ({ ...prev, dataPlaneadaFim: e.target.value }))} className="w-full rounded border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Data prevista</label>
              <input type="date" value={form.dataPrevista} onChange={(e) => setForm((prev) => ({ ...prev, dataPrevista: e.target.value }))} className="w-full rounded border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Data início</label>
              <input type="date" value={form.dataInicio} onChange={(e) => setForm((prev) => ({ ...prev, dataInicio: e.target.value }))} className="w-full rounded border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Data conclusão</label>
              <input type="date" value={form.dataConclusao} onChange={(e) => setForm((prev) => ({ ...prev, dataConclusao: e.target.value }))} className="w-full rounded border border-gray-300 px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Descrição / observações</label>
            <textarea value={form.descricao} onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))} rows={6} className="w-full rounded border border-gray-300 px-3 py-2" />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Checklist técnica (Fase 2)</h3>
              <span className="text-xs text-slate-600">
                {checklistItems.filter((item) => item.done).length}/{checklistItems.length} concluídos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {([
                ["pre", "Pré"] as const,
                ["intervencao", "Intervenção"] as const,
                ["validacao", "Validação"] as const,
              ]).map(([phase, label]) => (
                <div key={phase} className="rounded border border-slate-200 bg-white p-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">{label}</h4>
                  <div className="space-y-2">
                    {checklistByPhase[phase].length === 0 ? (
                      <p className="text-xs text-slate-400">Sem itens.</p>
                    ) : checklistByPhase[phase].map((item) => (
                      <label key={item.id} className="flex items-start gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={(e) => toggleChecklistItem(item.id, e.target.checked)}
                          className="mt-0.5"
                        />
                        <span className={item.done ? "line-through text-slate-400" : ""}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Execução e tempos</h3>
                <p className="text-xs text-slate-500">Regista início/fim de trabalho e controla o tempo acumulado.</p>
              </div>
              <div className="text-xs text-slate-600">
                Total registado: <b>{formatDurationMinutes(totalTrackedMinutes)}</b>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                value={timeNote}
                onChange={(e) => setTimeNote(e.target.value)}
                placeholder="Nota rápida do registo de tempo"
                className="min-w-[260px] flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void handleTimeAction("start")}
                disabled={saving || Boolean(activeTimeEntry)}
                className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 disabled:opacity-50"
              >
                Iniciar execução
              </button>
              <button
                type="button"
                onClick={() => void handleTimeAction("stop")}
                disabled={saving || !activeTimeEntry}
                className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 disabled:opacity-50"
              >
                Parar execução
              </button>
            </div>

            {activeTimeEntry ? (
              <div className="rounded border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-800">
                Em curso desde {formatDate(activeTimeEntry.startedAt)} · Técnico: {activeTimeEntry.tecnico || "—"}
              </div>
            ) : null}

            <div className="overflow-auto rounded border border-slate-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Técnico</th>
                    <th className="px-3 py-2 text-left">Início</th>
                    <th className="px-3 py-2 text-left">Fim</th>
                    <th className="px-3 py-2 text-right">Duração</th>
                    <th className="px-3 py-2 text-left">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {timeEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-slate-400">Sem registos de tempo.</td>
                    </tr>
                  ) : timeEntries.map((entry) => (
                    <tr key={entry.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">{entry.tecnico || "—"}</td>
                      <td className="px-3 py-2">{formatDate(entry.startedAt)}</td>
                      <td className="px-3 py-2">{entry.endedAt ? formatDate(entry.endedAt) : <span className="text-emerald-700 font-medium">Em curso</span>}</td>
                      <td className="px-3 py-2 text-right">{formatDurationMinutes(entry.durationMinutes)}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{entry.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Materiais da OT</h3>
                <p className="text-xs text-slate-500">Adicionar, reservar e consumir artigos ligados ao stock.</p>
              </div>
              <div className="text-xs text-slate-600">Valor estimado: <b>{new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(materialsTotal)}</b></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <input
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                placeholder="Pesquisar referência ou descrição"
                className="rounded border border-gray-300 px-3 py-2 text-sm md:col-span-2"
              />
              <select
                value={selectedStockId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setSelectedStockId(nextId);
                  const item = stockItems.find((stock) => String(stock.id) === nextId);
                  setMaterialPrice(item?.precoVenda != null ? String(item.precoVenda) : "");
                }}
                className="rounded border border-gray-300 px-3 py-2 text-sm md:col-span-2"
              >
                <option value="">Escolher artigo...</option>
                {filteredStockItems.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {String(item.referencia || "SEM-REF")} · {String(item.descricao || "Sem descrição")} · stock {Number(item.quantidade || 0)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void handleAddMaterial()}
                disabled={saving || !selectedStockId}
                className="rounded border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="number"
                min="1"
                value={materialQtyPrevista}
                onChange={(e) => setMaterialQtyPrevista(e.target.value)}
                placeholder="Qtd. prevista"
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="1"
                value={materialQtyUsada}
                onChange={(e) => setMaterialQtyUsada(e.target.value)}
                placeholder="Qtd. usada"
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={materialPrice}
                onChange={(e) => setMaterialPrice(e.target.value)}
                placeholder="Preço unitário"
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="overflow-auto rounded border border-slate-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Ref.</th>
                    <th className="px-3 py-2 text-left">Descrição</th>
                    <th className="px-3 py-2 text-right">Disp.</th>
                    <th className="px-3 py-2 text-right">Prev.</th>
                    <th className="px-3 py-2 text-right">Usada</th>
                    <th className="px-3 py-2 text-right">Preço</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                    <th className="px-3 py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-4 text-center text-slate-400">Sem materiais associados.</td>
                    </tr>
                  ) : materials.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-800">{item.referencia || "—"}</td>
                      <td className="px-3 py-2">{item.descricao || "—"}</td>
                      <td className="px-3 py-2 text-right">{Number(item.disponibilidade || 0)}</td>
                      <td className="px-3 py-2 text-right">{Number(item.quantidadePrevista || 0)}</td>
                      <td className="px-3 py-2 text-right">{Number(item.quantidadeUsada || 0)}</td>
                      <td className="px-3 py-2 text-right">{new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(Number(item.precoUnitario || 0))}</td>
                      <td className="px-3 py-2 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {item.reservado ? <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">Reservado</span> : null}
                          {item.consumido ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Consumido</span> : null}
                          {!item.reservado && !item.consumido ? <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">Pendente</span> : null}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => void handleMaterialAction("reserve", item.id)}
                            disabled={saving || item.reservado}
                            className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-700 disabled:opacity-50"
                          >
                            Reservar
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleMaterialAction("consume", item.id, item.quantidadeUsada || item.quantidadePrevista || 1)}
                            disabled={saving || item.consumido}
                            className="rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 disabled:opacity-50"
                          >
                            Consumir
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleMaterialAction("remove", item.id)}
                            disabled={saving}
                            className="rounded border border-rose-300 bg-rose-50 px-2 py-1 text-xs text-rose-700 disabled:opacity-50"
                          >
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Wizard de fecho operacional</h3>
                <p className="text-xs text-slate-500">Segue os passos para validar e concluir a OT sem falhas.</p>
              </div>
              <span className="text-xs text-slate-500">Passo {closeWizardStep} de 4</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {closeWizardSteps.map((stepInfo) => {
                const active = closeWizardStep === stepInfo.step;
                const blocked = Boolean(stepInfo.blocked) || stepInfo.step > maxReachableCloseStep;
                return (
                  <button
                    key={stepInfo.step}
                    type="button"
                    onClick={() => goToCloseWizardStep(stepInfo.step)}
                    disabled={blocked}
                    className={`rounded border px-3 py-2 text-left text-xs ${
                      active
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : stepInfo.done
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-gray-300 bg-white text-slate-700"
                    } disabled:opacity-50`}
                  >
                    <div className="font-semibold">{stepInfo.step}. {stepInfo.title}</div>
                    <div>{stepInfo.done ? "Concluído" : blocked ? "Bloqueado" : "Pendente"}</div>
                  </button>
                );
              })}
            </div>

            <div className="sticky top-2 z-10 rounded border border-slate-200 bg-white p-3 text-xs text-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-slate-900">Resumo de validações do fecho</div>
                <button
                  type="button"
                  onClick={goToFirstBlockedCloseWizardStep}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                >
                  Ir para bloqueio
                </button>
              </div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className={`rounded px-2 py-1 ${allChecklistDone ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  Checklist: {allChecklistDone ? "OK" : "pendente"}
                </div>
                <div className={`rounded px-2 py-1 ${materialsReadyForClosure ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  Materiais: {materialsReadyForClosure ? "OK" : "pendente"}
                </div>
                <div className={`rounded px-2 py-1 ${hasTrackedWork && !activeTimeEntry ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  Tempos: {hasTrackedWork && !activeTimeEntry ? "OK" : activeTimeEntry ? "em curso" : "pendente"}
                </div>
                <div className={`rounded px-2 py-1 ${closureReady ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  Confirmar: {closureReady ? "Apto" : "Bloqueado"}
                </div>
              </div>
            </div>

            {closeWizardStep === 1 ? (
              <div className={`rounded border px-3 py-3 text-sm ${allChecklistDone ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                Checklist técnica: <b>{allChecklistDone ? "OK" : "ainda há itens por concluir"}</b>
              </div>
            ) : null}

            {closeWizardStep === 2 ? (
              <div className={`rounded border px-3 py-3 text-sm ${materialsReadyForClosure ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                Materiais: <b>{materialsReadyForClosure ? "todos confirmados/consumidos" : "existem materiais pendentes"}</b>
              </div>
            ) : null}

            {closeWizardStep === 3 ? (
              <div className={`rounded border px-3 py-3 text-sm ${hasTrackedWork && !activeTimeEntry ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                Tempos: <b>{hasTrackedWork && !activeTimeEntry ? "registos válidos" : activeTimeEntry ? "existe execução em curso" : "sem registos de tempo"}</b>
              </div>
            ) : null}

            {closeWizardStep === 4 ? (
              <div className="space-y-2">
                <div className="rounded border border-slate-200 bg-white p-3 text-sm text-slate-700">
                  <div className="font-medium text-slate-900 mb-2">Resumo comercial</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>Subtotal: <b>{new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(subtotalMeta)}</b></div>
                    <div>IVA: <b>{new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(ivaMeta)}</b></div>
                    <div>Total: <b>{new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(totalComIvaMeta)}</b></div>
                  </div>
                </div>
                <div className={`rounded border px-3 py-2 text-sm ${closureReady ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                  Estado final do fecho: <b>{closureReady ? "apto para concluir" : "ainda bloqueado por validações"}</b>
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={goToPreviousCloseWizardStep}
                  disabled={closeWizardStep === 1}
                  className="rounded border border-gray-300 bg-white px-3 py-2 text-xs disabled:opacity-50"
                >
                  Passo anterior
                </button>
                <button
                  type="button"
                  onClick={goToNextCloseWizardStep}
                  disabled={closeWizardStep === 4}
                  className="rounded border border-gray-300 bg-white px-3 py-2 text-xs disabled:opacity-50"
                >
                  {closeWizardStep >= maxReachableCloseStep && closeWizardStep !== 4 ? "Ir para bloqueio" : "Próximo passo"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => void handleCloseOrder()}
                disabled={saving || !closureReady || form.status === "concluida" || closeWizardStep !== 4}
                className="rounded border border-sky-200 bg-sky-100 px-3 py-2 text-sm font-medium text-sky-900 hover:bg-sky-200 disabled:opacity-50"
              >
                Fechar OT
              </button>
            </div>
          </div>
        </section>

        <aside className="rounded-xl border border-gray-200 bg-slate-50 p-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Jangadas associadas</h2>
            <div className="rounded border border-slate-200 bg-white p-3 space-y-2">
              <div className="text-xs text-slate-500">
                {orderShipId ? `Navio #${orderShipId} · só podes associar jangadas deste navio.` : "Sem navio associado para filtrar jangadas."}
              </div>
              {availableSelection.length === 0 ? (
                <p className="text-xs text-slate-400">Sem jangadas disponíveis.</p>
              ) : availableSelection.map((jangada) => {
                const checked = selectedJangadaIds.includes(jangada.id);
                return (
                  <label key={jangada.id} className="flex items-start gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setSelectedJangadaIds((prev) => {
                          if (e.target.checked) return Array.from(new Set([...prev, jangada.id]));
                          if (prev.length <= 1) return prev;
                          return prev.filter((value) => value !== jangada.id);
                        });
                      }}
                    />
                    <span>
                      <span className="font-medium text-slate-900">{`${jangada.brand || ""} ${jangada.model || ""}`.trim() || "Jangada"}</span>
                      <span className="block text-xs text-slate-500">{jangada.serial} · {jangada.shipNameManual || jangada.owner || "Sem navio"}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Ativo principal</h2>
            <div className="text-sm text-slate-700 space-y-1">
              <p><b>Jangada:</b> {ordem?.jangada ? `${ordem.jangada.brand || ""} ${ordem.jangada.model || ""}`.trim() : "—"}</p>
              <p><b>Serial:</b> {ordem?.jangada?.serial || "—"}</p>
              <p><b>Navio:</b> {ordem?.jangada?.shipNameManual || ordem?.jangada?.owner || "—"}</p>
              <p><b>Última inspeção:</b> {formatDate(ordem?.jangada?.dataInspecao)}</p>
              <p><b>Próxima inspeção:</b> {formatDate(ordem?.jangada?.dataProxInspecao)}</p>
            </div>
            {ordem?.jangada?.id ? (
              <Link href={`/jangadas/${ordem.jangada.id}`} className="mt-2 inline-flex text-sm text-blue-700 hover:underline">
                Abrir ficha da jangada
              </Link>
            ) : null}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Contexto</h2>
            <div className="text-sm text-slate-700 space-y-1">
              <p><b>Cliente:</b> {ordem?.cliente?.nome || "—"}</p>
              <p><b>Inspeção:</b> {ordem?.inspecao?.certificadoNumero || "—"}</p>
              <p><b>SLA:</b> {ordem?.slaHoras ? `${ordem.slaHoras}h` : "—"}</p>
              <p><b>Planeado início:</b> {formatDate(ordem?.dataPlaneadaInicio)}</p>
              <p><b>Planeado fim:</b> {formatDate(ordem?.dataPlaneadaFim)}</p>
              <p><b>Aberta em:</b> {formatDate(ordem?.dataAbertura)}</p>
              <p><b>Atualizada em:</b> {formatDate(ordem?.updatedAt as string | null | undefined)}</p>
            </div>
          </div>

          {ordem?.metadados && Object.keys(ordem.metadados).length > 0 ? (
            <details className="rounded border border-slate-200 bg-white p-3">
              <summary className="cursor-pointer text-sm font-medium text-slate-800">Metadados</summary>
              <pre className="mt-2 max-h-80 overflow-auto text-xs text-slate-700">{JSON.stringify(ordem.metadados, null, 2)}</pre>
            </details>
          ) : null}

          <section className="rounded border border-slate-200 bg-white p-3">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Timeline OT</h2>
            {logs.length === 0 ? (
              <p className="text-xs text-slate-400">Sem eventos registados.</p>
            ) : (
              <ul className="space-y-2">
                {logs.map((entry, index) => (
                  <li key={entry.id || `${entry.at || "sem-data"}-${index}`} className="text-xs text-slate-700 border-l-2 border-slate-200 pl-2">
                    <div className="font-medium text-slate-800">{entry.message}</div>
                    <div className="text-slate-500">{formatDate(entry.at)} · {entry.type || "EVENTO"} · {entry.user || "sistema"}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
