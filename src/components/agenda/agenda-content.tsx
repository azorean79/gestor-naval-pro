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
// import { AgendaDetails } from './agenda-details'; // Componente removido

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

  // Sugestões de agendamento agrupadas por navio
  const sugestoesPorNavio = agendamentosResponse?.sugestoesPorNavio || {};


  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayStatus = (date: Date) => {
    const dayAgendamentos = (agendamentos || []).filter(
      (agendamento: any) =>
        format(new Date(agendamento.dataInicio), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );

    if (!Array.isArray(dayAgendamentos) || dayAgendamentos.length === 0) return 'free';
    // Impedir múltiplos agendamentos para a mesma jangada no mesmo dia
    const jangadasAgendadas = new Set(dayAgendamentos.map((a: any) => a.jangada?.numeroSerie));
    if (jangadasAgendadas.size < dayAgendamentos.length) return 'full'; // Já existe agendamento para a mesma jangada no mesmo dia

    // Impedir múltiplos agendamentos para a mesma jangada no mesmo mês
    const monthAgendamentos = (agendamentos || []).filter(
      (agendamento: any) =>
        agendamento.jangada?.numeroSerie &&
        format(new Date(agendamento.dataInicio), 'yyyy-MM') === format(date, 'yyyy-MM')
    );
    const jangadasMes = new Set(monthAgendamentos.map((a: any) => a.jangada?.numeroSerie));
    if (jangadasMes.size < monthAgendamentos.length) return 'full'; // Já existe agendamento para a mesma jangada no mesmo mês

    return 'partial';
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && typeof over.id === 'string' && over.id.startsWith('day-')) {
      const dateStr = over.id.replace('day-', '');
      const date = new Date(dateStr);
      const dragJangada = active.data.current?.jangada;
      if (dragJangada) {
        // Verifica se já existe agendamento para a mesma jangada no mesmo dia
        const diaAgendado = agendamentos.some((a: any) =>
          a.jangada?.numeroSerie === dragJangada.numeroSerie &&
          format(new Date(a.dataInicio), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        );
        // Verifica se já existe agendamento para a mesma jangada no mesmo mês
        const mesAgendado = agendamentos.some((a: any) =>
          a.jangada?.numeroSerie === dragJangada.numeroSerie &&
          format(new Date(a.dataInicio), 'yyyy-MM') === format(date, 'yyyy-MM')
        );
        if (diaAgendado || mesAgendado) {
          alert('Já existe agendamento para esta jangada neste dia ou mês.');
          return;
        }
      }
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

          {Object.keys(sugestoesPorNavio).length > 0 && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 text-lg">⚠️</span>
                <div className="text-sm text-yellow-900">
                  <p className="font-medium mb-1">Sugestões de Agendamento por Navio:</p>
                  {Object.entries(sugestoesPorNavio).map(([navio, sugestoes], idx) => (
                    <div key={navio} className="mb-2">
                      <div className="font-semibold text-yellow-700">🚢 {navio}</div>
                      <ul className="list-disc list-inside space-y-1 text-yellow-800">
                        {(sugestoes as any[]).map((s: any, sidx: number) => (
                          <li key={sidx}>
                            {s.tecnico ? (
                              <span><b>{s.tecnico}</b>: </span>
                            ) : null}
                            {s.numeroSerie ? (
                              <span>Jangada {s.numeroSerie}: </span>
                            ) : null}
                            {s.dia ? (
                              <span>Dia {s.dia}: </span>
                            ) : null}
                            {s.sugestao}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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

        {/* Painel de detalhes do agendamento removido: detalhes do agendamento não são mais exibidos */}

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