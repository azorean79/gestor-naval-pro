"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Package, Search } from "lucide-react";
import {
  STOCK_SHELVES,
  buildShelfSummary,
  formatShelfLabel,
  resolveShelfCode,
  shelfMatchesLocation,
} from "@/lib/stock-shelves";

export type ShelfStockItem = {
  id: number;
  nome?: string;
  descricao?: string;
  referencia?: string | null;
  quantidade?: number;
  localizacao?: string | null;
  categoria?: string | null;
};

type StockShelvesMapProps = {
  items: ShelfStockItem[];
  mode?: "view" | "select";
  selectedLocation?: string;
  onSelectLocation?: (loc: string) => void;
  onFilterCatalog?: (shelfCode: string) => void;
  className?: string;
};

export default function StockShelvesMap({
  items,
  mode = "view",
  selectedLocation = "",
  onSelectLocation,
  onFilterCatalog,
  className = "",
}: StockShelvesMapProps) {
  const initial = resolveShelfCode(selectedLocation) || null;
  const [selectedCell, setSelectedCell] = useState<string | null>(initial);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setSelectedCell(resolveShelfCode(selectedLocation) || null);
  }, [selectedLocation]);

  const summary = useMemo(() => buildShelfSummary(items), [items]);
  const rows = useMemo(() => {
    const grouped: (typeof STOCK_SHELVES)[] = [[], [], [], []];
    for (const shelf of STOCK_SHELVES) {
      grouped[shelf.row - 1]?.push(shelf);
    }
    return grouped.filter((r) => r.length > 0);
  }, []);

  const getItemsAt = (code: string) =>
    items.filter((item) => shelfMatchesLocation(item.localizacao, code));

  const listSource =
    selectedCell === "__NONE__"
      ? items.filter((i) => !resolveShelfCode(i.localizacao))
      : selectedCell
        ? getItemsAt(selectedCell)
        : [];

  const activeItems = listSource.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [item.nome, item.descricao, item.referencia, item.categoria]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const handleCellClick = (cellName: string) => {
    setSelectedCell(cellName);
    if (mode === "select" && onSelectLocation) {
      onSelectLocation(cellName);
    }
  };

  const selectedShelf = STOCK_SHELVES.find((s) => s.code === selectedCell);
  const occupied = summary.shelves.filter((s) => s.occupied).length;

  return (
    <div className={`grid grid-cols-1 gap-6 lg:grid-cols-3 ${className}`}>
      <div className="space-y-4 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs font-bold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-indigo-600" />
            20 prateleiras · {occupied}/20 ocupadas
            {summary.unassignedCount > 0 ? ` · ${summary.unassignedCount} sem local` : ""}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="h-3.5 w-3.5 rounded border border-indigo-400 bg-indigo-100" /> Ocupada
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3.5 w-3.5 rounded border border-slate-200 bg-white" /> Vazia
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3.5 w-3.5 rounded border border-amber-400 bg-amber-100" /> Selecionada
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Entrada / Expedição
        </div>

        <div className="space-y-4">
          {rows.map((rowShelves, rowIdx) => {
            const zone = rowShelves[0]?.zone || `Fila ${rowIdx + 1}`;
            return (
              <div key={zone} className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Fila {rowIdx + 1} · {zone}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {rowShelves.map((shelf) => {
                    const stats = summary.shelves.find((s) => s.code === shelf.code);
                    const hasItems = Boolean(stats?.occupied);
                    const isSelected = selectedCell === shelf.code;
                    return (
                      <button
                        key={shelf.code}
                        type="button"
                        onClick={() => handleCellClick(shelf.code)}
                        title={`${shelf.label} · ${shelf.zone}`}
                        className={`flex aspect-[4/3] flex-col items-center justify-center rounded-xl border p-1.5 transition-all ${
                          isSelected
                            ? "scale-[1.03] border-amber-500 bg-amber-50 text-amber-900 shadow-md ring-2 ring-amber-200"
                            : hasItems
                              ? "border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-sm font-black tracking-tight">{shelf.code}</span>
                        <span className="mt-0.5 text-[10px] font-bold opacity-80">
                          {hasItems ? `${stats?.itemCount} art · ${stats?.quantityTotal} un` : "vazia"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {summary.unassignedCount > 0 && (
          <button
            type="button"
            onClick={() => setSelectedCell("__NONE__")}
            className={`w-full rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
              selectedCell === "__NONE__"
                ? "border-rose-400 bg-rose-50 text-rose-800"
                : "border-rose-200 bg-rose-50/50 text-rose-700 hover:bg-rose-50"
            }`}
          >
            Sem prateleira: {summary.unassignedCount} artigo(s) · {summary.unassignedQuantity} un
          </button>
        )}
      </div>

      <div className="flex min-h-[320px] flex-col rounded-2xl border border-slate-100 bg-slate-50 p-5">
        <h4 className="mb-3 border-b border-slate-200 pb-2 text-xs font-black uppercase tracking-widest text-slate-400">
          {selectedCell === "__NONE__"
            ? "Artigos sem prateleira"
            : selectedCell
              ? formatShelfLabel(selectedCell)
              : "Seleciona uma prateleira"}
        </h4>

        {selectedCell && selectedCell !== "__NONE__" && selectedShelf && (
          <p className="mb-3 text-[11px] text-slate-500">
            Zona: <strong>{selectedShelf.zone}</strong>
            {selectedShelf.suggestedCategories.length > 0 && (
              <> · sugerido: {selectedShelf.suggestedCategories.slice(0, 3).join(", ")}</>
            )}
          </p>
        )}

        {selectedCell && (
          <div className="relative mb-3">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrar nesta prateleira..."
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-2 text-xs outline-none focus:border-indigo-400"
            />
          </div>
        )}

        {!selectedCell ? (
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-center text-xs text-slate-400">
            <MapPin size={28} className="mb-2 text-slate-300" />
            Clica em P01–P20 para ver o stock dessa prateleira.
          </div>
        ) : activeItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-center text-xs text-slate-400">
            <Package size={28} className="mb-2 text-slate-300" />
            {selectedCell === "__NONE__" ? "Todos os artigos têm prateleira." : "Prateleira vazia."}
            {mode === "select" && selectedCell !== "__NONE__" && (
              <button
                type="button"
                onClick={() => onSelectLocation?.(selectedCell)}
                className="mt-4 flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-[11px] font-bold text-white hover:bg-indigo-500"
              >
                Confirmar {selectedCell} <ArrowRight size={12} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="mb-2 flex flex-wrap gap-2">
              {mode === "view" && selectedCell !== "__NONE__" && onFilterCatalog && (
                <button
                  type="button"
                  onClick={() => onFilterCatalog(selectedCell)}
                  className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50"
                >
                  Ver no catálogo
                </button>
              )}
              {mode === "select" && selectedCell !== "__NONE__" && (
                <button
                  type="button"
                  onClick={() => onSelectLocation?.(selectedCell)}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-500"
                >
                  Alocar aqui <ArrowRight size={12} />
                </button>
              )}
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {activeItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/stock/${item.id}`}
                  className="block rounded-xl border border-slate-100 bg-white p-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/40"
                >
                  <p className="line-clamp-1 font-bold text-slate-900">{item.nome || item.descricao || "Sem nome"}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span>Ref: {item.referencia || "—"}</span>
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-600">
                      Qtd: {item.quantidade ?? 0}
                    </span>
                  </div>
                  {selectedCell === "__NONE__" && item.localizacao && (
                    <p className="mt-1 text-[10px] text-amber-700">Loc. livre: {item.localizacao}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
