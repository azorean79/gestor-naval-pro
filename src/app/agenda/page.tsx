'use client'

import { useState } from 'react'
import { Calendar, Search, Filter, Plus, Clock, MapPin, User, AlertTriangle, Check } from 'lucide-react'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useAgendamentos, useDeleteAgendamento, useUpdateAgendamento } from '@/hooks/use-agendamentos'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import AgendaDayView from '@/components/agenda/agenda-day-view'
import { useFeriados } from '@/hooks/use-feriados'
import { useQuery } from '@tanstack/react-query'

interface TransformedAgendamento {
  id: string
  titulo: string
  tipo: string
  data: string
  hora: string
  duracao: string
  navio: string
  local: string
  tecnico: string
  status: string
  prioridade: string
  descricao: string
}

export default function AgendaPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFilter, setTipoFilter] = useState<string>('todos')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'day'>('calendar')
  const [showProximos, setShowProximos] = useState(false)
  const [showEstacaoServico, setShowEstacaoServico] = useState(false)

  const { data: agendamentosData, isLoading } = useAgendamentos({
    proximos: showProximos,
    estacaoServico: showEstacaoServico,
  })
  const deleteAgendamento = useDeleteAgendamento()
  const updateAgendamento = useUpdateAgendamento()
  const agendamentos = agendamentosData?.data || []

  // Buscar jangadas aguardando inspeção
  const { data: jangadasAguardando } = useQuery({
    queryKey: ['jangadas', 'aguardando-inspecao'],
    queryFn: async () => {
      const response = await fetch('/api/jangadas?status=ativo&limit=50')
      if (!response.ok) throw new Error('Erro ao buscar jangadas')
      return response.json()
    }
  })

  // Buscar feriados
  const { data: feriados = [] } = useFeriados(selectedDate?.getFullYear())

  // If in day view, show the day view component
  if (viewMode === 'day' && selectedDate) {
    return (
      <div className="container mx-auto py-8">
        <AgendaDayView
          selectedDate={selectedDate}
          onBack={() => setViewMode('calendar')}
        />
      </div>
    )
  }

  // Transform API data to match component expectations
  const transformedAgendamentos: TransformedAgendamento[] = agendamentos.map((agendamento: any) => ({
    id: agendamento.id,
    titulo: agendamento.titulo,
    tipo: agendamento.tipo,
    data: format(new Date(agendamento.dataInicio), 'yyyy-MM-dd'),
    hora: format(new Date(agendamento.dataInicio), 'HH:mm'),
    duracao: `${Math.round((new Date(agendamento.dataFim).getTime() - new Date(agendamento.dataInicio).getTime()) / (1000 * 60 * 60))}h`,
    navio: agendamento.navio?.nome || 'N/A',
    local: 'A definir', // API doesn't have location
    tecnico: agendamento.responsavel || 'N/A',
    status: agendamento.status,
    prioridade: agendamento.prioridade,
    descricao: agendamento.descricao || ''
  }))

  const filteredAgendamentos = transformedAgendamentos.filter((agendamento: TransformedAgendamento) => {
    const matchesSearch = agendamento.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agendamento.navio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agendamento.local.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agendamento.tecnico.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTipo = tipoFilter === 'todos' || agendamento.tipo === tipoFilter
    return matchesSearch && matchesTipo
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <Badge variant="default" className="bg-green-100 text-green-800">Confirmado</Badge>
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>
      case 'atrasado':
        return <Badge variant="destructive">Atrasado</Badge>
      case 'cancelado':
        return <Badge variant="outline">Cancelado</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'inspecao':
        return <Badge variant="default">Inspeção</Badge>
      case 'manutencao':
        return <Badge variant="secondary">Manutenção</Badge>
      case 'treinamento':
        return <Badge variant="outline">Treinamento</Badge>
      default:
        return <Badge variant="outline">Outro</Badge>
    }
  }

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return <Badge variant="destructive">Alta</Badge>
      case 'media':
        return <Badge variant="secondary">Média</Badge>
      case 'baixa':
        return <Badge variant="outline">Baixa</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  const getUniqueTipos = () => {
    const tipos = transformedAgendamentos.map((agendamento: TransformedAgendamento) => agendamento.tipo)
    return [...new Set(tipos)]
  }

  const getProximosAgendamentos = () => {
    const hoje = new Date()
    return transformedAgendamentos.filter((agendamento: TransformedAgendamento) => {
      const dataAgendamento = new Date(agendamento.data)
      return dataAgendamento >= hoje
    }).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()).slice(0, 3)
  }

  const handleEditAgendamento = (agendamento: TransformedAgendamento) => {
    // TODO: Open edit modal or navigate to edit page
    console.log('Edit agendamento:', agendamento)
  }

  const handleDeleteAgendamento = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      try {
        await deleteAgendamento.mutateAsync(id)
        alert('Agendamento excluído com sucesso!')
      } catch (error) {
        alert('Erro ao excluir agendamento: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
      }
    }
  }

  const handleDragStart = (e: React.DragEvent, agendamento: TransformedAgendamento) => {
    e.dataTransfer.setData('application/json', JSON.stringify(agendamento))
  }

  const handleDropOnJangada = async (e: React.DragEvent, jangadaId: string) => {
    e.preventDefault()
    const agendamentoData = JSON.parse(e.dataTransfer.getData('application/json'))
    
    try {
      // Update the appointment to link it with the lifeboat
      await updateAgendamento.mutateAsync({
        id: agendamentoData.id,
        data: { jangadaId: jangadaId }
      })
      alert('Agendamento movido para a jangada com sucesso!')
    } catch (error) {
      alert('Erro ao mover agendamento: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Agenda de Agendamentos
          </h1>
          <p className="text-muted-foreground">Controle de inspeções, manutenções e treinamentos</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {/* Calendário */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
            <CardDescription>
              Visualize os agendamentos por data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date)
                setViewMode('day')
              }}
              className="rounded-md border"
              modifiers={{
                hasEvent: transformedAgendamentos.map(a => new Date(a.data)),
                isHoliday: feriados.map(f => new Date(f.data)),
              }}
              modifiersStyles={{
                hasEvent: {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  fontWeight: 'bold',
                },
                isHoliday: {
                  backgroundColor: 'hsl(var(--destructive))',
                  color: 'hsl(var(--destructive-foreground))',
                  fontWeight: 'bold',
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Eventos do dia selecionado */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                : 'Selecione uma data'
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Carregando...</p>
            ) : (
              <div className="space-y-2">
                {/* Mostrar feriados do dia */}
                {selectedDate && feriados
                  .filter(feriado => isSameDay(new Date(feriado.data), selectedDate))
                  .map(feriado => (
                    <div key={`feriado-${feriado.id}`} className="p-3 border rounded-lg bg-red-50 border-red-200">
                      <h4 className="font-semibold text-red-800 flex items-center gap-2">
                        <span>🏖️</span>
                        {feriado.nome}
                      </h4>
                      <p className="text-sm text-red-600">
                        {feriado.tipo === 'nacional' ? 'Feriado Nacional' :
                         feriado.tipo === 'regional' ? `Feriado Regional - ${feriado.regiao}` :
                         'Feriado Local'}
                      </p>
                      {feriado.descricao && (
                        <p className="text-sm text-red-500 mt-1">{feriado.descricao}</p>
                      )}
                    </div>
                  ))}

                {/* Mostrar agendamentos do dia */}
                {transformedAgendamentos
                  .filter(event => selectedDate && isSameDay(new Date(event.data), selectedDate))
                  .map(event => (
                    <div key={event.id} className="p-3 border rounded-lg">
                      <h4 className="font-semibold">{event.titulo}</h4>
                      <p className="text-sm text-muted-foreground">{event.descricao}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{event.tipo}</Badge>
                        <Badge variant={event.prioridade === 'alta' ? 'destructive' : 'secondary'}>
                          {event.prioridade}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.hora} ({event.duracao})
                      </p>
                    </div>
                  ))}
                {selectedDate && transformedAgendamentos.filter(event => isSameDay(new Date(event.data), selectedDate)).length === 0 && (
                  <p className="text-muted-foreground">Nenhum evento agendado para esta data.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Próximos Agendamentos */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Próximos Agendamentos</CardTitle>
          <CardDescription>
            Agendamentos programados para os próximos dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getProximosAgendamentos().map((agendamento) => (
              <Card key={agendamento.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{agendamento.titulo}</h4>
                    {getStatusBadge(agendamento.status)}
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(agendamento.data).toLocaleDateString('pt-PT')} às {agendamento.hora}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{agendamento.local}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{agendamento.tecnico}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    {getTipoBadge(agendamento.tipo)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, navio, local ou técnico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {getUniqueTipos().map(tipo => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo === 'inspecao' ? 'Inspeção' :
                     tipo === 'manutencao' ? 'Manutenção' : 'Treinamento'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="proximos"
                checked={showProximos}
                onCheckedChange={(checked) => setShowProximos(checked as boolean)}
              />
              <label
                htmlFor="proximos"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Apenas agendamentos próximos (30 dias)
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="estacao-servico"
                checked={showEstacaoServico}
                onCheckedChange={(checked) => setShowEstacaoServico(checked as boolean)}
              />
              <label
                htmlFor="estacao-servico"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Apenas jangadas na estação de serviço
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total de Agendamentos</p>
                <p className="text-2xl font-bold">{transformedAgendamentos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{transformedAgendamentos.filter(a => a.status === 'agendado').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Atrasados</p>
                <p className="text-2xl font-bold">{transformedAgendamentos.filter(a => {
                  const data = new Date(a.data)
                  const hoje = new Date()
                  return data < hoje && a.status !== 'realizado'
                }).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Esta Semana</p>
                <p className="text-2xl font-bold">
                  {transformedAgendamentos.filter(a => {
                    const data = new Date(a.data)
                    const hoje = new Date()
                    const semanaPassada = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000)
                    return data >= semanaPassada && data <= hoje
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Agendamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos</CardTitle>
          <CardDescription>
            Lista completa de inspeções, manutenções e treinamentos agendados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Navio</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Carregando agendamentos...
                  </TableCell>
                </TableRow>
              ) : filteredAgendamentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum agendamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgendamentos.map((agendamento) => (
                  <TableRow 
                    key={agendamento.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, agendamento)}
                    className="cursor-move hover:bg-muted/50"
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {new Date(agendamento.data).toLocaleDateString('pt-PT')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {agendamento.hora} ({agendamento.duracao})
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{agendamento.titulo}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {agendamento.descricao}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTipoBadge(agendamento.tipo)}
                    </TableCell>
                    <TableCell>{agendamento.navio}</TableCell>
                    <TableCell>{agendamento.local}</TableCell>
                    <TableCell>{agendamento.tecnico}</TableCell>
                    <TableCell>
                      {getPrioridadeBadge(agendamento.prioridade)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(agendamento.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditAgendamento(agendamento)}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteAgendamento(agendamento.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Jangadas Aguardando Inspeção */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Jangadas Aguardando Inspeção
          </CardTitle>
          <CardDescription>
            Arraste agendamentos para aqui para associá-los com jangadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jangadasAguardando?.data?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jangadasAguardando.data.map((jangada: any) => (
                <div
                  key={jangada.id}
                  className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                  onDrop={(e) => handleDropOnJangada(e, jangada.id)}
                  onDragOver={handleDragOver}
                >
                  <div className="font-medium">{jangada.numeroSerie}</div>
                  <div className="text-sm text-muted-foreground">
                    {jangada.tipo} - {jangada.capacidade}p
                  </div>
                  {jangada.navio && (
                    <div className="text-sm text-muted-foreground">
                      Navio: {jangada.navio.nome}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    Solte um agendamento aqui
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma jangada aguardando inspeção
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}