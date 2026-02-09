'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAgendamentos } from '@/hooks/use-agendamentos';
import { useJangadas } from '@/hooks/use-jangadas';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { AgendaCalendar } from './agenda-calendar';
import { AgendaSidebar } from './agenda-sidebar';
import { AgendarInspecaoDialog } from './agendar-inspecao-dialog';
import { AgendaDetails } from './agenda-details';

// Cada técnico pode fazer no máximo 2 inspeções por dia (3.5h cada)
const INSPECTIONS_PER_TECHNICIAN = 2;

export function AgendaContent() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dragData, setDragData] = useState<any>(null);

  const { data: agendamentosResponse } = useAgendamentos();
  const { data: jangadasResponse } = useJangadas();

  const agendamentos = Array.isArray(agendamentosResponse?.data) 
    ? agendamentosResponse.data 
    : Array.isArray(agendamentosResponse) 
      ? agendamentosResponse 
      : [];
  const jangadas = Array.isArray(jangadasResponse?.data)
    ? jangadasResponse.data
    : Array.isArray(jangadasResponse)
      ? jangadasResponse
      : [];


  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayStatus = (date: Date) => {
    const dayAgendamentos = (agendamentos || []).filter(
      (agendamento: any) =>
        format(new Date(agendamento.dataInicio), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );

    if (!Array.isArray(dayAgendamentos) || dayAgendamentos.length === 0) return 'free';
    // Verificar se algum técnico atingiu o limite de 2 inspeções
    const agendamentosPorTecnico = Array.isArray(dayAgendamentos)
      ? dayAgendamentos.reduce((acc: any, agendamento: any) => {
          const tecnico = agendamento.responsavel || 'Sem técnico';
          acc[tecnico] = (acc[tecnico] || 0) + 1;
          return acc;
        }, {})
      : {};
    const alguemNoLimite = Object.values(agendamentosPorTecnico).length > 0 && Object.values(agendamentosPorTecnico).some((count: any) => count >= INSPECTIONS_PER_TECHNICIAN);
    if (dayAgendamentos.length >= INSPECTIONS_PER_TECHNICIAN * 2) return 'full'; // 4 inspeções (2 por cada um dos 2 técnicos)
    if (alguemNoLimite || dayAgendamentos.length > 0) return 'partial';
    return 'free';
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && typeof over.id === 'string' && over.id.startsWith('day-')) {
      const dateStr = over.id.replace('day-', '');
      const date = new Date(dateStr);
      setSelectedDate(date);
      setDragData(active.data.current);
      setDialogOpen(true);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex h-screen">
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Agenda de Inspeções</h1>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 text-lg">ℹ️</span>
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Regras de Agendamento:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Horário de trabalho: <strong>Segunda a Sexta, 9:00 - 17:30</strong></li>
                  <li>Duração por inspeção: <strong>3 horas e 30 minutos</strong></li>
                  <li>Máximo de <strong>2 inspeções por técnico por dia</strong></li>
                  <li>Arraste uma jangada da sidebar para agendar</li>
                </ul>
              </div>
            </div>
          </div>

          <AgendaCalendar
            currentMonth={currentMonth}
            calendarDays={calendarDays}
            agendamentos={agendamentos}
            getDayStatus={getDayStatus}
            onDayClick={setSelectedDate}
          />
        </div>

        <AgendaSidebar
          selectedDate={selectedDate}
          agendamentos={agendamentos}
          jangadas={jangadas}
        />

        {/* Painel de detalhes do agendamento */}
        {selectedDate && agendamentos.length > 0 && (
          <AgendaDetails agendamento={agendamentos.find((a: any) => format(new Date(a.dataInicio), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))} />
        )}

        <AgendarInspecaoDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          selectedDate={selectedDate}
          dragData={dragData}
        />
      </div>
    </DndContext>
  );
}