"use client";
import { decretos } from '@/legislacao';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function LegislacaoPage() {
  const [busca, setBusca] = useState('');
  const decretosFiltrados = decretos.filter(d =>
    d.texto.toLowerCase().includes(busca.toLowerCase()) ||
    d.arquivo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Legislação Aplicável</h1>
      <Input
        placeholder="Buscar por palavra, artigo, decreto..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        className="mb-6"
      />
      {decretosFiltrados.map((d, i) => (
        <Card key={d.arquivo + i} className="mb-4">
          <CardHeader>
            <CardTitle>{d.arquivo}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm max-h-96 overflow-auto">{d.texto}</pre>
          </CardContent>
        </Card>
      ))}
      {decretosFiltrados.length === 0 && (
        <div className="text-center text-muted-foreground">Nenhum resultado encontrado.</div>
      )}
    </div>
  );
}
