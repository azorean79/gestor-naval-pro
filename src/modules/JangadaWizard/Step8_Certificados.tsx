"use client";
import React, { useState } from 'react';
import { useJangadaWizardStore } from './store/useJangadaWizardStore';
import { CheckCircle, Download, FileText, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Step8_Certificados() {
  const router = useRouter();
  const { inspectionData, jangadaId, shipId, inspecaoId } = useJangadaWizardStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const buildCertificatePayload = () => {
    const artigosSubstituidos = Object.values(inspectionData.packItems || {})
      .filter((item: any) => item.quantidade > 0)
      .map((item: any) => ({
        stockId: item.stockId || null,
        referencia: item.referencia,
        descricao: item.descricao || item.name,
        quantidade: item.quantidade,
        validade: item.validade || null,
      }));

    const testes = inspectionData.testes || {};
    const unit = testes.wpUnidadePressao || testes.testeWPUnidadePressao || 'mbar';

    const tIn = parseFloat(testes.wpTempInicio || testes.testeWPTemperaturaInicial || '0');
    const tOut = parseFloat(testes.wpTempFim || testes.testeWPTemperaturaFinal || '0');
    const pAtmIn = parseFloat(testes.wpPressaoAtmInicio || testes.testeWPPressaoAtmosfericaInicial || '0');
    const pAtmOut = parseFloat(testes.wpPressaoAtmFim || testes.testeWPPressaoAtmosfericaFinal || '0');
    
    const supIn = parseFloat(testes.wpCamaraSupInicio || testes.testeWPCamaraSuperiorInicio || '0');
    const supOut = parseFloat(testes.wpCamaraSupFim || testes.testeWPCamaraSuperiorFim || '0');
    const infIn = parseFloat(testes.wpCamaraInfInicio || testes.testeWPCamaraInferiorInicio || '0');
    const infOut = parseFloat(testes.wpCamaraInfFim || testes.testeWPCamaraInferiorFim || '0');

    const toMbar = (val: number) => {
      if (isNaN(val) || val <= 0) return NaN;
      if (unit === 'inhg') return val * 33.8638866667;
      if (unit === 'inh2o') return val * 2.490889;
      return val;
    };

    const fromMbar = (val: number) => {
      if (isNaN(val) || val <= 0) return NaN;
      if (unit === 'inhg') return val / 33.8638866667;
      if (unit === 'inh2o') return val / 2.490889;
      return val;
    };

    let wpUpperCorrected: string | number = '';
    let wpUpperDrop: string | number = '';
    let wpUpperDropPercent: string | number = '';
    let wpLowerCorrected: string | number = '';
    let wpLowerDrop: string | number = '';
    let wpLowerDropPercent: string | number = '';

    if (!isNaN(tIn) && !isNaN(tOut) && !isNaN(pAtmIn) && !isNaN(pAtmOut)) {
      const tempDelta = tOut - tIn;
      const baroDelta = pAtmOut - pAtmIn;
      const correctionTempMb = -(tempDelta * 4);
      const correctionBaroMb = baroDelta;
      const totalCorrectionMb = correctionTempMb + correctionBaroMb;

      if (!isNaN(supIn) && !isNaN(supOut)) {
        const startMb = toMbar(supIn);
        const endMb = toMbar(supOut);
        const correctedEndMb = endMb + totalCorrectionMb;
        const dropMb = Math.max(0, startMb - correctedEndMb);
        const percent = startMb > 0 ? (dropMb / startMb) * 100 : 0;
        wpUpperCorrected = isNaN(correctedEndMb) ? '' : Number(fromMbar(correctedEndMb).toFixed(2));
        wpUpperDrop = isNaN(dropMb) ? '' : Number(fromMbar(dropMb).toFixed(2));
        wpUpperDropPercent = isNaN(percent) ? '' : Number(percent.toFixed(2));
      }

      if (!isNaN(infIn) && !isNaN(infOut)) {
        const startMb = toMbar(infIn);
        const endMb = toMbar(infOut);
        const correctedEndMb = endMb + totalCorrectionMb;
        const dropMb = Math.max(0, startMb - correctedEndMb);
        const percent = startMb > 0 ? (dropMb / startMb) * 100 : 0;
        wpLowerCorrected = isNaN(correctedEndMb) ? '' : Number(fromMbar(correctedEndMb).toFixed(2));
        wpLowerDrop = isNaN(dropMb) ? '' : Number(fromMbar(dropMb).toFixed(2));
        wpLowerDropPercent = isNaN(percent) ? '' : Number(percent.toFixed(2));
      }
    }

    return {
      id: jangadaId,
      inspectionId: inspecaoId,
      certNumber: inspectionData.certificadoNumero || '',
      numeroObra: inspectionData.numeroObra || '',
      inspectionDate: inspectionData.dataInspecao || new Date().toISOString().slice(0, 10),
      nextInspectionDate: inspectionData.dataProxInspecao || '',
      shipName: inspectionData.shipName || inspectionData.shipNameManual || 'Sem navio',
      brand: inspectionData.brand || '',
      raftModel: inspectionData.model || '',
      raftCapacity: String(inspectionData.capacity || ''),
      raftSerial: inspectionData.serial || '',
      manufactureDate: inspectionData.dataFabrico || '',
      packType: inspectionData.packType || '',
      
      owner: inspectionData.owner || '',
      shipFlag: inspectionData.shipFlag || '',
      shipImo: inspectionData.shipImo || '',
      shipCallSign: inspectionData.shipCallSign || '',
      launchType: inspectionData.launchType || '',
      fabricType: inspectionData.fabricType || '',
      painterLength: inspectionData.painterLength || '',
      maxStowageHeight: inspectionData.maxStowageHeight || '',
      cylinderHydroTestDate: inspectionData.cylinder?.dataTeste || '',
      hruReference: inspectionData.hruReference || '',
      hruExpiry: inspectionData.hruExpiry || '',
      radarReflector: inspectionData.radarReflector || '',
      radarReflectorExpiry: inspectionData.radarReflectorExpiry || '',

      cylinderSerial: inspectionData.cylinder?.serial || '',
      cylinderGrossWeight: inspectionData.cylinder?.pesoBruto || '',
      cylinderTare: inspectionData.cylinder?.tara || '',
      cylinderCo2: inspectionData.cylinder?.co2 || '',
      cylinderN2: inspectionData.cylinder?.n2 || '',

      pressureUnit: unit,
      tempInitial: testes.wpTempInicio || testes.testeWPTemperaturaInicial || '',
      tempFinal: testes.wpTempFim || testes.testeWPTemperaturaFinal || '',
      baroInitial: testes.wpPressaoAtmInicio || testes.testeWPPressaoAtmosfericaInicial || '',
      baroFinal: testes.wpPressaoAtmFim || testes.testeWPPressaoAtmosfericaFinal || '',
      wpStartTime: testes.wpHoraInicio || testes.testeWPHoraInicio || '',
      wpEndTime: testes.wpHoraFim || testes.testeWPHoraFim || '',
      wpUpperStart: testes.wpCamaraSupInicio || testes.testeWPCamaraSuperiorInicio || '',
      wpUpperEnd: testes.wpCamaraSupFim || testes.testeWPCamaraSuperiorFim || '',
      wpUpperCorrected,
      wpUpperDrop,
      wpUpperDropPercent,
      wpLowerStart: testes.wpCamaraInfInicio || testes.testeWPCamaraInferiorInicio || '',
      wpLowerEnd: testes.wpCamaraInfFim || testes.testeWPCamaraInferiorFim || '',
      wpLowerCorrected,
      wpLowerDrop,
      wpLowerDropPercent,

      napTestDone: inspectionData.testes?.teste_nap || testes.testeNAP || 'NAO',
      fsTestDone: inspectionData.testes?.teste_fs || testes.testeFS || 'NAO',
      giTestDone: inspectionData.testes?.teste_gi || testes.testeGI || 'NAO',
      loadTestDone: inspectionData.testes?.teste_dl || testes.testeDL || 'NAO',
      
      status: 'Concluída',
      checklist: {
        ...(inspectionData.checklist || {}),
        ...(inspectionData.testes || {})
      },
      artigosSubstituidos,
    };
  };

  const handleGenerate = async (type: 'orey-html' | 'orey-xlsx' | 'survitec' | 'quadro-xlsx') => {
    setLoading(type);
    setPreviewHtml(null);
    try {
      const payload = buildCertificatePayload();
      let url = '';
      
      if (type === 'orey-html') url = '/api/certificados/orey?format=html';
      if (type === 'orey-xlsx') url = '/api/certificados/orey?format=xlsx';
      if (type === 'survitec') url = '/api/certificados/survitec-moderno';
      if (type === 'quadro-xlsx') url = '/api/exportar-raft';

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Falha ao gerar certificado');

      if (type === 'orey-xlsx' || type === 'quadro-xlsx') {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = type === 'quadro-xlsx' 
          ? `Quadro_${inspectionData.serial}.xlsx` 
          : `Certificado_Orey_${inspectionData.serial}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const data = await response.json();
        setPreviewHtml(data.html);
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar certificado. Verifique a consola.');
    } finally {
      setLoading(null);
    }
  };

  const handleDownloadPreview = () => {
    if (!previewHtml) return;
    const blob = new Blob([previewHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Certificado_${inspectionData.serial}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-4 py-8">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50">
          <CheckCircle size={40} className="animate-bounce" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Inspeção Submetida!</h2>
        <p className="text-slate-500 max-w-md mx-auto text-lg">
          A jangada <span className="font-bold text-slate-700">{inspectionData.serial}</span> foi atualizada e os consumos de stock aplicados com sucesso.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <FileText className="text-indigo-500" />
          Emissão de Certificados
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={() => handleGenerate('orey-xlsx')}
            disabled={loading !== null}
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-emerald-100 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-200 transition-all text-emerald-700 font-bold"
          >
            {loading === 'orey-xlsx' ? <Loader2 className="animate-spin" size={32} /> : <Download size={32} />}
            <span>Exportar Excel</span>
            <span className="text-xs font-medium text-emerald-400">Certificado .xlsx</span>
          </button>

          <button 
            onClick={() => handleGenerate('quadro-xlsx')}
            disabled={loading !== null}
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-blue-100 bg-blue-50 hover:bg-blue-100 hover:border-blue-200 transition-all text-blue-700 font-bold"
          >
            {loading === 'quadro-xlsx' ? <Loader2 className="animate-spin" size={32} /> : <FileText size={32} />}
            <span>Quadro Inspeção</span>
            <span className="text-xs font-medium text-blue-400">Tabela de Dados</span>
          </button>
        </div>
      </div>

      {previewHtml && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl animate-in slide-in-from-bottom-8">
          <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
            <h3 className="text-white font-bold flex items-center gap-2">
              Visualização Prévia do Certificado
            </h3>
            <button 
              onClick={handleDownloadPreview}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
            >
              <Download size={16} />
              Transferir HTML
            </button>
          </div>
          <div className="p-0 bg-slate-100 relative h-[800px] overflow-auto">
            <iframe 
              srcDoc={previewHtml} 
              className="w-full h-full bg-white scale-95 origin-top mt-4 rounded-xl shadow-sm border border-slate-200"
            />
          </div>
        </div>
      )}

      <div className="flex justify-center pt-8">
        <button 
          onClick={() => router.push('/jangadas')}
          className="px-8 py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center gap-3 transition-transform hover:scale-105"
        >
          Voltar para a Lista de Jangadas
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
