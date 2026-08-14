"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  RefreshCw,
  Link2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  ShoppingCart,
  Search,
  ArrowRight,
  Info,
  Loader2,
} from "lucide-react";

type StockMatch = {
  packLabel: string;
  packReference: string;
  category: string;
  section: string;
  demandQty: number;
  raftCount: number;
  stockId: number;
  stockReference: string;
  stockDescription: string;
  stockQuantity: number;
  stockMinQuantity: number | null;
  status: "ok" | "low" | "out" | "missing";
  suggestion: string;
};

type UnmatchedItem = {
  packLabel: string;
  packReference: string;
  category: string;
  section: string;
  demandQty: number;
  raftCount: number;
  stockReferences: string[];
  suggestion: "create" | "find_similar";
  similarItems: Array<{ id: number; referencia: string; descricao: string }>;
};

type SyncSummary = {
  totalPackArticles: number;
  matchedCount: number;
  unmatchedCount: number;
  statusBreakdown: { ok: number; low: number; out: number };
  totalRaftsAnalyzed: number;
};

type SyncResult = {
  reference: string;
  status: string;
  message: string;
};

type PackSyncPanelProps = {
  onSyncComplete?: () => void;
};

const SECTION_LABELS: Record<string, { label: string; color: string }> = {
  emergency: { label: "Emergência", color: "bg-red-100 text-red-700 border-red-200" },
  equipment: { label: "Equipamento", color: "bg-blue-100 text-blue-700 border-blue-200" },
  raft: { label: "Jangada", color: "bg-purple-100 text-purple-700 border-purple-200" },
};

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  ok: { icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-200", label: "Suficiente" },
  low: { icon: AlertTriangle, color: "text-amber-600 bg-amber-50 border-amber-200", label: "Baixo" },
  out: { icon: XCircle, color: "text-rose-600 bg-rose-50 border-rose-200", label: "Esgotado" },
  missing: { icon: Package, color: "text-slate-600 bg-slate-50 border-slate-200", label: "Não encontrado" },
};

