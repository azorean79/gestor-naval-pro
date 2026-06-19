"use client";
import { useState } from "react";

type Tarefa = {
  id: string;
  descricao: string;
  data: string;
  entidade: string;
  feito: boolean;
};

export default function Manutencao() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [entidade, setEntidade] = useState("");
  const [feito, setFeito] = useState(false);

  // Persistência local
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !data || !entidade) return;
    const nova = {
      id: Date.now().toString(),
      descricao,
      data,
      entidade,
      feito,
    };
    const atualizadas = [...tarefas, nova];
    setTarefas(atualizadas);
    localStorage.setItem("manutencao", JSON.stringify(atualizadas));
    setDescricao(""); setData(""); setEntidade(""); setFeito(false);
  };

  // Carregar do localStorage
  useState(() => {
    try {
      const salvas = JSON.parse(localStorage.getItem("manutencao") || "[]");
      setTarefas(salvas);
    } catch {}
  });

  // Marcar como feito
  const marcarFeito = (id: string) => {
    const atualizadas = tarefas.map(t => t.id === id ? { ...t, feito: true } : t);
    setTarefas(atualizadas);
    localStorage.setItem("manutencao", JSON.stringify(atualizadas));
  };

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4">
      <h2 className="text-2xl font-bold mb-4">Manutenção Preventiva</h2>
      <form onSubmit={handleAdd} className="mb-4 flex flex-col gap-2">
        <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição da tarefa" className="border rounded px-2 py-1" />
        <input value={data} onChange={e => setData(e.target.value)} type="date" className="border rounded px-2 py-1" />
        <input value={entidade} onChange={e => setEntidade(e.target.value)} placeholder="Navio/Jangada vinculada" className="border rounded px-2 py-1" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Salvar</button>
      </form>
      <h3 className="text-lg font-bold mb-2">Checklist de Manutenção</h3>
      <table className="min-w-full bg-white rounded shadow mb-2 text-xs sm:text-sm">
        <thead>
          <tr className="bg-blue-100">
            <th className="p-2">Descrição</th>
            <th className="p-2">Data</th>
            <th className="p-2">Vinculado</th>
            <th className="p-2">Status</th>
            <th className="p-2">Ação</th>
          </tr>
        </thead>
        <tbody>
          {tarefas.map((t: any) => (
            <tr key={t.id} className="border-t align-top">
              <td className="p-2">{t.descricao}</td>
              <td className="p-2">{t.data}</td>
              <td className="p-2">{t.entidade}</td>
              <td className="p-2">{t.feito ? "Concluída" : "Pendente"}</td>
              <td className="p-2">
                {!t.feito && (
                  <button className="bg-green-600 text-white px-2 py-1 rounded text-xs" onClick={() => marcarFeito(t.id)}>
                    Marcar como feito
                  </button>
                )}
              </td>
            </tr>
          ))}
          {tarefas.length === 0 && (
            <tr><td colSpan={5} className="p-2 text-gray-400">Nenhuma tarefa cadastrada.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
