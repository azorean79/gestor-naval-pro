"use client";
import { useState } from "react";

type Custo = {
  id: string;
  tipo: string;
  descricao: string;
  valor: string;
  data: string;
  entidade: string;
};

export default function Custos() {
  const [custos, setCustos] = useState<Custo[]>([]);
  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [entidade, setEntidade] = useState("");

  // Persistência local
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipo || !descricao || !valor || !data || !entidade) return;
    const novo = {
      id: Date.now().toString(),
      tipo,
      descricao,
      valor,
      data,
      entidade,
    };
    const atualizados = [...custos, novo];
    setCustos(atualizados);
    localStorage.setItem("custos", JSON.stringify(atualizados));
    setTipo(""); setDescricao(""); setValor(""); setData(""); setEntidade("");
  };

  // Carregar do localStorage
  useState(() => {
    try {
      const salvos = JSON.parse(localStorage.getItem("custos") || "[]");
      setCustos(salvos);
    } catch {}
  });

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4">
      <h2 className="text-2xl font-bold mb-4">Custos de Inspeção/Manutenção</h2>
      <form onSubmit={handleAdd} className="mb-4 flex flex-col gap-2">
        <select value={tipo} onChange={e => setTipo(e.target.value)} className="border rounded px-2 py-1">
          <option value="">Tipo</option>
          <option value="Inspeção">Inspeção</option>
          <option value="Manutenção">Manutenção</option>
        </select>
        <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição" className="border rounded px-2 py-1" />
        <input value={valor} onChange={e => setValor(e.target.value)} placeholder="Valor (R$)" className="border rounded px-2 py-1" type="number" min="0" step="0.01" />
        <input value={data} onChange={e => setData(e.target.value)} type="date" className="border rounded px-2 py-1" />
        <input value={entidade} onChange={e => setEntidade(e.target.value)} placeholder="Navio/Jangada vinculada" className="border rounded px-2 py-1" />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Salvar</button>
      </form>
      <h3 className="text-lg font-bold mb-2">Custos registrados</h3>
      <table className="min-w-full bg-white rounded shadow mb-2 text-xs sm:text-sm">
        <thead>
          <tr className="bg-blue-100">
            <th className="p-2">Tipo</th>
            <th className="p-2">Descrição</th>
            <th className="p-2">Valor</th>
            <th className="p-2">Data</th>
            <th className="p-2">Vinculado</th>
          </tr>
        </thead>
        <tbody>
          {custos.map((c: any) => (
            <tr key={c.id} className="border-t align-top">
              <td className="p-2">{c.tipo}</td>
              <td className="p-2">{c.descricao}</td>
              <td className="p-2">R$ {Number(c.valor).toFixed(2)}</td>
              <td className="p-2">{c.data}</td>
              <td className="p-2">{c.entidade}</td>
            </tr>
          ))}
          {custos.length === 0 && (
            <tr><td colSpan={5} className="p-2 text-gray-400">Nenhum custo registrado.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
