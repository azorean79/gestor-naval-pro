"use client";

import React, { useState } from 'react';
import LegislacaoList, { sampleLegislacao, LegislacaoItem } from '../../modules/Legislacao';

export default function LegislacaoPage() {
  const [items] = useState<LegislacaoItem[]>(() => sampleLegislacao());
  const [query, setQuery] = useState('');

  const filtered = items.filter(i => i.titulo.toLowerCase().includes(query.toLowerCase()) || (i.referencia || '').toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="p-6">
      <div className="max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Legislação</h1>
          <button className="bg-blue-700 text-white px-3 py-1 rounded">+ Novo</button>
        </div>

        <div className="mb-4 flex gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Procurar legislação" className="border rounded px-2 py-1 flex-1" />
          <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => setQuery('')}>Limpar</button>
        </div>

        <LegislacaoList items={filtered} />
      </div>
    </div>
  );
}
