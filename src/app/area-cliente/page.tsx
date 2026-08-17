"use client";

import React, { useState } from "react";
import {
  Anchor,
  Search,
  Ship,
  FileText,
  CalendarClock,
  AlertTriangle,
  ShieldCheck,
  Wrench,
  Loader2,
  ExternalLink,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { INSPECTION_STATUS_STYLES, type InspectionStatusColor } from "@/lib/inspection-status";

type SearchMode = "nif" | "codigo";

type JangadaEstado = {
  id: number;
  serial: string;
  brand: string;
  model: string;
  capacity: number;
  owner: string;
  navioNome: string | null;
  dataInspecao: string | null;
  dataProxInspecao: string | null;
  status: { label: string; color: InspectionStatusColor; daysLeft: number | null };
  diasParaProxima: number | null;
  ultimoCertificadoNumero: string | null;
  certificadoExternoNumero: string | null;
  certificadoExternoUrl: string | null;
  hruReferencia: string | null;
  hruValidade: string | null;
  diasHru: number | null;
  radarReflector: string | null;
  radarReflectorValidade: string | null;
  diasRadarReflector: number | null;
  cylinderSistema: string | null;
  cylinderDataTeste: string | null;
  cylinderDataProxTeste: string | null;
  diasProxTesteCilindro: number | null;
};

type OrdemServicoResumo = {
  id: number;
  numeroOrdem: string | null;
  status: string;
  orcamentoStatus: string | null;
  valorTotal: number | null;
  createdAt: string;
  dataConclusao: string | null;
  jangada: { id: number; serial: string; brand: string; model: string } | null;
};

type FaturaResumo = {
  id: number;
  numeroFatura: string;
  valorTotal: number;
  valorPago: number;
  pagamentoStatus: string;
  dataEmissao: string;
  cancelada: boolean;
  motivoCancelamento: string | null;
  numeroNotaCredito: string | null;
  numeroRecibo: string | null;
  ordemServicos: Array<{
    id: number;
    numeroOrdem: string;
    jangada: { id: number; serial: string; brand: string; model: string } | null;
  }>;
};

type RespostaClienteAuth = {
  cliente: { id: number; nome: string; nif: string | null; numeroCliente: string | null; morada: string | null; ilha: string | null };
  jangadas: JangadaEstado[];
  ordensServico: OrdemServicoResumo[];
  faturas: FaturaResumo[];
  resumoFaturas: { totalFaturas: number; totalFaturado: number; totalRecebido: number; totalEmDivida: number };
};

const statusLabelExtra: Record<InspectionStatusColor, string> = {
  green: "GI em dia",
  yellow: "GI a aproximar-se",
  orange: "GI urgente",
  red: "GI expirada",
  gray: "Sem inspeção registada",
};

function formatDias(dias: number | null): string {
  if (dias === null || dias === undefined) return "—";
  if (dias < 0) return `há ${Math.abs(dias)} dia${Math.abs(dias) === 1 ? "" : "s"}`;
  if (dias === 0) return "hoje";
  return `em ${dias} dia${dias === 1 ? "" : "s"}`;
}

export default function AreaClientePage() {
  const [mode, setMode] = useState<SearchMode>("nif");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<RespostaClienteAuth | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const consultar = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = input.trim();
    if (!value) {
      setError("Indique o NIF ou o Código de Cliente.");
      return;
    }
    setLoading(true);
    setError(null);
    setResultado(null);
    try {
      const param = mode === "nif" ? `nif=${encodeURIComponent(value)}` : `codigo=${encodeURIComponent(value)}`;
      const res = await fetch(`/api/portal/cliente-auth?${param}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro na consulta.");
      setResultado(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro na consulta.");
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-indigo-50">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <section className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-600 text-white rounded-xl p-2.5 shadow-md shadow-indigo-600/20">
              <Anchor size={22} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800 leading-tight">Orey Açores</p>
              <p className="text-xs text-slate-500 font-medium">Área do Cliente</p>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800">
            Consultar o estado das suas jangadas salva-vidas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Introduza o seu NIF ou o Código de Cliente para ver a situação da inspeção geral (GI), certificados e validades.
          </p>

          <form onSubmit={consultar} className="mt-6 space-y-4">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => { setMode("nif"); setInput(""); setError(null); }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${mode === "nif" ? "bg-white shadow-sm text-indigo-700" : "text-slate-500 hover:text-slate-700"}`}
              >
                Por NIF
              </button>
              <button
                type="button"
                onClick={() => { setMode("codigo"); setInput(""); setError(null); }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${mode === "codigo" ? "bg-white shadow-sm text-indigo-700" : "text-slate-500 hover:text-slate-700"}`}
              >
                Por Código de Cliente
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(null); }}
                placeholder={mode === "nif" ? "Ex: 500000000" : "Ex: ORY-0001"}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-100 outline-none font-medium"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/10 disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                {loading ? "A consultar..." : "Consultar"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertTriangle size={18} className="shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          {hasSearched && !loading && !error && resultado && resultado.jangadas.length === 0 && (
            <div className="mt-4 flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <ShieldCheck size={18} className="shrink-0" />
              <p className="text-sm font-semibold">Este cliente não tem jangadas registadas no sistema.</p>
            </div>
          )}
        </section>

        {resultado && !loading && (
          <>
            <section className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Cliente</p>
                  <h2 className="text-lg font-extrabold text-slate-800">{resultado.cliente.nome}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {resultado.cliente.numeroCliente && (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      Código: {resultado.cliente.numeroCliente}
                    </span>
                  )}
                  {resultado.cliente.ilha && (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {resultado.cliente.ilha}
                    </span>
                  )}
                </div>
              </div>

              {resultado.jangadas.length > 0 && (
                <>
                  <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
                    Jangadas ({resultado.jangadas.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resultado.jangadas.map((j) => {
                      const styles = INSPECTION_STATUS_STYLES[j.status.color];
                      return (
                        <div key={j.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-extrabold text-slate-800">{j.brand || "—"} {j.model || ""}</p>
                                {j.capacity ? <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{j.capacity}P</span> : null}
                              </div>
                              <p className="text-xs font-mono font-semibold text-slate-500 mt-0.5">S/N: {j.serial}</p>
                              {j.navioNome && (
                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                  <Ship size={12} className="text-slate-400" /> {j.navioNome}
                                </p>
                              )}
                            </div>
                            <span className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${styles.badge}`}>
                              <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
                              {j.status.color === "gray" ? "Sem inspeção" :
                               j.status.color === "red" ? "GI expirada" :
                               j.status.color === "orange" ? `GI em ${j.status.daysLeft}d` :
                               j.status.color === "yellow" ? `GI em ${j.status.daysLeft}d` :
                               "GI em dia"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-white rounded-xl border border-slate-200 p-3">
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <CalendarClock size={12} /> Última GI
                              </p>
                              <p className="font-bold text-slate-700 mt-0.5">{j.dataInspecao ? formatDate(j.dataInspecao) : "—"}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 p-3">
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Clock size={12} /> Próxima GI
                              </p>
                              <p className="font-bold text-slate-700 mt-0.5">
                                {j.dataProxInspecao ? formatDate(j.dataProxInspecao) : "—"}
                              </p>
                              {j.diasParaProxima !== null && (
                                <p className={`text-[11px] font-semibold mt-0.5 ${j.diasParaProxima < 0 ? "text-red-600" : j.diasParaProxima <= 30 ? "text-orange-600" : "text-emerald-600"}`}>
                                  {formatDias(j.diasParaProxima)}
                                </p>
                              )}
                            </div>
                          </div>

                          {(j.ultimoCertificadoNumero || j.certificadoExternoNumero) && (
                            <div className="space-y-1.5">
                              {j.ultimoCertificadoNumero && (
                                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                                  <FileText size={13} className="text-indigo-500 shrink-0" />
                                  Certificado: <span className="font-mono font-semibold">{j.ultimoCertificadoNumero}</span>
                                </p>
                              )}
                              {j.certificadoExternoNumero && (
                                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                                  <FileText size={13} className="text-amber-500 shrink-0" />
                                  Cert. externo: <span className="font-mono font-semibold">{j.certificadoExternoNumero}</span>
                                  {j.certificadoExternoUrl && (
                                    <a href={j.certificadoExternoUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold inline-flex items-center gap-0.5">
                                      ver <ExternalLink size={11} />
                                    </a>
                                  )}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-1.5">
                            {j.hruValidade && (
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${j.diasHru !== null && j.diasHru < 0 ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-slate-200 text-slate-600"}`}>
                                HRU {j.hruValidade ? formatDate(j.hruValidade) : ""}
                                {j.diasHru !== null && j.diasHru < 0 ? " · expirado" : ""}
                              </span>
                            )}
                            {j.radarReflectorValidade && (
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${j.diasRadarReflector !== null && j.diasRadarReflector < 0 ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-slate-200 text-slate-600"}`}>
                                Radar {j.radarReflectorValidade ? formatDate(j.radarReflectorValidade) : ""}
                                {j.diasRadarReflector !== null && j.diasRadarReflector < 0 ? " · expirado" : ""}
                              </span>
                            )}
                            {j.cylinderDataProxTeste && (
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${j.diasProxTesteCilindro !== null && j.diasProxTesteCilindro < 0 ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-slate-200 text-slate-600"}`}>
                                Cilindro: próx. teste {j.cylinderDataProxTeste ? formatDate(j.cylinderDataProxTeste) : ""}
                                {j.diasProxTesteCilindro !== null && j.diasProxTesteCilindro < 0 ? " · expirado" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {statusLabelExtra.green} · {statusLabelExtra.yellow} · {statusLabelExtra.orange} · {statusLabelExtra.red}
                  </p>
                </>
              )}
            </section>

            {resultado.ordensServico.length > 0 && (
              <section className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-8 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Wrench size={16} className="text-slate-400" /> Serviços recentes
                </h3>
                <div className="space-y-3">
                  {resultado.ordensServico.map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-700">
                          {o.jangada ? `${o.jangada.brand || ""} ${o.jangada.model || ""} · ${o.jangada.serial}` : "Serviço"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {o.numeroOrdem ? `OS ${o.numeroOrdem} · ` : ""}
                          {o.createdAt ? formatDate(o.createdAt) : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {o.valorTotal != null && (
                          <span className="text-sm font-bold text-slate-700">{Number(o.valorTotal).toFixed(2)} €</span>
                        )}
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {resultado.faturas.length > 0 && (
              <section className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 sm:p-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <FileText size={16} className="text-slate-400" /> Faturas
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      Faturado: <b className="text-slate-800">{resultado.resumoFaturas.totalFaturado.toFixed(2)} €</b>
                    </span>
                    <span className="font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      Pago: <b className="text-emerald-700">{resultado.resumoFaturas.totalRecebido.toFixed(2)} €</b>
                    </span>
                    <span className={`font-semibold px-2.5 py-1 rounded-full ${resultado.resumoFaturas.totalEmDivida > 0 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                      Em dívida: <b>{resultado.resumoFaturas.totalEmDivida.toFixed(2)} €</b>
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {resultado.faturas.map((f) => (
                    <div key={f.id} className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-700">{f.numeroFatura}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {f.dataEmissao ? formatDate(f.dataEmissao) : ""}
                            {f.ordemServicos[0]?.numeroOrdem ? ` · OS ${f.ordemServicos[0].numeroOrdem}` : ""}
                            {f.ordemServicos[0]?.jangada ? ` · ${f.ordemServicos[0].jangada.brand || ""} ${f.ordemServicos[0].jangada.model || ""} (${f.ordemServicos[0].jangada.serial})` : ""}
                          </p>
                          {f.numeroNotaCredito && (
                            <p className="text-xs text-rose-600 mt-0.5 font-semibold">
                              Nota de crédito: {f.numeroNotaCredito}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold text-slate-700">{Number(f.valorTotal).toFixed(2)} €</span>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${f.cancelada ? "bg-slate-100 text-slate-500 border-slate-200" : f.pagamentoStatus === "Pago" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : f.pagamentoStatus === "Pago Parcialmente" ? "bg-blue-50 text-blue-700 border-blue-200" : f.pagamentoStatus === "Vencido" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                            {f.cancelada ? "Anulada" : f.pagamentoStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 text-center">
        <p className="text-xs text-slate-400">
          Orey Açores · Manutenção e inspeção de jangadas salva-vidas · Se não conseguir aceder, contacte a nossa oficina.
        </p>
      </footer>
    </div>
  );
}
