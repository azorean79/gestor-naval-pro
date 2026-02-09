'use client';

import { format, addDays, isAfter, isBefore, differenceInDays } from 'date-fns';
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
      if (!jangada.dataProximaInspecao) return false;
      const proximaInspecao = new Date(jangada.dataProximaInspecao);
      return isAfter(proximaInspecao, hoje) && isBefore(proximaInspecao, trintaDias);
    });
  };

  const getUrgenciaEntrega = (jangada: any) => {
    if (!jangada.dataPrevistaEntrega) return null;
    
    const hoje = new Date();
    const dataEntrega = new Date(jangada.dataPrevistaEntrega);
    const diasRestantes = differenceInDays(dataEntrega, hoje);
    
    if (diasRestantes < 0) {
      return { nivel: 'atrasado', texto: 'ATRASADO', cor: 'bg-red-600 text-white', dias: Math.abs(diasRestantes) };
    } else if (diasRestantes === 0) {
      return { nivel: 'hoje', texto: 'HOJE', cor: 'bg-red-500 text-white', dias: 0 };
    } else if (diasRestantes <= 2) {
      return { nivel: 'urgente', texto: `${diasRestantes}d`, cor: 'bg-orange-600 text-white', dias: diasRestantes };
    } else if (diasRestantes <= 5) {
      return { nivel: 'alerta', texto: `${diasRestantes}d`, cor: 'bg-yellow-600 text-white', dias: diasRestantes };
    } else {
      return { nivel: 'normal', texto: `${diasRestantes}d`, cor: 'bg-blue-600 text-white', dias: diasRestantes };
    }
  };

  const getDayAgendamentos = () => {
    if (!selectedDate) return [];
    return agendamentos.filter(
      (agendamento) =>
        format(new Date(agendamento.dataInicio), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
    );
  };

  const getJangadasNaEstacao = () => {
    return (jangadas || []).filter((jangada) => 
      jangada.estado === 'em_estacao' || jangada.dataEntradaEstacao
    ).sort((a, b) => {
      // Ordenar por urgência de entrega
      const urgA = getUrgenciaEntrega(a);
      const urgB = getUrgenciaEntrega(b);
      
      if (!urgA && !urgB) return 0;
      if (!urgA) return 1;
      if (!urgB) return -1;
      
      // Atrasados primeiro, depois por dias restantes
      const ordemNivel = { atrasado: 0, hoje: 1, urgente: 2, alerta: 3, normal: 4 };
      const nivelA = urgA.nivel as keyof typeof ordemNivel;
      const nivelB = urgB.nivel as keyof typeof ordemNivel;
      return ordemNivel[nivelA] - ordemNivel[nivelB];
    });
  };

  const validadesProximas = getValidadesProximas();
  const dayAgendamentos = getDayAgendamentos();
  const jangadasNaEstacao = getJangadasNaEstacao();

  return (
    <div className="w-80 border-l bg-gray-50 p-4 space-y-4 overflow-y-auto">
      {selectedDate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{format(selectedDate, 'dd/MM/yyyy')}</span>
              <Badge variant="outline">
                {dayAgendamentos.length} {dayAgendamentos.length === 1 ? 'agendamento' : 'agendamentos'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dayAgendamentos.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhum agendamento para este dia
              </p>
            ) : (
              <div className="space-y-3">
                {dayAgendamentos.map((agendamento) => (
                  <div key={agendamento.id} className="p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-base">{agendamento.titulo}</div>
                      <Badge variant={agendamento.prioridade === 'urgente' ? 'destructive' : agendamento.prioridade === 'alta' ? 'default' : 'secondary'}>
                        {agendamento.prioridade}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">⏰</span>
                        <span>
                          {format(new Date(agendamento.dataInicio), 'HH:mm')} - {format(new Date(agendamento.dataFim), 'HH:mm')}
                        </span>
                      </div>
                      
                      {agendamento.responsavel && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">👤</span>
                          <span>{agendamento.responsavel}</span>
                        </div>
                      )}
                      
                      {agendamento.jangada && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">🛟</span>
                          <span>{agendamento.jangada.numeroSerie}</span>
                        </div>
                      )}
                      
                      {agendamento.descricao && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-gray-500">{agendamento.descricao}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Validades Próximas (30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          {validadesProximas.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhuma jangada com validade próxima
            </p>
          ) : (
            <div className="space-y-2">
              {validadesProximas.map((jangada) => (
                <Draggable
                  key={jangada.id}
                  id={`jangada-${jangada.id}`}
                  data={{ type: 'jangada', jangada }}
                >
                  <div className="p-3 bg-white rounded-lg border cursor-move hover:bg-blue-50 hover:border-blue-300 transition-all">
                    <div className="font-medium text-sm">{jangada.numeroSerie}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      <div>🚢 {jangada.navio?.nome || 'N/A'}</div>
                      <div>🏷️ {jangada.marca?.nome} {jangada.modelo?.nome}</div>
                      <div className="font-medium text-orange-600 mt-1">
                        📅 Próxima: {format(new Date(jangada.dataProximaInspecao), 'dd/MM/yyyy')}
                      </div>
                    </div>
                  </div>
                </Draggable>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Estação de Serviço</span>
            <Badge variant="outline">{jangadasNaEstacao.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jangadasNaEstacao.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhuma jangada na estação
            </p>
          ) : (
            <div className="space-y-2">
              {jangadasNaEstacao.map((jangada) => {
                const urgencia = getUrgenciaEntrega(jangada);
                return (
                  <Draggable
                    key={jangada.id}
                    id={`jangada-${jangada.id}`}
                    data={{ type: 'jangada', jangada }}
                  >
                    <div className="p-3 bg-white rounded-lg border cursor-move hover:bg-blue-50 hover:border-blue-300 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm flex-1">{jangada.numeroSerie}</div>
                        {urgencia && (
                          <Badge className={`text-xs px-2 py-0.5 ${urgencia.cor}`}>
                            {urgencia.texto}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                        <div>🚢 {jangada.navio?.nome || 'N/A'}</div>
                        <div>🏷️ {jangada.marca?.nome} {jangada.modelo?.nome}</div>
                        {jangada.dataEntradaEstacao && (
                          <div className="text-gray-500">
                            🔧 Entrada: {format(new Date(jangada.dataEntradaEstacao), 'dd/MM/yyyy')}
                          </div>
                        )}
                        {jangada.dataPrevistaEntrega && (
                          <div className={`font-medium mt-1 ${
                            urgencia?.nivel === 'atrasado' ? 'text-red-700' :
                            urgencia?.nivel === 'hoje' ? 'text-red-600' :
                            urgencia?.nivel === 'urgente' ? 'text-orange-600' :
                            urgencia?.nivel === 'alerta' ? 'text-yellow-700' :
                            'text-blue-600'
                          }`}>
                            📦 Entrega: {format(new Date(jangada.dataPrevistaEntrega), 'dd/MM/yyyy')}
                            {urgencia?.nivel === 'atrasado' && ` (${urgencia.dias}d atraso)`}
                          </div>
                        )}
                      </div>
                    </div>
                  </Draggable>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}