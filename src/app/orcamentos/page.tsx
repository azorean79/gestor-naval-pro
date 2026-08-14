"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { formatDateTimeShort } from "@/lib/date-utils";

const ORCAMENTO_STATUS_LIST = ["Rascunho", "Enviado", "Aprovado", "Rejeitado"];

const STATUS_LABELS: Record<string, string> = {
  Rascunho: "Orçamento em rascunho",
  Enviado: "Orçamento em análise",
  Pendente: "Orçamento em análise",
  Aprovado: "Orçamento aprovado",
  Rejeitado: "Orçamento rejeitado",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  Rascunho: "bg-slate-100 text-slate-700 border-slate-300",
  Enviado: "bg-amber-50 text-amber-800 border-amber-300",
  Pendente: "bg-amber-50 text-amber-800 border-amber-300",
  Aprovado: "bg-emerald-50 text-emerald-800 border-emerald-300",
  Rejeitado: "bg-rose-50 text-rose-800 border-rose-300",
};

type OrcamentoRow = {
  id: number;
  numeroOrdem?: string | null;
  tipo?: string | null;
  status?: string | null;
  prioridade?: string | null;
  orcamentoStatus?: string | null;
  valorTotal?: number | null;
  dataAbertura?: string | null;
  dataPrevista?: string | null;
  metadados?: unknown;
  jangada?: { serial?: string | null; brand?: string | null; model?: string | null; owner?: string | null; numeroObra?: string | null } | null;
  jangadas?: Array<{ serial?: string | null; brand?: string | null; model?: string | null; owner?: string | null }> | null;
  cliente?: { nome?: string | null; ilha?: string | null } | null;
};

function getRaftDisplay(row: OrcamentoRow) {
  if (row.jangada) {
    const s = row.jangada.serial || "";
    const b = row.jangada.brand || "";
    const m = row.jangada.model || "";
    return `${b} ${m}`.trim() + (s ? ` — ${s}` : "");
  }
  if (row.jangadas?.length) {
    const first = row.jangadas[0];
    return `${first.brand || ""} ${first.model || ""}`.trim() + (first.serial ? ` — ${first.serial}` : "");
  }
  return "—";
}

export default function OrcamentosPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OrcamentoRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ includeClosed: "1" });
      if (statusFilter) params.set("orcamentoStatus", statusFilter);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/ordens-servico?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error || "Erro ao carregar orçamentos.");
        setRows([]);
        return;
      }
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Erro ao carregar orçamentos.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, q]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Orçamentos</h1>
            <p className="text-sm text-slate-500">Todas as ordens de serviço com orçamento.</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter("")}
            className={`border px-3 py-1.5 text-sm rounded-lg font-medium ${
              statusFilter === "" ? "border-blue-400 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Todos
          </button>
          {ORCAMENTO_STATUS_LIST.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
              className={`border px-3 py-1.5 text-sm rounded-lg font-medium ${
                statusFilter === s ? "border-blue-400 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {STATUS_LABELS[s] || s}
            </button>
          ))}

          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar jangada, cliente, nº ordem…"
              className="w-72 rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> A carregar orçamentos…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Sem orçamentos encontrados neste filtro.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => {
              const orcStatus = row.orcamentoStatus || "Rascunho";
              const badge = STATUS_BADGE_CLASSES[orcStatus] || STATUS_BADGE_CLASSES.Rascunho;
              const label = STATUS_LABELS[orcStatus] || orcStatus;
              return (
                <Link
                  key={row.id}
                  href={`/ordens-servico/${row.id}`}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-400">
                      #{row.numeroOrdem || row.id}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${badge}`}>
                      {label}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-800">{getRaftDisplay(row)}</div>
                  {row.cliente?.nome && (
                    <div className="mt-0.5 text-sm text-slate-500">
                      {row.cliente.nome}
                      {row.cliente.ilha ? ` · ${row.cliente.ilha}` : ""}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>Aberto {row.dataAbertura ? formatDateTimeShort(row.dataAbertura) : "—"}</span>
                    {typeof row.valorTotal === "number" && (
                      <span className="font-semibold text-slate-600">€ {row.valorTotal.toFixed(2)}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}