"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { APP_CONFIG } from "@/lib/app-config";
import { formatDateDisplay } from "@/lib/date-display";
import { sortNaviosAlphabetically } from "@/lib/navios-sort";
import { normalizeStockCategory } from "@/lib/stock-categories";

type Inspection = {
  id: number;
  certificadoNumero?: string | null;
  navioNome?: string | null;
  navioId?: number | null;
  jangadaId?: number | null;
  jangadaSerial?: string | null;
  dataInspecao?: string | null;
  status?: string | null;
};

type Raft = {
  id?: number;
  serial: string;
  model?: string | null;
  brand?: string | null;
  owner?: string | null;
  shipId?: number | null;
  shipNameManual?: string | null;
  capacity?: number | null;
  dataFabrico?: string | null;
  packType?: string | null;
  dataInspecao?: string | null;
  dataProxInspecao?: string | null;
  numeroObra?: string | null;
  testeNAP?: string | null;
  testeFS?: string | null;
  artigos?: Array<{
    id?: number;
    name?: string | null;
    quantidade?: number | null;
    validade?: string | null;
    referencia?: string | null;
    codigoFabricante?: string | null;
  }>;
};

type Navio = {
  id: number;
  nome: string;
  matricula?: string | null;
  portoRegisto?: string | null;
  tipoPesca?: string | null;
  tipoNavio?: string | null;
  cliente?: {
    id?: number;
    nome?: string | null;
    nif?: string | null;
  } | null;
};

type InspectionReportRow = {
  key: string;
  inspection: Inspection;
  raft: Raft | null;
  shipName: string;
  numeroObra: string;
  raftLabel: string;
  serial: string;
  inspectionDate: string;
  status: string;
  certificadoNumero: string;
};

type ObraFormState = {
  shipId: string;
  shipName: string;
  numeroObra: string;
};

type StockItem = {
  id?: number;
  referencia?: string | null;
  descricao?: string | null;
  precoVenda?: number | null;
  quantidade?: number | null;
  categoria?: string | null;
  codigoFabricante?: string | null;
  associavelJangada?: boolean;
  aplicavelMarcaJangada?: string | null;
  aplicavelModeloJangada?: string | null;
};

type PricingState = {
  inspectionPrice: number;
  includeFS: boolean;
  includeNAP: boolean;
  includeCertificate: boolean;
  certificatePrice: number;
};

type ObraPreviewLine = {
  key: string;
  raftId?: number;
  isArticle?: boolean;
  isSuggestedStock?: boolean;
  referencia: string;
  descricao: string;
  quantidade: number;
  unitPrice: number;
  total: number;
  source: string;
};

type ServiceOrder = {
  id: number;
  numeroOrdem: string;
  grupoNumeroOrdem?: string | null;
  status: string;
  prioridade: string;
  tipo: string;
  tecnicoResponsavel?: string | null;
  slaHoras?: number | null;
  dataPlaneadaInicio?: string | null;
  dataPlaneadaFim?: string | null;
  dataPrevista?: string | null;
  createdAt?: string | null;
  jangada?: {
    id?: number;
    serial?: string | null;
    brand?: string | null;
    model?: string | null;
    shipNameManual?: string | null;
    owner?: string | null;
  } | null;
  cliente?: {
    id?: number;
    nome?: string | null;
  } | null;
};

const SERVICE_STOCK_ITEMS = [
  { referencia: "L-JD", descricao: "Inspeção de Jangada", precoVenda: 180, categoria: "Serviço" },
  { referencia: "L-NAP", descricao: "Teste NAP", precoVenda: 35, categoria: "Serviço" },
  { referencia: "L-FS", descricao: "Teste FS", precoVenda: 35, categoria: "Serviço" },
  { referencia: "L-CER", descricao: "Certificado de Inspeção", precoVenda: 100, categoria: "Serviço" },
] as const;

const FIXED_ARTICLE_PRICES: Array<{ matcher: (text: string) => boolean; price: number }> = [
  { matcher: (text) => text.includes("cinta"), price: 9 },
  { matcher: (text) => text.includes("comprimid") || text.includes("enjoo"), price: 19 },
  { matcher: (text) => text.includes("paraquedas") || text.includes("parachute"), price: 40 },
  { matcher: (text) => text.includes("pote") || text.includes("fumo") || text.includes("smoke"), price: 40 },
  { matcher: (text) => text.includes("racao") || text.includes("ration"), price: 6 },
  { matcher: (text) => text.includes("agua") || text.includes("water"), price: 3 },
  { matcher: (text) => text.includes("farmacia") || text.includes("first aid") || text.includes("ambulancia"), price: 75 },
];

const RAFT_RELATED_STOCK_KEYWORDS = [
  "cinta",
  "strap",
  "retenida",
  "retenida final",
  "anilha",
  "pilha",
  "bateria",
  "battery",
  "lanterna",
  "torch",
  "hru",
  "hammar",
  "facho",
  "flare",
  "paraquedas",
  "rocket",
  "pote",
  "fumo",
  "agua",
  "water",
  "racao",
  "ration",
  "farmacia",
  "first aid",
  "comprimido",
  "enjoo",
  "reflector",
  "radar",
  "tubo",
  "hose",
  "mangueira",
  "cilindro",
  "cylinder",
  "co2",
  "n2",
  "valvula",
  "vedante",
  "oring",
  "o ring",
  "cabeca",
  "disparo",
  "fecho",
  "closure",
  "contentor",
  "container",
  "pack",
];

function normalizeList<T>(payload: unknown): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];
  if (typeof payload === "object" && payload !== null && Array.isArray((payload as any).data)) {
    return (payload as any).data as T[];
  }
  return [];
}

async function safeReadJson(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  const rawText = await response.text();

  if (!rawText) return [];

  if (contentType.includes("application/json")) {
    return JSON.parse(rawText);
  }

  if (rawText.trim().startsWith("<")) {
    throw new Error(`Resposta inválida da API (${response.status}).`);
  }

  return JSON.parse(rawText);
}

