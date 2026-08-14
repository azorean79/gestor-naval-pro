"use client";

import React from "react";

export type ChecklistLegalItem = {
  id: string;
  label: string;
  referencia: string;
};

const CHECKLIST_KEY = "dgrm-checklist-legal-v1";

const checklistLegal: ChecklistLegalItem[] = [
  {
    id: "estacao-aprovada",
    label: "Oficina técnica aprovada e certificada para revisão de jangadas.",
    referencia: "DL 103/95, arts. 1.º a 5.º",
  },
  {
    id: "periodicidade-12m",
    label: "Revisões periódicas realizadas no prazo máximo de 12 meses.",
    referencia: "DL 103/95, art. 7.º, n.º 3",
  },
  {
    id: "ficha-certificado-bordo",
    label: "Certificado de reinspecção e relatório mantidos/emitidos conforme exigido.",
    referencia: "DL 103/95, arts. 8.º e 9.º",
  },
  {
    id: "condicoes-area-servico",
    label: "Área de serviço cumpre condições técnicas (espaço, iluminação, ventilação e equipamento).",
    referencia: "Portaria 1232/95, n.º 2.º",
  },
  {
    id: "procedimentos-revisao",
    label: "Procedimentos de revisão (GI/NAP/WP e inspeções) seguidos segundo fabricante e portaria.",
    referencia: "Portaria 1232/95, n.º 3.º e Anexo I",
  },
  {
    id: "registos-5-anos",
    label: "Registos de revisão e deficiências mantidos por pelo menos 5 anos.",
    referencia: "Portaria 1232/95, n.º 2.º, 15",
  },
];

export default function DgrmChecklistLegal() {
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CHECKLIST_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      setChecked(parsed || {});
    } catch {}
  }, []);

  function toggle(id: string, value: boolean) {
    setChecked((prev) => {
      const next = { ...prev, [id]: value };
      try {
        window.localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  const done = checklistLegal.filter((item) => checked[item.id]).length;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-blue-900">Checklist legal de auditoria</h2>
      <p className="mt-1 text-xs text-blue-800">Base legal ligada ao Decreto-Lei n.º 103/95 e à Portaria n.º 1232/95.</p>
      <p className="mt-2 text-xs text-blue-900">Concluído: <b>{done}</b> / <b>{checklistLegal.length}</b></p>

      <div className="mt-3 space-y-2">
        {checklistLegal.map((item) => (
          <label key={item.id} className="flex items-start gap-2 rounded border border-blue-100 bg-white px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(checked[item.id])}
              onChange={(e) => toggle(item.id, e.target.checked)}
              className="mt-0.5"
            />
            <span>
              {item.label}
              <span className="block text-xs text-gray-500">{item.referencia}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="mt-3 text-xs">
        <a href="https://diariodarepublica.pt/dr/detalhe/decreto-lei/103-1995-501873" target="_blank" rel="noreferrer" className="text-blue-700 hover:underline mr-3">
          Abrir DL 103/95
        </a>
        <a href="https://diariodarepublica.pt/dr/detalhe/portaria/1232-1995-663346" target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
          Abrir Portaria 1232/95
        </a>
      </div>

      <div className="mt-4 rounded border border-blue-100 bg-white p-3">
        <p className="text-sm font-semibold text-blue-900">Ferramentas/equipamentos exigidos na legislação?</p>
        <p className="mt-1 text-xs text-gray-700">
          Sim. A Portaria n.º 1232/95 (n.º 2.º e Anexo I) exige condições técnicas mínimas da oficina,
          incluindo meios/equipamentos adequados de inspeção e ensaio, condições de trabalho e controlo
          documental.
        </p>
        <ul className="mt-2 list-disc pl-5 text-xs text-gray-700 space-y-1">
          <li>Equipamentos de teste/inspeção e ferramentas adequadas às operações de revisão.</li>
          <li>Instrumentos de medição/ensaio calibrados e com evidência documental de calibração.</li>
          <li>Condições de área de serviço (espaço, iluminação, ventilação e segurança).</li>
          <li>Registos técnicos e evidências de conformidade preservados por período legal.</li>
        </ul>
      </div>
    </div>
  );
}
