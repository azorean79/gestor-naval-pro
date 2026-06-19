"use client";
import React from 'react';
import { useColeteWizardStore } from './store/useColeteWizardStore';
import { History, Wrench, CheckCircle } from 'lucide-react';

export default function Step8_Historico() {
  const { verificacoes } = useColeteWizardStore();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">8. Histórico de Inspecções</h2>
        <p className="text-slate-600 mt-1">Consulte o registo de todas as inspecções e manutenções anteriores deste equipamento.</p>
      </div>

      {(!verificacoes || verificacoes.length === 0) ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <History className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-600 font-medium">Nenhum histórico disponível para este colete.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {verificacoes.map((ver, idx) => (
            <div key={ver.id || idx} className="bg-white border border-slate-200 rounded-xl p-5 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <CheckCircle className="text-indigo-600" size={24} />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800">Inspecção Concluída</h4>
                    <p className="text-sm text-slate-500">Inspetor: {ver.inspectorNome || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
                      {new Date(ver.dataVerificacao || ver.createdAt).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Teste de Pressão</p>
                    <p className="text-sm font-semibold text-slate-800">{ver.colete?.testePressao || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Mecanismo</p>
                    <p className="text-sm font-semibold text-slate-800">{ver.mecanismoInflacao || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500">Observações</p>
                    <p className="text-sm text-slate-700 truncate">{ver.observacoes || 'Sem notas adicionais'}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
