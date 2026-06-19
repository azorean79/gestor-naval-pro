import React from "react";
import { IslandSummary } from "../types";

interface VistaIlhasProps {
  islandSummaries: IslandSummary[];
}

export default function VistaIlhas({
  islandSummaries,
}: VistaIlhasProps) {
  if (islandSummaries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Não há ilhas para mostrar com os filtros atuais.
      </div>
    );
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {islandSummaries.map((summary) => (
        <article key={summary.ilha} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ilha</p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">{summary.ilha}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {summary.total} navio{summary.total !== 1 && "s"} · {summary.portos.length} porto(s)
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 whitespace-nowrap">
              {summary.prontosTracking}/{summary.total} Prontos
            </span>
          </div>

          <div className="mt-4 flex flex-col justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Portos Registados</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 leading-tight">
              {summary.portos.join(", ") || "Sem porto"}
            </p>
          </div>

          <div className="mt-4 flex-grow">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">Resumo Tipologia</p>
            <div className="grid gap-2">
              {summary.tipologias.slice(0, 3).map((item) => (
                <div key={`${summary.ilha}-${item.tipo}`} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm shadow-sm">
                  <span className="text-slate-600 truncate">{item.tipo}</span>
                  <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full text-xs">
                    {item.total}
                  </span>
                </div>
              ))}
              {summary.tipologias.length > 3 && (
                <div className="text-center pt-1">
                  <span className="text-xs font-medium text-slate-500">
                    + {summary.tipologias.length - 3} mais...
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">Navios Principais</p>
            <div className="flex flex-wrap gap-2">
              {summary.navios.slice(0, 4).map((navio) => (
                <span
                  key={navio.id}
                  className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800"
                >
                  {navio.nome}
                </span>
              ))}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
