"use client";
import React, { useMemo } from "react";
import { useColeteWizardStore } from "./store/useColeteWizardStore";
import { ArrowLeft, ChevronRight, Activity, ChevronDown, Package } from "lucide-react";

type Props = {
  onNext: () => void;
  onPrev: () => void;
};

export default function Step3_Componentes({ onNext, onPrev }: Props) {
  const { inspectionData, setInspectionData, globalStock } = useColeteWizardStore();
  const componentes = inspectionData.componentes || [];

  const updateItem = (id: string, field: string, value: any) => {
    setInspectionData({
      componentes: componentes.map((comp) => 
        comp.id === id ? { ...comp, [field]: value } : comp
      )
    });
  };

  const handleStockSelect = (id: string, stockIdStr: string) => {
    const stockId = parseInt(stockIdStr, 10);
    const stockItem = globalStock.find((s) => s.id === stockId);
    if (stockItem) {
      setInspectionData({
        componentes: componentes.map((comp) => 
          comp.id === id ? { 
            ...comp, 
            reference: stockItem.referencia,
            stockId: stockItem.id,
            validade: stockItem.validade || comp.validade,
            lote: stockItem.lote || comp.lote
          } : comp
        )
      });
    }
  };

  // Funções para ajudar a filtrar o stock adequado para cada componente
  const getFilteredStock = (compId: string) => {
    return globalStock.filter(s => {
      const desc = s.descricao.toLowerCase();
      const cat = s.categoria?.toLowerCase() || '';
      if (compId === 'cylinder') return cat.includes('cilindro') || desc.includes('co2') || desc.includes('cylinder');
      if (compId === 'cartridge') return cat.includes('bobbin') || cat.includes('pastilha') || desc.includes('cartridge') || desc.includes('bobbin');
      if (compId === 'light') return cat.includes('luz') || desc.includes('light');
      if (compId === 'whistle') return cat.includes('apito') || desc.includes('whistle');
      return true;
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">3. Componentes e Peças</h2>
        <p className="text-slate-600 mt-1">Registe as peças de reposição instaladas. Selecione o artigo do Stock Global para auto-preencher os dados e descontar do inventário no final.</p>
      </div>

      <div className="space-y-4">
        {componentes.map((comp) => {
          const availableStock = getFilteredStock(comp.id);

          return (
            <div key={comp.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-indigo-200 transition-colors">
              <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  {comp.id === 'light' ? <Activity size={20} /> : <Package size={20} />}
                </div>
                <h3 className="text-lg font-bold text-slate-800">{comp.name}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
                
                {/* Substituído? */}
                <div className="lg:col-span-3 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Substituído?
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl w-full">
                    <button
                      type="button"
                      onClick={() => {
                        updateItem(comp.id, 'substituido', false);
                        updateItem(comp.id, 'stockId', null);
                        updateItem(comp.id, 'reference', '');
                      }}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        !comp.substituido
                          ? 'bg-slate-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateItem(comp.id, 'substituido', true);
                      }}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        comp.substituido
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Sim
                    </button>
                  </div>
                </div>

                {/* Seleção de Stock */}
                <div className="lg:col-span-4 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Artigo do Stock (Substituição)
                  </label>
                  {comp.substituido ? (
                    <div className="relative">
                      <select
                        value={comp.stockId || ""}
                        onChange={(e) => handleStockSelect(comp.id, e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-100 appearance-none font-medium text-sm transition-colors animate-in fade-in duration-200"
                      >
                        <option value="" disabled>Selecione um artigo do stock...</option>
                        {availableStock.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.referencia} - {s.descricao} (Lote: {s.lote || 'N/A'}, Qtd: {s.quantidade})
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <ChevronDown size={16} className="text-slate-400" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-100 text-slate-400 text-xs font-semibold h-[46px] flex items-center justify-center select-none animate-in fade-in duration-200">
                      Mantém original (sem desconto de stock)
                    </div>
                  )}
                  {comp.substituido && comp.stockId && (
                    <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Vinculado ao Stock (Referência: {comp.reference})
                    </p>
                  )}
                </div>

                {/* Validade */}
                <div className="lg:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Validade
                  </label>
                  <input
                    type="month"
                    value={comp.validade}
                    onChange={(e) => updateItem(comp.id, 'validade', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-100 transition-colors text-sm font-medium"
                  />
                </div>

                {/* Lote */}
                <div className="lg:col-span-3 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Lote
                  </label>
                  <input
                    type="text"
                    value={comp.lote}
                    placeholder="Ex: L2345"
                    onChange={(e) => updateItem(comp.id, 'lote', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-100 transition-colors text-sm font-medium"
                  />
                </div>

              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft size={18} /> Voltar
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Próximo Passo <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// Pequeno import perdido que uso na linha 83
import { CheckCircle2 } from "lucide-react";
