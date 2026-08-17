"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Loader2, ShieldCheck, AlertTriangle, Activity, CalendarClock } from "lucide-react";
import { toDisplayDate } from "@/lib/fato-date-utils";

type ConformidadeDGRM = {
  totalJangadas: number;
  validas: number;
  expiradas: number;
  taxaConformidadePct: number;
  inspecoesUltimos30Dias: number;
  estadoGeral: string;
};

type JangadaRow = {
  id: number;
  serial?: string | null;
  brand?: string | null;
  model?: string | null;
  capacity?: number | null;
  dataProxInspecao?: string | null;
  owner?: string | null;
};

function todayKey() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function DgrmPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conformidade, setConformidade] = useState<ConformidadeDGRM | null>(null);
  const [jangadas, setJangadas] = useState<JangadaRow[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/qualidade-dados/dgrm").then((res) => {
        if (!res.ok) throw new Error("Falha ao carregar auditoria DGRM.");
        return res.json();
      }),
      fetch("/api/jangadas").then((res) => {
        if (!res.ok) throw new Error("Falha ao carregar jangadas.");
        return res.json();
      }),
    ])
      .then(([dgrmPayload, jangadasData]) => {
        setConformidade(dgrmPayload?.conformidadeDGRM ?? null);
        setJangadas(Array.isArray(jangadasData) ? jangadasData : []);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados DGRM.");
      })
      .finally(() => setLoading(false));
  }, []);

  const today = todayKey();
  const validas = jangadas.filter((j) => (j.dataProxInspecao || "") >= today);
  const expiradas = jangadas.filter((j) => (j.dataProxInspecao || "") < today);
  const semData = jangadas.filter((j) => !j.dataProxInspecao);

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-700" />
            Conformidade DGRM
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Auditoria de certificados e fichas DGRM por jangada.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> A carregar auditoria…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> Estado Geral
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {conformidade?.estadoGeral ?? "—"}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide">
                <Activity className="w-4 h-4 text-slate-600" /> Taxa de conformidade
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {conformidade ? `${conformidade.taxaConformidadePct}%` : "—"}
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
              <div className="text-emerald-700 text-xs font-medium uppercase tracking-wide">Válidas</div>
              <div className="mt-2 text-2xl font-bold text-emerald-800">
                {conformidade?.validas ?? validas.length}
              </div>
              <div className="text-xs text-emerald-600">de {conformidade?.totalJangadas ?? jangadas.length} jangadas</div>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 shadow-sm">
              <div className="text-rose-700 text-xs font-medium uppercase tracking-wide">Expiradas</div>
              <div className="mt-2 text-2xl font-bold text-rose-800">{conformidade?.expiradas ?? expiradas.length}</div>
              <div className="text-xs text-rose-600">
                {semData.length > 0 ? `+ ${semData.length} sem data prevista` : "com certificado vencido"}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide">
                <CalendarClock className="w-4 h-4 text-slate-600" /> Inspeções (30 dias)
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {conformidade?.inspecoesUltimos30Dias ?? 0}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b bg-slate-50">
              <h2 className="font-semibold text-slate-800">Jangadas e fichas DGRM</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-2 text-left">Serial</th>
                    <th className="px-4 py-2 text-left">Marca / Modelo</th>
                    <th className="px-4 py-2 text-left">Capacidade</th>
                    <th className="px-4 py-2 text-left">Próxima inspeção</th>
                    <th className="px-4 py-2 text-left">Estado</th>
                    <th className="px-4 py-2 text-right">Ficha DGRM</th>
                  </tr>
                </thead>
                <tbody>
                  {jangadas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        Sem jangadas registadas.
                      </td>
                    </tr>
                  ) : (
                    jangadas.map((j) => {
                      const prox = j.dataProxInspecao || "";
                      const valida = !!prox && prox >= today;
                      return (
                        <tr key={j.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                          <td className="px-4 py-2 font-mono font-semibold text-slate-800">
                            <Link href={`/jangadas/${j.id}`} className="text-blue-700 hover:underline">
                              {j.serial || `#${j.id}`}
                            </Link>
                          </td>
                          <td className="px-4 py-2 text-slate-600">
                            {[j.brand, j.model].filter(Boolean).join(" ") || "—"}
                          </td>
                          <td className="px-4 py-2">{j.capacity ? `${j.capacity} pessoas` : "—"}</td>
                          <td className="px-4 py-2">{toDisplayDate(j.dataProxInspecao) || "—"}</td>
                          <td className="px-4 py-2">
                            {!prox ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                                Sem data
                              </span>
                            ) : valida ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Válida
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertTriangle className="w-3 h-3" /> Expirada
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Link
                              href={`/jangadas/${j.id}`}
                              className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-100"
                            >
                              <FileText className="w-3.5 h-3.5" /> Abrir ficha
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
