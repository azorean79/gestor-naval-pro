'use client'

import { useState } from 'react'
import {
  format,
  startOfDay,
  endOfDay,
  eachHourOfInterval,
  isSameDay,
  addMinutes,
  parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, ChevronLeft, Clock, MapPin, User, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAgendamentos } from '@/hooks/use-agendamentos'
import AgendarTarefaDialog from './agendar-tarefa-dialog'

interface AgendaDayViewProps {
  selectedDate: Date
  onBack: () => void
}

const PRIORITY_COLORS: Record<string, string> = {
  baixa: 'bg-blue-50 border-blue-200',
  normal: 'bg-gray-50 border-gray-200',
  alta: 'bg-orange-50 border-orange-200',
  urgente: 'bg-red-50 border-red-200',
}

const STATUS_COLORS: Record<string, string> = {
  agendado: 'bg-blue-100 text-blue-800',
  confirmado: 'bg-green-100 text-green-800',
  realizado: 'bg-gray-100 text-gray-800',
  cancelado: 'bg-red-100 text-red-800',
}

export default function AgendaDayView({ selectedDate, onBack }: AgendaDayViewProps) {
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false)
  const { data: agendamentosData, isLoading, refetch } = useAgendamentos()

  const agendamentos = agendamentosData?.data || []

  // Filter agendamentos for the selected day
  const dayAgendamentos = agendamentos.filter((agendamento: any) => {
    const agendDate = new Date(agendamento.dataInicio)
    return isSameDay(agendDate, selectedDate)
  })

  // Sort by time
  const sortedAgendamentos = dayAgendamentos.sort((a: any, b: any) => {
    const timeA = new Date(a.dataInicio).getTime()
    const timeB = new Date(b.dataInicio).getTime()
    return timeA - timeB
  })

  // Generate time slots for the day (6:00 to 22:00)
  const dayStart = startOfDay(selectedDate)
  const dayEnd = endOfDay(selectedDate)
  const hours = eachHourOfInterval({ start: dayStart, end: dayEnd })
  const dayHours = hours.filter((hour) => {
    const hourNum = hour.getHours()
    return hourNum >= 6 && hourNum < 22
  })

  const handleTaskCreated = () => {
    setShowNewTaskDialog(false)
    refetch()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: ptBR })}
            </h2>
            <p className="text-sm text-gray-600">
              {dayAgendamentos.length} tarefas agendadas
            </p>
          </div>
        </div>
        <Button
          className="gap-2"
          onClick={() => setShowNewTaskDialog(true)}
        >
          <Plus className="h-4 w-4" />
          Agendar Tarefa
        </Button>
      </div>

      {/* Tasks List */}
      {sortedAgendamentos.length > 0 ? (
        <div className="space-y-3">
          {sortedAgendamentos.map((agendamento: any) => {
            const dataInicio = parseISO(agendamento.dataInicio)
            const dataFim = parseISO(agendamento.dataFim)
            const duracao = Math.round(
              (dataFim.getTime() - dataInicio.getTime()) / (1000 * 60)
            )

            return (
              <Card
                key={agendamento.id}
                className={`border-l-4 ${PRIORITY_COLORS[agendamento.prioridade] || PRIORITY_COLORS.normal}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{agendamento.titulo}</h3>
                        <Badge className={STATUS_COLORS[agendamento.status]}>
                          {agendamento.status}
                        </Badge>
                        {agendamento.prioridade === 'urgente' && (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>

                      {agendamento.descricao && (
                        <p className="text-sm text-gray-600 mt-1">{agendamento.descricao}</p>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(dataInicio, 'HH:mm')} - {format(dataFim, 'HH:mm')}
                          <span className="text-xs ml-1">({duracao}min)</span>
                        </div>

                        {agendamento.navio && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            Navio: {agendamento.navio.nome}
                          </div>
                        )}

                        {agendamento.jangada && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            Jangada: {agendamento.jangada.nome}
                          </div>
                        )}

                        {agendamento.responsavel && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {agendamento.responsavel}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">Nenhuma tarefa agendada para este dia</p>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowNewTaskDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Agendar primeira tarefa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Time Grid View (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visualização Horária</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dayHours.map((hour) => {
              const hourStr = format(hour, 'HH:00')
              const tasksInHour = sortedAgendamentos.filter((agendamento: any) => {
                const taskStart = parseISO(agendamento.dataInicio)
                return format(taskStart, 'HH:00') === hourStr
              })

              return (
                <div key={hourStr} className="flex items-start gap-4 pb-2 border-b last:border-b-0">
                  <div className="w-12 text-sm font-medium text-gray-600">{hourStr}</div>
                  <div className="flex-1 min-h-12 flex flex-wrap items-center gap-2">
                    {tasksInHour.length > 0 ? (
                      tasksInHour.map((agendamento: any) => (
                        <Badge key={agendamento.id} variant="outline">
                          {agendamento.titulo}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">Sem tarefas</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* New Task Dialog */}
      {showNewTaskDialog && (
        <AgendarTarefaDialog
          selectedDate={selectedDate}
          onClose={() => setShowNewTaskDialog(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  )
}
