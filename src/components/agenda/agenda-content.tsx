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

const DAILY_INSPECTION_LIMIT = 3;

export function AgendaContent() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dragData, setDragData] = useState<any>(null);

  const { data: agendamentos = [] } = useAgendamentos();
  const { data: jangadas = [] } = useJangadas();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayStatus = (date: Date) => {
    const dayAgendamentos = agendamentos.filter(
      (agendamento: any) =>
        format(new Date(agendamento.dataInicio), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );

    if (dayAgendamentos.length === 0) return 'free';
    if (dayAgendamentos.length >= DAILY_INSPECTION_LIMIT) return 'full';
    return 'partial';
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
        <div className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
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