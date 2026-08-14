"use client";
import React from 'react';
import { useJangadaWizardStore } from './store/useJangadaWizardStore';
import { History, Calendar, User, FileCheck, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDateDisplay } from '@/lib/date-display';

export default function Step10_Historico() {
  const { inspecoes, setStep } = useJangadaWizardStore();
  const router = useRouter();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <History className="text-slate-500" />
            Histórico de Inspeções
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Consulta as inspeções antigas registadas nesta jangada
          </p>
        </div>
      </div>

      {inspecoes.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
          <History className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-slate-700 font-bold text-lg">Sem histórico de inspeções</h3>
          <p className="text-slate-500">Ainda não existem inspeções anteriores registadas para esta jangada no sistema.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inspecoes.map((insp: any) => (
            <div key={insp.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-start gap-6 hover:border-slate-300 transition-colors">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col items-center justify-center min-w-[120px]">
                <Calendar className="text-indigo-500 mb-2" size={24} />
                <span className="font-bold text-indigo-900">{formatDateDisplay(insp.dataInspecao)}</span>
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">
                    Certificado nº: {insp.certificadoNumero || 'Não gerado'}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    insp.status === 'Concluída' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {insp.status || 'Pendente'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <User size={16} />
                    <span><strong>Técnico:</strong> {insp.responsavel || 'Desconhecido'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <FileCheck size={16} />
                    <span><strong>Próxima Inspeção:</strong> {formatDateDisplay(insp.dataProxInspecao, 'N/A')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-start pt-6 border-t border-slate-200">
        <button 
          onClick={() => setStep(1)}
          className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar ao Resumo
        </button>
      </div>
    </div>
  );
}
