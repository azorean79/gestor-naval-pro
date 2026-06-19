"use client";

import React from "react";
import { groupNaviosByIslandTypeClient, normalizeNavioTipoCategoria, type NavioGroupingItem } from "@/lib/navios-grouping";

type NaviosAgrupadosProps<T extends NavioGroupingItem = NavioGroupingItem> = {
  navios: T[];
  emptyMessage?: string;
  compact?: boolean;
  renderActions?: (navio: T) => React.ReactNode;
};

export default function NaviosPorIlhaTipoCliente<T extends NavioGroupingItem>({
  navios,
  emptyMessage = "Nenhum navio encontrado para os filtros atuais.",
  compact = false,
  renderActions,
}: NaviosAgrupadosProps<T>) {
  const agrupado = groupNaviosByIslandTypeClient(navios);

  if (agrupado.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {agrupado.map((ilhaSection) => (
        <section key={ilhaSection.island} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{ilhaSection.island}</h3>
              <p className="text-xs text-slate-500">{ilhaSection.types.length} tipo(s) de atividade</p>
            </div>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
              {ilhaSection.total} navio(s)
            </span>
          </div>

          <div className="space-y-3 p-4">
            {ilhaSection.types.map((typeSection) => (
              <div key={`${ilhaSection.island}-${typeSection.type}`} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{typeSection.type}</h4>
                    <p className="text-xs text-slate-500">{typeSection.clients.length} cliente(s)</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                    {typeSection.total} navio(s)
                  </span>
                </div>

                <div className="space-y-3">
                  {typeSection.clients.map((clientSection) => (
                    <div key={`${ilhaSection.island}-${typeSection.type}-${clientSection.client}`} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <h5 className="text-sm font-medium text-slate-800">{clientSection.client}</h5>
                        <span className="text-[11px] text-slate-500">{clientSection.navios.length} navio(s)</span>
                      </div>

                      <div className="space-y-2">
                        {clientSection.navios.map((navio) => (
                          <div
                            key={navio.id}
                            className={`rounded-lg border border-slate-200 px-3 py-2 ${compact ? "bg-slate-50" : "bg-white"}`}
                          >
                            <div className={`flex ${compact ? "flex-col gap-2" : "flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"}`}>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{navio.nome}</p>
                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                                  <span><b>Matrícula:</b> {navio.matricula || "-"}</span>
                                  <span><b>Tipo:</b> {normalizeNavioTipoCategoria(navio.tipoPesca, navio.matricula)}</span>
                                </div>
                              </div>
                              {renderActions ? <div className="flex flex-wrap gap-2">{renderActions(navio)}</div> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
