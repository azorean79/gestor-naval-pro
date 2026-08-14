"use client";

import { useCallback, useEffect, useState } from "react";
import { 
  FileText, Receipt, Search, Loader2, Save, Download, 
  CheckCircle2, AlertCircle, Edit3, RefreshCcw, Percent, 
  DollarSign, Wrench, ShieldCheck, Zap, Link2, Check, 
  TrendingUp, PieChart, Building2, BarChart3, Wallet, MessageSquare, BadgeCheck, CreditCard,
  CalendarRange, Award, FileMinus, Gauge
} from "lucide-react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { formatDateTimeShort } from "@/lib/date-utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const CHART_TICK_COLOR = "#94a3b8";
const CHART_GRID_COLOR = "rgba(148, 163, 184, 0.12)";

const PAGAMENTO_STATUS_LIST = ["Pendente", "Pago Parcialmente", "Pago", "Vencido"];

const PAGAMENTO_BADGE_CLASSES: Record<string, string> = {
  Pendente: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "Pago Parcialmente": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Pago: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Vencido: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

type OrdemItem = {
  id: number;
  numeroOrdem?: string | null;
  status?: string | null;
  orcamentoStatus?: string | null;
  valorPecas?: number | null;
  valorMaoObra?: number | null;
  valorDesconto?: number | null;
  isIsentoIva?: boolean | null;
  valorTotal?: number | null;
  dataAbertura?: string | null;
  dataConclusao?: string | null;
  metadados?: any;
  jangada?: { serial?: string | null; brand?: string | null; model?: string | null; owner?: string | null; shipNameManual?: string | null } | null;
  cliente?: { id?: number; nome?: string | null; nif?: string | null; morada?: string | null; localidade?: string | null; ilha?: string | null } | null;
  serviceStation?: { codigo?: string | null; nome?: string | null } | null;
  tecnico?: { nome?: string | null } | null;
};

function getPagamentoStatus(ordem: OrdemItem | null) {
  if (!ordem) return "Pendente";
  const meta = ordem.metadados || {};
  return meta.pagamentoStatus || ordem.orcamentoStatus || "Pendente";
}

export default function FaturacaoConsolePage() {
  const [viewMode, setViewMode] = useState<"console" | "kpis">("console");
  const [loadingList, setLoadingList] = useState(true);
  const [orders, setOrders] = useState<OrdemItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"orcamento" | "fatura">("orcamento");

  // Editable fields for selected order
  const [editPecas, setEditPecas] = useState("0");
  const [editMaoObra, setEditMaoObra] = useState("0");
  const [editDesconto, setEditDesconto] = useState("0");
  const [editIsentoIva, setEditIsentoIva] = useState(false);
  const [editOrcamentoStatus, setEditOrcamentoStatus] = useState("Rascunho");
  const [editStatus, setEditStatus] = useState("aberta");
  const [editPagamento, setEditPagamento] = useState("Pendente");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoadingList(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams({ includeClosed: "1" });
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (statusFilter) params.set("orcamentoStatus", statusFilter);
      const res = await fetch(`/api/ordens-servico?${params.toString()}`);
      if (!res.ok) throw new Error("Falha ao carregar ordens de serviço.");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setOrders(list);
      if (list.length > 0 && !selectedId) {
        selectOrder(list[0]);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || "Erro ao carregar lista.");
    } finally {
      setLoadingList(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const selectOrder = (ordem: OrdemItem) => {
    setSelectedId(ordem.id);
    setEditPecas(String(ordem.valorPecas ?? 0));
    setEditMaoObra(String(ordem.valorMaoObra ?? 0));
    setEditDesconto(String(ordem.valorDesconto ?? 0));
    setEditIsentoIva(Boolean(ordem.isIsentoIva));
    setEditOrcamentoStatus(ordem.orcamentoStatus || "Rascunho");
    setEditStatus(ordem.status || "aberta");
    setEditPagamento(getPagamentoStatus(ordem));
    setErrorMsg(null);
    setSuccessMsg(null);
    setCopiedLink(false);
  };

  const selectedOrder = orders.find((o) => o.id === selectedId) || null;

  // Live calculations
  const numPecas = Number(editPecas) || 0;
  const numMaoObra = Number(editMaoObra) || 0;
  const numDesconto = Number(editDesconto) || 0;
  const subtotal = Math.max(0, numPecas + numMaoObra - numDesconto);
  const iva = editIsentoIva ? 0 : subtotal * 0.16;
  const total = subtotal + iva;

  const handleSave = async (override?: { orcamentoStatus?: string; status?: string }): Promise<boolean> => {
    if (!selectedOrder) return false;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payloadOrcStatus = override?.orcamentoStatus ?? editOrcamentoStatus;
    const payloadStatus = override?.status ?? editStatus;

    try {
      const res = await fetch(`/api/ordens-servico/${selectedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valorPecas: numPecas,
          valorMaoObra: numMaoObra,
          valorDesconto: numDesconto,
          isIsentoIva: editIsentoIva,
          orcamentoStatus: payloadOrcStatus,
          status: payloadStatus,
          metadados: { pagamentoStatus: editPagamento },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const details = body?.details?.length ? `: ${body.details.join("; ")}` : "";
        throw new Error(`${body?.error || "Erro ao atualizar valores."}${details}`);
      }

      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated, metadados: { ...(o.metadados || {}), pagamentoStatus: editPagamento } } : o)));
      if (override?.orcamentoStatus) setEditOrcamentoStatus(override.orcamentoStatus);
      if (override?.status) setEditStatus(override.status);
      setSuccessMsg(override?.orcamentoStatus === "Aprovado"
        ? "Orçamento aprovado com sucesso!"
        : "Orçamento / Valores / Pagamento atualizados com sucesso!");
      return true;
    } catch (e: any) {
      setErrorMsg(e?.message || "Erro ao salvar alterações.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Manual approval (just approve budget, no order closure required)
  const handleAprovarOrcamento = async () => {
    await handleSave({ orcamentoStatus: "Aprovado" });
  };

  // Approve + try to conclude + download invoice
  const handleAprovarEConcluirFaturar = async () => {
    if (!selectedOrder) return;
    const ok = await handleSave({ orcamentoStatus: "Aprovado", status: "concluida" });
    if (ok) {
      window.open(`/api/ordens-servico/${selectedOrder.id}/fatura-excel`, "_blank");
    }
  };

  const handleCopyPublicLink = () => {
    if (!selectedOrder) return;
    const url = `${window.location.origin}/public/orcamento/${selectedOrder.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleWhatsAppShare = () => {
    if (!selectedOrder) return;
    const url = `${window.location.origin}/public/orcamento/${selectedOrder.id}`;
    const clientName = selectedOrder.cliente?.nome || selectedOrder.jangada?.owner || "Cliente";
    const orderNum = selectedOrder.numeroOrdem || selectedOrder.id;
    const text = encodeURIComponent(
      `Olá ${clientName}, o orçamento para a Ordem de Serviço #${orderNum} (Total: € ${total.toFixed(2)}) já está disponível para consulta e aprovação online em: ${url}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleDownloadExcel = (type: "orcamento" | "fatura") => {
    if (!selectedOrder) return;
    if (type === "fatura" && selectedOrder.status !== "concluida" && editStatus !== "concluida") {
      setErrorMsg("Atenção: Para emitir a Fatura Oficial, a Ordem de Serviço deve estar concluída.");
    }
    const endpoint = type === "orcamento" ? "orcamento-excel" : "fatura-excel";
    window.open(`/api/ordens-servico/${selectedOrder.id}/${endpoint}`, "_blank");
  };

  // KPI Calculations
  const pendingOrders = orders.filter((o) => !o.orcamentoStatus || o.orcamentoStatus === "Rascunho" || o.orcamentoStatus === "Enviado" || o.orcamentoStatus === "Pendente");
  const approvedOrders = orders.filter((o) => o.orcamentoStatus === "Aprovado");
  const rejectedOrders = orders.filter((o) => o.orcamentoStatus === "Rejeitado");

  const totalPendingValue = pendingOrders.reduce((acc, o) => acc + Number(o.valorTotal || 0), 0);
  const totalApprovedValue = approvedOrders.reduce((acc, o) => acc + Number(o.valorTotal || 0), 0);

  const totalDecided = approvedOrders.length + rejectedOrders.length;
  const conversionRate = totalDecided > 0 ? (approvedOrders.length / totalDecided) * 100 : 0;

  // Contas a Receber
  const invoicedOrders = orders.filter((o) => o.status === "concluida");
  const paymentBreakdown = PAGAMENTO_STATUS_LIST.map((status) => ({
    status,
    count: invoicedOrders.filter((o) => getPagamentoStatus(o) === status).length,
    total: invoicedOrders.filter((o) => getPagamentoStatus(o) === status).reduce((acc, o) => acc + Number(o.valorTotal || 0), 0),
  }));
  const outstandingOrders = invoicedOrders.filter((o) => getPagamentoStatus(o) !== "Pago");
  const totalOutstanding = outstandingOrders.reduce((acc, o) => acc + Number(o.valorTotal || 0), 0);

  // Group billing by service station
  const stationBillingMap = new Map<string, { nome: string; count: number; total: number }>();
  orders.forEach((o) => {
    if (o.status === "concluida" || o.orcamentoStatus === "Aprovado") {
      const stationName = o.serviceStation?.nome || "Orey Técnica (Geral)";
      const current = stationBillingMap.get(stationName) || { nome: stationName, count: 0, total: 0 };
      current.count += 1;
      current.total += Number(o.valorTotal || 0);
      stationBillingMap.set(stationName, current);
    }
  });
  const stationBillingList = Array.from(stationBillingMap.values());

  // ── Dashboard avançado ─────────────────────────────────────────────
  // Faturação mensal (últimos 12 meses, ordens concluídas)
  const monthlyBillingMap = new Map<string, number>();
  const now = new Date();
  const last12Keys: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last12Keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  invoicedOrders.forEach((o) => {
    const rawDate = o.dataConclusao || o.dataAbertura;
    const d = rawDate ? new Date(rawDate) : null;
    const key = d && !Number.isNaN(d.getTime())
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      : null;
    if (!key) return;
    monthlyBillingMap.set(key, (monthlyBillingMap.get(key) || 0) + Number(o.valorTotal || 0));
  });
  const monthlyLabels = last12Keys.map((k) => {
    const [y, m] = k.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    return `${d.toLocaleDateString("pt-PT", { month: "short" })}/${String(y).slice(2)}`;
  });
  const monthlyValues = last12Keys.map((k) => monthlyBillingMap.get(k) || 0);
  const hasMonthlyBilling = monthlyValues.some((v) => v > 0);

  const monthlyChartData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: "Faturação (€)",
        data: monthlyValues,
        backgroundColor: monthlyValues.map((_, idx) =>
          idx === monthlyValues.length - 1 ? "#2dd4bf" : "#14b8a6"
        ),
        borderRadius: 6,
      },
    ],
  };
  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `€ ${Number(ctx.parsed.y || 0).toFixed(2)}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: CHART_TICK_COLOR }, grid: { color: CHART_GRID_COLOR } },
      y: {
        ticks: { color: CHART_TICK_COLOR, callback: (v: any) => `€${v}` },
        grid: { color: CHART_GRID_COLOR },
      },
    },
  };

  // Top clientes (por valor faturado)
  const clientBillingMap = new Map<string, number>();
  invoicedOrders.forEach((o) => {
    const name = o.cliente?.nome || o.jangada?.owner || "Cliente Particular";
    clientBillingMap.set(name, (clientBillingMap.get(name) || 0) + Number(o.valorTotal || 0));
  });
  const topClients = Array.from(clientBillingMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxClientValue = topClients.length > 0 ? topClients[0][1] : 0;

  // Composição da faturação: Mão de obra vs Peças
  const totalMaoObraFaturado = invoicedOrders.reduce((acc, o) => acc + Number(o.valorMaoObra || 0), 0);
  const totalPecasFaturado = invoicedOrders.reduce((acc, o) => acc + Number(o.valorPecas || 0), 0);
  const totalComponentes = totalMaoObraFaturado + totalPecasFaturado;

  const compositionChartData = {
    labels: ["Mão de Obra", "Peças / Materiais"],
    datasets: [
      {
        data: [totalMaoObraFaturado, totalPecasFaturado],
        backgroundColor: ["#2dd4bf", "#3b82f6"],
        borderColor: ["#0f766e", "#1d4ed8"],
        borderWidth: 2,
      },
    ],
  };
  const compositionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: CHART_TICK_COLOR },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `€ ${Number(ctx.parsed || 0).toFixed(2)}`,
        },
      },
    },
  };

  // Margem média por OT concluída
  const avgInvoice = invoicedOrders.length > 0
    ? invoicedOrders.reduce((acc, o) => acc + Number(o.valorTotal || 0), 0) / invoicedOrders.length
    : 0;

  const handleDownloadNotaCredito = () => {
    if (!selectedOrder) return;
    if (selectedOrder.status !== "concluida" && editStatus !== "concluida") {
      setErrorMsg("Para emitir a Nota de Crédito, a Ordem de Serviço deve estar concluída.");
      return;
    }
    window.open(`/api/ordens-servico/${selectedOrder.id}/nota-credito-excel`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 p-2.5 text-teal-400">
            <Receipt size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Consola de Faturação & Orçamentos</h1>
            <p className="text-xs text-slate-400">Gestão interativa, aprovação, WhatsApp, contas a receber e KPIs financeiros</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
            <button
              onClick={() => setViewMode("console")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === "console" ? "bg-teal-500 text-slate-950 shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              Consola de Emissão
            </button>
            <button
              onClick={() => setViewMode("kpis")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 ${
                viewMode === "kpis" ? "bg-teal-500 text-slate-950 shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              <BarChart3 size={14} /> Dashboard KPIs
            </button>
          </div>

          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            <RefreshCcw size={14} /> Atualizar
          </button>
        </div>
      </header>

      {viewMode === "kpis" ? (
        /* KPI Dashboard View */
        <div className="flex-1 p-8 overflow-y-auto bg-slate-950">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Dashboard de KPIs Financeiros</h2>
              <p className="text-sm text-slate-400">Métricas de orçamentos, conversão, contas a receber e faturação por estação.</p>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Orçamentos Pendentes</span>
                  <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400"><Wallet size={20} /></div>
                </div>
                <div className="text-2xl font-black text-white font-mono">€ {totalPendingValue.toFixed(2)}</div>
                <p className="text-xs text-amber-300/80 font-medium">{pendingOrders.length} orçamentos aguardando resposta</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Orçamentos Aprovados</span>
                  <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400"><TrendingUp size={20} /></div>
                </div>
                <div className="text-2xl font-black text-white font-mono">€ {totalApprovedValue.toFixed(2)}</div>
                <p className="text-xs text-emerald-300/80 font-medium">{approvedOrders.length} orçamentos aprovados</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Taxa de Conversão</span>
                  <div className="rounded-xl bg-teal-500/10 p-2 text-teal-400"><PieChart size={20} /></div>
                </div>
                <div className="text-2xl font-black text-teal-300 font-mono">{conversionRate.toFixed(1)}%</div>
                <p className="text-xs text-slate-400">Baseado em {totalDecided} orçamentos decididos</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Analisado</span>
                  <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400"><DollarSign size={20} /></div>
                </div>
                <div className="text-2xl font-black text-white font-mono">{orders.length} OTs</div>
                <p className="text-xs text-slate-400">Ordens de serviço no sistema</p>
              </div>
            </div>

            {/* Contas a Receber */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="text-teal-400" size={20} />
                  <h3 className="text-base font-bold text-white">Contas a Receber — Estados de Pagamento</h3>
                </div>
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-1.5 text-xs font-bold text-rose-300">
                  Em dívida: € {totalOutstanding.toFixed(2)}
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {paymentBreakdown.map((entry) => (
                  <div key={entry.status} className={`rounded-xl border p-4 space-y-2 ${PAGAMENTO_BADGE_CLASSES[entry.status] || PAGAMENTO_BADGE_CLASSES.Pendente}`}>
                    <div className="text-xs font-semibold uppercase tracking-wider opacity-80">{entry.status}</div>
                    <div className="text-xl font-black font-mono">€ {entry.total.toFixed(2)}</div>
                    <div className="text-xs opacity-80">{entry.count} faturas</div>
                  </div>
                ))}
              </div>

              {outstandingOrders.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">Sem valores em dívida. Todas as faturas emitidas estão pagas.</div>
              ) : (
                <div className="rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-800/80 text-slate-300 uppercase tracking-wider">
                        <th className="p-3">Ordem</th>
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Estado Pagamento</th>
                        <th className="p-3 text-right">Valor em dívida</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {outstandingOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-800/30">
                          <td className="p-3 font-mono text-teal-300">#{o.numeroOrdem || o.id}</td>
                          <td className="p-3 font-semibold text-slate-200">{o.cliente?.nome || o.jangada?.owner || "Cliente Particular"}</td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-semibold ${PAGAMENTO_BADGE_CLASSES[getPagamentoStatus(o)] || PAGAMENTO_BADGE_CLASSES.Pendente}`}>
                              {getPagamentoStatus(o)}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-300">€ {Number(o.valorTotal || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Station Billing Consolidation */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Building2 className="text-teal-400" size={20} />
                <h3 className="text-base font-bold text-white">Faturação Consolidada por Estação de Serviço</h3>
              </div>

              {stationBillingList.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">Sem dados suficientes para consolidação por estação.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stationBillingList.map((station, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                      <div className="text-sm font-bold text-slate-200">{station.nome}</div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs text-slate-400">{station.count} OTs concl./aprov.</span>
                        <span className="text-base font-mono font-bold text-teal-400">€ {station.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Dashboard Avançado ── */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pt-2">
                <Gauge className="text-teal-400" size={20} />
                <h3 className="text-lg font-bold text-white">Análise Avançada</h3>
              </div>

              {/* Faturação mensal */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <CalendarRange className="text-teal-400" size={20} />
                    <h4 className="text-base font-bold text-white">Faturação Mensal (últimos 12 meses)</h4>
                  </div>
                  <span className="text-xs font-mono bg-teal-500/20 text-teal-300 px-3 py-1 rounded-full border border-teal-500/30">
                    {invoicedOrders.length} faturas emitidas
                  </span>
                </div>
                {!hasMonthlyBilling ? (
                  <div className="text-center py-10 text-slate-500 text-sm">Sem faturas emitidas nos últimos 12 meses.</div>
                ) : (
                  <div className="h-64">
                    <Bar data={monthlyChartData} options={monthlyChartOptions} />
                  </div>
                )}
              </div>

              {/* Top clientes + Composição */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Award className="text-amber-400" size={20} />
                    <h4 className="text-base font-bold text-white">Top Clientes</h4>
                  </div>
                  {topClients.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm">Sem clientes faturados.</div>
                  ) : (
                    <div className="space-y-4">
                      {topClients.map(([name, total], idx) => {
                        const pct = maxClientValue > 0 ? (total / maxClientValue) * 100 : 0;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] font-black text-slate-500 w-5">{idx + 1}º</span>
                                <span className="font-semibold text-slate-200 truncate">{name}</span>
                              </div>
                              <span className="font-mono font-bold text-teal-300 text-xs">€ {total.toFixed(2)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-800 overflow-hidden ml-7">
                              <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="text-blue-400" size={20} />
                      <h4 className="text-base font-bold text-white">Composição da Faturação</h4>
                    </div>
                    <span className="text-xs font-mono text-slate-400">Média/OT: € {avgInvoice.toFixed(2)}</span>
                  </div>
                  {totalComponentes <= 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm">Sem valores de componentes.</div>
                  ) : (
                    <div className="flex flex-col items-center gap-5 sm:flex-row">
                      <div className="h-44 w-44 shrink-0">
                        <Doughnut data={compositionChartData} options={compositionChartOptions} />
                      </div>
                      <div className="flex-1 space-y-3 w-full">
                        <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-3">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-teal-300">Mão de Obra</div>
                          <div className="text-lg font-black font-mono text-white">€ {totalMaoObraFaturado.toFixed(2)}</div>
                          <div className="text-xs text-slate-400">{totalComponentes > 0 ? ((totalMaoObraFaturado / totalComponentes) * 100).toFixed(0) : 0}% do total</div>
                        </div>
                        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">Peças / Materiais</div>
                          <div className="text-lg font-black font-mono text-white">€ {totalPecasFaturado.toFixed(2)}</div>
                          <div className="text-xs text-slate-400">{totalComponentes > 0 ? ((totalPecasFaturado / totalComponentes) * 100).toFixed(0) : 0}% do total</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Console View */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Sidebar: Order Selection */}
          <div className="lg:col-span-4 border-r border-slate-800 bg-slate-900/50 flex flex-col h-[calc(100vh-73px)]">
            <div className="p-4 border-b border-slate-800 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Pesquisar nº ordem, cliente, jangada..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {["", "Rascunho", "Enviado", "Aprovado"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-lg px-2.5 py-1 font-medium whitespace-nowrap transition ${
                      statusFilter === st
                        ? "bg-teal-500 text-slate-950 font-bold"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {st === "" ? "Todos" : st}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {loadingList ? (
                <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
                  <Loader2 className="animate-spin" size={18} /> A carregar ordens...
                </div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">Nenhuma ordem encontrada.</div>
              ) : (
                orders.map((ord) => {
                  const isSelected = ord.id === selectedId;
                  const raft = ord.jangada ? `${ord.jangada.brand || ""} ${ord.jangada.model || ""} (${ord.jangada.serial || "Sem serial"})` : "Sem jangada";
                  const pagamento = getPagamentoStatus(ord);
                  return (
                    <button
                      key={ord.id}
                      onClick={() => selectOrder(ord)}
                      className={`w-full text-left p-4 transition flex flex-col gap-1.5 ${
                        isSelected ? "bg-teal-500/10 border-l-4 border-teal-500" : "hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-400">#{ord.numeroOrdem || ord.id}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          ord.orcamentoStatus === "Aprovado" ? "bg-emerald-500/20 text-emerald-300" :
                          ord.orcamentoStatus === "Enviado" ? "bg-amber-500/20 text-amber-300" : "bg-slate-800 text-slate-400"
                        }`}>
                          {ord.orcamentoStatus || "Rascunho"}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-200 truncate">{ord.cliente?.nome || ord.jangada?.owner || "Cliente Particular"}</div>
                      <div className="text-xs text-slate-400 truncate">{raft}</div>
                      <div className="flex items-center justify-between text-xs pt-1 font-mono text-slate-300">
                        <span>{ord.dataAbertura ? formatDateTimeShort(ord.dataAbertura) : "—"}</span>
                        <span className="font-bold text-teal-300">€ {(ord.valorTotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${PAGAMENTO_BADGE_CLASSES[pagamento] || PAGAMENTO_BADGE_CLASSES.Pendente}`}>
                          <CreditCard size={10} /> {pagamento}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Content / Workbench */}
          <div className="lg:col-span-8 flex flex-col h-[calc(100vh-73px)] overflow-y-auto p-6 bg-slate-950">
            {!selectedOrder ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <FileText size={48} className="mb-3 text-slate-700" />
                <p className="text-base font-medium">Selecione uma ordem de serviço na lista ao lado.</p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto w-full space-y-6">
                {/* Header card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-teal-400">Ordem #{selectedOrder.numeroOrdem || selectedOrder.id}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                        Estado OT: {editStatus}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-white">{selectedOrder.cliente?.nome || selectedOrder.jangada?.owner || "Cliente Particular"}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Embarcação: <span className="text-slate-200">{selectedOrder.jangada?.shipNameManual || "—"}</span> · Jangada: <span className="text-slate-200">{selectedOrder.jangada?.brand || ""} {selectedOrder.jangada?.model || ""} ({selectedOrder.jangada?.serial || "—"})</span>
                    </p>
                  </div>

                  {/* Document Type Switcher & Quick Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
                      <button
                        onClick={() => setActiveTab("orcamento")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          activeTab === "orcamento" ? "bg-teal-500 text-slate-950 shadow" : "text-slate-300 hover:text-white"
                        }`}
                      >
                        Orçamento
                      </button>
                      <button
                        onClick={() => setActiveTab("fatura")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          activeTab === "fatura" ? "bg-teal-500 text-slate-950 shadow" : "text-slate-300 hover:text-white"
                        }`}
                      >
                        Fatura Oficial
                      </button>
                    </div>

                    <button
                      onClick={() => handleDownloadExcel(activeTab)}
                      className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-500 transition shadow-lg shadow-teal-900/20"
                    >
                      <Download size={14} /> {activeTab === "orcamento" ? "Orçamento .xlsx" : "Fatura .xlsx"}
                    </button>

                    <button
                      onClick={handleDownloadNotaCredito}
                      className="flex items-center gap-1.5 rounded-xl bg-rose-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-600 transition shadow-lg shadow-rose-900/20"
                      title="Emitir nota de crédito que anula/corrige a fatura desta ordem de serviço"
                    >
                      <FileMinus size={14} /> Nota de Crédito
                    </button>

                    <button
                      onClick={() => selectedOrder && window.open(`/api/ordens-servico/${selectedOrder.id}/recibo-excel`, "_blank")}
                      className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-sky-500 transition shadow-lg shadow-sky-900/20"
                      title="Emitir recibo da fatura desta ordem de serviço"
                    >
                      <FileText size={14} /> Recibo .xlsx
                    </button>
                  </div>
                </div>

                {/* Quick Actions Bar */}
                <div className="rounded-2xl border border-teal-500/30 bg-teal-950/20 p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-teal-300">
                    <Zap size={16} className="text-teal-400 animate-pulse" />
                    <span>Ações: Aprovar orçamento, enviar por WhatsApp ou faturar.</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleAprovarOrcamento}
                      disabled={saving || editOrcamentoStatus === "Aprovado"}
                      className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-900/40 px-3.5 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/70 transition disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                      {editOrcamentoStatus === "Aprovado" ? "Orçamento Aprovado ✓" : "Aprovar Orçamento"}
                    </button>

                    <button
                      onClick={handleWhatsAppShare}
                      className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-900/40 px-3.5 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/70 transition"
                    >
                      <MessageSquare size={14} className="text-emerald-400" /> WhatsApp
                    </button>

                    <button
                      onClick={handleCopyPublicLink}
                      className="flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-900/40 px-3.5 py-2 text-xs font-semibold text-teal-200 hover:bg-teal-900/70 transition"
                    >
                      {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Link2 size={14} />}
                      {copiedLink ? "Link Copiado!" : "Copiar Link"}
                    </button>

                    <button
                      onClick={handleAprovarEConcluirFaturar}
                      disabled={saving}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white hover:from-emerald-500 hover:to-teal-500 transition shadow-lg shadow-emerald-900/30 disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                      ⚡ Aprovar & Faturar
                    </button>
                  </div>
                </div>

                {errorMsg && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 flex items-center gap-2">
                    <AlertCircle size={18} /> {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 size={18} /> {successMsg}
                  </div>
                )}

                {/* Interactive Editor Form */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
                      <Edit3 size={16} /> Parâmetros de Cálculo, Estado & Pagamento
                    </h3>
                    <button
                      onClick={() => handleSave()}
                      disabled={saving}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar Alterações
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Valor Peças / Materiais (€)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input
                          type="number"
                          step="0.01"
                          value={editPecas}
                          onChange={(e) => setEditPecas(e.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-8 pr-3 text-sm text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Valor Mão-de-Obra (€)</label>
                      <div className="relative">
                        <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input
                          type="number"
                          step="0.01"
                          value={editMaoObra}
                          onChange={(e) => setEditMaoObra(e.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-8 pr-3 text-sm text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Desconto Aplicado (€)</label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input
                          type="number"
                          step="0.01"
                          value={editDesconto}
                          onChange={(e) => setEditDesconto(e.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-8 pr-3 text-sm text-slate-100 focus:border-teal-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Estado do Orçamento</label>
                      <select
                        value={editOrcamentoStatus}
                        onChange={(e) => setEditOrcamentoStatus(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                      >
                        <option value="Rascunho">Rascunho</option>
                        <option value="Enviado">Enviado</option>
                        <option value="Aprovado">Aprovado</option>
                        <option value="Rejeitado">Rejeitado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Estado da Ordem de Serviço</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                      >
                        <option value="aberta">Aberta</option>
                        <option value="em_progresso">Em Progresso</option>
                        <option value="concluida">Concluída (Pronta para Faturar)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Estado de Pagamento (Fatura)</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <select
                          value={editPagamento}
                          onChange={(e) => setEditPagamento(e.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-8 pr-3 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
                        >
                          {PAGAMENTO_STATUS_LIST.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editIsentoIva}
                          onChange={(e) => setEditIsentoIva(e.target.checked)}
                          className="w-5 h-5 rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-teal-500 focus:ring-offset-slate-900"
                        />
                        <span className="text-sm font-medium text-slate-200">Isenção de IVA</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Live Preview Card */}
                <div className="rounded-2xl border border-teal-500/30 bg-slate-900 p-6 space-y-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="text-teal-400" size={20} />
                      <h3 className="text-base font-bold text-white">
                        Pré-visualização em Tempo Real — {activeTab === "orcamento" ? "ORÇAMENTO" : "FATURA OFICIAL"}
                      </h3>
                    </div>
                    <span className="text-xs font-mono bg-teal-500/20 text-teal-300 px-3 py-1 rounded-full border border-teal-500/30">
                      Cálculo Automático Ativo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Dados do Destinatário</div>
                      <p className="font-bold text-white">{selectedOrder.cliente?.nome || selectedOrder.jangada?.owner || "Cliente Particular"}</p>
                      <p className="text-slate-400 text-xs">NIF: <span className="text-slate-200 font-mono">{selectedOrder.cliente?.nif || "—"}</span></p>
                      <p className="text-slate-400 text-xs">Morada: <span className="text-slate-200">{selectedOrder.cliente?.morada || "—"}</span></p>
                      <p className="text-slate-400 text-xs">Localidade/Ilha: <span className="text-slate-200">{selectedOrder.cliente?.localidade || ""} {selectedOrder.cliente?.ilha || ""}</span></p>
                    </div>

                    <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Referência & Equipamento</div>
                      <p className="text-slate-300 text-xs">Documento Nº: <span className="font-bold text-white font-mono">{selectedOrder.numeroOrdem || selectedOrder.id}</span></p>
                      <p className="text-slate-300 text-xs">Embarcação: <span className="font-bold text-white">{selectedOrder.jangada?.shipNameManual || "—"}</span></p>
                      <p className="text-slate-300 text-xs">Jangada: <span className="font-bold text-white">{selectedOrder.jangada?.brand || ""} {selectedOrder.jangada?.model || ""}</span></p>
                      <p className="text-slate-300 text-xs">Nº Série: <span className="font-mono text-teal-300">{selectedOrder.jangada?.serial || "—"}</span></p>
                    </div>
                  </div>

                  {/* Line items table */}
                  <div className="rounded-xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-800/80 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          <th className="p-3">Descrição do Serviço / Artigo</th>
                          <th className="p-3 text-center">Qtd</th>
                          <th className="p-3 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono text-xs">
                        <tr>
                          <td className="p-3 text-slate-200 font-sans">Mão-de-obra (trabalhos técnicos executados)</td>
                          <td className="p-3 text-center">1</td>
                          <td className="p-3 text-right font-bold text-slate-100">€ {numMaoObra.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="p-3 text-slate-200 font-sans">Peças e Materiais aplicados</td>
                          <td className="p-3 text-center">1</td>
                          <td className="p-3 text-right font-bold text-slate-100">€ {numPecas.toFixed(2)}</td>
                        </tr>
                        {numDesconto > 0 && (
                          <tr className="text-rose-400">
                            <td className="p-3 font-sans">Desconto Comercial</td>
                            <td className="p-3 text-center">1</td>
                            <td className="p-3 text-right font-bold">- € {numDesconto.toFixed(2)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals box */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-end space-y-1.5 font-mono text-sm">
                    <div className="flex justify-between w-64 text-slate-400 text-xs">
                      <span>Subtotal:</span>
                      <span className="text-slate-200">€ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between w-64 text-slate-400 text-xs">
                      <span>IVA ({editIsentoIva ? "Isento" : "16%"}):</span>
                      <span className="text-slate-200">€ {iva.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between w-64 text-teal-400 font-bold text-base pt-2 border-t border-slate-800">
                      <span>TOTAL:</span>
                      <span>€ {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
