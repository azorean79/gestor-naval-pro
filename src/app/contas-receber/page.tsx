"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { 
  Loader2, Search, CreditCard, AlertTriangle, CheckCircle2, Wallet, 
  Building2, MapPin, MessageSquare, RefreshCcw, Download, FileText, TrendingUp
} from "lucide-react";
import { formatDateTimeShort } from "@/lib/date-utils";

const PAGAMENTO_STATUS_LIST = ["Pendente", "Pago Parcialmente", "Pago", "Vencido"];

const PAGAMENTO_BADGE_CLASSES: Record<string, string> = {
  Pendente: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "Pago Parcialmente": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Pago: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Vencido: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

const PAYMENT_TERMS_DAYS = 30;

type OrdemMetadados = Record<string, unknown> & { pagamentoStatus?: string };

type OrdemItem = {
  id: number;
  numeroOrdem?: string | null;
  status?: string | null;
  orcamentoStatus?: string | null;
  valorTotal?: number | null;
  dataAbertura?: string | null;
  dataConclusao?: string | null;
  createdAt?: string | null;
  metadados?: OrdemMetadados | null;
  jangada?: { owner?: string | null; shipNameManual?: string | null; serial?: string | null } | null;
  cliente?: { nome?: string | null; ilha?: string | null; numeroCliente?: string | null } | null;
  serviceStation?: { nome?: string | null; codigo?: string | null } | null;
};

function getPagamentoStatus(ordem: OrdemItem) {
  const meta = ordem.metadados || {};
  return meta.pagamentoStatus || "Pendente";
}

function getDueDate(ordem: OrdemItem) {
  const base = ordem.dataConclusao || ordem.createdAt;
  if (!base) return null;
  const d = new Date(base);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + PAYMENT_TERMS_DAYS);
  return d;
}

function getDiasVencido(ordem: OrdemItem) {
  const due = getDueDate(ordem);
  if (!due) return 0;
  const diff = Math.floor((Date.now() - due.getTime()) / 86400000);
  return Math.max(0, diff);
}

function getEffectiveStatus(ordem: OrdemItem) {
  const manual = getPagamentoStatus(ordem);
  if (manual === "Pago") return "Pago";
  if (getDiasVencido(ordem) > 0) return "Vencido";
  return manual;
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);
}

