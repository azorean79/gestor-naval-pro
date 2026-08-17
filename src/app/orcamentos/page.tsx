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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setLoading(true) no início do fetch assíncrono controla o estado de carregamento.
    load();
  }, [load]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    const confirmText = window.confirm(
      `Eliminar definitivamente ${ids.length} orçamento(s)/OT(s)?\n\nEsta ação não pode ser anulada.`,
    );
    if (!confirmText) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/ordens-servico/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao eliminar ordens.");
      setSelectedIds(new Set());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao eliminar ordens.");
    } finally {
      setDeleting(false);
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

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

        {selectedIds.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5">
            <span className="text-sm font-semibold text-rose-700">
              {selectedIds.size} selecionada(s)
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={clearSelection}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Limpar seleção
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleting}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? "A eliminar…" : "Eliminar selecionadas"}
              </button>
            </div>
          </div>
        )}

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
                    <label
                      onClick={(e) => e.preventDefault()}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span className="text-xs font-semibold text-slate-400">
                        #{row.numeroOrdem || row.id}
                      </span>
                    </label>
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