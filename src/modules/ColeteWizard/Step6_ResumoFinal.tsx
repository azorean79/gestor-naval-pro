"use client";
import React from 'react';
import { useColeteWizardStore } from './store/useColeteWizardStore';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Step6_ResumoFinal() {
  const { inspectionData } = useColeteWizardStore();

  // Determine se há falhas
  const hasFailures = Object.values(inspectionData.checklist || {}).some(v => v === 'Falha (F)');
  const hasRepairs = Object.values(inspectionData.checklist || {}).some(v => v === 'Reparado (R)' || v === 'Substituído (S)');
  const testsFailed = [inspectionData.testePressao, inspectionData.testeInsuflacao, inspectionData.testeVazamento].some(v => v === 'Reprovado');

  const isApproved = !hasFailures && !testsFailed;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">6. Resumo e Conclusão</h2>
        <p className="text-slate-600 mt-1">Revise os resultados da inspecção antes da certificação.</p>
      </div>

      <div className={`p-6 rounded-2xl border ${isApproved ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${isApproved ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
            {isApproved ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
          </div>
          <div>
            <h3 className={`text-xl font-bold ${isApproved ? 'text-emerald-800' : 'text-red-800'}`}>
              {isApproved ? 'Colete Apto para Serviço' : 'Colete Reprovado na Inspecção'}
            </h3>
            <p className={`mt-2 ${isApproved ? 'text-emerald-700' : 'text-red-700'}`}>
              {isApproved 
                ? 'Todos os testes e verificações foram aprovados. O colete cumpre os requisitos para certificação.'
                : 'Foram detectadas falhas graves durante a inspecção ou testes reprovados. O colete não deve ser certificado no estado actual.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Resumo da Checklist</h4>
          <ul className="space-y-2 text-sm">
            {Object.entries(inspectionData.checklist || {}).map(([key, value]) => (
              <li key={key} className="flex justify-between items-center">
                <span className="text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className={`font-semibold ${value === 'OK' ? 'text-emerald-600' : value === 'Falha (F)' ? 'text-red-600' : 'text-amber-600'}`}>
                  {String(value)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Resumo dos Testes</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between items-center">
              <span className="text-slate-600">Teste de Pressão</span>
              <span className={`font-semibold ${inspectionData.testePressao === 'Aprovado' ? 'text-emerald-600' : 'text-red-600'}`}>{inspectionData.testePressao || 'N/A'}</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-slate-600">Teste de Insuflação</span>
              <span className={`font-semibold ${inspectionData.testeInsuflacao === 'Aprovado' ? 'text-emerald-600' : 'text-red-600'}`}>{inspectionData.testeInsuflacao || 'N/A'}</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-slate-600">Teste de Vazamento</span>
              <span className={`font-semibold ${inspectionData.testeVazamento === 'Aprovado' ? 'text-emerald-600' : 'text-red-600'}`}>{inspectionData.testeVazamento || 'N/A'}</span>
            </li>
          </ul>

          {(hasRepairs || hasFailures) && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <h5 className="font-bold text-slate-800 mb-2">Observações</h5>
              <p className="text-slate-600 text-sm whitespace-pre-wrap">{inspectionData.observacoesInspecao || 'Sem observações.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
