import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AgendaDetailsProps {
  agendamento: any;
}

export function AgendaDetails({ agendamento }: AgendaDetailsProps) {
  if (!agendamento) return null;

  return (
    <Card className="w-full max-w-lg mx-auto mt-4 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">Detalhes do Agendamento</span>
          <Badge variant="outline">{agendamento.status}</Badge>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Data: {new Date(agendamento.dataInicio).toLocaleString('pt-BR')}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2">
          <strong>Técnico:</strong> {agendamento.responsavel || 'Sem técnico'}
        </div>
        <div className="mb-2">
          <strong>Jangada:</strong> {agendamento.jangada?.numeroSerie || 'N/A'}
        </div>
        <div className="mb-2">
          <strong>Certificados:</strong> {agendamento.certificados?.length || 0}
        </div>
        <div className="mb-2">
          <strong>Inspeções:</strong> {agendamento.inspecoes?.length || 0}
        </div>
        <div className="mb-2">
          <strong>Componentes Inspeção:</strong> {agendamento.componentesInspecao?.length || 0}
        </div>
        <div className="mb-2">
          <strong>Componentes Pack:</strong> {agendamento.componentesPack?.length || 0}
        </div>
        <div className="mb-2">
          <strong>Notas:</strong> {agendamento.descricao || '---'}
        </div>
      </CardContent>
    </Card>
  );
}
