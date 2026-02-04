'use client';

import { format, addDays, isAfter, isBefore } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Draggable } from './draggable';

interface AgendaSidebarProps {
  selectedDate: Date | null;
  agendamentos: any[];
  jangadas: any[];
}

export function AgendaSidebar({ selectedDate, agendamentos, jangadas }: AgendaSidebarProps) {
  const getValidadesProximas = () => {
    const hoje = new Date();
    const trintaDias = addDays(hoje, 30);

    return (jangadas || []).filter((jangada) => {
      if (!jangada.proximaInspecao) return false;
      const proximaInspecao = new Date(jangada.proximaInspecao);
      return isAfter(proximaInspecao, hoje) && isBefore(proximaInspecao, trintaDias);
    });
  };

  const getDayAgendamentos = () => {
    if (!selectedDate) return [];
    return agendamentos.filter(
      (agendamento) =>
        format(new Date(agendamento.dataInicio), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
    );
  };

  const validadesProximas = getValidadesProximas();
  const dayAgendamentos = getDayAgendamentos();

  return (
    <div className="w-80 border-l bg-gray-50 p-4 space-y-4">
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {format(selectedDate, 'dd/MM/yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dayAgendamentos.map((agendamento) => (
                <div key={agendamento.id} className="p-2 bg-white rounded border">
                  <div className="font-medium">{agendamento.titulo}</div>
                  <div className="text-sm text-gray-600">
                    {format(new Date(agendamento.dataInicio), 'HH:mm')} - {format(new Date(agendamento.dataFim), 'HH:mm')}
                  </div>
                  <div className="text-sm">{agendamento.responsavel}</div>
                  <Badge variant={agendamento.prioridade === 'urgente' ? 'destructive' : 'secondary'}>
                    {agendamento.prioridade}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Validades Próximas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {validadesProximas.map((jangada) => (
              <Draggable
                key={jangada.id}
                id={`jangada-${jangada.id}`}
                data={{ type: 'jangada', jangada }}
              >
                <div className="p-2 bg-white rounded border cursor-move hover:bg-gray-50">
                  <div className="font-medium">{jangada.numeroSerie}</div>
                  <div className="text-sm text-gray-600">
                    Navio: {jangada.navio?.nome}
                  </div>
                  <div className="text-sm text-gray-600">
                    Próxima: {format(new Date(jangada.proximaInspecao), 'dd/MM/yyyy')}
                  </div>
                </div>
              </Draggable>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}