"use client";
import React from "react";
import { useColeteWizardStore } from "./store/useColeteWizardStore";
import { ArrowLeft, ChevronRight, Wind, ShieldAlert, Activity } from "lucide-react";

type Props = {
  onNext: () => void;
  onPrev: () => void;
};

export default function Step4_Testes({ onNext, onPrev }: Props) {
  const { inspectionData, setInspectionData } = useColeteWizardStore();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">4. Testes do Equipamento</h2>
        <p className="text-slate-600 mt-1">Registo dos resultados dos testes de insuflação e retenção de pressão.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Teste de Insuflação */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Wind size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Teste de Insuflação</h3>
                <p className="text-xs text-slate-500">Insuflação por ar comprimido ou cilindro</p>
              </div>
            </div>
            
            <div className="space-y-1.5 mt-6">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Resultado do Teste</label>
              <select
                value={inspectionData.testeInsuflacao}
                onChange={(e) => setInspectionData({ testeInsuflacao: e.target.value })}
                className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-100 font-medium text-sm transition-colors"
              >
                <option value="">Selecione o resultado...</option>
                <option value="Aprovado (Manual)">Aprovado (Insuflação Manual)</option>
                <option value="Aprovado (Automático)">Aprovado (Insuflação Automática)</option>
                <option value="Aprovado (Oral)">Aprovado (Insuflação Oral)</option>
                <option value="Reprovado">Reprovado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Teste de Pressão / Estanquidade */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Teste de Retenção de Pressão</h3>
                <p className="text-xs text-slate-500">Normalmente deixado durante 12-24 horas</p>
              </div>
            </div>
            
            <div className="space-y-1.5 mt-6">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Resultado do Teste</label>
              <select
                value={inspectionData.testePressao}
                onChange={(e) => setInspectionData({ testePressao: e.target.value })}
                className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-100 font-medium text-sm transition-colors"
              >
                <option value="">Selecione o resultado...</option>
                <option value="Aprovado (12h)">Aprovado (Pressão mantida por 12h)</option>
                <option value="Aprovado (24h)">Aprovado (Pressão mantida por 24h)</option>
                <option value="Reprovado (Fuga)">Reprovado (Fuga detetada)</option>
              </select>
            </div>
          </div>
        </div>

      </div>

      {/* Observações Gerais */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
          <Activity size={16} className="text-indigo-500" /> Observações e Trabalhos Adicionais
        </h3>
        <textarea
          value={inspectionData.observacoes}
          onChange={(e) => setInspectionData({ observacoes: e.target.value })}
          placeholder="Descreva aqui quaisquer reparos efetuados ou observações adicionais sobre o estado do colete..."
          className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-colors min-h-[120px]"
        />
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
