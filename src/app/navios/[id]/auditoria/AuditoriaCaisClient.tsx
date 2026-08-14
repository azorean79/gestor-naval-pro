"use client";

import React, { useState } from "react";
import { Check, X, AlertTriangle, Printer, ArrowLeft, Anchor } from "lucide-react";
import type { Navio, Jangada, Colete, Epirb, Cliente } from "@prisma/client";

type EquipmentItem = {
  id: number;
  tipo: "Jangada" | "Colete" | "Epirb";
  serial: string;
  modelo: string;
  validade: string | null;
  status: "OK" | "FALTA" | "AVARIADO" | "PENDENTE";
  notes?: string;
};

type NavioAuditoria = Navio & { cliente: Cliente | null } & {
  jangadas: Jangada[];
  coletes: Colete[];
  epirbs: Epirb[];
};

export default function AuditoriaCaisClient({ navio }: { navio: NavioAuditoria }) {
  const initialItems: EquipmentItem[] = [];

  navio.jangadas.forEach((j) => {
    initialItems.push({
      id: j.id,
      tipo: "Jangada",
      serial: j.serial,
      modelo: `${j.brand || ""} ${j.model || ""}`.trim(),
      validade: j.dataProxInspecao,
      status: "PENDENTE"
    });
  });

  navio.coletes.forEach((c) => {
    initialItems.push({
      id: c.id,
      tipo: "Colete",
      serial: c.serial,
      modelo: `${c.marca || ""} ${c.modelo || ""}`.trim(),
      validade: c.dataProxInspecao,
      status: "PENDENTE"
    });
  });

  navio.epirbs.forEach((e) => {
    initialItems.push({
      id: e.id,
      tipo: "Epirb",
      serial: e.serial,
      modelo: `${e.marca || ""} ${e.modelo || ""}`.trim(),
      validade: e.dataProxInspecao,
      status: "PENDENTE"
    });
  });

  const [items, setItems] = useState<EquipmentItem[]>(initialItems);

  const handleStatusChange = (idx: number, status: "OK" | "FALTA" | "AVARIADO") => {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], status };
      return copy;
    });
  };

  const handleNotesChange = (idx: number, notes: string) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], notes };
      return copy;
    });
  };

  const total = items.length;
  const verified = items.filter((i) => i.status !== "PENDENTE").length;
  const okCount = items.filter((i) => i.status === "OK").length;
  const faltaCount = items.filter((i) => i.status === "FALTA").length;
  const avariadoCount = items.filter((i) => i.status === "AVARIADO").length;

  const percent = total > 0 ? Math.round((verified / total) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.history.back()} 
            className="p-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Anchor className="w-5 h-5 text-indigo-600" />
              Auditoria de Cais
            </h1>
            <p className="text-xs text-slate-500">{navio.nome} — Checklist Física</p>
          </div>
        </div>
        <button 
          onClick={() => window.print()} 
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Imprimir Auditoria
        </button>
      </div>

      {/* Progress Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-slate-700">Progresso da Verificação</span>
          <span className="text-sm font-black text-slate-900">{verified} de {total} ({percent}%)</span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${percent}%` }}></div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs font-semibold">
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 py-2 rounded-xl">
            {okCount} Presentes (OK)
          </div>
          <div className="bg-rose-50 text-rose-700 border border-rose-100 py-2 rounded-xl">
            {faltaCount} Em Falta
          </div>
          <div className="bg-amber-50 text-amber-700 border border-amber-100 py-2 rounded-xl">
            {avariadoCount} Anomalia / Exp.
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-4">
        {items.map((item, idx) => {
          const isOk = item.status === "OK";
          const isFalta = item.status === "FALTA";
          const isAvariado = item.status === "AVARIADO";

          return (
            <div 
              key={`${item.tipo}-${item.id}`} 
              className={`bg-white p-5 rounded-2xl border transition-all duration-200 ${
                isOk ? "border-emerald-200 bg-emerald-50/20" :
                isFalta ? "border-rose-200 bg-rose-50/20" :
                isAvariado ? "border-amber-200 bg-amber-50/20" :
                "border-slate-200"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      item.tipo === "Jangada" ? "bg-blue-100 text-blue-700" :
                      item.tipo === "Colete" ? "bg-purple-100 text-purple-700" :
                      "bg-sky-100 text-sky-700"
                    }`}>
                      {item.tipo}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Série: <b>{item.serial}</b></span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{item.modelo}</h3>
                  {item.validade && (
                    <p className="text-xs text-slate-500 mt-1">Validade: <b>{new Date(item.validade).toLocaleDateString('pt-PT')}</b></p>
                  )}
                </div>

                {/* Big Touch Controls */}
                <div className="flex items-center gap-2 no-print">
                  <button
                    onClick={() => handleStatusChange(idx, "OK")}
                    className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                      isOk 
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    OK
                  </button>
                  <button
                    onClick={() => handleStatusChange(idx, "FALTA")}
                    className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                      isFalta 
                        ? "bg-rose-600 border-rose-600 text-white shadow-sm" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <X className="w-4 h-4" />
                    FALTA
                  </button>
                  <button
                    onClick={() => handleStatusChange(idx, "AVARIADO")}
                    className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                      isAvariado 
                        ? "bg-amber-600 border-amber-600 text-white shadow-sm" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    ANOMALIA
                  </button>
                </div>
              </div>

              {/* Notes Input */}
              {(isFalta || isAvariado) && (
                <div className="mt-4 pt-3 border-t border-slate-100 no-print">
                  <input
                    type="text"
                    placeholder="Descreva a anomalia ou detalhes adicionais..."
                    value={item.notes || ""}
                    onChange={(e) => handleNotesChange(idx, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Printable Report Layout */}
      <div className="only-print mt-10">
        <h2 className="text-xl font-bold border-b-2 border-slate-800 pb-2 mb-4">RELATÓRIO OPERACIONAL DE CAIS</h2>
        <div className="grid grid-cols-2 gap-4 text-xs mb-6">
          <p><b>Navio:</b> {navio.nome}</p>
          <p><b>Armador:</b> {navio.cliente?.nome || "Particular"}</p>
          <p><b>Verificados:</b> {verified} de {total}</p>
          <p><b>Data Auditoria:</b> {new Date().toLocaleDateString('pt-PT')}</p>
        </div>

        <table className="w-full text-left text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-slate-800 font-bold">
              <th className="py-2">Tipo</th>
              <th className="py-2">Série</th>
              <th className="py-2">Modelo</th>
              <th className="py-2">Estado Físico</th>
              <th className="py-2">Observações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item) => (
              <tr key={`${item.tipo}-${item.id}`} className="py-1">
                <td className="py-2">{item.tipo}</td>
                <td className="py-2 font-mono">{item.serial}</td>
                <td className="py-2">{item.modelo}</td>
                <td className="py-2 font-bold">{item.status}</td>
                <td className="py-2">{item.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-16 text-center text-xs">
          <div className="inline-block border-t border-slate-400 w-64 pt-2">
            Assinatura do Técnico Auditor
          </div>
        </div>
      </div>
    </div>
  );
}
