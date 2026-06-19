import React from "react";
import Link from "next/link";
import { Navio } from "../types";
import { getShipIsland, hasTrackingReadiness } from "../utils";
import { normalizeNavioTipoCategoria } from "@/lib/navio-legal-types";

interface VistaListaProps {
  filteredNavios: Navio[];
  handleAutofillVessel: (id: number, nome: string) => void;
}

export default function VistaLista({
  filteredNavios,
  handleAutofillVessel,
}: VistaListaProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Navio</th>
              <th className="px-4 py-3">Porto</th>
              <th className="px-4 py-3">Ilha</th>
              <th className="px-4 py-3">Tipologia</th>
              <th className="px-4 py-3 whitespace-nowrap">ETA / ETD</th>
              <th className="px-4 py-3">Vel.</th>
              <th className="px-4 py-3">Tracking</th>
              <th className="px-4 py-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {filteredNavios.map((navio) => (
              <tr key={navio.id} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 min-w-[200px]">
                  <div>
                    <p className="font-semibold text-slate-900">{navio.nome}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{navio.matricula || "Sem matrícula"}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{navio.portoRegisto || "Sem porto"}</td>
                <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{getShipIsland(navio)}</td>
                <td className="px-4 py-3 text-slate-700 whitespace-nowrap text-xs italic opacity-80">{normalizeNavioTipoCategoria(navio.tipoPesca, navio.matricula, navio.tipoNavio)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex flex-col gap-0.5 min-w-[120px]">
                    <span className="text-xs text-emerald-700 font-medium">{navio.eta ? `ARR: ${navio.eta}` : ""}</span>
                    <span className="text-xs text-rose-700 font-medium">{navio.etd ? `DEP: ${navio.etd}` : ""}</span>
                    {!navio.eta && !navio.etd && <span className="text-slate-400">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                  {navio.speedKnots ? `${navio.speedKnots.toFixed(1)} KN` : "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${hasTrackingReadiness(navio) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                    {hasTrackingReadiness(navio) ? "Pronto" : "Em falta"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    {!hasTrackingReadiness(navio) && (
                      <button
                        type="button"
                        onClick={() => handleAutofillVessel(navio.id, navio.nome)}
                        className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors whitespace-nowrap"
                      >
                        Auto MMSI
                      </button>
                    )}
                    <Link href={`/navios/${navio.id}`} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap">
                      Abrir ficha
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {filteredNavios.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                  Nenhum navio encontrado para os filtros escolhidos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
