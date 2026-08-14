"use client";
import React from "react";
import { useColeteWizardStore } from "./store/useColeteWizardStore";
import { ArrowLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";

type Props = {
  onNext: () => void;
  onPrev: () => void;
};

const VISUAL_CHECKS = [
  { key: "tecidoExterior", label: "Tecido Exterior", desc: "Verificar cortes, desgaste ou descoloração." },
  { key: "colagens", label: "Costuras e Colagens", desc: "Integridade das uniões." },
  { key: "fitasReflectoras", label: "Fitas Refletoras", desc: "Aderência e refletividade." },
  { key: "zataosVelcro", label: "Fechos e Velcros", desc: "Funcionamento correto." },
  { key: "sistemaInflacao", label: "Sistema de Insuflação", desc: "Estado geral do atuador." },
  { key: "camaras", label: "Câmaras-de-ar (Bladders)", desc: "Desgaste ou danos na câmara interna." },
  { key: "tuboInflador", label: "Tubo de Insuflação Oral", desc: "Válvula e bocal." },
];

export default function Step2_Inspecao({ onNext, onPrev }: Props) {
  const { inspectionData, setInspectionData } = useColeteWizardStore();

  const handleSetCheck = (key: string, value: string) => {
    setInspectionData({ [key]: value });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">2. Inspeção Visual</h2>
        <p className="text-slate-600 mt-1">Verificação detalhada da integridade física do colete salva-vidas.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 bg-slate-50 px-6 py-4 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-12 md:col-span-5">Ponto de Verificação</div>
          <div className="col-span-12 md:col-span-7">Estado</div>
        </div>

        <div className="divide-y divide-slate-100">
          {VISUAL_CHECKS.map((check) => {
            const currentValue = (inspectionData as any)[check.key];
            return (
              <div key={check.key} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50/50 transition-colors">
                <div className="col-span-12 md:col-span-5">
                  <p className="font-bold text-slate-800">{check.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{check.desc}</p>
                </div>
                <div className="col-span-12 md:col-span-7">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleSetCheck(check.key, 'OK')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                        currentValue === 'OK'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle2 size={16} /> Bom (OK)
                    </button>
                    <button
                      onClick={() => handleSetCheck(check.key, 'F')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                        currentValue === 'F'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <AlertCircle size={16} /> Falhou (F)
                    </button>
                    <button
                      onClick={() => handleSetCheck(check.key, 'R')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                        currentValue === 'R'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Info size={16} /> Reparado (R)
                    </button>
                    <button
                      onClick={() => handleSetCheck(check.key, 'N/A')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                        currentValue === 'N/A'
                          ? 'bg-slate-200 text-slate-800 border border-slate-300'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <XCircle size={16} /> N/A
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mecanismo */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">
          Tipo de Mecanismo de Insuflação
        </h3>
        <select
          value={inspectionData.mecanismoInflacao}
          onChange={(e) => setInspectionData({ mecanismoInflacao: e.target.value })}
          className="w-full md:w-1/2 border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-100 transition-colors"
        >
          <option value="">Selecionar mecanismo...</option>
          <option value="HR">Halkey Roberts (HR)</option>
          <option value="HM">Hammar (HM)</option>
          <option value="SEC">Secumar (SEC)</option>
          <option value="LZ_JS1">Lalizas JS1 Automático</option>
          <option value="LZ_MAN">Lalizas Manual Operating Head</option>
          <option value="UML">United Moulders (UML)</option>
          <option value="CREW">Crewsaver (CREW)</option>
          <option value="PL">Plastimo (PL)</option>
          <option value="MANUAL">Apenas Manual</option>
        </select>
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
