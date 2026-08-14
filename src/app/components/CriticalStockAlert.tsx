import React, { useEffect, useState } from "react";

interface CriticalItem {
  id: number;
  referencia: string;
  descricao: string;
  quantidade: number;
  quantidadeMinima: number | null;
}

export default function CriticalStockAlert({ stationId }: { stationId: number }) {
  const [critical, setCritical] = useState<CriticalItem[]>([]);

  useEffect(() => {
    if (!stationId) return;
    fetch(`/api/stock/critical?stationId=${stationId}`)
      .then((res) => res.json())
      .then((data) => setCritical(data.criticalItems || []))
      .catch(console.error);
  }, [stationId]);

  if (critical.length === 0) return null;

  return (
    <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 shadow-sm animate-fadeIn">
      <h2 className="font-semibold text-lg mb-2 flex items-center">
        <span className="mr-2">⚠️</span> Stock crítico na estação
      </h2>
      <ul className="list-disc list-inside space-y-1">
        {critical.map((item) => (
          <li key={item.id}>
            {item.referencia} – {item.descricao}: {item.quantidade}/{item.quantidadeMinima}
          </li>
        ))}
      </ul>
    </div>
  );
}
