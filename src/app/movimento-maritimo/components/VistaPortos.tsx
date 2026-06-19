import React from "react";
import Link from "next/link";
import { PortSummary } from "../types";
import { getShipIsland, hasTrackingReadiness } from "../utils";
import { normalizeNavioTipoCategoria } from "@/lib/navio-legal-types";

interface VistaPortosProps {
  portSummaries: PortSummary[];
  handleAutofillVessel: (id: number, nome: string) => void;
}

export default function VistaPortos({
  portSummaries,
  handleAutofillVessel,
}: VistaPortosProps) {
  if (portSummaries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Não há portos para mostrar com os filtros atuais.
      </div>
    );
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {portSummaries.map((summary) => {
        const sampleNavios = summary.navios.slice(0, 4);

        return (
          <article key={summary.porto} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Porto</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">{summary.porto}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {summary.total} navio{summary.total !== 1 && "s"} · {summary.prontosTracking} prontos
                </p>
              </div>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 whitespace-nowrap">
                {summary.ilhaPrincipal}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Ilhas conexas</p>
                <p className="mt-1 text-sm font-semibold text-slate-900 leading-tight">
                  {summary.ilhasLigadas.join(", ")}
                </p>
              </div>
              <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Cobertura</p>
                <p className="mt-1 text-sm font-semibold text-slate-900 leading-tight">
                  {summary.prontosTracking === summary.total
                    ? "100% Pronto"
                    : `${summary.total - summary.prontosTracking} ficha(s) pendente(s)`}
                </p>
              </div>
            </div>

            <div className="mt-5 flex-grow">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Destaques deste Porto</p>
              <div className="space-y-2">
                {sampleNavios.map((navio) => (
                  <div key={navio.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm shadow-sm">
                    <div className="min-w-0 flex-1 pr-2">
                      <Link href={`/navios/${navio.id}`} className="font-semibold text-blue-700 hover:text-blue-900 hover:underline truncate block">
                        {navio.nome}
                      </Link>
                      <p className="text-[11px] text-slate-500 truncate block">
                        {getShipIsland(navio)} · {normalizeNavioTipoCategoria(navio.tipoPesca, navio.matricula, navio.tipoNavio)}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-xl px-2 py-1 text-[10px] font-semibold whitespace-nowrap ${hasTrackingReadiness(navio) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                          {hasTrackingReadiness(navio) ? "Tracking OK" : "Incompleto"}
                        </span>
                      </div>
                      
                      {!hasTrackingReadiness(navio) && (
                        <button
                          type="button"
                          onClick={() => handleAutofillVessel(navio.id, navio.nome)}
                          className="text-[10px] font-medium text-blue-600 hover:text-blue-800 underline transition-colors"
                        >
                          Auto-preencher MMSI
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {summary.navios.length > 4 && (
                  <div className="text-center pt-2">
                    <span className="text-xs font-medium text-slate-500">
                      e mais {summary.navios.length - 4} navio(s)...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
