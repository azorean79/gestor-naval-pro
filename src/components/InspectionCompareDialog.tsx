"use client";

import React from "react";
import { ArrowLeftRight, Scale } from "lucide-react";
import { formatValidityDisplay } from "@/lib/date-display";
import { fmtPeso } from "@/lib/liferaft-diagram-helpers";

type InspectionArticle = {
  id?: number;
  name?: string | null;
  quantidade?: number | null;
  validade?: string | null;
  referencia?: string | null;
  codigoFabricante?: string | null;
};

type InspectionType = {
  id: number;
  certificadoNumero?: string | null;
  dataInspecao?: string | null;
  dataProxInspecao?: string | null;
  status?: string | null;
  responsavel?: string | null;
  artigos?: InspectionArticle[];
  
  // Testes WP
  testeWPCamaraSuperiorInicio?: string | null;
  testeWPCamaraSuperiorFim?: string | null;
  testeWPCamaraSuperiorQueda?: string | null;
  testeWPCamaraInferiorInicio?: string | null;
  testeWPCamaraInferiorFim?: string | null;
  testeWPCamaraInferiorQueda?: string | null;
  
  // Cilindros
  cylinderSerial?: string | null;
  cylinderCo2?: string | null;
  cylinderN2?: string | null;
  cylinderDataTeste?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  inspA: InspectionType;
  inspB: InspectionType;
};

