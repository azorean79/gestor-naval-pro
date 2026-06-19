"use client";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Reports() {
  const [rafts, setRafts] = useState<any[]>([]);
  const [ships, setShips] = useState<any[]>([]);
  const [filter, setFilter] = useState({
    start: "",
    end: "",
    ship: "",
    brand: "",
  });
  useEffect(() => {
    // Carregar dados locais (ajuste para API se necessário)
    const r = localStorage.getItem("rafts");
    setRafts(r ? JSON.parse(r) : []);
    const s = localStorage.getItem("ships");
    setShips(s ? JSON.parse(s) : []);
  }, []);

  // Filtro
  const filtered = rafts.filter((raft) => {
    const data = raft.dataInspecao || "";
    const afterStart = !filter.start || data >= filter.start;
    const beforeEnd = !filter.end || data <= filter.end;
    const byShip = !filter.ship || String(raft.shipId) === filter.ship;
    const byBrand = !filter.brand || raft.brand === filter.brand;
    return afterStart && beforeEnd && byShip && byBrand;
  });

  // Consumo de artigos
  const artigosConsumo: Record<string, { total: number; jangadas: number }> = {};
  filtered.forEach((raft) => {
    (raft.artigos || []).forEach((a: any) => {
      if (!artigosConsumo[a.name]) artigosConsumo[a.name] = { total: 0, jangadas: 0 };
      artigosConsumo[a.name].total += Number(a.quantidade || 0);
      artigosConsumo[a.name].jangadas += 1;
    });
  });

  function exportarPDF() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Relatório de Consumo de Artigos", 14, 18);
    doc.setFontSize(11);
    doc.text(`Período: ${filter.start || '-'} a ${filter.end || '-'}`, 14, 28);
    doc.text(`Navio: ${ships.find(s => String(s.id) === filter.ship)?.nome || 'Todos'}`, 14, 34);
    doc.text(`Marca: ${filter.brand || 'Todas'}`, 14, 40);
    autoTable(doc, {
      head: [["Artigo", "Total Consumido", "Jangadas"]],
      body: Object.entries(artigosConsumo).map(([nome, info]) => [nome, info.total, info.jangadas]),
      startY: 48,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
    });
    doc.save("relatorio_consumo_artigos.pdf");
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Relatório de Consumo de Artigos</h1>
      <div className="flex flex-wrap gap-3 mb-4">
        <label className="flex flex-col text-xs">Início
          <input type="date" value={filter.start} onChange={e => setFilter(f => ({ ...f, start: e.target.value }))} className="border rounded p-1" />
        </label>
        <label className="flex flex-col text-xs">Fim
          <input type="date" value={filter.end} onChange={e => setFilter(f => ({ ...f, end: e.target.value }))} className="border rounded p-1" />
        </label>
        <label className="flex flex-col text-xs">Navio
          <select value={filter.ship} onChange={e => setFilter(f => ({ ...f, ship: e.target.value }))} className="border rounded p-1">
            <option value="">Todos</option>
            {ships.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-xs">Marca
          <input value={filter.brand} onChange={e => setFilter(f => ({ ...f, brand: e.target.value }))} className="border rounded p-1" placeholder="Marca" />
        </label>
        <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs self-end" onClick={exportarPDF}>Exportar PDF</button>
      </div>
      <table className="min-w-full text-xs border mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Artigo</th>
            <th className="p-2">Total Consumido</th>
            <th className="p-2">Jangadas</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(artigosConsumo).map(([nome, info]) => (
            <tr key={nome}>
              <td className="p-2">{nome}</td>
              <td className="p-2">{info.total}</td>
              <td className="p-2">{info.jangadas}</td>
            </tr>
          ))}
          {Object.keys(artigosConsumo).length === 0 && (
            <tr><td colSpan={3} className="text-center text-gray-400 p-2">Nenhum consumo encontrado.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
