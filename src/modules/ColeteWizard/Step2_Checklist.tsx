"use client";
import React from 'react';
import { useColeteWizardStore } from './store/useColeteWizardStore';

const CHECKLIST_OPTIONS = ['OK', 'Falha (F)', 'Substituído (S)', 'Reparado (R)', 'N/A'];

export default function Step2_Checklist() {
  const { inspectionData, setInspectionData } = useColeteWizardStore();

  const handleChecklistChange = (field: string, value: string) => {
    setInspectionData({
      checklist: {
        ...(inspectionData.checklist || {}),
        [field]: value
      }
    });
  };

  const renderRadioGroup = (label: string, field: string) => {
    const currentValue = inspectionData.checklist?.[field] || '';
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 mb-3">{label}</h4>
        <div className="flex flex-wrap gap-2">
          {CHECKLIST_OPTIONS.map((opt) => (
            <label 
              key={opt} 
              className={`flex-1 min-w-[80px] text-center px-3 py-2 rounded-lg cursor-pointer text-xs font-semibold transition-all ${currentValue === opt ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <input 
                type="radio" 
                name={field} 
                value={opt} 
                checked={currentValue === opt}
                onChange={() => handleChecklistChange(field, opt)}
                className="hidden" 
              />
              {opt}
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">2. Inspecção Visual (Checklist)</h2>
        <p className="text-slate-600 mt-1">Verifique o estado geral dos componentes exteriores e costuras.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderRadioGroup("Tecido Exterior (Cover)", "tecidoExterior")}
        {renderRadioGroup("Colagens e Costuras", "colagens")}
        {renderRadioGroup("Zataos / Velcro / Fechos", "zataosVelcro")}
        {renderRadioGroup("Fitas Reflectoras SOLAS", "fitasReflectoras")}
      </div>
    </div>
  );
}
