"use client";
import React, { useMemo } from 'react';
import { useJangadaWizardStore } from './store/useJangadaWizardStore';
import { AlertTriangle, CheckCircle, Save, FileText, Anchor, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from '@/components/shared/SignatureCanvas';

export default function Step7_ResumoFinal() {
  const router = useRouter();
  const { 
    jangadaId,
    shipId,
    inspecaoId,
    inspectionData, 
    setStep,
    setIsSaving,
    isSaving
  } = useJangadaWizardStore();

  // Validate the data to generate warnings
  const warnings = useMemo(() => {
    const list: { text: string; step: number; isCritical: boolean }[] = [];

    // Step 1 Validations
    if (!inspectionData.serial) list.push({ text: 'Nº de Série da jangada não definido.', step: 1, isCritical: true });
    if (!inspectionData.brand || !inspectionData.model) list.push({ text: 'Marca ou Modelo da jangada não definidos.', step: 1, isCritical: true });
    if (!inspectionData.packType) list.push({ text: 'Tipo de Pack não selecionado.', step: 1, isCritical: true });
    if (!inspectionData.dataProxInspecao) list.push({ text: 'Data da Próxima Inspeção não definida.', step: 1, isCritical: true });
    
    // Step 2 Validations
    const checklistItems = Object.values(inspectionData.checklist || {});
    const reprovados = checklistItems.filter((item: any) => item.status === 'REPROVADO');
    if (reprovados.length > 0) {
      list.push({ text: `Existem ${reprovados.length} itens do checklist exterior/interior marcados como Reprovado.`, step: 2, isCritical: true });
    }

    // Step 3 Validations
    const componentes = inspectionData.componentes || [];
    const missingValidades = componentes.filter((c: any) => !c.validade);
    if (missingValidades.length > 0) {
      list.push({ text: `Falta definir a validade em ${missingValidades.length} componente(s) crítico(s).`, step: 3, isCritical: true });
    }

    // Step 4 Validations
    const packItems = Object.values(inspectionData.packItems || {});
    const consumiveisSemValidade = packItems.filter((item: any) => item.quantidade > 0 && !item.validade);
    if (consumiveisSemValidade.length > 0) {
      list.push({ text: `Foram substituídos ${consumiveisSemValidade.length} consumíveis sem registo de nova validade.`, step: 4, isCritical: true });
    }

    // Step 5 Validations
    if (!inspectionData.cylinder?.serial) list.push({ text: 'Nº de Série do cilindro não definido.', step: 5, isCritical: false });
    if (!inspectionData.cylinder?.pesoBruto) list.push({ text: 'Peso Bruto do cilindro não verificado.', step: 5, isCritical: false });

    // Step 6 Validations
    const testes = Object.values(inspectionData.testes || {});
    if (testes.includes('REPROVOU')) {
      list.push({ text: 'Existem testes operacionais/pressão que reprovararam.', step: 6, isCritical: true });
    }

    return list;
  }, [inspectionData]);

  const criticalCount = warnings.filter(w => w.isCritical).length;

  const buildSavePayload = (isFinal = false) => {
    const packSubstitutions = Object.values(inspectionData.packItems || {})
      .filter((item: any) => item.quantidade > 0)
      .map((item: any) => ({
        stockId: item.stockId || null,
        referencia: item.referencia,
        descricao: item.descricao || item.name,
        quantidade: item.quantidade,
        motivo: "Substituição Inspeção",
        validade: item.validade || null,
        codigoFabricante: item.codigoFabricante || null,
      }));

    const compSubstitutions = (inspectionData.componentes || [])
      .filter((comp: any) => comp.stockId || comp.reference) // Apenas os que têm referência preenchida
      .map((comp: any) => ({
        stockId: comp.stockId || null,
        referencia: comp.reference,
        descricao: comp.name || "Componente",
        quantidade: 1, // Componentes normais são 1 por 1
        motivo: "Substituição Inspeção",
        validade: comp.validade || null,
        codigoFabricante: null,
      }));

    const artigosSubstituidos = [...packSubstitutions, ...compSubstitutions];

    const testes = inspectionData.testes || {};
    const unit = testes.wpUnidadePressao || 'mbar';

    const tIn = parseFloat(testes.wpTempInicio || '0');
    const tOut = parseFloat(testes.wpTempFim || '0');
    const pAtmIn = parseFloat(testes.wpPressaoAtmInicio || '0');
    const pAtmOut = parseFloat(testes.wpPressaoAtmFim || '0');
    
    const supIn = parseFloat(testes.wpCamaraSupInicio || '0');
    const supOut = parseFloat(testes.wpCamaraSupFim || '0');
    const infIn = parseFloat(testes.wpCamaraInfInicio || '0');
    const infOut = parseFloat(testes.wpCamaraInfFim || '0');

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

    let supDropStr = "";
    let infDropStr = "";

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
        supDropStr = isNaN(dropMb) ? "" : `${fromMbar(dropMb).toFixed(2)} ${unit} (${percent.toFixed(1)}%)`;
      }

      if (!isNaN(infIn) && !isNaN(infOut)) {
        const startMb = toMbar(infIn);
        const endMb = toMbar(infOut);
        const correctedEndMb = endMb + totalCorrectionMb;
        const dropMb = Math.max(0, startMb - correctedEndMb);
        const percent = startMb > 0 ? (dropMb / startMb) * 100 : 0;
        infDropStr = isNaN(dropMb) ? "" : `${fromMbar(dropMb).toFixed(2)} ${unit} (${percent.toFixed(1)}%)`;
      }
    }

    return {
      // Identificação e Jangada Fields
      ...inspectionData,
      id: jangadaId,
      shipId: shipId,
      raftId: jangadaId,
      navioNome: inspectionData.shipName || inspectionData.shipNameManual || null,
      shipNameManual: inspectionData.shipName || inspectionData.shipNameManual || null,
      jangadaSerial: inspectionData.serial || null,
      date: inspectionData.dataInspecao || new Date().toISOString().slice(0, 10),
      dataProxInspecao: inspectionData.dataProxInspecao || null,
      
      owner: inspectionData.owner || null,
      launchType: inspectionData.launchType || null,
      painterLength: inspectionData.painterLength || null,
      maxStowageHeight: inspectionData.maxStowageHeight || null,
      fabricType: inspectionData.fabricType || null,

      // Cilindros Fields
      cylinderSerial: inspectionData.cylinder?.serial || null,
      cylinderPesoBruto: inspectionData.cylinder?.pesoBruto || null,
      cylinderTara: inspectionData.cylinder?.tara || null,
      cylinderCo2: inspectionData.cylinder?.co2 || null,
      cylinderN2: inspectionData.cylinder?.n2 || null,
      cylinderDataTeste: inspectionData.cylinder?.dataTeste || null,
      cylinderDataProxTeste: inspectionData.cylinder?.dataProxTeste || null,
      
      // Testes
      testeWP: testes.testeWP || null,
      testeNAP: testes.testeNAP || null,
      testeFS: testes.testeFS || null,
      testeGI: testes.testeGI || null,
      testeDL: testes.testeDL || null,

      testeWPUnidadePressao: testes.wpUnidadePressao || null,
      testeWPHoraInicio: testes.wpHoraInicio || null,
      testeWPHoraFim: testes.wpHoraFim || null,
      testeWPTemperaturaInicial: testes.wpTempInicio || null,
      testeWPTemperaturaFinal: testes.wpTempFim || null,
      testeWPPressaoAtmosfericaInicial: testes.wpPressaoAtmInicio || null,
      testeWPPressaoAtmosfericaFinal: testes.wpPressaoAtmFim || null,
      testeWPCamaraSuperiorInicio: testes.wpCamaraSupInicio || null,
      testeWPCamaraSuperiorFim: testes.wpCamaraSupFim || null,
      testeWPCamaraSuperiorQueda: supDropStr || null,
      testeWPCamaraInferiorInicio: testes.wpCamaraInfInicio || null,
      testeWPCamaraInferiorFim: testes.wpCamaraInfFim || null,
      testeWPCamaraInferiorQueda: infDropStr || null,

      // Inspeção Fields
      status: isFinal ? (criticalCount > 0 ? "Condenada" : "Concluída") : "Draft",
      responsavel: "Operador",
      applyStockMovements: isFinal,
      checklistSnapshot: inspectionData.checklist || {},
      artigosSubstituidos,
    };
  };

  const saveToBackend = async (isFinal: boolean) => {
    try {
      setIsSaving(true);
      const payload = buildSavePayload(isFinal);

      if (typeof window !== 'undefined' && !window.navigator.onLine) {
        try {
          const offlineInspection = {
            id: inspecaoId || `offline_${Date.now()}`,
            jangadaId,
            shipId,
            payload,
            savedAt: new Date().toISOString()
          };
          const existingOffline = JSON.parse(localStorage.getItem('offline_inspections') || '[]');
          const filtered = existingOffline.filter((item: any) => item.jangadaId !== jangadaId);
          filtered.push(offlineInspection);
          localStorage.setItem('offline_inspections', JSON.stringify(filtered));
          alert("Sem ligação à internet. A inspeção foi guardada localmente neste dispositivo. Por favor, lembre-se de a sincronizar quando voltar a ter rede.");
          if (isFinal) {
            setStep(8);
          }
        } catch (err) {
          console.error("Erro ao guardar offline:", err);
          alert("Ocorreu um erro ao guardar a inspeção localmente.");
        } finally {
          setIsSaving(false);
        }
        return;
      }

      // Remove fields that cause issues in the PUT or are strictly for the payload
      const jangadaPayload = { ...payload };
      delete jangadaPayload.checklist;
      delete jangadaPayload.packItems;
      delete jangadaPayload.artigosSubstituidos;
      
      // 1. Atualiza Jangada (testes, etc)
      if (jangadaId) {
        await fetch(`/api/jangadas/${jangadaId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jangadaPayload),
        });
      }

      // 2. Atualiza Navio se associado
      if (shipId) {
        try {
          await fetch(`/api/navios/${shipId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              proprietario: inspectionData.owner,
              bandeira: inspectionData.shipFlag,
              imo: inspectionData.shipImo,
              callSignal: inspectionData.shipCallSign,
            }),
          });
        } catch (shipErr) {
          console.error("Erro ao atualizar dados do navio:", shipErr);
        }
      }

      // 3. Guarda / Finaliza Inspecao
      const method = inspecaoId ? "PUT" : "POST";
      const url = inspecaoId ? `/api/inspecoes?id=${inspecaoId}` : '/api/inspecoes';
      
      const inspRes = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!inspRes.ok) throw new Error("Falha ao gravar inspeção");

      if (isFinal) {
        setStep(8);
      } else {
        alert("Rascunho guardado com sucesso!");
      }
    } catch (error) {
      console.error(error);
      alert("Ocorreu um erro ao gravar. Verifica a tua ligação.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = () => {
    saveToBackend(false);
  };

  const handleFinish = () => {
    if (criticalCount > 0) {
      if (!confirm(`Atenção: Existem ${criticalCount} avisos críticos. Deseja mesmo finalizar a inspeção? A jangada poderá ficar com certificado Condenado.`)) {
        return;
      }
    }
    saveToBackend(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">7. Fecho & Resumo</h2>
        <p className="text-slate-600 mt-1">Valide os alertas automáticos antes de fechar e emitir o certificado.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Painel Central de Alertas */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
              <ShieldAlert className="text-slate-500" size={20} />
              <h3 className="text-lg font-bold text-slate-800">Validação do Sistema</h3>
            </div>
            
            <div className="p-6">
              {warnings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800">Tudo Perfeito!</h4>
                  <p className="text-slate-500 mt-1 max-w-sm">
                    A inteligência do sistema não detetou falhas, validades em atraso ou itens reprovados. A jangada está pronta para ser certificada.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {warnings.map((warning, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-start justify-between gap-4 p-4 rounded-xl border ${
                        warning.isCritical 
                          ? 'bg-red-50 border-red-200 text-red-900' 
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`shrink-0 mt-0.5 ${warning.isCritical ? 'text-red-500' : 'text-amber-500'}`} size={18} />
                        <div>
                          <p className="font-semibold text-sm">{warning.text}</p>
                          <p className={`text-xs mt-0.5 ${warning.isCritical ? 'text-red-700' : 'text-amber-700'}`}>
                            {warning.isCritical ? 'Ação Crítica Obrigatória' : 'Aviso Informativo'}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setStep(warning.step)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                          warning.isCritical 
                            ? 'bg-red-100 hover:bg-red-200 text-red-800' 
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                        }`}
                      >
                        Corrigir Passo {warning.step}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Secção de Assinatura Digital */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-6">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
              <FileText className="text-slate-500" size={20} />
              <h3 className="text-lg font-bold text-slate-800">Assinatura Digital do Técnico</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                Por favor, assine digitalmente no quadro abaixo para validar esta inspeção e incluir a assinatura no dossier e certificados.
              </p>
              <SignatureCanvas 
                onChange={(base64) => setInspectionData({ signatureBase64: base64 })} 
                initialValue={inspectionData.signatureBase64}
              />
            </div>
          </div>
        </div>

        {/* Barra Lateral de Resumo Rápido */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-300 mb-6">Raio-X da Jangada</h3>
            
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-2.5 rounded-xl text-white">
                  <Anchor size={20} />
                </div>
                <div>
                  <p className="text-xs text-indigo-200 font-medium uppercase tracking-wider mb-0.5">Identificação</p>
                  <p className="font-semibold">{inspectionData.serial || 'Sem Série'}</p>
                  <p className="text-xs text-indigo-100">{inspectionData.brand || 'Sem Marca'} - {inspectionData.model || 'Sem Modelo'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-2.5 rounded-xl text-white">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-xs text-indigo-200 font-medium uppercase tracking-wider mb-0.5">Configuração</p>
                  <p className="font-semibold">{inspectionData.packType || 'Sem Pack'}</p>
                  <p className="text-xs text-indigo-100">{inspectionData.capacity ? `${inspectionData.capacity} Pessoas` : 'S/ Capacidade'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-2.5 rounded-xl text-white">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <p className="text-xs text-indigo-200 font-medium uppercase tracking-wider mb-0.5">Estado</p>
                  <p className="font-semibold text-emerald-300">Em Rascunho</p>
                  <p className="text-xs text-indigo-100">Próx. Insp: {inspectionData.dataProxInspecao || '?'}</p>
                </div>
              </div>
            </div>

            <hr className="border-indigo-800 my-6" />

            <div className="flex gap-3">
              <button 
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="w-1/3 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-white/10 hover:bg-white/20 text-white"
              >
                {isSaving ? "A Gravar..." : "Guardar Rascunho"}
              </button>

              <button 
                onClick={handleFinish}
                disabled={isSaving}
                className={`w-2/3 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  criticalCount === 0 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30'
                }`}
              >
                <Save size={20} />
                {isSaving ? "A Processar..." : (criticalCount === 0 ? 'Fechar Inspeção e Gravar' : 'Finalizar com Falhas (Condenada)')}
              </button>
            </div>
            {criticalCount > 0 && (
              <p className="text-center text-xs mt-3 text-amber-200">Existem falhas que reprovam a jangada</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
