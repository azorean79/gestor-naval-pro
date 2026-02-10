import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';

interface Navio {
  id: string;
  nome: string;
  ilha?: string;
  tipo?: string;
}

export default function DashboardNavios({ navios }: { navios: Navio[] }) {
  // Agrupar por ilha
  const naviosPorIlha: Record<string, Navio[]> = {};
  navios.forEach(n => {
    const ilha = n.ilha || 'Desconhecida';
    if (!naviosPorIlha[ilha]) naviosPorIlha[ilha] = [];
    naviosPorIlha[ilha].push(n);
  });

  // Agrupar por tipo de pesca
  const naviosPorTipo: Record<string, Navio[]> = {};
  navios.forEach(n => {
    const tipo = n.tipo || 'Desconhecido';
    if (!naviosPorTipo[tipo]) naviosPorTipo[tipo] = [];
    naviosPorTipo[tipo].push(n);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
      <Card className="p-4 animate-fade-in">
        <div className="text-lg font-bold mb-2 text-blue-700">Navios por Ilha</div>
        {Object.entries(naviosPorIlha).map(([ilha, navios]) => (
          <div key={ilha} className="mb-3">
            <div className="font-semibold text-blue-900">{ilha}</div>
            <div className="text-sm text-gray-700">{navios.length} navios</div>
            <ul className="list-disc list-inside text-xs text-gray-600">
              {navios.map(n => (
                <li key={n.id}>{n.nome}</li>
              ))}
            </ul>
          </div>
        ))}
      </Card>
      <Card className="p-4 animate-fade-in">
        <div className="text-lg font-bold mb-2 text-green-700">Navios por Tipo de Pesca</div>
        {Object.entries(naviosPorTipo).map(([tipo, navios]) => (
          <div key={tipo} className="mb-3">
            <div className="font-semibold text-green-900">{tipo}</div>
            <div className="text-sm text-gray-700">{navios.length} navios</div>
            <ul className="list-disc list-inside text-xs text-gray-600">
              {navios.map(n => (
                <li key={n.id}>{n.nome}</li>
              ))}
            </ul>
          </div>
        ))}
      </Card>
    </div>
  );
}
