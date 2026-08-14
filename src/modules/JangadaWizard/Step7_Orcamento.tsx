"use client";
import React, { useMemo, useEffect, useRef } from 'react';
import { useJangadaWizardStore } from './store/useJangadaWizardStore';
import { Receipt, RefreshCw, Search, X, PackageSearch, Info, Download } from 'lucide-react';
import type { OrcamentoLinha } from './types';
import { calcTotal, getIvaRate } from '@/lib/iva';
import * as XLSX from 'xlsx';

const formatPrice = (value: number) => {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value || 0);
};

const round = (value: number) => Math.round((value || 0) * 100) / 100;

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  "L-JD": "Inspeção de Jangada",
  "L-FS": "Teste FS",
  "L-NAP": "Teste NAP",
  "L-GI": "Teste GI",
  "L-TH": "Teste Hidrostático",
  "L-CO2": "Carga de CO2",
};

export default function Step7_Orcamento() {
  const { inspectionData, setInspectionData } = useJangadaWizardStore();

  const orcamento = {
    ...(inspectionData.orcamento || { linhas: [], valorMaoObra: 0, valorDesconto: 0, isIsentoIva: false }),
    usarOrcamento: true,
  };
  const linhas: OrcamentoLinha[] = orcamento.linhas || [];
  const globalStock = inspectionData.globalStock || [];
  const [artigoBusca, setArtigoBusca] = React.useState("");
  const linhaSeq = React.useRef(0);

  const getStockPrice = (referencia: string, stockId?: number | string | null) => {
    if (stockId != null && stockId !== "") {
      const byId = globalStock.find((s) => s.id === Number(stockId));
      if (byId && Number(byId.precoVenda) > 0) return Number(byId.precoVenda) || 0;
    }
    const byRef = globalStock.find(
      (s) => s.referencia && referencia && s.referencia.toLowerCase() === String(referencia).toLowerCase()
    );
    return byRef ? Number(byRef.precoVenda) || 0 : 0;
  };

  const buildServiceLines = (): OrcamentoLinha[] => {
    const testes = inspectionData.testes || {};
    const refs: string[] = ["L-JD"];
    if (["PASSOU", "REPROVOU", "APROVOU"].includes(testes.testeFS)) refs.push("L-FS");
    if (["PASSOU", "REPROVOU", "APROVOU"].includes(testes.testeNAP)) refs.push("L-NAP");
    if (["PASSOU", "REPROVOU", "APROVOU"].includes(testes.testeGI)) refs.push("L-GI");
    if (["PASSOU", "REPROVOU", "APROVOU"].includes(testes.testeDL) || inspectionData.cylinder?.dataTeste) refs.push("L-TH");
    if (inspectionData.cylinder?.serial) refs.push("L-CO2");

    return refs.map((ref) => {
      const stock = globalStock.find((s) => s.referencia === ref);
      const unitPrice = Number(stock?.precoVenda) || 0;
      return {
        id: `service-${ref}`,
        stockId: stock?.id ?? null,
        referencia: ref,
        descricao: SERVICE_DESCRIPTIONS[ref] || stock?.descricao || ref,
        quantidade: 1,
        unitPrice,
        total: unitPrice,
        source: "service" as const,
      };
    });
  };

  const buildPackLines = (): OrcamentoLinha[] =>
    Object.values(inspectionData.packItems || {})
      .filter((item: any) => Number(item.quantidade) > 0)
      .map((item: any) => {
        const unitPrice = getStockPrice(item.referencia, item.stockId);
        const quantidade = Number(item.quantidade) || 0;
        return {
          id: `pack-${item.referencia || item.checklistName}`,
          stockId: item.stockId ?? null,
          referencia: item.referencia || "SEM-REF",
          descricao: item.descricao || item.name || "Consumível",
          quantidade,
          unitPrice,
          total: round(quantidade * unitPrice),
          source: "pack" as const,
        };
      });

  const buildComponenteLines = (): OrcamentoLinha[] =>
    (inspectionData.componentes || [])
      .filter((comp: any) => comp.reference || comp.stockId)
      .map((comp: any) => {
        const unitPrice = getStockPrice(comp.reference, comp.stockId);
        return {
          id: `comp-${comp.id}`,
          stockId: comp.stockId ?? null,
          referencia: comp.reference || "SEM-REF",
          descricao: comp.type || comp.name || "Componente",
          quantidade: 1,
          unitPrice,
          total: unitPrice,
          source: "componente" as const,
        };
      });

  const buildMergedLines = (removedIdsOverride?: string[]): OrcamentoLinha[] => {
    const current = linhas;
    const removed = new Set(removedIdsOverride || orcamento.removedIds || []);
    const built = [...buildServiceLines(), ...buildPackLines(), ...buildComponenteLines()];

    const result: OrcamentoLinha[] = [];
    for (const b of built) {
      if (removed.has(b.id)) continue;
      const existing = current.find(
        (l) => l.id === b.id || (l.referencia === b.referencia && l.source === b.source)
      );
      if (existing) {
        result.push({
          ...existing,
          quantidade: b.source === "service" ? existing.quantidade || 1 : b.quantidade,
          unitPrice: Number(existing.unitPrice) > 0 ? Number(existing.unitPrice) : b.unitPrice,
          total: round((b.source === "service" ? existing.quantidade || 1 : b.quantidade) * (Number(existing.unitPrice) > 0 ? Number(existing.unitPrice) : b.unitPrice)),
        });
      } else {
        result.push({ ...b });
      }
    }

    const builtIds = new Set(built.map((b) => b.id));
    const builtRefs = new Set(built.map((b) => `${b.referencia}::${b.source}`));
    for (const l of current) {
      if (!builtIds.has(l.id) && !builtRefs.has(`${l.referencia}::${l.source}`)) {
        result.push(l);
      }
    }

    return result;
  };

  const syncFromSubstitutions = () => {
    setInspectionData({
      orcamento: {
        linhas: buildMergedLines(),
        valorMaoObra: 0,
        valorDesconto: Number(orcamento.valorDesconto) || 0,
        isIsentoIva: Boolean(orcamento.isIsentoIva),
        usarOrcamento: true,
      },
    });
  };

  useEffect(() => {
    const next = buildMergedLines();
    const nextKey = next.map((l) => `${l.id}::${l.quantidade}::${l.unitPrice}`).join("|");
    const curKey = linhas.map((l) => `${l.id}::${l.quantidade}::${l.unitPrice}`).join("|");
    if (nextKey !== curKey || next.length !== linhas.length) {
      setInspectionData({
        orcamento: {
          ...orcamento,
          linhas: next,
          usarOrcamento: true,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectionData.packItems, inspectionData.componentes, inspectionData.testes, inspectionData.globalStock]);

  const updateLinha = (id: string, patch: Partial<OrcamentoLinha>) => {
    setInspectionData({
      orcamento: {
        ...orcamento,
        linhas: linhas.map((l) => {
          if (l.id !== id) return l;
          const next = { ...l, ...patch };
          next.quantidade = Number(next.quantidade) || 0;
          next.unitPrice = Number(next.unitPrice) || 0;
          next.total = round(next.quantidade * next.unitPrice);
          return next;
        }),
      },
    });
  };

  const removeLinha = (id: string) => {
    setInspectionData({
      orcamento: {
        ...orcamento,
        linhas: linhas.filter((l) => l.id !== id),
        removedIds: [...(orcamento.removedIds || []), id],
      },
    });
  };

  const restoreRemovedLines = () => {
    setInspectionData({
      orcamento: {
        ...orcamento,
        removedIds: [],
        linhas: buildMergedLines([]),
        usarOrcamento: true,
      },
    });
  };

  const exportOrcamentoXlsx = () => {
    const rows = linhas.map((l) => ({
      Referência: l.referencia || "—",
      Descrição: l.descricao || "",
      Qtd: l.quantidade,
      "Preço Unit. (€)": l.unitPrice,
      "Total (€)": l.total,
      Origem: l.source === "service" ? "Serviço" : l.source === "pack" ? "Pack" : l.source === "componente" ? "Componente" : "Manual",
    }));
    rows.push({ Referência: "", Descrição: "Mão de obra (incluída nos serviços)", Qtd: 0, "Preço Unit. (€)": 0, "Total (€)": 0, Origem: "" });
    rows.push({ Referência: "", Descrição: "Desconto", Qtd: 0, "Preço Unit. (€)": 0, "Total (€)": -(Number(orcamento.valorDesconto) || 0), Origem: "" });
    rows.push({ Referência: "", Descrição: "Subtotal", Qtd: 0, "Preço Unit. (€)": 0, "Total (€)": subtotal, Origem: "" });
    rows.push({ Referência: "", Descrição: `IVA (${orcamento.isIsentoIva ? "isento" : `${(getIvaRate() * 100).toFixed(0)}%`})`, Qtd: 0, "Preço Unit. (€)": 0, "Total (€)": round(total - subtotal), Origem: "" });
    rows.push({ Referência: "", Descrição: "TOTAL", Qtd: 0, "Preço Unit. (€)": 0, "Total (€)": total, Origem: "" });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orçamento");
    XLSX.writeFile(wb, `orcamento-${inspectionData.dataInspecao || "inspecao"}-${inspectionData.serial || "j"}.xlsx`);
  };

  const addArtigo = (artigo: { id: number; referencia: string; descricao: string; precoVenda: number }) => {
    setInspectionData({
      orcamento: {
        ...orcamento,
        linhas: [
          ...linhas,
          {
            id: `stock-${artigo.id}-${++linhaSeq.current}`,
            stockId: artigo.id,
            referencia: artigo.referencia,
            descricao: artigo.descricao,
            quantidade: 1,
            unitPrice: artigo.precoVenda,
            total: artigo.precoVenda,
            source: "stock",
          },
        ],
      },
    });
  };

  const artigosServicos = useMemo(() => {
    return globalStock.filter((s) => /^L-/i.test(s.referencia || ""));
  }, [globalStock]);

  const artigosFiltrados = useMemo(() => {
    const busca = artigoBusca.trim().toLowerCase();
    if (!busca) return [];
    return globalStock
      .filter((s) =>
        (s.referencia || "").toLowerCase().includes(busca) ||
        (s.descricao || "").toLowerCase().includes(busca)
      )
      .slice(0, 8);
  }, [artigoBusca, globalStock]);

  const valorPecas = linhas.reduce((acc, l) => acc + (Number(l.total) || 0), 0);
  const valorDesconto = Number(orcamento.valorDesconto) || 0;
  const subtotal = Math.max(0, valorPecas - valorDesconto);
  const total = calcTotal(valorPecas, 0, valorDesconto, Boolean(orcamento.isIsentoIva));

  const substituicoesAtivas =
    Object.values(inspectionData.packItems || {}).filter((i: any) => Number(i.quantidade) > 0).length +
    (inspectionData.componentes || []).filter((c: any) => c.reference || c.stockId).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">7. Orçamento</h2>
        <p className="text-slate-600 mt-1">
          Orçamento sincronizado com as substituições registadas (pack e componentes) e os testes realizados. A mão de obra está incluída nos serviços (L-JD / L-RFD / L-DSB); edite preços, quantidades e desconto conforme necessário.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={syncFromSubstitutions}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw size={16} />
            Atualizar a partir de substituições
          </button>
          {(orcamento.removedIds || []).length > 0 && (
            <button
              type="button"
              onClick={restoreRemovedLines}
              className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-xl font-semibold text-sm border border-amber-200 hover:bg-amber-200 transition-colors"
              title="Repor as linhas automáticas que foram removidas"
            >
              <RefreshCw size={16} />
              Repor linhas removidas ({(orcamento.removedIds || []).length})
            </button>
          )}
          {linhas.length > 0 && (
            <button
              type="button"
              onClick={exportOrcamentoXlsx}
              className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 rounded-xl font-semibold text-sm border border-indigo-200 hover:bg-indigo-50 transition-colors"
              title="Exportar orçamento para Excel"
            >
              <Download size={16} />
              Exportar XLSX
            </button>
          )}
          {substituicoesAtivas > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1.5">
              {substituicoesAtivas} artigo{substituicoesAtivas === 1 ? "" : "s"} substituído{substituicoesAtivas === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 bg-slate-50 border-b border-slate-200 px-6 py-4">
          <Receipt className="text-slate-500" size={20} />
          <h3 className="text-lg font-bold text-slate-800">Linhas do Orçamento</h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Adicionar artigo do stock
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={14} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Procurar artigo (ex.: L-JD, L-MAR)..."
                  value={artigoBusca}
                  onChange={(e) => setArtigoBusca(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {artigoBusca.trim() && (
                  <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                    {artigosFiltrados.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-500">Sem resultados.</div>
                    ) : (
                      artigosFiltrados.map((artigo) => (
                        <button
                          key={artigo.id}
                          type="button"
                          onClick={() => {
                            addArtigo({
                              id: artigo.id,
                              referencia: artigo.referencia || "",
                              descricao: artigo.descricao || "",
                              precoVenda: Number(artigo.precoVenda) || 0,
                            });
                            setArtigoBusca("");
                          }}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-indigo-50"
                        >
                          <span className="text-xs">
                            <span className="font-bold text-slate-800">{artigo.referencia}</span>
                            <span className="block text-slate-500">{artigo.descricao}</span>
                          </span>
                          <span className="text-xs font-semibold text-slate-700">{formatPrice(Number(artigo.precoVenda))}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Serviços (um clique)
              </label>
              {artigosServicos.length === 0 ? (
                <div className="text-xs text-slate-400 italic pt-2">Sem serviços L-* no stock carregado.</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {artigosServicos.map((artigo) => (
                    <button
                      key={artigo.id}
                      type="button"
                      onClick={() =>
                        addArtigo({
                          id: artigo.id,
                          referencia: artigo.referencia || "",
                          descricao: artigo.descricao || "",
                          precoVenda: Number(artigo.precoVenda) || 0,
                        })
                      }
                      title={artigo.descricao}
                      className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                      {artigo.referencia} · {formatPrice(Number(artigo.precoVenda))}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {linhas.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
              <PackageSearch className="w-10 h-10 text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-700 mb-1">Sem linhas no orçamento</h3>
              <p className="text-sm text-slate-500 max-w-md">
                Carregue em "Atualizar a partir de substituições" para gerar as linhas automáticas ou adicione artigos manualmente.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Artigo</th>
                    <th className="w-16 px-2 py-2 text-right font-semibold">Qtd</th>
                    <th className="w-24 px-2 py-2 text-right font-semibold">Preço €</th>
                    <th className="w-24 px-2 py-2 text-right font-semibold">Total €</th>
                    <th className="w-8 px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {linhas.map((linha) => (
                    <tr key={linha.id}>
                      <td className="px-3 py-2">
                        <div className="font-bold text-slate-800">{linha.referencia || "—"}</div>
                        <div className="text-slate-500">{linha.descricao}</div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">
                          {linha.source === "service" ? "Serviço" : linha.source === "pack" ? "Pack" : linha.source === "componente" ? "Componente" : "Manual"}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={linha.quantidade ?? 1}
                          onChange={(e) => updateLinha(linha.id, { quantidade: Number(e.target.value) })}
                          className="w-full rounded-lg border border-slate-300 px-1.5 py-1 text-right text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={linha.unitPrice ?? 0}
                          onChange={(e) => updateLinha(linha.id, { unitPrice: Number(e.target.value) })}
                          className="w-full rounded-lg border border-slate-300 px-1.5 py-1 text-right text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-2 py-2 text-right font-semibold text-slate-800">{formatPrice(linha.total)}</td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeLinha(linha.id)}
                          className="text-slate-400 hover:text-red-600"
                          aria-label="Remover artigo"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Desconto (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={orcamento.valorDesconto || ""}
                onChange={(e) => setInspectionData({ orcamento: { ...orcamento, valorDesconto: Number(e.target.value) } })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(orcamento.isIsentoIva)}
                  onChange={(e) => setInspectionData({ orcamento: { ...orcamento, isIsentoIva: e.target.checked } })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Isento de IVA
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <span>Peças / serviços</span>
              <span className="font-semibold text-slate-800">{formatPrice(valorPecas)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 mt-1.5">
              <span>Mão de obra (incluída nos serviços)</span>
              <span className="font-semibold text-slate-800">Incluída</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 mt-1.5">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-800">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 mt-1.5">
              <span>IVA</span>
              <span className="font-semibold text-slate-800">{orcamento.isIsentoIva ? "Isento" : "16%"}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 mt-2.5 pt-2.5 text-slate-900">
              <span className="font-bold">Total</span>
              <span className="font-black text-indigo-700">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 items-start">
        <Info className="text-indigo-600 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="text-sm font-bold text-indigo-900">Sincronização automática</h4>
          <p className="text-xs text-indigo-800 mt-1">
            Ao fechar a inspeção, estas linhas são gravadas na ordem de serviço associada à jangada, substituindo o cálculo automático. Os preços são preenchidos a partir do stock (preço de venda); edite apenas quando necessário.
          </p>
        </div>
      </div>
    </div>
  );
}