export default function InspectionCompareDialog({ isOpen, onClose, inspA, inspB }: Props) {
  if (!isOpen) return null;

  // Organizar datas
  const dateA = inspA.dataInspecao ? new Date(inspA.dataInspecao) : null;
  const dateB = inspB.dataInspecao ? new Date(inspB.dataInspecao) : null;

  // Ordenar por ordem cronológica para que A seja a mais antiga e B a mais recente
  let older = inspA;
  let newer = inspB;
  
  if (dateA && dateB && dateA.getTime() > dateB.getTime()) {
    older = inspB;
    newer = inspA;
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const formatMonthYear = (val?: string | null) => {
    if (!val) return '—';
    const raw = String(val).trim();
    if (!raw) return '—';
    const parts = raw.split('-');
    if (parts.length >= 2) return `${parts[1]}/${parts[0]}`;
    const slashMatch = raw.match(/^(\d{2})\/(\d{4})$/);
    if (slashMatch) return raw;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // Agregar artigos únicos presentes em ambos
  const allArticleNames = Array.from(
    new Set([
      ...(older.artigos || []).map(a => a.name).filter(Boolean),
      ...(newer.artigos || []).map(a => a.name).filter(Boolean),
    ])
  ) as string[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-650 text-white rounded-xl">
              <ArrowLeftRight size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Comparação Histórica de Vistorias
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Diferenças técnicas entre as inspeções de {formatDate(older.dataInspecao)} e {formatDate(newer.dataInspecao)}.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full transition-colors font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Ficha Resumo */}
          <div className="grid grid-cols-2 gap-4">
            {/* Vistoria Antiga */}
            <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vistoria Anterior</span>
              <h4 className="text-base font-extrabold text-slate-850 mt-1">
                Certificado: {older.certificadoNumero || "Rascunho"}
              </h4>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-600">
                <div>Data: <strong>{formatDate(older.dataInspecao)}</strong></div>
                <div>Técnico: <strong>{older.responsavel || "—"}</strong></div>
                <div>Status: <strong className="text-emerald-700">{older.status || "—"}</strong></div>
                <div>Próxima: <strong>{formatDate(older.dataProxInspecao)}</strong></div>
              </div>
            </div>

            {/* Vistoria Recente */}
            <div className="p-5 border border-indigo-150 rounded-2xl bg-indigo-50/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Vistoria Recente</span>
              <h4 className="text-base font-extrabold text-slate-850 mt-1">
                Certificado: {newer.certificadoNumero || "Rascunho"}
              </h4>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-600">
                <div>Data: <strong>{formatDate(newer.dataInspecao)}</strong></div>
                <div>Técnico: <strong>{newer.responsavel || "—"}</strong></div>
                <div>Status: <strong className="text-indigo-700">{newer.status || "—"}</strong></div>
                <div>Próxima: <strong>{formatDate(newer.dataProxInspecao)}</strong></div>
              </div>
            </div>
          </div>

          {/* Comparativo de Consumíveis */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              📦 Validades e Consumíveis Substituídos
            </h4>
            
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 font-bold text-slate-500">
                    <th className="px-4 py-3">Nome do Artigo</th>
                    <th className="px-4 py-3">Antes ({formatDate(older.dataInspecao)})</th>
                    <th className="px-4 py-3">Depois ({formatDate(newer.dataInspecao)})</th>
                    <th className="px-4 py-3 text-right">Alteração</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {allArticleNames.map(name => {
                    const artOld = (older.artigos || []).find(a => a.name === name);
                    const artNew = (newer.artigos || []).find(a => a.name === name);
                    
                    const valOld = artOld?.validade ? formatMonthYear(artOld.validade) : "—";
                    const valNew = artNew?.validade ? formatMonthYear(artNew.validade) : "—";
                    
                    const isNewerValid = artNew?.validade && (!artOld?.validade || new Date(artNew.validade).getTime() > new Date(artOld.validade).getTime());
                    const isSame = valOld === valNew && (artOld?.quantidade || 0) === (artNew?.quantidade || 0);

                    return (
                      <tr key={name} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-slate-800">{name}</td>
                        <td className="px-4 py-3">
                          {artOld ? `${valOld} (${artOld.quantidade || 1}x)` : "Não presente"}
                        </td>
                        <td className="px-4 py-3">
                          {artNew ? `${valNew} (${artNew.quantidade || 1}x)` : "Não presente"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isSame ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">Igual</span>
                          ) : isNewerValid ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">🔄 Substituído (Nova Validade)</span>
                          ) : !artNew ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-700 font-bold">❌ Removido</span>
                          ) : !artOld ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">➕ Adicionado</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold">Modificado</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comparativo de Cilindro */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Scale size={14} className="text-slate-400" />
              🛢️ Dados do Cilindro de Disparo
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-slate-150 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                  <span className="text-slate-400 font-semibold">Parâmetro</span>
                  <span className="font-bold text-slate-800">Vistoria Anterior</span>
                </div>
                <div className="flex justify-between">
                  <span>Nº de Série:</span>
                  <span className="font-bold">{older.cylinderSerial || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Peso CO2:</span>
                  <span className="font-bold">{fmtPeso(older.cylinderCo2, " kg")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Peso N2:</span>
                  <span className="font-bold">{fmtPeso(older.cylinderN2, " kg")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Último Teste:</span>
                  <span className="font-bold">{older.cylinderDataTeste || "—"}</span>
                </div>
              </div>

              <div className="border border-indigo-150 rounded-2xl p-4 space-y-2 text-xs bg-indigo-50/10">
                <div className="flex justify-between border-b border-slate-50 pb-1.5">
                  <span className="text-slate-400 font-semibold">Parâmetro</span>
                  <span className="font-bold text-slate-800">Vistoria Recente</span>
                </div>
                <div className="flex justify-between">
                  <span>Nº de Série:</span>
                  <span className={`font-bold ${older.cylinderSerial !== newer.cylinderSerial && newer.cylinderSerial ? "text-indigo-600" : ""}`}>
                    {newer.cylinderSerial || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Peso CO2:</span>
                  <span className="font-bold">{fmtPeso(newer.cylinderCo2, " kg")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Peso N2:</span>
                  <span className="font-bold">{fmtPeso(newer.cylinderN2, " kg")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Último Teste:</span>
                  <span className={`font-bold ${older.cylinderDataTeste !== newer.cylinderDataTeste && newer.cylinderDataTeste ? "text-emerald-700" : ""}`}>
                    {formatValidityDisplay(newer.cylinderDataTeste)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Teste de Pressão WP */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              ⚖️ Teste de Pressão Atmosférica / Câmaras (WP)
            </h4>
            
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 font-bold text-slate-500">
                    <th className="px-4 py-3">Parâmetro</th>
                    <th className="px-4 py-3">Anterior ({formatDate(older.dataInspecao)})</th>
                    <th className="px-4 py-3">Recente ({formatDate(newer.dataInspecao)})</th>
                    <th className="px-4 py-3 text-right">Comparação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="px-4 py-3 font-semibold">Câmara Superior (Início / Fim)</td>
                    <td className="px-4 py-3">
                      {older.testeWPCamaraSuperiorInicio || "—"} / {older.testeWPCamaraSuperiorFim || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {newer.testeWPCamaraSuperiorInicio || "—"} / {newer.testeWPCamaraSuperiorFim || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      Queda: <strong className="text-slate-800">{older.testeWPCamaraSuperiorQueda || "—"}</strong> vs <strong className="text-indigo-600">{newer.testeWPCamaraSuperiorQueda || "—"}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">Câmara Inferior (Início / Fim)</td>
                    <td className="px-4 py-3">
                      {older.testeWPCamaraInferiorInicio || "—"} / {older.testeWPCamaraInferiorFim || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {newer.testeWPCamaraInferiorInicio || "—"} / {newer.testeWPCamaraInferiorFim || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      Queda: <strong className="text-slate-800">{older.testeWPCamaraInferiorQueda || "—"}</strong> vs <strong className="text-indigo-600">{newer.testeWPCamaraInferiorQueda || "—"}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-150 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            Fechar Comparação
          </button>
        </div>

      </div>
    </div>
  );
}
