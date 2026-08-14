"use client";
import React from "react";
import { useColeteWizardStore } from "./store/useColeteWizardStore";
import { Ship, Tag, Calendar, ChevronRight } from "lucide-react";

type Props = {
  onNext: () => void;
};

export default function Step1_Identificacao({ onNext }: Props) {
  const { inspectionData, setInspectionData } = useColeteWizardStore();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">1. Identificação do Colete</h2>
        <p className="text-slate-600 mt-1">Verifique e atualize as informações de registo do Colete Salva-Vidas e do Navio associado.</p>
      </div>

      {/* Navio Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
          <Ship size={16} className="text-indigo-500" /> Navio Cliente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Nome do Navio</label>
            <input
              type="text"
              value={inspectionData.shipName}
              onChange={(e) => setInspectionData({ shipName: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Colete Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
          <Tag size={16} className="text-indigo-500" /> Dados do Equipamento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Número de Série <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={inspectionData.serial}
              onChange={(e) => setInspectionData({ serial: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-100 font-mono font-medium transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Marca / Fabricante</label>
            <input
              type="text"
              value={inspectionData.brand}
              onChange={(e) => setInspectionData({ brand: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-100 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Modelo</label>
            <input
              type="text"
              value={inspectionData.model}
              onChange={(e) => setInspectionData({ model: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-100 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Datas */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
          <Calendar size={16} className="text-indigo-500" /> Agendamento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Data de Inspeção Atual</label>
            <input
              type="date"
              value={inspectionData.dataInspecao}
              onChange={(e) => {
                const newDate = e.target.value;
                const update: any = { dataInspecao: newDate };
                const d = new Date(newDate);
                if (!isNaN(d.getTime())) {
                  d.setFullYear(d.getFullYear() + 1);
                  update.dataProxInspecao = d.toISOString().slice(0, 10);
                }
                setInspectionData(update);
              }}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-100 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Próxima Inspeção (Vencimento)</label>
            <input
              type="date"
              value={inspectionData.dataProxInspecao}
              onChange={(e) => setInspectionData({ dataProxInspecao: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-100 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={onNext}
          disabled={!inspectionData.serial}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Próximo Passo <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
