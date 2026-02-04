'use client';

import { format, isSameMonth, isToday } from 'date-fns';
import { Droppable } from './droppable';
import { Draggable } from './draggable';

interface AgendaCalendarProps {
  currentMonth: Date;
  calendarDays: Date[];
  agendamentos: any[];
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

  const getDayAgendamentos = (date: Date) => {
    return agendamentos.filter(
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
        const dayAgendamentos = getDayAgendamentos(date);
        const isCurrentMonth = isSameMonth(date, currentMonth);

        return (
          <Droppable key={date.toISOString()} id={`day-${date.toISOString()}`}>
            <div
              className={`min-h-[120px] p-2 border rounded-lg cursor-pointer transition-colors ${
                getStatusColor(status)
              } ${!isCurrentMonth ? 'opacity-50' : ''} ${isToday(date) ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => onDayClick(date)}
            >
              <div className="text-sm font-medium mb-1">
                {format(date, 'd')}
              </div>
              <div className="space-y-1">
                {dayAgendamentos.slice(0, 3).map((agendamento, index) => (
                  <div
                    key={agendamento.id}
                    className="text-xs bg-blue-500 text-white rounded px-1 py-0.5 truncate"
                    title={`${agendamento.titulo} - ${agendamento.responsavel}`}
                  >
                    {agendamento.titulo}
                  </div>
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