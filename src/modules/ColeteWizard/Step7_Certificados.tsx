"use client";
import React from 'react';
import { useColeteWizardStore } from './store/useColeteWizardStore';
import { FileText, Printer } from 'lucide-react';
import Link from 'next/link';

export default function Step7_Certificados() {
  const { coleteId, verificacaoId, shipId, inspectionData } = useColeteWizardStore();

  const isConcluida = !!verificacaoId;
  const isAssociadoNavio = !!shipId || !!inspectionData.shipId;
  const navioTargetId = shipId || inspectionData.shipId;

  // Para testar mocks no caso em que queiramos forçar um navio de demonstração:
  const isMock = coleteId === 9999 || coleteId === 9998;
  const mockShipId = 999;
  const finalShipId = isMock ? mockShipId : navioTargetId;
  const showShipCertificate = isAssociadoNavio || isMock;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">7. Certificados</h2>
        <p className="text-slate-600 mt-1">Gere ou consulte os certificados de inspecção.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
          <FileText size={32} />
        </div>
        
        {showShipCertificate ? (
          <>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Certificado Global de Navio</h3>
            <p className="text-slate-600 mb-8 max-w-md">
              {isConcluida 
                ? 'Para comodidade e rigor legal, a Orey emite um certificado unificado por embarcação. O colete foi registado; podes agora inspecionar os restantes e imprimir o certificado global do navio.'
                : 'O certificado global estará disponível para impressão quando finalizares as inspecções deste lote e gravares os dados no sistema.'}
            </p>
          </>
        ) : (
          <>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Certificado Individual (Colete Avulso)</h3>
            <p className="text-slate-600 mb-8 max-w-md">
              {isConcluida 
                ? 'A inspecção foi gravada. Podes emitir o certificado para este colete individual.'
                : 'O certificado será gerado automaticamente quando a inspecção for concluída e os dados forem gravados.'}
            </p>
          </>
        )}

        <div className="flex gap-4">
          {isConcluida ? (
            showShipCertificate ? (
              <Link 
                href={`/navios/${finalShipId}/certificado-coletes`}
                target="_blank"
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-indigo-700 transition-colors"
              >
                <Printer size={20} />
                Ver Certificado do Navio
              </Link>
            ) : (
              <Link 
                href={`/equipamentos/${coleteId}/certificado/${verificacaoId}`}
                target="_blank"
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-indigo-700 transition-colors"
              >
                <Printer size={20} />
                Ver e Imprimir PDF
              </Link>
            )
          ) : (
            <button 
              disabled={true} 
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold opacity-50 cursor-not-allowed"
            >
              <Printer size={20} />
              Imprimir
            </button>
          )}
        </div>
        
        {!isConcluida && (
          <p className="text-xs text-slate-400 mt-6">
            É necessário finalizar a inspecção no passo anterior para desbloquear a emissão.
          </p>
        )}
      </div>
    </div>
  );
}
