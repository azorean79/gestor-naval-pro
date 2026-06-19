"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

type MonthlyNeed = {
  month: string;
  quantidade: number;
  jangadas?: Array<{
    id: number;
    serial: string;
    brand?: string | null;
    model?: string | null;
    owner?: string | null;
  }>;
};

type Summary = {
  artigosComValidadeAte12Meses: number;
  artigosVencidos: number;
  quantidadeTotalNecessaria12m: number;
  jangadasAfetadas: number;
  necessidadesMensaisTotais: MonthlyNeed[];
};

type StockNeedRow = {
  stockId: number;
  referencia: string;
  nome: string;
  stockAtual: number;
  necessidade12m: number;
  saldoProjetado12m: number;
  mensal: MonthlyNeed[];
};

type UnmatchedNeedRow = {
  key: string;
  referencia: string | null;
  nome: string;
  necessidade12m: number;
  mensal: MonthlyNeed[];
};

type ApiPayload = {
  summary?: Summary | null;
  stockNeeds?: StockNeedRow[];
  unmatchedNeeds?: UnmatchedNeedRow[];
};

type ControlRow = {
  key: string;
  stockId?: number;
  nome: string;
  referencia?: string | null;
  stockAtual: number;
  necessidade: number;
  comprar: number;
  saldo: number;
  mensal: MonthlyNeed[];
  source: "stock" | "unmatched";
};

function formatMonth(month: string) {
  const [year, mon] = String(month || "").split("-");
  if (!year || !mon) return month;
  const date = new Date(Number(year), Number(mon) - 1, 1);
  return date.toLocaleDateString("pt-PT", { month: "short", year: "numeric" });
}

function buildRolling12Months() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  now.setDate(1);

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now);
    date.setMonth(now.getMonth() + index);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });
}

function getMonthNeed(mensal: MonthlyNeed[], month?: string | null) {
  if (!month) return null;
  return Number(mensal.find((item) => item.month === month)?.quantidade || 0);
}

