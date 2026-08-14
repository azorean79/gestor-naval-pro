"use client";

import React, { useMemo } from "react";

const EQUASIS_HOME_URL = "https://www.equasis.org/EquasisWeb/public/HomePage?fs=HomePage";
const EQUASIS_SEARCH_URL = "https://www.equasis.org/EquasisWeb/public/ShipSearch?fs=Search";

type CurrentNavioSnapshot = {
  nome?: string | null;
  imo?: string | null;
  mmsi?: string | null;
  callSignal?: string | null;
  bandeira?: string | null;
  comprimentoMetros?: string | number | null;
  proprietario?: string | null;
  tipoNavio?: string | null;
};

type NavioEquasisCardProps = {
  navioId?: number | string;
  nomeNavio?: string | null;
  imo?: string | null;
  mmsi?: string | null;
  currentNavio?: CurrentNavioSnapshot | null;
  onImportApplied?: (() => void | Promise<void>) | null;
};

function clean(value?: string | number | null) {
  return String(value ?? "").trim();
}

function isValidImo(value?: string | null) {
  return /^\d{7}$/.test(clean(value));
}

function buildSearchRecommendations(nomeNavio?: string | null, imo?: string | null, mmsi?: string | null) {
  const cleanName = clean(nomeNavio);
  const cleanImoValue = clean(imo);
  const cleanMmsiValue = clean(mmsi);

  return [
    cleanName
      ? { label: "Pesquisar por nome", value: cleanName, preferred: true, hint: "Preferência recomendada quando o nome está disponível." }
      : null,
    isValidImo(cleanImoValue)
      ? { label: "Pesquisar por IMO", value: cleanImoValue, preferred: !cleanName, hint: "Boa alternativa para reduzir ambiguidades." }
      : null,
    cleanMmsiValue
      ? { label: "Usar MMSI como apoio", value: cleanMmsiValue, preferred: false, hint: "Útil para confirmar identidade, mesmo que o Equasis favoreça nome/IMO." }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string; preferred: boolean; hint: string }>;
}

export default function NavioEquasisCard({
  navioId,
  nomeNavio,
  imo,
  mmsi,
  currentNavio,
  onImportApplied,
}: NavioEquasisCardProps) {
  const recommendations = useMemo(() => buildSearchRecommendations(nomeNavio, imo, mmsi), [nomeNavio, imo, mmsi]);
  const hasLookupData = recommendations.length > 0;
  const summaryRows = [
    { label: "Nome", value: clean(nomeNavio) || clean(currentNavio?.nome) || "—" },
    { label: "IMO", value: clean(imo) || clean(currentNavio?.imo) || "—" },
    { label: "MMSI", value: clean(mmsi) || clean(currentNavio?.mmsi) || "—" },
    { label: "Call sign", value: clean(currentNavio?.callSignal) || "—" },
    { label: "Bandeira", value: clean(currentNavio?.bandeira) || "—" },
    { label: "Tipo", value: clean(currentNavio?.tipoNavio) || "—" },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Equasis</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Consulta assistida do navio</h2>
          <p className="mt-1 text-sm text-slate-500">
            Abre o Equasis com os dados disponíveis desta ficha. Quando houver nome, a pesquisa por <b>nome</b> é a via preferida; o IMO entra como plano B civilizado.
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {navioId ? `Navio #${navioId}` : "Sem ID local"}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {summaryRows.map((row) => (
          <div key={row.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">{row.label}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900 break-words">{row.value}</div>
          </div>
        ))}
      </div>

      {hasLookupData ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            Usa primeiro a pesquisa por <b>nome</b> e confirma com IMO/MMSI se necessário. É o modo mais alinhado com a forma como esta aplicação privilegia a consulta Equasis.
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              {recommendations.map((item) => (
                <div key={`${item.label}-${item.value}`} className="rounded-xl border border-slate-200 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{item.label}</span>
                        {item.preferred ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">Preferida</span>
                        ) : null}
                      </div>
                      <div className="mt-1 break-all font-mono text-sm text-slate-700">{item.value}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.hint}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(item.value)}
                      className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <a
                href={EQUASIS_SEARCH_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Abrir pesquisa Equasis
              </a>
              <a
                href={EQUASIS_HOME_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                Abrir página inicial
              </a>
              {onImportApplied ? (
                <button
                  type="button"
                  onClick={() => {
                    void onImportApplied();
                  }}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Atualizar ficha local
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
          Ainda faltam dados mínimos para consulta. Preenche pelo menos o <b>nome</b> ou um <b>IMO válido</b> na ficha do navio para usar o Equasis com menos adivinhação.
        </div>
      )}
    </section>
  );
}
