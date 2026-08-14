"use client";
import React from 'react';
import { useJangadaWizardStore } from './store/useJangadaWizardStore';
import { Container, Scale, Calendar, Beaker, AlertTriangle } from 'lucide-react';

export default function Step5_Cilindros() {
  const { inspectionData, setInspectionData } = useJangadaWizardStore();

  const cylinder = inspectionData.cylinder || {};

  const handleChange = (field: string, value: string) => {
    const updatedCylinder = {
      ...cylinder,
      [field]: value
    };

    if (field === 'dataTeste' && value) {
      const parts = value.split('-');
      if (parts[0] && parts[0].length === 4) {
        const year = parseInt(parts[0]) + 5;
        const month = parts[1] || '01';
        const day = parts[2];
        updatedCylinder.dataProxTeste = day ? `${year}-${month}-${day}` : `${year}-${month}`;
      }
    }

    setInspectionData({
      cylinder: updatedCylinder
    });
  };

  // Helper function to try to calculate gross weight if possible
  const calculateGrossWeight = () => {
    const tara = parseFloat(cylinder.tara || '0');
    const co2 = parseFloat(cylinder.co2 || '0');
    const n2 = parseFloat(cylinder.n2 || '0');
    
    if (tara > 0 || co2 > 0 || n2 > 0) {
      return (tara + co2 + n2).toFixed(3);
    }
    return '';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">5. Cilindro e Teste Hidrostático</h2>
        <p className="text-slate-600 mt-1">Registe os dados do cilindro de insuflação, pesagens de gás e as datas das provas.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Identificação */}
        <div className="border border-slate-200 bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
              <Container size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Identificação</h3>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nº de Série do Cilindro</label>
              <input 
                type="text" 
                placeholder="Ex: CYL-123456"
                value={cylinder.serial || ''}
                onChange={(e) => handleChange('serial', e.target.value)}
                className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white text-sm transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Sistema de Insuflação</label>
              <input 
                type="text" 
                placeholder="Ex: Cabeça Operacional MK3"
                value={cylinder.sistema || ''}
                onChange={(e) => handleChange('sistema', e.target.value)}
                className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white text-sm transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Pesagens */}
        <div className="border border-slate-200 bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
              <Scale size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Pesagens de Gás</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Beaker size={12}/> CO2 (kg)</label>
              <input 
                type="number" 
                step="0.001"
                placeholder="0.000"
                value={cylinder.co2 || ''}
                onChange={(e) => handleChange('co2', e.target.value)}
                className="w-full border-slate-200 rounded-xl px-4 py-3 bg-amber-50/30 focus:bg-white text-sm transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Beaker size={12}/> N2 (kg)</label>
              <input 
                type="number" 
                step="0.001"
                placeholder="0.000"
                value={cylinder.n2 || ''}
                onChange={(e) => handleChange('n2', e.target.value)}
                className="w-full border-slate-200 rounded-xl px-4 py-3 bg-amber-50/30 focus:bg-white text-sm transition-colors"
              />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tara (kg)</label>
              <input 
                type="number" 
                step="0.001"
                placeholder="0.000"
                value={cylinder.tara || ''}
                onChange={(e) => handleChange('tara', e.target.value)}
                className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white text-sm transition-colors"
              />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Peso Bruto Verificado (kg)</label>
              <input 
                type="number" 
                step="0.001"
                placeholder={calculateGrossWeight() || "0.000"}
                value={cylinder.pesoBruto || ''}
                onChange={(e) => handleChange('pesoBruto', e.target.value)}
                className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white text-sm transition-colors font-semibold text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Testes Hidrostáticos */}
        <div className="border border-slate-200 bg-white rounded-2xl p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
              <Calendar size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Testes Hidrostáticos</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Data do Último Teste (Realizado)</label>
              <input 
                type="month" 
                value={cylinder.dataTeste || ''}
                onChange={(e) => handleChange('dataTeste', e.target.value)}
                className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white text-sm transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Próximo Teste Hidrostático</label>
              <input 
                type="month" 
                value={cylinder.dataProxTeste || ''}
                onChange={(e) => handleChange('dataProxTeste', e.target.value)}
                className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white text-sm transition-colors"
              />
              {(() => {
                if (cylinder.dataProxTeste) {
                  const expDate = new Date(cylinder.dataProxTeste);
                  const insDate = inspectionData.dataInspecao ? new Date(inspectionData.dataInspecao) : new Date();
                  if (!isNaN(expDate.getTime())) {
                    const diffTime = expDate.getTime() - insDate.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) {
                      return (
                        <div className="text-xs font-semibold text-red-700 flex items-center gap-1.5 mt-2 bg-red-50 p-2 rounded-xl border border-red-200 animate-pulse">
                          <AlertTriangle size={16} className="shrink-0 text-red-500" />
                          <span>O teste hidrostático do cilindro está EXPIRADO!</span>
                        </div>
                      );
                    } else if (diffDays <= 90) {
                      return (
                        <div className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 mt-2 bg-amber-50 p-2 rounded-xl border border-amber-200">
                          <AlertTriangle size={16} className="shrink-0 text-amber-500" />
                          <span>O teste hidrostático expira em {diffDays} dias.</span>
                        </div>
                      );
                    }
                  }
                }
                return null;
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
