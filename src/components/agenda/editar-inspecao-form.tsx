"use client";
import { useState } from "react";

export function EditarInspecaoForm({ inspecao, onSave }: { inspecao?: any, onSave?: () => void }) {
  const [titulo, setTitulo] = useState(inspecao?.titulo || "");
  const [descricao, setDescricao] = useState(inspecao?.descricao || "");
  const [dataInicio, setDataInicio] = useState(inspecao?.dataInicio ? inspecao.dataInicio.slice(0, 16) : "");
  const [dataFim, setDataFim] = useState(inspecao?.dataFim ? inspecao.dataFim.slice(0, 16) : "");
  const [local, setLocal] = useState(inspecao?.local || "");
  const [responsavel, setResponsavel] = useState(inspecao?.responsavel || "");
  const [status, setStatus] = useState(inspecao?.status || "agendado");
  const [prioridade, setPrioridade] = useState(inspecao?.prioridade || "media");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const method = inspecao ? "PUT" : "POST";
    const url = inspecao
      ? `/api/agendamentos/${inspecao.id}`
      : `/api/agendamentos`;
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo,
        descricao,
        dataInicio: dataInicio ? new Date(dataInicio).toISOString() : undefined,
        dataFim: dataFim ? new Date(dataFim).toISOString() : undefined,
        local,
        responsavel,
        status,
        prioridade,
      }),
    });
    setSaving(false);
    if (res.ok && onSave) onSave();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium">Título</label>
        <input className="border rounded px-2 py-1 w-full" value={titulo} onChange={e => setTitulo(e.target.value)} required />
      </div>
      <div>
        <label className="block font-medium">Descrição</label>
        <textarea className="border rounded px-2 py-1 w-full" value={descricao} onChange={e => setDescricao(e.target.value)} />
      </div>
      <div>
        <label className="block font-medium">Data Início</label>
        <input type="datetime-local" className="border rounded px-2 py-1 w-full" value={dataInicio} onChange={e => setDataInicio(e.target.value)} required />
      </div>
      <div>
        <label className="block font-medium">Data Fim</label>
        <input type="datetime-local" className="border rounded px-2 py-1 w-full" value={dataFim} onChange={e => setDataFim(e.target.value)} />
      </div>
      <div>
        <label className="block font-medium">Local</label>
        <input className="border rounded px-2 py-1 w-full" value={local} onChange={e => setLocal(e.target.value)} />
      </div>
      <div>
        <label className="block font-medium">Responsável</label>
        <input className="border rounded px-2 py-1 w-full" value={responsavel} onChange={e => setResponsavel(e.target.value)} />
      </div>
      <div>
        <label className="block font-medium">Status</label>
        <select className="border rounded px-2 py-1 w-full" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="agendado">Agendado</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="concluido">Concluído</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>
      <div>
        <label className="block font-medium">Prioridade</label>
        <select className="border rounded px-2 py-1 w-full" value={prioridade} onChange={e => setPrioridade(e.target.value)}>
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </select>
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={saving}>
        {inspecao ? "Salvar Alterações" : "Criar Inspeção"}
      </button>
    </form>
  );
}
