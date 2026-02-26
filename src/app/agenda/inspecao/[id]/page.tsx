"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

// Wizard de checklist de inspeção liferaft
const checklistSteps = [
  {
    title: "Testes Técnicos",
    items: [
      "Teste de explosão nas mangueiras de inflação",
      "Teste das válvulas de sobrepressão (abertura/reset)",
      "Teste de pressão de trabalho (WP test)",
      "Teste de pressão com venturi (se aplicável)",
      "Teste de cilindros: peso, data de hidroteste, recarga, tipo de cabeça de disparo"
    ]
  },
  {
    title: "Testes Realizados",
    items: [
      "NAP test",
      "GI test",
      "Teste de costura do piso",
      "Teste de sobrecarga (DL)",
      "Teste hidrostático do cilindro",
      "Substituição de mangueiras"
    ]
  },
  {
    title: "Inspeção do liferaft",
    items: [
      "Flutuabilidade principal",
      "Canopy (toldo)",
      "Piso interno e externo",
      "Fita refletiva",
      "Linha de vida externa/interna",
      "Patch do painter",
      "Patch de reboque",
      "Bolsas de água",
      "Rampas/escadas",
      "Válvulas de sobrepressão e tampas",
      "Sistema de inflação",
      "Etiquetas",
      "Faca flutuante",
      "Âncora de mar",
      "Quoit + linha",
      "Sistema de iluminação",
      "Venturi (se aplicável)",
      "Sistema de conexão MES (se aplicável)"
    ]
  },
  {
    title: "Inspeção de acessórios",
    items: [
      "Sinalizadores",
      "Comida",
      "Água",
      "Kit primeiros socorros",
      "Comprimidos para enjoo",
      "Baterias",
      "Cola",
      "EPIRB",
      "Transponder radar",
      "HRU",
      "Sistema de iluminação",
      "Bomba de pé",
      "Bailer",
      "Esponja",
      "Abridor de latas",
      "Kit pesca",
      "Lanterna",
      "Lâmpada sobressalente",
      "Espelho de sinalização",
      "Apito",
      "Recipiente para beber",
      "Sacos para enjoo",
      "Âncora de mar",
      "Remos",
      "Coletor de água da chuva",
      "TPA",
      "Refletor radar"
    ]
  },
  {
    title: "Condição do liferaft e equipamentos",
    items: [
      "Raft molhado?",
      "Liferaft danificado?",
      "Container danificado?",
      "Liferaft disparado?",
      "Natureza e extensão dos danos/defeitos",
      "Reparos realizados"
    ]
  },
  {
    title: "Repacking e verificação de segurança",
    items: [
      "Etiqueta do liferaft preenchida",
      "Cartão de identificação preenchido",
      "Certificado de reinspeção preenchido",
      "Etiqueta do container preenchida",
      "Histórico de serviço preenchido",
      "Conexões: luz, linha painter, linha de disparo rápido, tampa de acesso do shackle (DL), venturi (se aplicável)"
    ]
  }
];
function ChecklistWizard({ onFinish, artigos }: { onFinish: (data: any) => void, artigos?: any[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [associations, setAssociations] = useState<Record<string, string>>({});
  const current = checklistSteps[step];

  const handleChange = (item: string, value: string) => {
    setAnswers((prev: any) => ({ ...prev, [item]: value }));
  };

  const handleAssocChange = (item: string, artigoId: string) => {
    setAssociations(prev => ({ ...prev, [item]: artigoId }));
  };

  return (
    <div className="bg-white rounded shadow p-6 mb-8">
      <h3 className="text-lg font-bold mb-4">{current.title}</h3>
      <form onSubmit={e => { e.preventDefault(); if (step < checklistSteps.length - 1) { setStep(step + 1); } else { onFinish({ answers, associations }); } }}>
        <div className="space-y-4">
          {current.items.map(item => (
            <div key={item} className="flex items-center gap-2">
              <label className="flex-1 text-sm font-medium">{item}</label>
              <select className="input w-44" value={answers[item] || ""} onChange={e => handleChange(item, e.target.value)} required>
                <option value="">Selecione</option>
                <option value="ok">OK</option>
                <option value="nao">Não</option>
                <option value="reparado">Reparado</option>
                <option value="substituido">Substituído</option>
                <option value="n/a">N/A</option>
              </select>
              {artigos && artigos.length > 0 && (
                <select className="input w-56" value={associations[item] || ""} onChange={e => handleAssocChange(item, e.target.value)}>
                  <option value="">Vincular a artigo (opcional)</option>
                  {artigos.map(a => (
                    <option key={a.id} value={a.id}>{a.nome + (a.lote ? ` | Lote: ${a.lote}` : '')}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-6">
          {step > 0 && <button className="btn btn-outline" type="button" onClick={() => setStep(step - 1)}>Anterior</button>}
          <button className="btn btn-primary" type="submit">{step < checklistSteps.length - 1 ? "Próximo" : "Finalizar"}</button>
        </div>
      </form>
    </div>
  );
}


 

async function fetchAgendamento(id: string) {
  const res = await fetch(`/api/agendamentos/${id}`);
  if (!res.ok) return null;
  return res.json();
}

async function fetchInspecao(id: string) {
  const res = await fetch(`/api/inspecoes/${id}`);
  if (!res.ok) return null;
  return res.json();
}

async function fetchJangada(id: string) {
  const res = await fetch(`/api/jangadas/${id}`);
  if (!res.ok) return null;
  return res.json();
}

function getPeriodicidade(tipoNavio: string) {
  if (!tipoNavio) return 'Anual';
  if (tipoNavio.toLowerCase().includes('recreio') || tipoNavio.toLowerCase().includes('turística')) {
    return '3 Anos';
  }
  return 'Anual';
}


export default function InspecaoPage() {
  const params = useParams();
  const [agendamento, setAgendamento] = useState<any>(null);
  const [jangada, setJangada] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checklistData, setChecklistData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const id = typeof params.id === 'string' ? params.id : String(params.id);
      const ag = await fetchAgendamento(id);
      if (ag) {
        setAgendamento(ag);
        if (ag.entidadeRelacionada) {
          const jg = await fetchJangada(ag.entidadeRelacionada);
          setJangada(jg);
        }
      } else {
        // fallback: maybe the URL contains an Inspecao id - try load it
        const ins = await fetchInspecao(id);
        if (ins) {
          // adapt inspecao into agendamento-like shape for UI
          setAgendamento({ id: ins.id, titulo: `Inspeção ${ins.tipoInspecao || ''}`, descricao: ins.observacoesGerais || '' });
          // try to fetch jangada by equipamentoId
          if (ins.jangadaId || ins.equipamentoId) {
            const equipamentoId = ins.jangadaId ?? ins.equipamentoId;
            const jg = await fetchJangada(equipamentoId);
            setJangada(jg);
          }
          // parse checklist if present
          try {
            const parsed = typeof ins.checklist === 'string' ? JSON.parse(ins.checklist) : ins.checklist;
            if (parsed) setChecklistData({ answers: Object.fromEntries((parsed || []).map((p: any) => [p.item || p.label || JSON.stringify(p), p.resposta || p.status || ''])) , associations: {} , raw: parsed });
          } catch (e) {
            // ignore parse errors
            setChecklistData({ raw: ins.checklist });
          }
        }
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) {
    return <div className="max-w-2xl mx-auto p-6">Carregando...</div>;
  }
  if (!agendamento) {
    return <div className="max-w-2xl mx-auto p-6">Inspeção não encontrada.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold mb-4">Detalhes da Inspeção</h2>
        <div className="mb-2"><b>Número do Detalhe:</b> INSP {agendamento.id.padStart(3, '0')}/2026</div>
        {jangada && <>
          <div className="mb-2"><b>Número de Série da Jangada:</b> {jangada.numeroSerie}</div>
          <div className="mb-2"><b>Marca:</b> {jangada.marca}</div>
          <div className="mb-2"><b>Modelo:</b> {jangada.modelo}</div>
          <div className="mb-2"><b>Data de Fabrico:</b> {jangada.dataFabricacao}</div>
          <div className="mb-2"><b>Tipo de Pack:</b> {jangada.tipoPack}</div>
          <div className="mb-2"><b>Tipo de Navio:</b> {jangada.tipoNavio || '-'} </div>
          <div className="mb-2"><b>Periodicidade da Inspeção:</b> {getPeriodicidade(jangada.tipoNavio)}</div>
          <div className="mb-2"><b>Validade dos Artigos:</b></div>
          <ul className="list-disc ml-6">
            {(jangada.artigos || []).map((artigo: any, idx: number) => (
              <li key={idx}>
                <b>{artigo.nome}</b>
       Kill the other Next.js process that's holding the lock        {artigo.lote ? <span> | Lote: <b>{artigo.lote}</b></span> : null}
                {artigo.validade ? <span> | Validade: <b>{artigo.validade}</b></span> : null}
              </li>
            ))}
          </ul>
        </>}
      </div>
      {/* show wizard only when we don't have checklistData already (i.e. a saved inspection) */}
      {!checklistData && <ChecklistWizard onFinish={data => setChecklistData(data)} artigos={jangada?.artigos} />}
      {checklistData && (
        <div className="bg-white rounded shadow p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">Checklist Finalizada</h3>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">{JSON.stringify(checklistData, null, 2)}</pre>
          <div className="flex gap-2">
              <button
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    const structuredChecklist = Object.entries(checklistData?.answers || {}).map(([item, resposta]) => ({
                      item,
                      resposta,
                      artigoId: checklistData?.associations?.[item] || null
                    }));

                    const payload = {
                      agendamentoId: agendamento?.id,
                      jangadaId: jangada?.id,
                      checklist: structuredChecklist,
                      criadoEm: new Date().toISOString()
                    };

                    const res = await fetch('/api/inspecoes', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    });
                    if (!res.ok) {
                      const txt = await res.text();
                      throw new Error(txt || res.statusText);
                    }
                    const json = await res.json();
                    alert('Checklist salva com sucesso (ID: ' + (json.id || json.insertId || '-') + ')');
                  } catch (err: any) {
                    console.error(err);
                    alert('Falha ao salvar checklist: ' + (err?.message || err));
                  }
                }}
              >
                Salvar
              </button>
            <button className="btn btn-outline" onClick={() => setChecklistData(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