export default function ContasReceberPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OrdemItem[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [islandFilter, setIslandFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ includeClosed: "1" });
      const res = await fetch(`/api/ordens-servico?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar ordens de serviço.");
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setLoading(true) no início do fetch assíncrono controla o estado de carregamento.
    load();
  }, [load]);

  const invoices = useMemo(() => rows.filter((o) => o.status === "concluida"), [rows]);

  const stations = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((o) => {
      if (o.serviceStation?.nome) set.add(o.serviceStation.nome);
    });
    return Array.from(set).sort();
  }, [invoices]);

  const islands = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((o) => {
      if (o.cliente?.ilha) set.add(o.cliente.ilha);
    });
    return Array.from(set).sort();
  }, [invoices]);

  const filtered = useMemo(() => {
    return invoices.filter((o) => {
      const eff = getEffectiveStatus(o);
      if (statusFilter && eff !== statusFilter) return false;
      if (stationFilter && (o.serviceStation?.nome || "") !== stationFilter) return false;
      if (islandFilter && (o.cliente?.ilha || "") !== islandFilter) return false;
      if (q.trim()) {
        const hay = `${o.numeroOrdem || ""} ${o.cliente?.nome || ""} ${o.jangada?.owner || ""} ${o.jangada?.shipNameManual || ""}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [invoices, statusFilter, stationFilter, islandFilter, q]);

  const summary = useMemo(() => {
    let vencido = 0, pago = 0, parcial = 0;
    filtered.forEach((o) => {
      const eff = getEffectiveStatus(o);
      const v = Number(o.valorTotal || 0);
      if (eff === "Pago") pago += v;
      else if (eff === "Vencido") vencido += v;
      else if (eff === "Pago Parcialmente") parcial += v;
    });
    const emDivida = filtered.filter((o) => getEffectiveStatus(o) !== "Pago").reduce((a, o) => a + Number(o.valorTotal || 0), 0);
    const countEmDivida = filtered.filter((o) => getEffectiveStatus(o) !== "Pago").length;
    return { emDivida, vencido, pago, parcial, countEmDivida };
  }, [filtered]);

  const setPaymentStatus = async (orderId: number, status: string) => {
    setSavingId(orderId);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/ordens-servico/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadados: { pagamentoStatus: status } }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Falha ao atualizar estado de pagamento.");
      }
      setRows((prev) => prev.map((o) => (o.id === orderId ? { ...o, metadados: { ...(o.metadados || {}), pagamentoStatus: status } } : o)));
      setSuccess(`Estado de pagamento atualizado para "${status}".`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar estado.");
    } finally {
      setSavingId(null);
    }
  };

  const sendWhatsAppReminder = (o: OrdemItem) => {
    const clientName = o.cliente?.nome || o.jangada?.owner || "Cliente";
    const orderNum = o.numeroOrdem || o.id;
    const text = encodeURIComponent(
      `Olá ${clientName}, lembramos que a fatura #${orderNum} no valor de ${formatEuro(Number(o.valorTotal || 0))} continua em aberto. Agradecemos o pagamento. Obrigado!`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 p-2.5 text-teal-400">
            <CreditCard size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Contas a Receber</h1>
            <p className="text-xs text-slate-400">Faturas emitidas e controlo de pagamentos por cliente e estação</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
        >
          <RefreshCcw size={14} /> Atualizar
        </button>
      </header>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">Em Dívida (Filtro)</span>
                <Wallet size={18} className="text-amber-400" />
              </div>
              <div className="text-2xl font-black font-mono text-white">{formatEuro(summary.emDivida)}</div>
              <div className="text-xs text-amber-300/80">{summary.countEmDivida} faturas em aberto</div>
            </div>

            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">Vencido</span>
                <AlertTriangle size={18} className="text-rose-400" />
              </div>
              <div className="text-2xl font-black font-mono text-white">{formatEuro(summary.vencido)}</div>
              <div className="text-xs text-rose-300/80">Além dos {PAYMENT_TERMS_DAYS} dias de prazo</div>
            </div>

            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">Pago Parcialmente</span>
                <TrendingUp size={18} className="text-blue-400" />
              </div>
              <div className="text-2xl font-black font-mono text-white">{formatEuro(summary.parcial)}</div>
              <div className="text-xs text-blue-300/80">Faturas com pagamento parcial</div>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Pago</span>
                <CheckCircle2 size={18} className="text-emerald-400" />
              </div>
              <div className="text-2xl font-black font-mono text-white">{formatEuro(summary.pago)}</div>
              <div className="text-xs text-emerald-300/80">Faturas liquidadas</div>
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Pesquisar nº fatura, cliente, embarcação..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-teal-500 focus:outline-none"
            >
              <option value="">Estado: Todos</option>
              {PAGAMENTO_STATUS_LIST.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-teal-500 focus:outline-none"
            >
              <option value="">Estação: Todas</option>
              {stations.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={islandFilter}
              onChange={(e) => setIslandFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-teal-500 focus:outline-none"
            >
              <option value="">Ilha: Todas</option>
              {islands.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          {/* Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
                <Loader2 className="animate-spin" size={18} /> A carregar faturas...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">
                {invoices.length === 0
                  ? "Ainda não existem faturas emitidas (ordens de serviço concluídas)."
                  : "Nenhuma fatura corresponde aos filtros selecionados."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-800/80 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      <th className="p-3">Fatura / Cliente</th>
                      <th className="p-3">Estação · Ilha</th>
                      <th className="p-3">Data Emissão</th>
                      <th className="p-3 text-right">Valor</th>
                      <th className="p-3">Dias Venc.</th>
                      <th className="p-3">Estado de Pagamento</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filtered.map((o) => {
                      const eff = getEffectiveStatus(o);
                      const dias = getDiasVencido(o);
                      const clientName = o.cliente?.nome || o.jangada?.owner || "Cliente Particular";
                      return (
                        <tr key={o.id} className="hover:bg-slate-800/30">
                          <td className="p-3">
                            <div className="font-mono font-bold text-teal-300">#{o.numeroOrdem || o.id}</div>
                            <div className="text-xs font-semibold text-slate-200">{clientName}</div>
                            <div className="text-xs text-slate-500">{o.jangada?.shipNameManual || "—"}</div>
                          </td>
                          <td className="p-3 text-xs text-slate-400">
                            <div className="flex items-center gap-1.5"><Building2 size={12} /> {o.serviceStation?.nome || "—"}</div>
                            <div className="flex items-center gap-1.5 mt-1"><MapPin size={12} /> {o.cliente?.ilha || "—"}</div>
                          </td>
                          <td className="p-3 text-xs text-slate-400">
                            {o.dataConclusao ? formatDateTimeShort(o.dataConclusao) : "—"}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-100">{formatEuro(Number(o.valorTotal || 0))}</td>
                          <td className="p-3 text-center">
                            {eff === "Pago" ? (
                              <span className="text-emerald-400">—</span>
                            ) : (
                              <span className={`font-mono font-bold ${dias > 0 ? "text-rose-300" : "text-slate-400"}`}>{dias}</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1.5">
                              <select
                                value={getPagamentoStatus(o)}
                                disabled={savingId === o.id}
                                onChange={(e) => setPaymentStatus(o.id, e.target.value)}
                                className={`rounded-lg border px-2 py-1 text-xs font-semibold bg-slate-950 focus:outline-none ${PAGAMENTO_BADGE_CLASSES[getPagamentoStatus(o)] || PAGAMENTO_BADGE_CLASSES.Pendente}`}
                              >
                                {PAGAMENTO_STATUS_LIST.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              {eff === "Vencido" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400">
                                  <AlertTriangle size={10} /> Vencido
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`/api/ordens-servico/${o.id}/fatura-excel`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Descarregar fatura Excel"
                                className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-teal-300 transition"
                              >
                                <Download size={14} />
                              </a>
                              <a
                                href={`/api/ordens-servico/${o.id}/orcamento-excel`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Descarregar orçamento Excel"
                                className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-indigo-300 transition"
                              >
                                <FileText size={14} />
                              </a>
                              <a
                                href={`/api/ordens-servico/${o.id}/recibo-excel`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Descarregar recibo Excel"
                                className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-sky-300 transition"
                              >
                                <FileText size={14} />
                              </a>
                              <button
                                onClick={() => sendWhatsAppReminder(o)}
                                title="Enviar lembrete por WhatsApp"
                                className="rounded-lg border border-emerald-700 bg-emerald-900/40 p-1.5 text-emerald-300 hover:bg-emerald-900/70 transition"
                              >
                                <MessageSquare size={14} />
                              </button>
                              {eff !== "Pago" && (
                                <button
                                  onClick={() => setPaymentStatus(o.id, "Pago")}
                                  disabled={savingId === o.id}
                                  title="Marcar como pago"
                                  className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition disabled:opacity-50"
                                >
                                  {savingId === o.id ? <Loader2 size={12} className="animate-spin" /> : "Pagar"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