const PackSyncPanelNoMemo = function PackSyncPanel({ onSyncComplete }: PackSyncPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matched, setMatched] = useState<StockMatch[]>([]);
  const [unmatched, setUnmatched] = useState<UnmatchedItem[]>([]);
  const [summary, setSummary] = useState<SyncSummary | null>(null);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<"all" | "ok" | "low" | "out" | "missing">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stock/sync-pack");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar dados.");
      setMatched(data.matched || []);
      setUnmatched(data.unmatched || []);
      setSummary(data.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const filteredMatched = useMemo(() => {
    let items = matched;
    if (filter !== "all") {
      items = items.filter(m => m.status === filter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(m =>
        m.packLabel.toLowerCase().includes(term) ||
        m.stockReference.toLowerCase().includes(term) ||
        m.stockDescription.toLowerCase().includes(term)
      );
    }
    return items;
  }, [matched, filter, searchTerm]);

  const filteredUnmatched = useMemo(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return unmatched.filter(u =>
        u.packLabel.toLowerCase().includes(term) ||
        u.packReference.toLowerCase().includes(term)
      );
    }
    return unmatched;
  }, [unmatched, searchTerm]);

  const handleCreateMissing = async (items: UnmatchedItem[]) => {
    setProcessing(true);
    setSyncResults([]);
    try {
      const res = await fetch("/api/stock/sync-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_missing",
          items: items.map(i => ({
            packReference: i.packReference,
            packLabel: i.packLabel,
            category: i.category,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar artigos.");
      setSyncResults(data.results || []);
      await loadData();
      onSyncComplete?.();
    } catch (err) {
      setSyncResults([{
        reference: "ERRO",
        status: "error",
        message: err instanceof Error ? err.message : "Erro desconhecido",
      }]);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateMinQty = async (stockId: number, reference: string, newQty: number) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/stock/sync-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_min_qty",
          items: [{ packReference: reference, stockId, newMinQty: newQty }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar.");
      await loadData();
    } catch (err) {
      console.error("Erro ao atualizar quantidade mínima:", err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center">
        <Loader2 size={24} className="text-blue-500 animate-spin mr-3" />
        <span className="text-slate-600 font-medium">A carregar sincronização pack↔stock...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-6">
        <div className="flex items-center gap-3 text-rose-700">
          <XCircle size={20} />
          <span className="font-bold">{error}</span>
        </div>
        <button onClick={loadData} className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-bold">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Link2 size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  Sincronização Pack ↔ Stock
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Artigos obrigatórios dos packs vs. stock disponível
                </p>
              </div>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Atualizar
            </button>
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-5 bg-slate-50 border-b border-slate-100">
            <div className="text-center">
              <p className="text-2xl font-black text-slate-800">{summary.totalPackArticles}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Artigos Pack</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-emerald-600">{summary.matchedCount}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">No Stock</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-amber-600">{summary.statusBreakdown.low}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Stock Baixo</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-rose-600">{summary.statusBreakdown.out + summary.unmatchedCount}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Em Falta</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-indigo-600">{summary.totalRaftsAnalyzed}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Jangadas</p>
            </div>
          </div>
        )}

        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar artigos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(["all", "ok", "low", "out", "missing"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f === "all" ? "Todos" : STATUS_CONFIG[f]?.label || f}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredMatched.map((item, idx) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.missing;
            const StatusIcon = cfg.icon;
            const sectionCfg = SECTION_LABELS[item.section] || SECTION_LABELS.equipment;

            return (
              <div key={`m-${idx}`} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-xl border ${cfg.color}`}>
                      <StatusIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-800 truncate">{item.packLabel}</h4>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${sectionCfg.color}`}>
                          {sectionCfg.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Ref: {item.stockReference} · {item.raftCount} jangada(s) precisam
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500">Demanda</p>
                      <p className="text-sm font-black text-slate-800">{item.demandQty} un.</p>
                    </div>
                    <ArrowRight size={14} className="text-slate-300" />
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500">Stock</p>
                      <p className={`text-sm font-black ${item.stockQuantity <= 0 ? 'text-rose-600' : item.stockQuantity <= (item.stockMinQuantity || 0) ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {item.stockQuantity} un.
                      </p>
                    </div>
                    <div className="min-w-[140px]">
                      <p className={`text-[11px] font-medium ${cfg.color.split(' ')[0]}`}>
                        {item.suggestion}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredUnmatched.length > 0 && (
            <div className="px-6 py-3 bg-amber-50 border-t border-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-600" />
                  <span className="text-xs font-bold text-amber-800">
                    {filteredUnmatched.length} artigo(s) não encontrados no stock
                  </span>
                </div>
                <button
                  onClick={() => handleCreateMissing(filteredUnmatched.filter(u => u.suggestion === "create"))}
                  disabled={processing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  {processing ? <Loader2 size={12} className="animate-spin" /> : <Package size={12} />}
                  Criar no Stock
                </button>
              </div>
            </div>
          )}

          {filteredUnmatched.map((item, idx) => (
            <div key={`u-${idx}`} className="px-6 py-4 bg-amber-50/30 hover:bg-amber-50/60 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="p-2 rounded-xl border border-amber-200 bg-amber-50">
                    <Package size={16} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{item.packLabel}</h4>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-200 bg-amber-100 text-amber-700">
                        {item.suggestion === "create" ? "Criar" : "Similar"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ref: {item.packReference} · {item.raftCount} jangada(s) precisam
                    </p>
                    {item.similarItems.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-[9px] text-slate-500 mr-1">Similares:</span>
                        {item.similarItems.map(s => (
                          <span key={s.id} className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                            {s.referencia} - {s.descricao.slice(0, 30)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500">Demanda</p>
                  <p className="text-sm font-black text-amber-700">{item.demandQty} un.</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {syncResults.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h4 className="text-sm font-bold text-slate-800 mb-3">Resultados da Sincronização</h4>
          <div className="space-y-2">
            {syncResults.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${
                r.status === "created" ? "bg-emerald-50 border border-emerald-200" :
                r.status === "error" ? "bg-rose-50 border border-rose-200" :
                "bg-slate-50 border border-slate-200"
              }`}>
                {r.status === "created" ? (
                  <CheckCircle2 size={14} className="text-emerald-500" />
                ) : r.status === "error" ? (
                  <XCircle size={14} className="text-rose-500" />
                ) : (
                  <Info size={14} className="text-slate-400" />
                )}
                <span className="text-xs font-medium text-slate-700">
                  <strong>{r.reference}</strong>: {r.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export default React.memo(PackSyncPanelNoMemo);
