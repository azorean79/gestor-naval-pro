"use client";

import React, { useMemo, useState } from "react";
import { AuditoriaConformidadePorMarca, AuditoriaDocumentosLegais, AuditoriaPlaneamentoCard } from "@/modules/Auditorias";
import DgrmChecklistLegal from "@/modules/DgrmChecklistLegal";
import LegislacaoList, { sampleLegislacao, type LegislacaoItem } from "@/modules/Legislacao";
import { FileText, ClipboardCheck, ShieldCheck, Search, X, Scale } from "lucide-react";

function classifyDgrmItem(item: LegislacaoItem) {
  const text = `${item.titulo} ${item.referencia || ""} ${item.descricao || ""}`.toLowerCase();
  if (text.includes("circular")) return "Circular";
  if (text.includes("portaria")) return "Portaria";
  if (text.includes("decreto")) return "Decreto-Lei";
  return "Legislação";
}

export default function DgrmPage() {
  const [activeTab, setActiveTab] = useState<"legislacao" | "checklist" | "auditoria">("legislacao");
  const [query, setQuery] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("Todos");
  
  const items = useMemo(() => sampleLegislacao(), []);

  const tipos = useMemo(
    () => ["Todos", ...Array.from(new Set(items.map((item) => classifyDgrmItem(item))))],
    [items]
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const tipo = classifyDgrmItem(item);
      if (tipoFiltro !== "Todos" && tipo !== tipoFiltro) return false;
      if (!normalizedQuery) return true;
      return [item.titulo, item.referencia, item.descricao, item.data]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [items, query, tipoFiltro]);

  const countByTipo = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, item) => {
      const tipo = classifyDgrmItem(item);
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});
  }, [items]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/40 py-8 animate-in fade-in duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header Premium Glassmorphic */}
        <header className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-6 shadow-md flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Scale className="text-indigo-600 dark:text-indigo-400" size={28} /> DGRM
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Consulta rápida de legislação, diplomas e conformidade legal da oficina e das estações de serviço.
            </p>
          </div>
          <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/40 dark:border-indigo-800 px-3.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-sm">
            Auditoria & Regulamentação
          </span>
        </header>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/30 w-full sm:w-max">
          <button
            onClick={() => setActiveTab("legislacao")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all w-full sm:w-auto justify-center ${
              activeTab === "legislacao"
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800"
            }`}
          >
            <FileText size={16} /> Legislação & Circulares
          </button>
          <button
            onClick={() => setActiveTab("checklist")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all w-full sm:w-auto justify-center ${
              activeTab === "checklist"
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800"
            }`}
          >
            <ClipboardCheck size={16} /> Checklist Legal
          </button>
          <button
            onClick={() => setActiveTab("auditoria")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all w-full sm:w-auto justify-center ${
              activeTab === "auditoria"
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800"
            }`}
          >
            <ShieldCheck size={16} /> Conformidade & Auditoria
          </button>
        </div>

        {/* Tab 1: Legislação */}
        {activeTab === "legislacao" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="rounded-2xl border border-indigo-100 dark:border-indigo-950/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-1">Total</p>
                <p className="text-3xl font-extrabold text-indigo-900 dark:text-indigo-300">{items.length}</p>
              </div>
              {Object.entries(countByTipo).map(([tipo, total]) => (
                <div key={tipo} className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800 p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">{tipo}</p>
                  <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-200">{total}</p>
                </div>
              ))}
            </div>

            {/* List with Search Filters */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="relative md:col-span-6">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Procurar diploma, referência, data ou texto…"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 transition-colors text-sm font-medium"
                  />
                  <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search size={18} />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <select
                    value={tipoFiltro}
                    onChange={(event) => setTipoFiltro(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 transition-colors text-sm font-medium"
                  >
                    {tipos.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo === "Todos" ? "Todos os Tipos" : tipo}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setTipoFiltro("Todos");
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-all text-sm"
                  >
                    <X size={16} /> Limpar Filtros
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Esta secção de consulta apresenta diplomas, circulares e portarias emitidas pela DGRM ou órgãos competentes, servindo de base de apoio legal permanente para a atividade de inspeção.
              </div>

              <div className="pt-2">
                <LegislacaoList items={filtered} />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Checklist */}
        {activeTab === "checklist" && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
            <DgrmChecklistLegal />
          </div>
        )}

        {/* Tab 3: Auditoria */}
        {activeTab === "auditoria" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <AuditoriaPlaneamentoCard />
            <AuditoriaConformidadePorMarca />
            <AuditoriaDocumentosLegais />
          </div>
        )}

      </div>
    </div>
  );
}