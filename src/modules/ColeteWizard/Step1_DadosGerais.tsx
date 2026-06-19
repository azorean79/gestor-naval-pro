"use client";
import React, { useEffect, useState } from 'react';
import { useColeteWizardStore } from './store/useColeteWizardStore';

export default function Step1_DadosGerais() {
  const { inspectionData, setInspectionData } = useColeteWizardStore();
  const [catalogOptions, setCatalogOptions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/coletes/catalog-options')
      .then(res => res.json())
      .then(data => {
        if (data && data.options) {
          setCatalogOptions(data.options);
        }
      })
      .catch(err => console.error("Erro ao carregar catálogo:", err));
  }, []);

  const handleChange = (field: string, value: any) => {
    setInspectionData({ [field]: value });
  };

  const marcas = Array.from(new Set(catalogOptions.map(o => o.marca).filter(Boolean))).sort();
  const modelosFiltered = catalogOptions
    .filter(o => !inspectionData.marca || o.marca.toUpperCase() === String(inspectionData.marca).toUpperCase())
    .map(o => o.modelo)
    .filter(Boolean);
  const modelos = Array.from(new Set(modelosFiltered)).sort();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">1. Identificação do Colete</h2>
        <p className="text-slate-600 mt-1">Registe os dados identificativos do colete e as suas características principais.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Serial */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nº Série</label>
          <input 
            type="text" 
            className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white transition-colors"
            placeholder="Ex: LALIZAS-123"
            value={inspectionData.serial || ''}
            onChange={(e) => handleChange('serial', e.target.value)}
          />
        </div>

        {/* Marca */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Marca</label>
          <input 
            list="marcas-list"
            type="text" 
            className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white transition-colors"
            placeholder="Ex: LALIZAS"
            value={inspectionData.marca || ''}
            onChange={(e) => handleChange('marca', e.target.value)}
          />
          <datalist id="marcas-list">
            {marcas.map(m => <option key={m} value={m as string} />)}
          </datalist>
        </div>

        {/* Modelo */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Modelo</label>
          <input 
            list="modelos-list"
            type="text" 
            className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white transition-colors"
            placeholder="Ex: Sigma 150N"
            value={inspectionData.modelo || ''}
            onChange={(e) => handleChange('modelo', e.target.value)}
          />
          <datalist id="modelos-list">
            {modelos.map(m => <option key={m} value={m as string} />)}
          </datalist>
        </div>

        {/* Tamanho */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tamanho</label>
          <input 
            type="text" 
            className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white transition-colors"
            placeholder="Ex: Adulto universal"
            value={inspectionData.tamanho || ''}
            onChange={(e) => handleChange('tamanho', e.target.value)}
          />
        </div>

        {/* Navio associado */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Navio (ID)</label>
          <input 
            type="number" 
            className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white transition-colors"
            placeholder="ID do navio associado"
            value={inspectionData.shipId || ''}
            onChange={(e) => handleChange('shipId', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
      </div>

      <hr className="border-slate-200 my-8" />

      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Dados da Inspeção e Certificação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Nome do Inspetor */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Inspetor</label>
            <input 
              type="text" 
              className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white transition-colors"
              placeholder="Nome do técnico responsável"
              value={inspectionData.inspectorNome || ''}
              onChange={(e) => handleChange('inspectorNome', e.target.value)}
            />
          </div>

          {/* Data de Fabrico */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Data de Fabrico</label>
            <input 
              type="month" 
              className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white transition-colors"
              value={inspectionData.dataFabrico || ''}
              onChange={(e) => handleChange('dataFabrico', e.target.value)}
            />
          </div>

          {/* Data da Inspeção */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Data da Inspeção</label>
            <input 
              type="date" 
              className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white transition-colors"
              value={inspectionData.dataInspecao || ''}
              onChange={(e) => handleChange('dataInspecao', e.target.value)}
            />
          </div>

          {/* Próxima Inspeção */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Próxima Inspeção</label>
            <input 
              type="date" 
              className="w-full border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white transition-colors"
              value={inspectionData.dataProxInspecao || ''}
              onChange={(e) => handleChange('dataProxInspecao', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
