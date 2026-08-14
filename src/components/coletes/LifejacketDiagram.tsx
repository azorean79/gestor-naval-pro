/* LifejacketDiagram — premium interactive hotspot vector diagram for lifejackets
   Displays CO2 cylinder, inflator capsule, locator light, and whistle.
   Synchronized with colete database fields.
*/
"use client";
import React, { useState, useMemo } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Maximize2,
  X,
} from "lucide-react";
import type { ComponentKey, ComponentStatus, LifejacketDiagramProps } from "@/types/lifejacket-diagram";
import { getComponentStatus, fmt } from "@/lib/lifejacket-diagram-helpers";
import { formatValidityDisplay } from "@/lib/date-display";
import LifejacketDiagramHotspots from "@/components/coletes/LifejacketDiagramHotspots";

export default function LifejacketDiagram({ colete }: LifejacketDiagramProps) {
  const [hoveredKey, setHoveredKey] = useState<ComponentKey | null>(null);
  const [selectedKey, setSelectedKey] = useState<ComponentKey | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  /* Compute statuses */
  const cylSt = getComponentStatus(colete.cilindroValidade, !!colete.cilindroRef);
  const infSt = getComponentStatus(colete.pastilhaValidade, !!colete.pastilhaRef);
  const lgtSt = getComponentStatus(colete.luzValidade, !!colete.luzRef);
  const whsSt = colete.apitoRef ? "OK" : "NONE";
  const hasLight = colete.temLuz !== false;

  const lightComponent = useMemo<Partial<Record<string, ComponentStatus>>>(() => hasLight ? {
    light: {
      key: "light",
      label: "Luz de Sinalização SOLAS",
      status: lgtSt,
      desc: lgtSt === "OK" ? "Luz de sobrevivência operacional e dentro do prazo."
          : lgtSt === "WARNING" ? "Luz do colete expira em menos de 90 dias."
          : lgtSt === "CRITICAL" ? "Bateria/Luz de colete expirada — substituição obrigatória."
          : "Sem luz de sinalização instalada no colete.",
      icon: "💡",
      specs: [
        { name: "Referência", value: fmt(colete.luzRef) },
        { name: "Lote / Batch", value: fmt(colete.luzLote) },
        { name: "Validade", value: fmt(formatValidityDisplay(colete.luzValidade)) },
        { name: "Intensidade", value: "≥ 0,75 cd (SOLAS)" },
        { name: "Autonomia", value: "≥ 8 horas (Frequência Piscante)" }
      ],
      pos: [63, 28]
    }
  } : {}, [colete, hasLight, lgtSt]);

  const components = useMemo<Record<ComponentKey, ComponentStatus>>(() => ({
    /* ① Inflatable Chamber / Vest body */
    chamber: {
      key: "chamber",
      label: "Câmara Inflável / Cobertura",
      status: "OK",
      desc: "Cúpula e lóbulos de flutuação de cor amarela/laranja refletora SOLAS, equipada com fitas retro-refletoras para máxima visibilidade na água.",
      icon: "🦺",
      specs: [
        { name: "Flutuabilidade", value: "≥ 150 N (SOLAS)" },
        { name: "Fitas Refletoras", value: "Retro-refletoras (Aprovado)" },
        { name: "Material", value: "Poliamida revestida a poliuretano" }
      ],
      pos: [50, 48]
    },
    /* ② CO2 Inflation Cylinder */
    cylinder: {
      key: "cylinder",
      label: "Cilindro de CO₂",
      status: cylSt,
      desc: cylSt === "OK" ? "Cilindro de gás comprimido CO₂ dentro da validade."
          : cylSt === "WARNING" ? "Cilindro expira em menos de 90 dias."
          : cylSt === "CRITICAL" ? "Cilindro de CO₂ com validade expirada — substituição urgente!"
          : "Sem cilindro de CO₂ registado ou em falta.",
      icon: "🧪",
      specs: [
        { name: "Referência", value: fmt(colete.cilindroRef) },
        { name: "Lote / Batch", value: fmt(colete.cilindroLote) },
        { name: "Validade", value: fmt(colete.cilindroValidade) },
        { name: "Capacidade", value: "33g CO₂ (Padrão)" }
      ],
      pos: [38, 68]
    },
    /* ③ Automatic Water-soluble Inflator / Pastilha */
    inflator: {
      key: "inflator",
      label: "Disparador Automático / Pastilha",
      status: infSt,
      desc: infSt === "OK" ? "Pastilha de acionamento solúvel em água dentro da validade."
          : infSt === "WARNING" ? "Pastilha de disparo expira em menos de 90 dias."
          : infSt === "CRITICAL" ? "Pastilha expirada — risco de falha na inflação automática!"
          : "Sem pastilha de acionamento automática registada.",
      icon: "💊",
      specs: [
        { name: "Referência", value: fmt(colete.pastilhaRef) },
        { name: "Lote / Batch", value: fmt(colete.pastilhaLote) },
        { name: "Validade", value: fmt(formatValidityDisplay(colete.pastilhaValidade)) },
        { name: "Ativação", value: "Manual + Automática (<5s na água)" }
      ],
      pos: [38, 56]
    },
    ...lightComponent,
    /* ⑤ Emergency Whistle */
    whistle: {
      key: "whistle",
      label: "Apito de Sinalização Sonora",
      status: whsSt,
      desc: whsSt === "OK" ? "Apito de alta frequência em conformidade SOLAS." : "Sem apito de sinalização registado.",
      icon: "📢",
      specs: [
        { name: "Referência", value: fmt(colete.apitoRef) },
        { name: "Frequência", value: "Multi-tom (SOLAS)" },
        { name: "Nível de Som", value: "≥ 100 dB (a 1 metro)" }
      ],
      pos: [35, 40]
    }
  }) as Record<ComponentKey, ComponentStatus>, [colete, cylSt, infSt, whsSt, lightComponent]);

  const activeKey = hoveredKey || selectedKey;
  const activeComp = activeKey ? components[activeKey] : null;

  /* Score computation */
  const score = useMemo(() => {
    let s = 100;
    Object.values(components).forEach((c) => {
      if (c.status === "CRITICAL") s -= 30;
      else if (c.status === "WARNING") s -= 12;
      else if (c.status === "NONE") s -= 8;
    });
    return Math.max(0, s);
  }, [components]);

  const scoreColor = score >= 90 ? "#10b981" : score >= 65 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 28;

  const statusBadge = (status: ComponentStatus["status"]) => {
    const map = {
      OK: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2, label: "CONFORME" },
      WARNING: { cls: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse", Icon: AlertTriangle, label: "ATENÇÃO" },
      CRITICAL: { cls: "bg-rose-50 text-rose-700 border-rose-200 animate-bounce", Icon: XCircle, label: "EXPIRED" },
      NONE: { cls: "bg-slate-50 text-slate-500 border-slate-200", Icon: HelpCircle, label: "N/D" },
    }[status];
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${map.cls}`}>
        <map.Icon size={11} /> {map.label}
      </span>
    );
  };

  const DetailPanel = activeComp ? (
      <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 animate-in fade-in duration-200">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activeComp.icon}</span>
            <div>
              <h4 className="text-sm font-black text-slate-800 leading-snug">{activeComp.label}</h4>
            </div>
          </div>
          {statusBadge(activeComp.status)}
        </div>

        <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-200/50 p-3 rounded-xl">
          {activeComp.desc}
        </p>

        <div className="bg-white border border-slate-200/50 rounded-xl divide-y divide-slate-100 overflow-hidden">
          {activeComp.specs.map((s, i) => (
            <div key={i} className="flex justify-between items-center p-2.5 text-xs">
              <span className="text-slate-500 font-medium">{s.name}</span>
              <span className="text-slate-900 font-bold font-mono text-right">{s.value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => { setSelectedKey(null); setHoveredKey(null); }}
          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1"
        >
          ← Ver Resumo Geral
        </button>
      </div>
    ) : (
      <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 animate-in fade-in duration-200">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-200/40">
          <div className="relative flex-shrink-0">
            <svg className="h-16 w-16 -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="#e2e8f0" strokeWidth="5" fill="transparent" />
              <circle cx="32" cy="32" r="28"
                stroke={scoreColor} strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (circumference * score) / 100}
                strokeLinecap="round" fill="transparent"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-slate-800">{score}%</span>
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Conformidade Colete</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
              {score === 100 ? "Todos os consumíveis válidos."
               : score >= 75 ? "Validades sob controlo."
               : "Consumíveis em atraso detetados!"}
            </p>
          </div>
        </div>

        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Monitorização de Consumíveis</p>
        <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[220px]">
          {Object.values(components).map((comp) => {
            const dotCls = {
              OK: "bg-emerald-500",
              WARNING: "bg-amber-500 animate-pulse",
              CRITICAL: "bg-rose-500 animate-bounce",
              NONE: "bg-slate-300",
            }[comp.status];
            return (
              <button key={comp.key} onClick={() => setSelectedKey(comp.key)}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/40 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-left"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${dotCls}`} />
                  <span className="text-xs font-bold text-slate-700">{comp.label}</span>
                </div>
                <span>{comp.icon}</span>
              </button>
            );
          })}
        </div>
      </div>
  );

  /* Esc key handler */
  React.useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setModalOpen(false); setSelectedKey(null); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  return (
    <>
      {/* ── FULLSCREEN DIAGRAM MODAL ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex flex-col"
          onClick={() => { setModalOpen(false); setSelectedKey(null); }}
        >
          {/* Top bar */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-slate-900/95 border-b border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-xl">
                <Activity size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-widest leading-none">
                  Diagnóstico Visual do Colete
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {colete.serial || ""} · Clique nos hotspots para ver detalhes
                </p>
              </div>
            </div>
            <button
              onClick={() => { setModalOpen(false); setSelectedKey(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all"
            >
              <X size={16} /> Fechar
            </button>
          </div>

          {/* Modal body */}
          <div
            className="flex flex-1 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Diagram */}
            <div className="flex-1 flex items-center justify-center bg-slate-950 p-6 overflow-hidden">
              <div className="w-[480px] h-[480px] max-w-full max-h-full">
                <LifejacketDiagramHotspots
                  components={components}
                  colete={colete}
                  hoveredKey={hoveredKey}
                  selectedKey={selectedKey}
                  onHoveredKeyChange={setHoveredKey}
                  onSelectedKeyChange={setSelectedKey}
                  onZoomRequest={() => setModalOpen(true)}
                  enlarged
                />
              </div>
            </div>

            {/* Inspector side panel */}
            <div className="w-96 flex-shrink-0 bg-white border-l border-slate-200 overflow-y-auto flex flex-col">
              <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100 bg-slate-50">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  {activeComp ? "Consumível Selecionado" : "Painel de Diagnóstico"}
                </p>
                {activeComp && (
                  <h3 className="text-sm font-black text-slate-800 mt-0.5 leading-tight">{activeComp.label}</h3>
                )}
              </div>

              <div className="flex-1 p-5">
                {DetailPanel}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex flex-col">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Activity size={18} /></div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Diagnóstico Visual do Colete
              </h3>
              <p className="text-[11px] text-slate-500">Sincronizado com referências e validades dos consumíveis</p>
            </div>
          </div>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all">
            <Maximize2 size={13} /> Ampliar
          </button>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          <div className="md:col-span-6 bg-slate-50/60 rounded-2xl p-3 border border-slate-100 flex items-center justify-center cursor-pointer"
               onClick={() => setModalOpen(true)}>
            <LifejacketDiagramHotspots
              components={components}
              colete={colete}
              hoveredKey={hoveredKey}
              selectedKey={selectedKey}
              onHoveredKeyChange={setHoveredKey}
              onSelectedKeyChange={setSelectedKey}
              onZoomRequest={() => setModalOpen(true)}
            />
          </div>
          <div className="md:col-span-6 flex flex-col">
            {DetailPanel}
          </div>
        </div>

        {/* Legend */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-x-2 gap-y-1.5 mt-5 pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-500">
          {[
            { color: "bg-emerald-500", label: "Conforme" },
            { color: "bg-amber-500", label: "A Expirar (≤90d)" },
            { color: "bg-rose-500", label: "Expirado / Crítico" },
            { color: "bg-slate-300", label: "Não Instalado" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${l.color} border border-white shadow-sm`} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
