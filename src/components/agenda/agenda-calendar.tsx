'use client';

import { format, isSameMonth, isToday, getDay } from 'date-fns';
import { Droppable } from './droppable';
import { Draggable } from './draggable';

// Melhor definição de tipo para agendamentos
interface Agendamento {
  id: string | number;
  dataInicio: string | Date;
  titulo: string;
  responsavel: string;
  tipo: string; // 'inspecao' ou outros
}

interface AgendaCalendarProps {
  currentMonth: Date;
  calendarDays: Date[];
  agendamentos: Agendamento[];
  getDayStatus: (date: Date) => string;
  onDayClick: (date: Date) => void;
}

export function AgendaCalendar({
  currentMonth,
  calendarDays,
  agendamentos,
  getDayStatus,
  onDayClick,
}: AgendaCalendarProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'free': return 'bg-green-100 border-green-200';
      case 'partial': return 'bg-yellow-100 border-yellow-200';
      case 'full': return 'bg-red-100 border-red-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  const getDayAgendamentos = (date: Date): Agendamento[] => {
    return (agendamentos || []).filter(
      (agendamento) =>
        format(new Date(agendamento.dataInicio), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  return (
    <div className="grid grid-cols-7 gap-2">
      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
        <div key={day} className="p-2 text-center font-semibold text-sm">
          {day}
        </div>
      ))}

      {calendarDays.map((date) => {
        const status = getDayStatus(date);
        const dayAgendamentosRaw = getDayAgendamentos(date);
        const dayAgendamentos = Array.isArray(dayAgendamentosRaw) ? dayAgendamentosRaw : [];
        const isCurrentMonth = isSameMonth(date, currentMonth);
        const dayOfWeek = getDay(date);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        // Destacar inspeções agendadas para o dia
        const hasInspecao = dayAgendamentos.length > 0 && dayAgendamentos.some(a => a.tipo === 'inspecao');
        const highlightValidade = hasInspecao ? 'ring-4 ring-orange-400 border-orange-400' : '';

        return (
          <Droppable key={date.toISOString()} id={`day-${date.toISOString()}`}>
            <div
                className={`min-h-[120px] p-2 border rounded-lg transition-colors ${
                  isWeekend 
                    ? 'bg-gray-200 border-gray-300 cursor-not-allowed opacity-60' 
                    : `cursor-pointer ${getStatusColor(status)} ${highlightValidade}`
                } ${!isCurrentMonth ? 'opacity-50' : ''} ${isToday(date) ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => !isWeekend && onDayClick(date)}
              title={isWeekend ? 'Agendamentos apenas de segunda a sexta-feira' : undefined}
            >
              <div className="text-sm font-medium mb-1 flex items-center justify-between">
                <span>{format(date, 'd')}</span>
                {isWeekend && <span className="text-xs text-gray-500">FDS</span>}
                {hasInspecao && (
                  <span className="text-xs bg-orange-400 text-white rounded px-2 py-0.5 ml-2" title="Inspeção marcada">
                    Inspeção!
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {dayAgendamentos.slice(0, 3).map((agendamento, index) => (
                  <Draggable
                    key={agendamento.id}
                    id={`agendamento-${agendamento.id}`}
                    data={{ type: 'agendamento', agendamento }}
                  >
                    <div
                        className={`text-xs rounded px-1 py-0.5 truncate cursor-move ${agendamento.tipo === 'inspecao' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'} hover:bg-blue-600`}
                        title={`${agendamento.titulo} - ${agendamento.responsavel}\n${agendamento.tipo === 'inspecao' ? 'Inspeção marcada' : ''}\nArraste para reagendar`}
                    >
                      {agendamento.titulo}
                    </div>
                  </Draggable>
                ))}
                {dayAgendamentos.length > 3 && (
                  <div className="text-xs text-gray-600">
                    +{dayAgendamentos.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          </Droppable>
        );
      })}
    </div>
  );
}