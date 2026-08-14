"use client";
import React from 'react';
import { useJangadaWizardStore } from './store/useJangadaWizardStore';
import { Check, X, RefreshCw, Minus } from 'lucide-react';

const CHECKLIST_GROUPS = [
  {
    title: 'Exterior da Jangada',
    items: [
      { id: 'cobertura_exterior', label: 'Cobertura Exterior' },
      { id: 'saida_antena', label: 'Saída de Antena' },
      { id: 'refletores', label: 'Refletores' },
      { id: 'tubo_identificacao', label: 'Tubo de Identificação' },
      { id: 'costuras_juntas', label: 'Protectores de Juntas' },
      { id: 'camara_fundos', label: 'Câmara e Fundo' },
      { id: 'sistema_endireitar', label: 'Sistema de Endireitar' },
      { id: 'bolsas_estabilizacao', label: 'Bolsas de Estabilização' },
      { id: 'luz_exterior_bateria', label: 'Luz Exterior e Bateria' },
      { id: 'escada_borda', label: 'Rampa ou Escada' },
      { id: 'grinalda_espelhos', label: 'Grinalda e Espelhos' },
    ]
  },
  {
    title: 'Interior da Jangada',
    items: [
      { id: 'escada_entrada', label: 'Escada de Entrada' },
      { id: 'grinalda_interior', label: 'Grinalda Interior' },
      { id: 'anel_linha', label: 'Anel com Linha' },
      { id: 'faca_seguranca', label: 'Facas de Segurança' },
      { id: 'cobertura_interior', label: 'Cobertura Interior' },
      { id: 'fecho_cobertura', label: 'Fecho da Cobertura' },
      { id: 'colectores_agua', label: 'Colectores de Água' },
      { id: 'manual_instrucoes', label: 'Manual de Instruções' },
      { id: 'tecido_camara_fundo', label: 'Tecido de Câmara e Fundo' },
      { id: 'luz_interior_bateria', label: 'Luz Interior e Bateria' },
    ]
  }
];

const STATUS_OPTIONS = [
  { value: 'OK', label: 'Bom Estado', icon: Check, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200' },
  { value: 'SUBSTITUIDO', label: 'Substituído', icon: RefreshCw, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200' },
  { value: 'REPROVADO', label: 'Reprovado', icon: X, color: 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200' },
  { value: 'NA', label: 'N/A', icon: Minus, color: 'text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200' },
];

export default function Step2_Checklist() {
  const { inspectionData, setInspectionData } = useJangadaWizardStore();

  // Initialize checklist object if undefined
  const checklist = inspectionData.checklist || {};

  const handleStatusChange = (itemId: string, status: string) => {
    setInspectionData({
      checklist: {
        ...checklist,
        [itemId]: { ...(checklist[itemId] || {}), status }
      }
    });
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    setInspectionData({
      checklist: {
        ...checklist,
        [itemId]: { ...(checklist[itemId] || {}), notes }
      }
    });
  };

  const setAllToOk = (groupItems: { id: string }[]) => {
    const updatedChecklist = { ...checklist };
    groupItems.forEach(item => {
      if (!updatedChecklist[item.id]) updatedChecklist[item.id] = {};
      updatedChecklist[item.id].status = 'OK';
    });
    setInspectionData({ checklist: updatedChecklist });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">2. Checklist Visual</h2>
        <p className="text-slate-600 mt-1">Verifique visualmente o estado do exterior e interior da jangada.</p>
      </div>

      <div className="space-y-10">
        {CHECKLIST_GROUPS.map((group) => (
          <div key={group.title} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-slate-800">{group.title}</h3>
              <button 
                onClick={() => setAllToOk(group.items)}
                className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors"
              >
                Marcar tudo como Bom Estado (OK)
              </button>
            </div>
            
            <div className="divide-y divide-slate-100">
              {group.items.map((item) => {
                const currentStatus = checklist[item.id]?.status;
                const currentNotes = checklist[item.id]?.notes || '';
                
                return (
                  <div key={item.id} className="p-4 sm:px-6 hover:bg-slate-50/50 transition-colors flex flex-col xl:flex-row gap-4 xl:items-center justify-between">
                    <div className="w-full xl:w-1/3">
                      <p className="font-semibold text-slate-800">{item.label}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 xl:w-auto shrink-0">
                      {STATUS_OPTIONS.map((opt) => {
                        const isSelected = currentStatus === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => handleStatusChange(item.id, opt.value)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                              isSelected 
                                ? `${opt.color} ring-2 ring-offset-1 ring-opacity-50 ${opt.color.split(' ')[0].replace('text', 'ring')}` 
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <opt.icon size={16} />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="w-full xl:w-1/3">
                      <input
                        type="text"
                        placeholder="Observações (opcional)"
                        value={currentNotes}
                        onChange={(e) => handleNotesChange(item.id, e.target.value)}
                        className={`w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-100 transition-colors ${currentStatus === 'REPROVADO' ? 'border-red-300 bg-red-50' : ''}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
