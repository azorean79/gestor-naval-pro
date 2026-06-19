'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, ClipboardCheck, Package, Ship, Anchor, Cylinder, ShieldAlert, Activity, Info } from 'lucide-react';
import { computeNextInspectionDate, needsThreeYearRule } from '../../lib/inspectionUtils';


interface ArtigoInspecao {
  id: number;
  name: string;
  quantidade: number;
  referencia: string | null;
  validade: string | null;
  codigoFabricante: string | null;
}

interface Inspecao {
  id: number;
  certificadoNumero: string | null;
  dataInspecao: string;
  dataProxInspecao: string | null;
  status: string;
  responsavel?: string | null;
  artigos?: ArtigoInspecao[];
}

interface InspecaoDetalhesDialogProps {
  inspecao: Inspecao;
  onClose: () => void;
}

export function InspecaoDetalhesDialog({
  inspecao,
  onClose,
}: InspecaoDetalhesDialogProps) {
  const [snapshot, setSnapshot] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'geral' | 'cilindro' | 'artigos'>('geral');

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('pt-PT');
  };

  // Compute next inspection date according to business rule
  const computedNextDate = computeNextInspectionDate(inspecao, snapshot?.brand);
  // Determine if the date was auto‑calculated
  const isAutoCalculated = !inspecao.dataProxInspecao && needsThreeYearRule(snapshot?.brand);


  const formatMonthYear = (val?: string | null) => {
    if (!val) return '—';
    return val;
  };

  useEffect(() => {
    if (!inspecao.certificadoNumero) return;
    setLoading(true);
    fetch(`/api/inspecoes/snapshot?certificadoNumero=${encodeURIComponent(inspecao.certificadoNumero)}`)
      .then(res => res.json())
      .then(data => {
        if (data.snapshot) {
          setSnapshot(data.snapshot);
        }
      })
      .catch(err => console.error("Error loading snapshot:", err))
      .finally(() => setLoading(false));
  }, [inspecao.certificadoNumero]);

  // Use snapshot articles if available, otherwise fall back to inspection articles
  const artigos = snapshot?.artigos || inspecao.artigos || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-100 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ClipboardCheck className="text-indigo-650" size={22} />
              Detalhes da Inspeção
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Histórico completo com os dados e componentes da jangada tal como estavam na data desta inspeção.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-650 hover:bg-slate-50 p-1.5 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        {snapshot && (
          <div className="flex bg-slate-50 border-b border-slate-100 px-6 pt-2 gap-2">
            {[
              { id: 'geral', label: 'Dados da Jangada', icon: Anchor },
              { id: 'cilindro', label: 'Cilindro & Ensaios (WP)', icon: Cylinder },
              { id: 'artigos', label: 'Artigos no Pack', icon: Package },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                  activeSubTab === tab.id
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-850'
                }`}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6 text-left flex-1 overflow-y-auto">
          {/* Main Inspection Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Certificado Nº</span>
              <p className="font-bold text-slate-800 mt-0.5">{inspecao.certificadoNumero || 'Draft / Não emitido'}</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Data de Inspeção</span>
              <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-500" />
                {formatDate(inspecao.dataInspecao)}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Próxima Inspeção</span>
              <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-500" />
                {formatDate(computedNextDate)}
                {isAutoCalculated && (
                  <Info size={14} className="text-slate-500 ml-1" title="Data calculada automaticamente – 3 anos" />
                )}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado</span>
              <div className="mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  inspecao.status === 'Concluída' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : inspecao.status === 'Draft'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                }`}>
                  {inspecao.status}
                </span>
              </div>
            </div>
          </div>

          {inspecao.responsavel && (
            <div className="text-sm text-slate-650 bg-indigo-50/40 border border-indigo-100/20 rounded-2xl p-4">
              <span>Técnico Responsável: <strong className="text-indigo-950 font-bold">{inspecao.responsavel}</strong></span>
            </div>
          )}

          {/* Conditional Sub-Tabs content based on snapshot loading */}
          {loading ? (
            <div className="text-center py-12 text-slate-500 font-medium">Carregando dados históricos...</div>
          ) : snapshot ? (
            <>
              {activeSubTab === 'geral' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
                  {/* General specs */}
                  <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Anchor size={16} className="text-slate-500" />
                      <span>Características Gerais</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-slate-400 block">Marca / Modelo</span>
                        <span className="font-semibold text-slate-800">{snapshot.brand} / {snapshot.model}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Nº de Série</span>
                        <span className="font-semibold text-slate-800">{snapshot.serial}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Lotação (Pessoas)</span>
                        <span className="font-semibold text-slate-800">{snapshot.capacity} pax</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Tipo de Pack</span>
                        <span className="font-semibold text-slate-800">Pack {snapshot.packType || '—'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Data de Fabrico</span>
                        <span className="font-semibold text-slate-800">{formatMonthYear(snapshot.dataFabrico)}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Tipo de Tecido</span>
                        <span className="font-semibold text-slate-800">{snapshot.fabricType || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vessel specs */}
                  <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Ship size={16} className="text-slate-500" />
                      <span>Embarcação & Armador</span>
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-xs text-slate-400 block">Navio Associado</span>
                        <span className="font-semibold text-slate-800">{snapshot.shipNameManual || 'Sem navio associado'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Proprietário / Armador</span>
                        <span className="font-semibold text-slate-800">{snapshot.owner || '—'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Tipo de Lançamento</span>
                        <span className="font-semibold text-slate-800">{snapshot.launchType || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'cilindro' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
                  {/* Cylinder Info */}
                  <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Cylinder size={16} className="text-slate-550" />
                      <span>Cilindro de Insuflação</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-slate-400 block">Nº de Série</span>
                        <span className="font-semibold text-slate-800">{snapshot.cylinderSerial || '—'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Sistema</span>
                        <span className="font-semibold text-slate-800">{snapshot.cylinderSistema || '—'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Peso Bruto / Tara</span>
                        <span className="font-semibold text-slate-800">
                          {snapshot.cylinderPesoBruto ? `${snapshot.cylinderPesoBruto} kg` : '—'} / {snapshot.cylinderTara ? `${snapshot.cylinderTara} kg` : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Carga Gás (CO2 / N2)</span>
                        <span className="font-semibold text-slate-800">
                          {snapshot.cylinderCo2 ? `${snapshot.cylinderCo2} kg` : '—'} / {snapshot.cylinderN2 ? `${snapshot.cylinderN2} kg` : '—'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-slate-400 block">Data do Teste Hidráulico</span>
                        <span className="font-semibold text-slate-800">{snapshot.cylinderDataTeste ? formatDate(snapshot.cylinderDataTeste) : '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* WP Test Info */}
                  <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Activity size={16} className="text-slate-550" />
                      <span>Ensaio WP (Pressão de Trabalho)</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-slate-400 block">Realizado Em</span>
                        <span className="font-semibold text-slate-800">{snapshot.testeWP ? formatDate(snapshot.testeWP) : '—'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Horário</span>
                        <span className="font-semibold text-slate-800">
                          {snapshot.testeWPHoraInicio || '—'} às {snapshot.testeWPHoraFim || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Queda Câmara Sup.</span>
                        <span className="font-semibold text-slate-850">
                          {snapshot.testeWPCamaraSuperiorInicio ? `${snapshot.testeWPCamaraSuperiorInicio} → ${snapshot.testeWPCamaraSuperiorFim}` : '—'}
                          {snapshot.testeWPCamaraSuperiorQueda ? ` (Queda: ${snapshot.testeWPCamaraSuperiorQueda}%)` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Queda Câmara Inf.</span>
                        <span className="font-semibold text-slate-850">
                          {snapshot.testeWPCamaraInferiorInicio ? `${snapshot.testeWPCamaraInferiorInicio} → ${snapshot.testeWPCamaraInferiorFim}` : '—'}
                          {snapshot.testeWPCamaraInferiorQueda ? ` (Queda: ${snapshot.testeWPCamaraInferiorQueda}%)` : ''}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-slate-400 block">Testes Adicionais</span>
                        <span className="font-semibold text-slate-700 text-xs block">
                          NAP: {snapshot.testeNAP || '—'} | FS: {snapshot.testeFS || '—'} | GI: {snapshot.testeGI || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'artigos' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Package size={16} className="text-slate-500" />
                    <span>Consumíveis do Pack no Momento da Inspeção ({artigos.length})</span>
                  </h3>
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                          <th className="px-5 py-3.5">Artigo / Peça</th>
                          <th className="px-5 py-3.5">Referência</th>
                          <th className="px-5 py-3.5">Cód. Fabr.</th>
                          <th className="px-5 py-3.5 text-center">Quantidade</th>
                          <th className="px-5 py-3.5">Validade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {artigos.map((artigo: any) => (
                          <tr key={artigo.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3 font-semibold text-slate-800">{artigo.name}</td>
                            <td className="px-5 py-3 font-mono text-xs text-slate-500">{artigo.referencia || '—'}</td>
                            <td className="px-5 py-3 text-slate-500">{artigo.codigoFabricante || '—'}</td>
                            <td className="px-5 py-3 text-center font-bold text-slate-700">{artigo.quantidade}</td>
                            <td className="px-5 py-3 text-slate-600 font-semibold">{formatDate(artigo.validade)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Fallback for older inspections (no snapshot available)
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-xs flex items-start gap-2">
                <ShieldAlert className="text-amber-605" size={18} />
                <div>
                  <p className="font-bold">Dados parciais (Inspeção Legada)</p>
                  <p className="mt-0.5">Esta inspeção foi registada antes da ativação do sistema de snapshots históricos. Apenas a lista de artigos substituídos está disponível.</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Package size={16} className="text-slate-550" />
                  Consumíveis e Peças Instaladas ({artigos.length})
                </h3>
                
                {artigos.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Package className="mx-auto text-slate-350 mb-2" size={32} />
                    <p className="text-xs text-slate-400">Não há registo de artigos associados a esta inspeção.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                          <th className="px-5 py-3.5">Artigo / Peça</th>
                          <th className="px-5 py-3.5">Referência</th>
                          <th className="px-5 py-3.5">Cód. Fabr.</th>
                          <th className="px-5 py-3.5 text-center">Quantidade</th>
                          <th className="px-5 py-3.5">Validade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {artigos.map((artigo: any) => (
                          <tr key={artigo.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3 font-semibold text-slate-800">{artigo.name}</td>
                            <td className="px-5 py-3 font-mono text-xs text-slate-500">{artigo.referencia || '—'}</td>
                            <td className="px-5 py-3 text-slate-500">{artigo.codigoFabricante || '—'}</td>
                            <td className="px-5 py-3 text-center font-bold text-slate-700">{artigo.quantidade}</td>
                            <td className="px-5 py-3 text-slate-600 font-semibold">{formatDate(artigo.validade)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-150 px-6 py-4 flex justify-end bg-slate-50 rounded-b-3xl">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 hover:bg-slate-900 border border-slate-200 px-5 py-2.5 text-sm font-bold text-white transition-all shadow-sm"
          >
            Fechar Detalhes
          </button>
        </div>
      </div>
    </div>
  );
}