export default function StockReposicoesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedMonth = String(searchParams.get("month") || "").trim() || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<ApiPayload | null>(null);
  const [search, setSearch] = useState("");
  const [onlyToBuy, setOnlyToBuy] = useState(true);
  const [expandedNeedKey, setExpandedNeedKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/stock/necessidades?stockScope=jangadas-ocean", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Não foi possível carregar o controlo de reposições.");
        }

        const data = (await response.json()) as ApiPayload;
        if (!active) return;
        setPayload(data);
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Erro ao carregar dados.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const availableMonths = useMemo(() => buildRolling12Months(), []);

  const rows = useMemo<ControlRow[]>(() => {
    const stockRows = (payload?.stockNeeds || []).map((row) => {
      const necessidade = selectedMonth ? getMonthNeed(row.mensal || [], selectedMonth) || 0 : Number(row.necessidade12m || 0);
      const stockAtual = Number(row.stockAtual || 0);
      const saldo = stockAtual - necessidade;
      return {
        key: `stock-${row.stockId}`,
        stockId: row.stockId,
        nome: row.nome,
        referencia: row.referencia,
        stockAtual,
        necessidade,
        comprar: Math.max(0, necessidade - stockAtual),
        saldo,
        mensal: row.mensal || [],
        source: "stock" as const,
      };
    });

    const unmatchedRows = (payload?.unmatchedNeeds || []).map((row) => {
      const necessidade = selectedMonth ? getMonthNeed(row.mensal || [], selectedMonth) || 0 : Number(row.necessidade12m || 0);
      return {
        key: row.key,
        nome: row.nome,
        referencia: row.referencia,
        stockAtual: 0,
        necessidade,
        comprar: Math.max(0, necessidade),
        saldo: -Math.max(0, necessidade),
        mensal: row.mensal || [],
        source: "unmatched" as const,
      };
    });

    return [...stockRows, ...unmatchedRows];
  }, [payload, selectedMonth]);

  const filteredRows = useMemo(() => {
    const text = search.trim().toLowerCase();
    return rows
      .filter((row) => row.necessidade > 0)
      .filter((row) => {
        if (!text) return true;
        return [row.nome, row.referencia || ""]
          .join(" ")
          .toLowerCase()
          .includes(text);
      })
      .filter((row) => (onlyToBuy ? row.comprar > 0 : true))
      .sort((a, b) => {
        if (b.comprar !== a.comprar) return b.comprar - a.comprar;
        if (b.necessidade !== a.necessidade) return b.necessidade - a.necessidade;
        return a.nome.localeCompare(b.nome, "pt", { sensitivity: "base" });
      });
  }, [rows, search, onlyToBuy]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.necessidade += row.necessidade;
        acc.stock += row.stockAtual;
        acc.comprar += row.comprar;
        if (row.source === "unmatched") acc.semCorrespondencia += 1;
        return acc;
      },
      { necessidade: 0, stock: 0, comprar: 0, semCorrespondencia: 0 }
    );
  }, [filteredRows]);

  const summaryCards = [
    {
      label: selectedMonth ? `Necessidade ${formatMonth(selectedMonth)}` : "Necessidade total 12 meses",
      value: totals.necessidade,
      tone: "border-sky-200 bg-sky-50 text-sky-900",
    },
    {
      label: "Stock atual disponível",
      value: totals.stock,
      tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
    },
    {
      label: "Comprar / requisitar",
      value: totals.comprar,
      tone: "border-amber-200 bg-amber-50 text-amber-900",
    },
    {
      label: "Sem artigo mapeado",
      value: totals.semCorrespondencia,
      tone: "border-rose-200 bg-rose-50 text-rose-900",
    },
  ];

  const updateMonth = (month: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (month) params.set("month", month);
    else params.delete("month");
    const query = params.toString();
    router.replace(query ? `/stock/reposicoes?${query}` : "/stock/reposicoes");
  };

  const selectedMonthRafts = (row: ControlRow) => {
    if (!selectedMonth) return [];
    return row.mensal.find((item) => item.month === selectedMonth)?.jangadas || [];
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <div className="app-hero-panel flex flex-col gap-4 rounded-2xl p-6 text-white">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-base font-semibold uppercase tracking-[0.2em] text-sky-100">Stock · Reposições</p>
              <h1 className="mt-2 text-4xl font-bold">Controlo de reposições</h1>
              <p className="mt-2 max-w-4xl text-base text-sky-100">
                Vista operacional para decidir o que comprar ou requisitar com base na necessidade prevista, stock atual e faltas por artigo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/stock"
                className="rounded-lg bg-white/15 px-4 py-2 text-base font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/20"
              >
                Voltar ao stock
              </Link>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg bg-white px-4 py-2 text-base font-semibold text-blue-700 shadow-sm transition hover:bg-sky-50"
              >
                Atualizar dados
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div key={card.label} className={`rounded-xl border p-4 ${card.tone}`}>
                <p className="text-xs uppercase tracking-[0.18em] opacity-80">{card.label}</p>
                <p className="mt-2 text-2xl font-bold">{card.value}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Filtro temporal</h2>
                <p className="text-sm text-slate-600">
                  Seleciona um mês para ver a necessidade desse período, ou mantém a vista global de 12 meses.
                </p>
              </div>
              {payload?.summary && (
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {payload.summary.quantidadeTotalNecessaria12m} unidades previstas em 12 meses
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateMonth(null)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  !selectedMonth
                    ? "bg-blue-700 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Vista 12 meses
              </button>
              {availableMonths.map((month) => (
                <button
                  key={month}
                  type="button"
                  onClick={() => updateMonth(month)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    selectedMonth === month
                      ? "bg-blue-700 text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {formatMonth(month)}
                </button>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
              <label className="block text-sm font-medium text-slate-700">
                Escolher mês
                <select
                  value={selectedMonth || ""}
                  onChange={(e) => updateMonth(e.target.value || null)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Vista global 12 meses</option>
                  {availableMonths.map((month) => (
                    <option key={`select-${month}`} value={month}>
                      {formatMonth(month)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Pesquisar artigo
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nome ou referência"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={onlyToBuy}
                  onChange={(e) => setOnlyToBuy(e.target.checked)}
                />
                Mostrar só faltas para comprar
              </label>
              <div className="flex items-end">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                  {filteredRows.length} linha(s)
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Necessidades vs stock</h2>
              <p className="text-sm text-slate-600">
                Cada linha mostra a necessidade prevista, o stock que tens e a quantidade que falta comprar ou requisitar.
              </p>
            </div>
            {selectedMonth && (
              <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                Mês selecionado: {formatMonth(selectedMonth)}
              </div>
            )}
          </div>

          {loading ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
              A carregar controlo de reposições...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
              Nenhuma necessidade encontrada com os filtros atuais.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
                    <th className="px-3 py-3">Artigo</th>
                    <th className="px-3 py-3">Referência</th>
                    <th className="px-3 py-3">Necessidade</th>
                    <th className="px-3 py-3">Stock atual</th>
                    <th className="px-3 py-3">Comprar / requisitar</th>
                    <th className="px-3 py-3">Saldo</th>
                    <th className="px-3 py-3">Planeamento</th>
                    <th className="px-3 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.key} className="border-b border-slate-100 align-top hover:bg-slate-50/70">
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-slate-900">{row.nome || "Sem nome"}</span>
                          {row.referencia ? (
                            <span className="text-xs font-medium text-slate-500">Ref. stock: {row.referencia}</span>
                          ) : null}
                          <span
                            className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              row.source === "unmatched"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {row.source === "unmatched" ? "Sem artigo de stock" : "Artigo mapeado"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{row.referencia || "—"}</td>
                      <td className="px-3 py-3 font-semibold text-slate-900">{row.necessidade}</td>
                      <td className="px-3 py-3 text-slate-700">{row.stockAtual}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            row.comprar > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {row.comprar}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={row.saldo < 0 ? "font-semibold text-rose-700" : "font-semibold text-emerald-700"}>
                          {row.saldo}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex max-w-[320px] flex-wrap gap-1.5">
                          {row.mensal.length > 0 ? (
                            row.mensal.map((item) => (
                              <button
                                key={`${row.key}-${item.month}`}
                                type="button"
                                onClick={() => {
                                  updateMonth(item.month);
                                  if (selectedMonth === item.month) {
                                    setExpandedNeedKey((prev) => (prev === row.key ? null : row.key));
                                  } else {
                                    setExpandedNeedKey(row.key);
                                  }
                                }}
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium ${
                                  selectedMonth === item.month
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
                                }`}
                                title={`${formatMonth(item.month)} · ${item.quantidade} unidade(s)${
                                  (item.jangadas || []).length
                                    ? ` · ${item.jangadas!.map((jangada) => jangada.serial).join(", ")}`
                                    : ""
                                }`}
                              >
                                <span>{formatMonth(item.month)}</span>
                                <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-bold text-inherit">
                                  {item.quantidade}
                                </span>
                              </button>
                            ))
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </div>
                        {selectedMonth && expandedNeedKey === row.key && selectedMonthRafts(row).length > 0 && (
                          <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">
                                Jangadas previstas para {formatMonth(selectedMonth)}
                              </p>
                              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                                {selectedMonthRafts(row).length} jangada(s)
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {selectedMonthRafts(row).map((jangada) => (
                                <Link
                                  key={`${row.key}-${selectedMonth}-${jangada.id}`}
                                  href={`/jangadas/${jangada.id}`}
                                  className="rounded-lg border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-medium text-sky-900 transition hover:border-sky-300 hover:bg-sky-100"
                                >
                                  <span className="font-bold">{jangada.serial}</span>
                                  {(jangada.brand || jangada.model) ? ` · ${[jangada.brand, jangada.model].filter(Boolean).join(" / ")}` : ""}
                                  {jangada.owner ? ` · ${jangada.owner}` : ""}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          {row.stockId ? (
                            <Link
                              href={`/stock/${row.stockId}`}
                              className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                            >
                              Ver artigo
                            </Link>
                          ) : (
                            <Link
                              href="/stock"
                              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Ir ao stock
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
