"use client";

import React, { useEffect, useMemo, useState } from "react";
import AuditoriasList, { AuditoriaItem } from "@/modules/Auditorias";

export default function AuditoriasPage() {
  const [items, setItems] = useState<AuditoriaItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchAuditorias(nextQuery = "") {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (nextQuery.trim()) params.set("q", nextQuery.trim());
      const res = await fetch(`/api/auditorias?${params.toString()}`);
      if (!res.ok) throw new Error("Falha ao carregar auditorias");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAuditorias();
  }, []);

  const title = useMemo(() => (query ? `Auditorias (filtro: ${query})` : "Auditorias"), [query]);

  return (
    <div className="p-6">
      <div className="max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h1 className="text-2xl font-bold">{title}</h1>
          <button
            className="rounded bg-blue-700 px-3 py-1.5 text-sm font-medium text-white"
            onClick={() => fetchAuditorias(query)}
          >
            Atualizar
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar por tabela, operação, descrição ou utilizador"
            className="flex-1 rounded border px-3 py-2"
          />
          <button className="rounded bg-gray-200 px-3 py-2" onClick={() => fetchAuditorias(query)}>
            Procurar
          </button>
          <button
            className="rounded bg-gray-100 px-3 py-2"
            onClick={() => {
              setQuery("");
              fetchAuditorias("");
            }}
          >
            Limpar
          </button>
        </div>

        {loading ? <div className="text-sm text-gray-500">A carregar auditorias...</div> : <AuditoriasList items={items} />}
      </div>
    </div>
  );
}