function formatDate(value?: string | null) {
  return formatDateDisplay(value);
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function splitApplicability(raw?: string | null) {
  return String(raw || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function getApplicabilityBadge(item: StockItem) {
  const marcas = splitApplicability(item.aplicavelMarcaJangada);
  const modelos = splitApplicability(item.aplicavelModeloJangada);
  const labels = [
    marcas.length > 0 ? `Marca: ${marcas.slice(0, 2).join(" / ")}${marcas.length > 2 ? ` +${marcas.length - 2}` : ""}` : "",
    modelos.length > 0 ? `Modelo: ${modelos.slice(0, 2).join(" / ")}${modelos.length > 2 ? ` +${modelos.length - 2}` : ""}` : "",
  ].filter(Boolean);

  return labels.join(" · ");
}

function getRaftKeywordScore(item: StockItem) {
  const blob = normalizeText([
    item.referencia,
    item.descricao,
    item.codigoFabricante,
    item.categoria,
    item.aplicavelMarcaJangada,
    item.aplicavelModeloJangada,
  ].filter(Boolean).join(" "));

  return RAFT_RELATED_STOCK_KEYWORDS.reduce((acc, keyword) => (
    blob.includes(normalizeText(keyword)) ? acc + 1 : acc
  ), 0);
}

function getShipDisplayName(navio?: Navio | null) {
  return String(navio?.nome || "").trim();
}

function getShipOptionLabel(navio?: Navio | null) {
  if (!navio) return "";
  const nome = String(navio.nome || "").trim() || "Navio sem nome";
  const matricula = String(navio.matricula || "").trim();
  return matricula ? `${nome} (${matricula})` : nome;
}

function buildSuggestedObraNumber(existingRafts: Raft[]) {
  const today = new Date();
  const stamp = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const usedNumbers = new Set(
    existingRafts
      .map((raft) => String(raft.numeroObra || "").trim())
      .filter(Boolean)
  );

  let sequence = 1;
  let candidate = "";
  do {
    candidate = `OBR-${stamp}-${String(sequence).padStart(3, "0")}`;
    sequence += 1;
  } while (usedNumbers.has(candidate));

  return candidate;
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value || 0);
}

function isOrderClosed(status?: string | null) {
  const value = String(status || "").trim().toLowerCase();
  return value === "concluida" || value === "concluída" || value === "cancelada";
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
  const value = String(priority || "").trim().toLowerCase();
  if (value === "critica" || value === "crítica") return 4;
  if (value === "alta") return 3;
  if (value === "normal") return 2;
  if (value === "baixa") return 1;
  return 0;
}

function resolveArticleUnitPrice(articleName: string, fallbackPrice: number) {
  const text = normalizeText(articleName);
  const fixed = FIXED_ARTICLE_PRICES.find((rule) => rule.matcher(text));
  return fixed?.price ?? fallbackPrice;
}

function formatDateLongPt(date = new Date()) {
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

export default function RelatoriosPage() {
  const searchParams = useSearchParams();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [rafts, setRafts] = useState<Raft[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [navios, setNavios] = useState<Navio[]>([]);
  const [naviosById, setNaviosById] = useState<Record<number, string>>({});
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [obraForm, setObraForm] = useState<ObraFormState>({ shipId: "", shipName: "", numeroObra: "" });
  const [selectedRaftIds, setSelectedRaftIds] = useState<number[]>([]);
  const [savingObra, setSavingObra] = useState(false);
  const [pricingByRaftId, setPricingByRaftId] = useState<Record<number, PricingState>>({});
  const [selectedLineKeys, setSelectedLineKeys] = useState<string[]>([]);
  const [lineOverrides, setLineOverrides] = useState<Record<string, { quantidade: number; unitPrice: number }>>({});
  const [hasIvaDeclaration, setHasIvaDeclaration] = useState(false);
  const [ordersStatusFilter, setOrdersStatusFilter] = useState("all");
  const [ordersPriorityFilter, setOrdersPriorityFilter] = useState("all");
  const [ordersTechFilter, setOrdersTechFilter] = useState("");
  const [ordersLateOnly, setOrdersLateOnly] = useState(false);
  const [prefillApplied, setPrefillApplied] = useState(false);

  const prefillJangadaId = Number(searchParams.get("jangadaId") || 0);
  const prefillShipId = Number(searchParams.get("shipId") || 0);

  useEffect(() => {
    Promise.all([fetch("/api/inspecao"), fetch("/api/jangadas"), fetch("/api/navios"), fetch("/api/stock?take=5000"), fetch("/api/ordens-servico?includeClosed=1")])
      .then(async ([inspectionsRes, raftsRes, naviosRes, stockRes, ordersRes]) => {
        const inspectionsPayload = inspectionsRes.ok ? await safeReadJson(inspectionsRes) : [];
        const raftsPayload = raftsRes.ok ? await safeReadJson(raftsRes) : [];
        const naviosPayload = naviosRes.ok ? await safeReadJson(naviosRes) : [];
        const stockPayload = stockRes.ok ? await safeReadJson(stockRes) : [];
        const ordersPayload = ordersRes.ok ? await safeReadJson(ordersRes) : [];

        setInspections(normalizeList<Inspection>(inspectionsPayload));
        setRafts(normalizeList<Raft>(raftsPayload));
        setStockItems(normalizeList<StockItem>(stockPayload));
        setOrders(normalizeList<ServiceOrder>(ordersPayload));

        const naviosList = sortNaviosAlphabetically(normalizeList<Navio>(naviosPayload));
        setNavios(naviosList);
        setNaviosById(
          naviosList.reduce<Record<number, string>>((acc, navio) => {
            if (navio?.id) acc[navio.id] = navio.nome;
            return acc;
          }, {})
        );
      })
      .catch((error) => {
        console.error("Erro ao carregar dados de relatórios:", error);
        setInspections([]);
        setRafts([]);
        setOrders([]);
        setNavios([]);
        setStockItems([]);
        setNaviosById({});
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    const missingServiceItems = SERVICE_STOCK_ITEMS.filter((service) => {
      return !stockItems.some((item) => String(item.referencia || "").trim().toUpperCase() === service.referencia);
    });

    if (missingServiceItems.length === 0) return;

    void fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        missingServiceItems.map((service) => ({
          referencia: service.referencia,
          nome: service.descricao,
          descricao: service.descricao,
          categoria: service.categoria,
          quantidade: 0,
          precoVenda: service.precoVenda,
          associavelJangada: false,
        }))
      ),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        setStockItems((prev) => [
          ...prev,
          ...missingServiceItems.map((service) => ({
            referencia: service.referencia,
            descricao: service.descricao,
            categoria: service.categoria,
            quantidade: 0,
            precoVenda: service.precoVenda,
          })),
        ]);
      })
      .catch((error) => {
        console.error("Erro ao criar serviços no stock:", error);
      });
  }, [loading, stockItems]);

  const stockByReference = useMemo(() => {
    const map = new Map<string, StockItem>();
    stockItems.forEach((item) => {
      const ref = String(item.referencia || "").trim().toUpperCase();
      if (ref) map.set(ref, item);
    });
    return map;
  }, [stockItems]);

  const servicePriceDefaults = useMemo(() => ({
    inspection: toNumber(stockByReference.get("L-JD")?.precoVenda, 180),
    nap: toNumber(stockByReference.get("L-NAP")?.precoVenda, 35),
    fs: toNumber(stockByReference.get("L-FS")?.precoVenda, 35),
    certificate: Math.max(100, toNumber(stockByReference.get("L-CER")?.precoVenda, 100)),
  }), [stockByReference]);

  const sortedNavios = useMemo(() => {
    return [...navios].sort((a, b) => getShipDisplayName(a).localeCompare(getShipDisplayName(b), "pt-PT", { sensitivity: "base" }));
  }, [navios]);

  const obraNaviosList = useMemo(() => sortedNavios, [sortedNavios]);

  const selectedNavio = useMemo(() => {
    const byId = obraNaviosList.find((navio) => String(navio.id) === obraForm.shipId);
    if (byId) return byId;
    const byName = obraNaviosList.find((navio) => normalizeText(navio.nome) === normalizeText(obraForm.shipName));
    return byName || null;
  }, [obraNaviosList, obraForm.shipId, obraForm.shipName]);

  const obraIvaExempt = useMemo(() => {
    if (!selectedNavio) return false;
    const tipoPesca = normalizeText(selectedNavio.tipoPesca);
    const tipoNavio = normalizeText(selectedNavio.tipoNavio);
    return Boolean(tipoPesca) || tipoNavio.includes("pesca");
  }, [selectedNavio]);

  const availableRaftsForObra = useMemo(() => {
    if (!selectedNavio?.id) return [];
    return rafts
      .filter((raft) => raft.shipId === selectedNavio.id)
      .sort((a, b) => {
        const modelCompare = String(a.model || "").localeCompare(String(b.model || ""), "pt-PT", { sensitivity: "base" });
        if (modelCompare !== 0) return modelCompare;
        return String(a.serial || "").localeCompare(String(b.serial || ""), "pt-PT", { sensitivity: "base" });
      });
  }, [rafts, selectedNavio]);

  const selectedRaftsForObra = useMemo(() => {
    return availableRaftsForObra.filter((raft) => raft.id && selectedRaftIds.includes(raft.id));
  }, [availableRaftsForObra, selectedRaftIds]);

  useEffect(() => {
    if (prefillApplied || loading || rafts.length === 0 || navios.length === 0) return;

    const targetRaft = Number.isFinite(prefillJangadaId) && prefillJangadaId > 0
      ? rafts.find((raft) => Number(raft.id) === prefillJangadaId) || null
      : null;
    const targetShipId = targetRaft?.shipId || (Number.isFinite(prefillShipId) && prefillShipId > 0 ? prefillShipId : null);
    const targetShip = targetShipId
      ? navios.find((navio) => Number(navio.id) === Number(targetShipId)) || null
      : null;

    if (!targetShip && !targetRaft) {
      setPrefillApplied(true);
      return;
    }

    if (targetShip) {
      setObraForm((prev) => ({
        ...prev,
        shipId: String(targetShip.id),
        shipName: targetShip.nome,
        numeroObra: prev.numeroObra || buildSuggestedObraNumber(rafts),
      }));
    }

    if (targetRaft?.id) {
      setSelectedRaftIds([targetRaft.id]);
    }

    setPrefillApplied(true);
  }, [prefillApplied, loading, rafts, navios, prefillJangadaId, prefillShipId]);

  useEffect(() => {
    if (!selectedNavio?.id) {
      setSelectedRaftIds([]);
      setObraForm((prev) => ({ ...prev, numeroObra: prev.numeroObra || buildSuggestedObraNumber(rafts) }));
      return;
    }

    setSelectedRaftIds((prev) => prev.filter((id) => availableRaftsForObra.some((raft) => raft.id === id)));
    setObraForm((prev) => ({
      ...prev,
      shipId: String(selectedNavio.id),
      shipName: selectedNavio.nome,
      numeroObra: prev.numeroObra || buildSuggestedObraNumber(rafts),
    }));
  }, [selectedNavio, availableRaftsForObra, rafts]);

  useEffect(() => {
    if (availableRaftsForObra.length === 0) {
      setPricingByRaftId({});
      return;
    }

    setPricingByRaftId((prev) => {
      const next: Record<number, PricingState> = {};
      for (const raft of availableRaftsForObra) {
        if (!raft.id) continue;
        next[raft.id] = prev[raft.id] || {
          inspectionPrice: servicePriceDefaults.inspection,
          includeFS: Boolean(String(raft.testeFS || "").trim()),
          includeNAP: Boolean(String(raft.testeNAP || "").trim()),
          includeCertificate: true,
          certificatePrice: servicePriceDefaults.certificate,
        };
      }
      return next;
    });
  }, [availableRaftsForObra, servicePriceDefaults]);

  const reportRows = useMemo(() => {
    const latestInspectionByRaft = new Map<string, Inspection>();
    const sortedInspections = [...inspections].sort((a, b) => {
      const aTime = new Date(a.dataInspecao || 0).getTime();
      const bTime = new Date(b.dataInspecao || 0).getTime();
      return bTime - aTime;
    });

    sortedInspections.forEach((inspection) => {
      const status = String(inspection.status || "").toLowerCase();
      const isRelevant = ["concluída", "concluida", "finalizada", "scheduled", "obra"].some((token) => status.includes(token));
      if (!isRelevant) return;

      const rowKey = inspection.jangadaId
        ? `id-${inspection.jangadaId}`
        : inspection.jangadaSerial
          ? `serial-${inspection.jangadaSerial}`
          : `inspection-${inspection.id}`;

      if (!latestInspectionByRaft.has(rowKey)) {
        latestInspectionByRaft.set(rowKey, inspection);
      }
    });

    const rows = rafts
      .filter((raft) => String(raft.numeroObra || "").trim() || raft.dataInspecao || raft.dataProxInspecao)
      .map<InspectionReportRow>((raft) => {
        const rowKey = raft.id ? `id-${raft.id}` : `serial-${raft.serial}`;
        const inspection = latestInspectionByRaft.get(rowKey);
        const shipName =
          (raft.shipId ? naviosById[raft.shipId] : "") ||
          raft.shipNameManual ||
          inspection?.navioNome?.trim() ||
          "Sem navio";

        return {
          key: rowKey,
          inspection: inspection || { id: 0, dataInspecao: raft.dataInspecao || null, status: "OT criada" },
          raft,
          shipName,
          numeroObra: String(raft.numeroObra || "").trim() || "—",
          raftLabel: raft.model?.trim() || "Jangada",
          serial: raft.serial || "—",
          inspectionDate: formatDate(inspection?.dataInspecao || raft.dataInspecao),
          status: inspection?.status || (raft.numeroObra ? "OT criada" : "Sem inspeção"),
          certificadoNumero: inspection?.certificadoNumero || "—",
        };
      })
      .sort((a, b) => {
        const obraCompare = a.numeroObra.localeCompare(b.numeroObra, "pt-PT", { sensitivity: "base" });
        if (obraCompare !== 0) return obraCompare;
        const shipCompare = a.shipName.localeCompare(b.shipName, "pt-PT", { sensitivity: "base" });
        if (shipCompare !== 0) return shipCompare;
        return a.serial.localeCompare(b.serial, "pt-PT", { sensitivity: "base" });
      });

    const term = search.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((row) => {
      return (
        row.numeroObra.toLowerCase().includes(term) ||
        row.shipName.toLowerCase().includes(term) ||
        row.raftLabel.toLowerCase().includes(term) ||
        row.serial.toLowerCase().includes(term) ||
        row.certificadoNumero.toLowerCase().includes(term)
      );
    });
  }, [inspections, rafts, naviosById, search]);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const techTerm = normalizeText(ordersTechFilter);

    return [...orders]
      .filter((order) => {
        if (ordersStatusFilter !== "all") {
          const status = String(order.status || "").trim().toLowerCase();
          if (status !== ordersStatusFilter) return false;
        }

        if (ordersPriorityFilter !== "all") {
          const prioridade = String(order.prioridade || "").trim().toLowerCase();
          if (prioridade !== ordersPriorityFilter) return false;
        }

        if (techTerm) {
          const tecnico = normalizeText(order.tecnicoResponsavel || "");
          if (!tecnico.includes(techTerm)) return false;
        }

        if (ordersLateOnly && !isOrderLate(order, now)) return false;

        return true;
      })
      .sort((a, b) => {
        const aLate = isOrderLate(a, now);
        const bLate = isOrderLate(b, now);
        if (aLate !== bLate) return aLate ? -1 : 1;

        const priorityDiff = getPriorityWeight(b.prioridade) - getPriorityWeight(a.prioridade);
        if (priorityDiff !== 0) return priorityDiff;

        const aPlannedEnd = a.dataPlaneadaFim ? new Date(a.dataPlaneadaFim).getTime() : Number.POSITIVE_INFINITY;
        const bPlannedEnd = b.dataPlaneadaFim ? new Date(b.dataPlaneadaFim).getTime() : Number.POSITIVE_INFINITY;
        if (aPlannedEnd !== bPlannedEnd) return aPlannedEnd - bPlannedEnd;

        const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bCreated - aCreated;
      });
  }, [orders, ordersStatusFilter, ordersPriorityFilter, ordersTechFilter, ordersLateOnly]);

  const handleObraShipSelect = (shipIdValue: string) => {
    const match = obraNaviosList.find((navio) => String(navio.id) === shipIdValue) || null;
    setObraForm((prev) => ({
      ...prev,
      shipId: shipIdValue,
      shipName: match?.nome || "",
    }));
  };

  const obraPreviewLines = useMemo(() => {
    const lines: ObraPreviewLine[] = [];

    const selectedRaftArticleRefs = new Set(
      selectedRaftsForObra.flatMap((raft) => (raft.artigos || []).map((article) => String(article.referencia || article.codigoFabricante || "").trim().toUpperCase()).filter(Boolean))
    );

    const selectedBrands = new Set(selectedRaftsForObra.map((raft) => normalizeText(raft.brand)).filter(Boolean));
    const selectedModels = new Set(selectedRaftsForObra.map((raft) => normalizeText(raft.model)).filter(Boolean));

    const relatedStockItems = stockItems
      .map((item) => {
        const referencia = String(item.referencia || "").trim();
        const categoria = normalizeStockCategory(item.categoria, `${item.descricao || ""} ${item.referencia || ""} ${item.codigoFabricante || ""}`);
        const applicabilityBrands = splitApplicability(item.aplicavelMarcaJangada).map((value) => normalizeText(value));
        const applicabilityModels = splitApplicability(item.aplicavelModeloJangada).map((value) => normalizeText(value));
        const brandMatch = applicabilityBrands.some((value) => selectedBrands.has(value));
        const modelMatch = applicabilityModels.some((value) => selectedModels.has(value));
        const keywordScore = getRaftKeywordScore(item);
        const categoryBoost = ["CONTENTORES", "TUBOS DE ALTA PRESSÃO", "ACESSÓRIOS", "CONSUMÍVEIS", "CILINDROS", "PIROTÉCNICOS", "PRIMEIROS SOCORROS"].includes(categoria) ? 2 : 0;
        const score =
          (item.associavelJangada ? 5 : 0) +
          (brandMatch ? 3 : 0) +
          (modelMatch ? 4 : 0) +
          Math.min(4, keywordScore) +
          categoryBoost +
          (Number(item.quantidade || 0) > 0 ? 1 : 0);

        return {
          item,
          referencia,
          categoria,
          brandMatch,
          modelMatch,
          keywordScore,
          score,
        };
      })
      .filter(({ item, referencia, categoria, score, brandMatch, modelMatch, keywordScore }) => {
        if (!item.id) return false;
        if (referencia.startsWith("L-")) return false;
        if (selectedRaftArticleRefs.has(referencia.toUpperCase())) return false;
        if (categoria === "COLETES" || categoria === "DIVERSOS") return false;
        return Boolean(item.associavelJangada || brandMatch || modelMatch || keywordScore > 0 || score >= 5);
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.item.descricao || "").localeCompare(String(b.item.descricao || ""), "pt-PT", { sensitivity: "base" });
      })
      .slice(0, 150);

    for (const raft of availableRaftsForObra) {
      if (!raft.id || !selectedRaftIds.includes(raft.id)) continue;
      const pricing = pricingByRaftId[raft.id] || {
        inspectionPrice: servicePriceDefaults.inspection,
        includeFS: false,
        includeNAP: false,
        includeCertificate: true,
        certificatePrice: servicePriceDefaults.certificate,
      };

      lines.push({
        key: `${raft.id}-L-JD`,
        raftId: raft.id,
        referencia: "L-JD",
        descricao: `Inspeção de Jangada · ${raft.model || "Jangada"} · ${raft.serial}`,
        quantidade: 1,
        unitPrice: pricing.inspectionPrice,
        total: pricing.inspectionPrice,
        source: "Serviço base",
      });

      if (pricing.includeNAP) {
        lines.push({
          key: `${raft.id}-L-NAP`,
          raftId: raft.id,
          referencia: "L-NAP",
          descricao: `Teste NAP · ${raft.serial}`,
          quantidade: 1,
          unitPrice: servicePriceDefaults.nap,
          total: servicePriceDefaults.nap,
          source: "Serviço adicional",
        });
      }

      if (pricing.includeFS) {
        lines.push({
          key: `${raft.id}-L-FS`,
          raftId: raft.id,
          referencia: "L-FS",
          descricao: `Teste FS · ${raft.serial}`,
          quantidade: 1,
          unitPrice: servicePriceDefaults.fs,
          total: servicePriceDefaults.fs,
          source: "Serviço adicional",
        });
      }

      if (pricing.includeCertificate) {
        lines.push({
          key: `${raft.id}-L-CER`,
          raftId: raft.id,
          referencia: "L-CER",
          descricao: `Certificado · ${raft.serial}`,
          quantidade: 1,
          unitPrice: pricing.certificatePrice,
          total: pricing.certificatePrice,
          source: "Serviço documental",
        });
      }

      for (const [index, article] of (raft.artigos || []).entries()) {
        const quantidade = Math.max(1, Number(article.quantidade || 1));
        const reference = String(article.referencia || article.codigoFabricante || "ART-SEM-REF").trim();
        const stockItem = stockByReference.get(reference.toUpperCase());
        const unitPrice = resolveArticleUnitPrice(String(article.name || ""), toNumber(stockItem?.precoVenda, 0));
        const articleIdentity = article.id ? `ID-${article.id}` : `IDX-${index}`;
        lines.push({
          key: `${raft.id}-ART-${reference}-${articleIdentity}-${String(article.name || "").trim() || "SEM-NOME"}`,
          raftId: raft.id,
          isArticle: true,
          referencia: reference,
          descricao: `${article.name || "Artigo substituído"} · ${raft.serial}`,
          quantidade,
          unitPrice,
          total: quantidade * unitPrice,
          source: "Artigo substituído / associado",
        });
      }
    }

    relatedStockItems.forEach(({ item, referencia, categoria }) => {
      const unitPrice = toNumber(item.precoVenda, 0);
      const applicability = getApplicabilityBadge(item);
      lines.push({
        key: `STOCK-JANGADA-${item.id}`,
        isSuggestedStock: true,
        referencia: referencia || `STOCK-${item.id}`,
        descricao: `${String(item.descricao || "Artigo de stock").trim()}${applicability ? ` · ${applicability}` : ""}`,
        quantidade: 1,
        unitPrice,
        total: unitPrice,
        source: `Stock jangadas · ${categoria}`,
      });
    });

    return lines;
  }, [availableRaftsForObra, selectedRaftIds, selectedRaftsForObra, pricingByRaftId, servicePriceDefaults, stockByReference, stockItems]);

  const relatedRaftStockItems = useMemo(() => {
    return obraPreviewLines.filter((line) => line.isSuggestedStock);
  }, [obraPreviewLines]);

  useEffect(() => {
    setSelectedLineKeys((prev) => {
      const available = new Set(obraPreviewLines.map((line) => line.key));
      const kept = prev.filter((key) => available.has(key));
      const already = new Set(kept);
      const autoSelectedServices = obraPreviewLines
        .filter((line) => !line.isArticle)
        .map((line) => line.key)
        .filter((key) => !already.has(key));
      return [...kept, ...autoSelectedServices];
    });

    setLineOverrides((prev) => {
      const next: Record<string, { quantidade: number; unitPrice: number }> = {};
      for (const line of obraPreviewLines) {
        const prevValue = prev[line.key];
        next[line.key] = {
          quantidade: prevValue?.quantidade ?? line.quantidade,
          unitPrice: prevValue?.unitPrice ?? line.unitPrice,
        };
      }
      return next;
    });
  }, [obraPreviewLines]);

  useEffect(() => {
    if (!prefillApplied || !prefillJangadaId || selectedRaftsForObra.length === 0 || obraPreviewLines.length === 0) return;

    const prefilledRaftIds = new Set(
      selectedRaftsForObra
        .map((raft) => Number(raft.id))
        .filter((id) => Number.isFinite(id) && id > 0)
    );

    if (!prefilledRaftIds.has(prefillJangadaId)) return;

    const prefillKeys = obraPreviewLines
      .filter((line) => {
        if (!line.raftId) return false;
        if (!prefilledRaftIds.has(Number(line.raftId))) return false;
        return !line.isSuggestedStock;
      })
      .map((line) => line.key);

    if (prefillKeys.length === 0) return;

    setSelectedLineKeys((prev) => Array.from(new Set([...prev, ...prefillKeys])));
  }, [prefillApplied, prefillJangadaId, selectedRaftsForObra, obraPreviewLines]);

  const selectedObraPreviewLines = useMemo(() => {
    const selected = new Set(selectedLineKeys);
    return obraPreviewLines
      .filter((line) => selected.has(line.key))
      .map((line) => {
        const override = lineOverrides[line.key];
        const quantidade = Math.max(0, toNumber(override?.quantidade, line.quantidade));
        const unitPrice = Math.max(0, toNumber(override?.unitPrice, line.unitPrice));
        return {
          ...line,
          quantidade,
          unitPrice,
          total: quantidade * unitPrice,
        };
      });
  }, [obraPreviewLines, selectedLineKeys, lineOverrides]);

  const obraPreviewTotals = useMemo(() => {
    const subtotal = selectedObraPreviewLines.reduce(
      (acc, line) => {
        acc.total += line.total;
        if (line.referencia === "L-JD") acc.base += line.total;
        if (line.referencia === "L-NAP") acc.nap += line.total;
        if (line.referencia === "L-FS") acc.fs += line.total;
        if (line.referencia === "L-CER") acc.certificate += line.total;
        if (!["L-JD", "L-NAP", "L-FS", "L-CER"].includes(line.referencia)) acc.articles += line.total;
        return acc;
      },
      { base: 0, nap: 0, fs: 0, certificate: 0, articles: 0, total: 0 }
    );

    const hasExemptionApplied = obraIvaExempt && hasIvaDeclaration;
    const ivaRate = hasExemptionApplied ? 0 : APP_CONFIG.ivaRate;
    const iva = subtotal.total * ivaRate;

    return {
      ...subtotal,
      ivaRate,
      iva,
      totalComIva: subtotal.total + iva,
      hasExemptionApplied,
    };
  }, [selectedObraPreviewLines, obraIvaExempt, hasIvaDeclaration]);

  const handleGenerateIvaDeclaration = () => {
    if (!selectedNavio) {
      alert("Selecione primeiro o navio para gerar a declaração.");
      return;
    }

    const clienteNomeDeclarante = String(selectedNavio.cliente?.nome || "").trim() || "[Nome do cliente associado ao navio]";
    const clienteNifDeclarante = String(selectedNavio.cliente?.nif || "").trim() || "[Número de Identificação Fiscal do cliente associado ao navio]";

    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(15);
    doc.text("Declaração de Isenção de IVA", 20, y);

    y += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Identificação do Declarante", 20, y);
    doc.setFont("helvetica", "normal");
    y += 7;
    doc.text(doc.splitTextToSize(
      `Eu, ${clienteNomeDeclarante}, com NIF ${clienteNifDeclarante}, associado ao navio denominado ${selectedNavio.nome || "[Nome da Embarcação]"}, com a matrícula ${selectedNavio.matricula || "[Matrícula]"}, registada no Porto ${selectedNavio.portoRegisto || "[Porto de Registo]"}, venho por este meio declarar que:`,
      170
    ), 20, y);

    y += 22;
    doc.setFont("helvetica", "bold");
    doc.text("Atividade da Embarcação", 20, y);
    doc.setFont("helvetica", "normal");
    y += 7;
    doc.text(doc.splitTextToSize(
      "A referida embarcação exerce atividade no setor da pesca marítima (CAE 03110), dedicando-se à pesca profissional.",
      170
    ), 20, y);

    y += 18;
    doc.setFont("helvetica", "bold");
    doc.text("Finalidade dos Serviços", 20, y);
    doc.setFont("helvetica", "normal");
    y += 7;
    doc.text(doc.splitTextToSize(
      "Os serviços de inspeção de jangada e salvamento, adquiridos à empresa Orey Técnica Serviço Navais, Lda, com NIF 501117334, destinam-se à manutenção ou equipamento da citada embarcação.",
      170
    ), 20, y);

    y += 18;
    doc.setFont("helvetica", "bold");
    doc.text("Fundamento Legal", 20, y);
    doc.setFont("helvetica", "normal");
    y += 7;
    doc.text(doc.splitTextToSize(
      "Pelo exposto, solicito a aplicação da isenção de IVA, nos termos da alínea f) do n.º 1 do Artigo 14.º do Código do IVA, por se tratar de operações isentas relativas a embarcações de pesca.",
      170
    ), 20, y);

    y += 18;
    doc.setFont("helvetica", "bold");
    doc.text("Declaração de Responsabilidade", 20, y);
    doc.setFont("helvetica", "normal");
    y += 7;
    doc.text(doc.splitTextToSize(
      "Estou ciente das obrigações declarativas e da responsabilidade pela veracidade destas informações, conforme disposto no Código do IVA.",
      170
    ), 20, y);

    y += 24;
    doc.text(`Lagoa, ${formatDateLongPt()}.`, 20, y);
    y += 18;
    doc.text("Assinatura do Armador / Representante Legal:", 20, y);
    y += 16;
    doc.line(20, y, 110, y);
    y += 8;
    doc.text("[Assinatura]", 20, y);

    doc.save(`declaracao_isencao_iva_${String(selectedNavio.nome || "embarcacao").replace(/\s+/g, "_")}.pdf`);
  };

  const handleCreateObra = async () => {
    if (!selectedNavio?.id) {
      alert("Selecione um navio para criar a OT.");
      return;
    }

    if (selectedRaftIds.length === 0) {
      alert("Selecione pelo menos uma jangada para esta OT.");
      return;
    }

    const numeroObra = String(obraForm.numeroObra || "").trim();
    if (!numeroObra) {
      alert("Indique a referência do grupo OT.");
      return;
    }

    setSavingObra(true);
    try {
      const targetRafts = availableRaftsForObra.filter((raft) => raft.id && selectedRaftIds.includes(raft.id));

      const response = await fetch("/api/ordens-servico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numeroBase: numeroObra,
          grupoNumeroOrdem: numeroObra,
          jangadaIds: targetRafts.map((raft) => raft.id),
          shipId: selectedNavio.id,
          shipName: selectedNavio.nome,
          tipo: "inspecao",
          prioridade: "normal",
          status: "pendente",
          origem: "relatorios",
          descricao: `OT criada manualmente a partir do hub de relatórios para ${selectedNavio.nome}.`,
          metadados: {
            linhas: selectedObraPreviewLines,
            totais: {
              subtotal: obraPreviewTotals.total,
              iva: obraPreviewTotals.iva,
              totalComIva: obraPreviewTotals.totalComIva,
            },
            observacao: hasIvaDeclaration ? "Cliente com declaração de isenção de IVA." : "",
          },
        }),
      });

      const createdOrders = response.ok ? await response.json() : null;
      if (!response.ok) {
        throw new Error(createdOrders?.error || "Falha ao criar ordens de serviço.");
      }

      setRafts((prev) => prev.map((raft) => (
        raft.id && selectedRaftIds.includes(raft.id)
          ? { ...raft, numeroObra, shipId: selectedNavio.id, shipNameManual: selectedNavio.nome }
          : raft
      )));

      setOrders((prev) => {
        const nextCreated = Array.isArray(createdOrders) ? createdOrders as ServiceOrder[] : [];
        const createdIds = new Set(nextCreated.map((order) => order.id));
        return [...nextCreated, ...prev.filter((order) => !createdIds.has(order.id))];
      });

      setObraForm({ shipId: String(selectedNavio.id), shipName: selectedNavio.nome, numeroObra: buildSuggestedObraNumber(rafts.map((raft) => (
        raft.id && selectedRaftIds.includes(raft.id) ? { ...raft, numeroObra } : raft
      ))) });
      setSelectedRaftIds([]);
      alert(`OT criada com o grupo ${numeroObra} e ${targetRafts.length} jangada(s) associadas.`);
    } catch (error) {
      console.error("Erro ao criar OT:", error);
      alert("Não foi possível criar as ordens de serviço.");
    } finally {
      setSavingObra(false);
    }
  };

  const handleGenerateCertificate = (row: InspectionReportRow) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Certificado de Inspeção de Jangada", 20, 20);

    doc.setFontSize(11);
    const lines = [
      `Certificado Nº: ${row.certificadoNumero}`,
      `Data da inspeção: ${row.inspectionDate}`,
      `Navio: ${row.shipName}`,
      `Jangada: ${row.raftLabel}`,
      `Serial: ${row.serial}`,
      `Estado: ${row.status}`,
      `Marca: ${row.raft?.brand || "—"}`,
      `Capacidade: ${row.raft?.capacity || "—"}`,
      `Pack: ${row.raft?.packType || "—"}`,
    ];

    let y = 35;
    lines.forEach((line) => {
      doc.text(line, 20, y);
      y += 8;
    });

    doc.setFontSize(10);
    doc.text("Documento gerado automaticamente pelo sistema.", 20, y + 10);
    doc.save(`certificado_${row.serial}_${row.certificadoNumero}.pdf`);
  };

  const handleGenerateQuadro = async (row: InspectionReportRow) => {
    const payload = row.raft || {
      serial: row.serial,
      model: row.raftLabel,
      owner: row.shipName,
      dataInspecao: row.inspection.dataInspecao,
    };

    const response = await fetch("/api/exportar-raft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      alert("Erro ao gerar quadro de inspeção.");
      return;
    }

    const blob = await response.blob();
    const inspectionMonthYear = (() => {
      const raw = String(row.inspection.dataInspecao || '').trim();
      if (!raw) return '';
      const iso = raw.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
      if (iso) return `${iso[2]}/${iso[1]}`;
      const pt = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (pt) return `${String(Number(pt[2])).padStart(2, '0')}/${pt[3]}`;
      return raw;
    })();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = response.headers.get("Content-Disposition")?.match(/filename="?([^";]+)"?/)?.[1]
      || `${[String(row.serial || '').trim(), String(row.raft?.brand || '').trim(), String(row.raft?.model || row.raftLabel || '').trim(), (() => {
        const raw = String(row.raft?.capacity || '').trim();
        const match = raw.match(/\d+/);
        return match ? `${Number(match[0])}P` : raw;
      })()].filter(Boolean).join(' ').trim() || 'jangada'}${inspectionMonthYear ? ` (${inspectionMonthYear})` : ''}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportCsv = (tipo: "clientes" | "navios" | "jangadas") => {
    window.open(`/api/relatorios/export?tipo=${tipo}`, "_blank");
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
        <p className="text-sm text-gray-600">Hub da Fase 1: criar OT manuais por jangada, reaproveitando o fluxo comercial/técnico já existente.</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            type="button"
            onClick={() => handleExportCsv("clientes")}
            className="bg-slate-700 hover:bg-slate-800 text-white rounded px-3 py-1.5 text-xs font-medium"
          >
            Exportar clientes CSV
          </button>
          <button
            type="button"
            onClick={() => handleExportCsv("navios")}
            className="bg-slate-700 hover:bg-slate-800 text-white rounded px-3 py-1.5 text-xs font-medium"
          >
            Exportar navios CSV
          </button>
          <button
            type="button"
            onClick={() => handleExportCsv("jangadas")}
            className="bg-slate-700 hover:bg-slate-800 text-white rounded px-3 py-1.5 text-xs font-medium"
          >
            Exportar jangadas CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-slate-900">Criar grupo OT manual</h2>
          <p className="text-sm text-gray-600">Escolha o navio, selecione as jangadas e crie uma única OT multi-jangada, mantendo a mesma referência de grupo para o serviço.</p>
          {prefillApplied && prefillJangadaId > 0 ? (
            <div className="mt-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
              Pré-preenchido a partir da ficha da jangada.
              {selectedRaftsForObra[0]?.id ? (
                <>
                  {" "}
                  <Link href={`/jangadas/${selectedRaftsForObra[0].id}`} className="font-semibold underline underline-offset-2">
                    Voltar à ficha
                  </Link>
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Navio</label>
            <select
              value={selectedNavio?.id ? String(selectedNavio.id) : obraForm.shipId}
              onChange={(e) => handleObraShipSelect(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
            >
              <option value="">Escolher navio...</option>
              {obraNaviosList.map((navio) => (
                <option key={navio.id} value={String(navio.id)}>
                  {getShipOptionLabel(navio)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Grupo OT</label>
            <input
              value={obraForm.numeroObra}
              onChange={(e) => setObraForm((prev) => ({ ...prev, numeroObra: e.target.value }))}
              placeholder="Ex.: OBR-20260313-001"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700 flex flex-col justify-center">
            <span><b>Navio:</b> {selectedNavio?.nome || "—"}</span>
            <span><b>Jangadas selecionadas:</b> {selectedRaftIds.length}</span>
              {selectedRaftsForObra[0]?.serial ? <span><b>Origem:</b> ficha da jangada {selectedRaftsForObra[0].serial}</span> : null}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
            <div>
              <div className="text-sm font-medium text-gray-900">Jangadas do navio</div>
              <div className="text-xs text-gray-500">Selecione uma ou mais jangadas para a mesma proforma/orçamento.</div>
            </div>
            {availableRaftsForObra.length > 0 ? (
              <button
                type="button"
                onClick={() => setSelectedRaftIds((prev) => prev.length === availableRaftsForObra.length ? [] : availableRaftsForObra.map((raft) => raft.id!).filter(Boolean))}
                className="text-xs rounded border border-gray-300 bg-white px-2.5 py-1.5"
              >
                {selectedRaftIds.length === availableRaftsForObra.length ? "Limpar seleção" : "Selecionar todas"}
              </button>
            ) : null}
          </div>

          <div className="max-h-72 overflow-auto divide-y divide-gray-100">
            {availableRaftsForObra.length === 0 ? (
              <div className="px-3 py-6 text-sm text-gray-500">Escolha um navio para ver as jangadas disponíveis.</div>
            ) : availableRaftsForObra.map((raft) => {
              const checked = Boolean(raft.id && selectedRaftIds.includes(raft.id));
              const pricing = raft.id ? pricingByRaftId[raft.id] : undefined;
              return (
                <label key={raft.id || raft.serial} className="flex items-start gap-3 px-3 py-3 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const raftId = raft.id;
                      if (!raftId) return;
                      setSelectedRaftIds((prev) => (
                        e.target.checked ? Array.from(new Set([...prev, raftId])) : prev.filter((id) => id !== raftId)
                      ));
                    }}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-900">{raft.model || "Jangada"} · {raft.serial}</div>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1 mt-1">
                      <span>Marca: {raft.brand || "—"}</span>
                      <span>Lotação: {raft.capacity || "—"}</span>
                      <span>Pack: {raft.packType || "—"}</span>
                      <span>Grupo atual: {raft.numeroObra || "—"}</span>
                    </div>
                    {checked && raft.id ? (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2 rounded-lg border border-slate-200 bg-white p-3">
                        <div className="space-y-1">
                          <span className="text-[11px] font-medium text-gray-600">Inspeção L-JD</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={pricing?.inspectionPrice ?? servicePriceDefaults.inspection}
                            onChange={(e) => setPricingByRaftId((prev) => ({
                              ...prev,
                              [raft.id!]: {
                                ...(prev[raft.id!] || {
                                  inspectionPrice: servicePriceDefaults.inspection,
                                  includeFS: false,
                                  includeNAP: false,
                                  includeCertificate: true,
                                  certificatePrice: servicePriceDefaults.certificate,
                                }),
                                inspectionPrice: toNumber(e.target.value, 0),
                              },
                            }))}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={Boolean(pricing?.includeNAP)}
                            onChange={(e) => setPricingByRaftId((prev) => ({
                              ...prev,
                              [raft.id!]: {
                                ...(prev[raft.id!] || {
                                  inspectionPrice: servicePriceDefaults.inspection,
                                  includeFS: false,
                                  includeNAP: false,
                                  includeCertificate: true,
                                  certificatePrice: servicePriceDefaults.certificate,
                                }),
                                includeNAP: e.target.checked,
                              },
                            }))}
                          />
                          NAP (+ {formatCurrency(servicePriceDefaults.nap)})
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={Boolean(pricing?.includeFS)}
                            onChange={(e) => setPricingByRaftId((prev) => ({
                              ...prev,
                              [raft.id!]: {
                                ...(prev[raft.id!] || {
                                  inspectionPrice: servicePriceDefaults.inspection,
                                  includeFS: false,
                                  includeNAP: false,
                                  includeCertificate: true,
                                  certificatePrice: servicePriceDefaults.certificate,
                                }),
                                includeFS: e.target.checked,
                              },
                            }))}
                          />
                          FS (+ {formatCurrency(servicePriceDefaults.fs)})
                        </label>
                        <div className="space-y-1">
                          <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={Boolean(pricing?.includeCertificate)}
                              onChange={(e) => setPricingByRaftId((prev) => ({
                                ...prev,
                                [raft.id!]: {
                                  ...(prev[raft.id!] || {
                                    inspectionPrice: servicePriceDefaults.inspection,
                                    includeFS: false,
                                    includeNAP: false,
                                    includeCertificate: true,
                                    certificatePrice: servicePriceDefaults.certificate,
                                  }),
                                  includeCertificate: e.target.checked,
                                },
                              }))}
                            />
                            Certificado L-CER
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={pricing?.certificatePrice ?? servicePriceDefaults.certificate}
                            onChange={(e) => setPricingByRaftId((prev) => ({
                              ...prev,
                              [raft.id!]: {
                                ...(prev[raft.id!] || {
                                  inspectionPrice: servicePriceDefaults.inspection,
                                  includeFS: false,
                                  includeNAP: false,
                                  includeCertificate: true,
                                  certificatePrice: servicePriceDefaults.certificate,
                                }),
                                certificatePrice: toNumber(e.target.value, 0),
                              },
                            }))}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {selectedRaftIds.length > 0 ? (
          <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-cyan-900">Stock relacionado com jangadas</h3>
                <p className="text-sm text-cyan-800">Mostra artigos do stock ligados a jangadas para esta OT — como cintas, retenidas, anilhas, pilhas e restantes consumíveis/acessórios relevantes.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs font-semibold text-cyan-800">
                  {relatedRaftStockItems.length} artigo(s) sugerido(s)
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedLineKeys((prev) => Array.from(new Set([...prev, ...relatedRaftStockItems.map((line) => line.key)])))}
                  className="rounded border border-cyan-300 bg-white px-3 py-1.5 text-xs font-medium text-cyan-800"
                >
                  Incluir stock de jangadas
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 max-h-72 overflow-auto">
              {relatedRaftStockItems.length === 0 ? (
                <div className="rounded-lg border border-dashed border-cyan-300 bg-white px-3 py-4 text-sm text-cyan-900">
                  Não encontrei artigos específicos de stock para as jangadas selecionadas. Confere se os itens no stock estão marcados como associáveis a jangadas ou com marca/modelo aplicável.
                </div>
              ) : relatedRaftStockItems.map((line) => {
                const stockSelected = selectedLineKeys.includes(line.key);
                return (
                  <label key={line.key} className={`rounded-lg border px-3 py-3 cursor-pointer transition ${stockSelected ? "border-cyan-400 bg-white shadow-sm" : "border-cyan-200 bg-white/80 hover:bg-white"}`}>
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={stockSelected}
                        onChange={(e) => setSelectedLineKeys((prev) => (
                          e.target.checked ? Array.from(new Set([...prev, line.key])) : prev.filter((key) => key !== line.key)
                        ))}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900">{line.referencia}</span>
                          <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-medium text-cyan-800">{line.source}</span>
                        </div>
                        <div className="mt-1 text-sm text-slate-700">{line.descricao}</div>
                        <div className="mt-2 text-xs text-slate-500">Preço base: {formatCurrency(line.unitPrice)}</div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Pré-visualização da inspeção de jangada</h3>
              <p className="text-sm text-gray-600">Inclui inspeção de jangada base, NAP/FS, artigos já associados e artigos sugeridos do stock de jangadas. Seleciona as linhas que queres cobrar.</p>
              <p className="text-xs text-gray-500 mt-1">As linhas de artigos começam por defeito desmarcadas. Podes editar quantidade e preço unitário.</p>
              {obraIvaExempt ? (
                <p className="text-xs font-medium text-emerald-700 mt-1">Navio elegível para isenção (pesca). Sem declaração assinada, será cobrado IVA 16%.</p>
              ) : null}
            </div>
            <div className="text-right text-sm text-slate-700">
              <div><b>Subtotal:</b> {formatCurrency(obraPreviewTotals.total)}</div>
              <div><b>IVA ({Math.round(obraPreviewTotals.ivaRate * 100)}%):</b> {formatCurrency(obraPreviewTotals.iva)}</div>
              <div><b>Total c/ IVA:</b> {formatCurrency(obraPreviewTotals.totalComIva)}</div>
              <div className="text-xs text-gray-500">Base {formatCurrency(obraPreviewTotals.base)} · NAP {formatCurrency(obraPreviewTotals.nap)} · FS {formatCurrency(obraPreviewTotals.fs)} · Cert. {formatCurrency(obraPreviewTotals.certificate)} · Artigos {formatCurrency(obraPreviewTotals.articles)}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={hasIvaDeclaration}
                onChange={(e) => setHasIvaDeclaration(e.target.checked)}
                disabled={!obraIvaExempt}
              />
              Cliente entregou declaração de isenção de IVA
            </label>
            <button
              type="button"
              onClick={handleGenerateIvaDeclaration}
              className="rounded border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
            >
              Gerar Declaração de Isenção de IVA
            </button>
            <button
              type="button"
              onClick={() => setSelectedLineKeys(obraPreviewLines.map((line) => line.key))}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs"
            >
              Selecionar todas as linhas
            </button>
            <button
              type="button"
              onClick={() => setSelectedLineKeys(obraPreviewLines.filter((line) => !line.isArticle).map((line) => line.key))}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs"
            >
              Só serviços
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-auto bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-center whitespace-nowrap">Incluir</th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">Ref.</th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">Descrição</th>
                  <th className="px-3 py-2 text-left whitespace-nowrap">Origem</th>
                  <th className="px-3 py-2 text-right whitespace-nowrap">Qtd.</th>
                  <th className="px-3 py-2 text-right whitespace-nowrap">Unit.</th>
                  <th className="px-3 py-2 text-right whitespace-nowrap">Total</th>
                </tr>
              </thead>
              <tbody>
                {obraPreviewLines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-sm text-gray-500">Selecione jangadas para montar a proforma/orçamento.</td>
                  </tr>
                ) : obraPreviewLines.map((line) => {
                  const selected = selectedLineKeys.includes(line.key);
                  const override = lineOverrides[line.key];
                  const quantidade = Math.max(0, toNumber(override?.quantidade, line.quantidade));
                  const unitPrice = Math.max(0, toNumber(override?.unitPrice, line.unitPrice));
                  const rowTotal = quantidade * unitPrice;

                  return (
                  <tr key={line.key} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => setSelectedLineKeys((prev) => {
                          if (e.target.checked) return Array.from(new Set([...prev, line.key]));
                          return prev.filter((key) => key !== line.key);
                        })}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-700">{line.referencia}</td>
                    <td className="px-3 py-2">{line.descricao}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{line.source}</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={quantidade}
                        onChange={(e) => setLineOverrides((prev) => ({
                          ...prev,
                          [line.key]: {
                            quantidade: toNumber(e.target.value, 0),
                            unitPrice,
                          },
                        }))}
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={unitPrice}
                        onChange={(e) => setLineOverrides((prev) => ({
                          ...prev,
                          [line.key]: {
                            quantidade,
                            unitPrice: toNumber(e.target.value, 0),
                          },
                        }))}
                        className="w-28 border border-gray-300 rounded px-2 py-1 text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">{formatCurrency(rowTotal)}</td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleCreateObra()}
            disabled={savingObra}
            className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {savingObra ? "A criar OT(s)..." : "Criar OT(s)"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">OT criadas</h2>
            <p className="text-sm text-gray-600">Listagem operacional com foco de planeamento (técnico, prioridade e atrasos).</p>
          </div>
          <div className="text-sm text-gray-500">{filteredOrders.length} / {orders.length} OT(s)</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <select
            value={ordersStatusFilter}
            onChange={(e) => setOrdersStatusFilter(e.target.value)}
            className="rounded border border-gray-300 px-2.5 py-2 text-sm"
          >
            <option value="all">Estado: todos</option>
            <option value="pendente">Pendente</option>
            <option value="agendada">Agendada</option>
            <option value="confirmada">Confirmada</option>
            <option value="em_progresso">Em progresso</option>
            <option value="pausada">Pausada</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>

          <select
            value={ordersPriorityFilter}
            onChange={(e) => setOrdersPriorityFilter(e.target.value)}
            className="rounded border border-gray-300 px-2.5 py-2 text-sm"
          >
            <option value="all">Prioridade: todas</option>
            <option value="baixa">Baixa</option>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>

          <input
            value={ordersTechFilter}
            onChange={(e) => setOrdersTechFilter(e.target.value)}
            placeholder="Técnico responsável"
            className="rounded border border-gray-300 px-2.5 py-2 text-sm"
          />

          <label className="inline-flex items-center gap-2 rounded border border-gray-300 px-2.5 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={ordersLateOnly}
              onChange={(e) => setOrdersLateOnly(e.target.checked)}
            />
            Só atrasadas
          </label>

          <button
            type="button"
            onClick={() => {
              setOrdersStatusFilter("all");
              setOrdersPriorityFilter("all");
              setOrdersTechFilter("");
              setOrdersLateOnly(false);
            }}
            className="rounded border border-gray-300 bg-white px-2.5 py-2 text-sm"
          >
            Limpar filtros
          </button>
        </div>

        <div className="overflow-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left">OT</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-left">Jangada</th>
                <th className="px-3 py-2 text-left">Navio / Cliente</th>
                <th className="px-3 py-2 text-left">Técnico</th>
                <th className="px-3 py-2 text-left">Fluxo</th>
                <th className="px-3 py-2 text-left">Prevista</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-gray-500">Sem ordens de serviço para os filtros atuais.</td>
                </tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <div className="font-semibold text-slate-900">{order.numeroOrdem}</div>
                    <div className="text-xs text-gray-500">Grupo: {order.grupoNumeroOrdem || "—"}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{order.status}</span>
                      {isOrderLate(order) ? (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">Atrasada</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-900">{`${order.jangada?.brand || ""} ${order.jangada?.model || ""}`.trim() || "Jangada"}</div>
                    <div className="text-xs text-gray-500">{order.jangada?.serial || "—"}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div>{order.jangada?.shipNameManual || order.jangada?.owner || "—"}</div>
                    <div className="text-xs text-gray-500">{order.cliente?.nome || "Sem cliente associado"}</div>
                  </td>
                  <td className="px-3 py-2">{order.tecnicoResponsavel || "—"}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs text-gray-400">—</span>
                  </td>
                  <td className="px-3 py-2">{formatDate(order.dataPrevista)}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <a href={`/ordens-servico/${order.id}`} className="rounded border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">Abrir OT</a>
                      {order.jangada?.id ? (
                        <a href={`/jangadas/${order.jangada.id}`} className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700">Jangada</a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
