"use client";
import { useEffect, useState } from "react";

// Componente para renderizar data apenas no cliente, evitando hydration mismatch
function ClientDate({ date }: { date: string }) {
  return <span>{date}</span>;
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Calendar as CalendarMonth } from "@/components/ui/calendar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Calendar, Plus, Search, Edit, Eye, Trash2, Clock, MapPin, Users, AlertTriangle, LifeBuoy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useUpdateJangada } from "@/hooks/use-jangadas";
import { CalendarioPlaneamento } from "@/components/agenda/CalendarioPlaneamento";
import { toast } from "sonner";
import Link from "next/link";
import { useJangadas } from "@/hooks/use-jangadas";
import { useAgendamentos, useDeleteAgendamento } from "@/hooks/use-agendamentos";
import { useProprietarios } from "@/hooks/use-proprietarios";

// Função utilitária para calcular diferença de dias entre datas
function diasAte(data: string) {
  const hoje = new Date();
  const alvo = new Date(data);
  return Math.ceil((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export default function AgendaPage() {
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState("2026-01-26");

  // Modal de detalhes da inspeção
  const [openDetalhe, setOpenDetalhe] = useState(false);
  const [inspecaoDetalhe, setInspecaoDetalhe] = useState<any>(null);

  // Modal de agendamento
  const [openAgendar, setOpenAgendar] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [jangadaSelecionada, setJangadaSelecionada] = useState("");
  const [dataAgendada, setDataAgendada] = useState("");
  const updateJangada = useUpdateJangada();
  const [tecnico, setTecnico] = useState("Julio Correia");
  const [local, setLocal] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Buscar todas as jangadas para avisos de validade
  const { data: jangadas = [], isLoading: loadingJangadas } = useJangadas();

  // Buscar agendamentos
  const { data: agendamentos, isLoading: loadingAgendamentos } = useAgendamentos();
  const deleteAgendamento = useDeleteAgendamento();

  // Buscar proprietários
  const { data: proprietarios = [], isLoading: loadingProprietarios } = useProprietarios();

  // Filtrar jangadas com inspeção próxima (menos de 30 dias) ou vencida
  const jangadasAviso = (jangadas || []).filter(j => {
    const dataProxima = j.proximaInspecao;
    if (!dataProxima) return false;
    const dias = diasAte(dataProxima);
    return dias <= 30;
  });


  const getStatusColor = (status: string) => {
    switch (status) {
      case "agendado": return "bg-blue-100 text-blue-800";
      case "em_andamento": return "bg-yellow-100 text-yellow-800";
      case "concluido": return "bg-green-100 text-green-800";
      case "cancelado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case "Alta": return "bg-red-100 text-red-800";
      case "Média": return "bg-yellow-100 text-yellow-800";
      case "Baixa": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "inspecao": return <LifeBuoy className="h-4 w-4" />;
      case "manutencao": return <AlertTriangle className="h-4 w-4" />;
      case "servico_externo": return <Users className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  // Transformar agendamentos para formato compatível com a UI
  const eventos = (agendamentos || []).map(agendamento => ({
    id: agendamento.id,
    titulo: agendamento.titulo,
    tipo: agendamento.tipo === 'inspecao' ? 'Inspeção' :
          agendamento.tipo === 'manutencao' ? 'Manutenção' :
          agendamento.tipo === 'reuniao' ? 'Reunião' :
          agendamento.tipo === 'treinamento' ? 'Treinamento' :
          agendamento.tipo === 'outro' ? 'Outro' : agendamento.tipo,
    data: agendamento.dataInicio.toISOString().split('T')[0],
    hora: agendamento.dataInicio.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
    local: agendamento.local || '',
    responsavel: agendamento.responsavel,
    status: agendamento.status === 'agendado' ? 'Agendado' :
            agendamento.status === 'em_andamento' ? 'Em Andamento' :
            agendamento.status === 'concluido' ? 'Concluído' :
            agendamento.status === 'cancelado' ? 'Cancelado' : agendamento.status,
    prioridade: agendamento.prioridade === 'baixa' ? 'Baixa' :
                agendamento.prioridade === 'media' ? 'Média' :
                agendamento.prioridade === 'alta' ? 'Alta' :
                agendamento.prioridade === 'urgente' ? 'Urgente' : agendamento.prioridade,
    descricao: agendamento.descricao || '',
  }));

  const eventosFiltrados = eventos.filter(evento => {
    const matchTipo = filtroTipo === "todos" || evento.tipo.toLowerCase() === filtroTipo.toLowerCase();
    const matchStatus = filtroStatus === "todos" || evento.status === filtroStatus;
    const matchBusca = evento.titulo.toLowerCase().includes(busca.toLowerCase()) ||
                      evento.responsavel.toLowerCase().includes(busca.toLowerCase());
    return matchTipo && matchStatus && matchBusca;
  });

  // Eventos de inspeção de jangadas (próxima inspeção)
  const eventosInspecaoJangadas = (jangadas || [])
    .filter(j => !!j.proximaInspecao)
    .map(j => ({
      id: `inspecao-jangada-${j.id}`,
      titulo: `Inspeção Jangada ${j.numero || ''}`,
      tipo: 'Inspeção Jangada',
      data: (typeof j.proximaInspecao === 'object' && j.proximaInspecao !== null && (j.proximaInspecao as any) instanceof Date)
        ? (j.proximaInspecao as Date).toISOString().split('T')[0]
        : (typeof j.proximaInspecao === 'string' ? j.proximaInspecao.split('T')[0] : ''),
      hora: '09:00',
      local: '', // 'local' property does not exist on Jangada; set as empty or use another property if available
      responsavel: j.proprietario || '',
      status: 'Agendado',
      prioridade: 'Média',
      descricao: `Próxima inspeção da jangada ${j.numero || ''}`,
    }));

  // Unir eventos da agenda e inspeções de jangadas
  const eventosCompletos = [...eventosFiltrados, ...eventosInspecaoJangadas];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      {/* Calendário de Planeamento (Diário, Semanal, Mensal) */}
      <CalendarioPlaneamento eventos={eventosCompletos} />
      {/* Avisos de Jangadas */}
      {jangadasAviso.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Avisos de Inspeção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {jangadasAviso.map(jangada => (
                <div key={jangada.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{jangada.numeroSerie}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      Inspeção em {jangada.proximaInspecao ? diasAte(jangada.proximaInspecao) : 0} dias
                    </span>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/agenda/inspecao/${jangada.id}`} className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Agenda de Inspeções e Manutenção</CardTitle>
          <CardDescription>
            Gerencie inspeções, manutenções e eventos relacionados às embarcações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar eventos..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="Inspeção">Inspeção</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                  <SelectItem value="Reunião">Reunião</SelectItem>
                  <SelectItem value="Treinamento">Treinamento</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="Agendado">Agendado</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Link href="/agenda/novo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Evento
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Calendário e Lista */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Calendário */}
        <Card>
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarMonth
              mode="single"
              selected={new Date(dataSelecionada)}
              onSelect={(date) => date && setDataSelecionada(date.toISOString().split('T')[0])}
            />
          </CardContent>
        </Card>

        {/* Lista de Eventos */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos do Dia</CardTitle>
            <CardDescription>
              <ClientDate date={dataSelecionada} />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {eventosFiltrados
                .filter(evento => evento.data === dataSelecionada)
                .map(evento => (
                  <div key={evento.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTipoIcon(evento.tipo)}
                      <div>
                        <div className="font-medium">{evento.titulo}</div>
                        <div className="text-sm text-gray-600">
                          {evento.hora} • {evento.local}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(evento.status)}>
                        {evento.status}
                      </Badge>
                      <Badge variant="outline" className={getPrioridadeColor(evento.prioridade)}>
                        {evento.prioridade}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              {eventosFiltrados.filter(evento => evento.data === dataSelecionada).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum evento agendado para esta data
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Todos os Eventos */}
      <Card>
        <CardHeader>
          <CardTitle>Todos os Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventosFiltrados.map(evento => (
                <TableRow key={evento.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTipoIcon(evento.tipo)}
                      {evento.tipo}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {evento.tipo === 'Inspeção' && evento.id ? (
                      <Link href={`/agenda/inspecao/${evento.id}`} className="text-blue-600 hover:underline">
                        INSP {evento.id.padStart(3, '0')}/2026
                      </Link>
                    ) : (
                      evento.titulo
                    )}
                  </TableCell>
                  <TableCell>
                    <ClientDate date={evento.data} />
                  </TableCell>
                  <TableCell>{evento.hora}</TableCell>
                  <TableCell>{evento.local}</TableCell>
                  <TableCell>{evento.responsavel}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(evento.status)}>
                      {evento.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getPrioridadeColor(evento.prioridade)}>
                      {evento.prioridade}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {evento.tipo === 'Inspeção' && evento.id && (
                        <Link href={`/agenda/inspecao/${evento.id}`}>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => alert('Função de edição em breve!')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => alert('Função de exclusão em breve!')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={openDetalhe} onOpenChange={setOpenDetalhe}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Inspeção</DialogTitle>
          </DialogHeader>
          {inspecaoDetalhe && (
            <div className="space-y-4">
              <div>
                <Label>Cliente</Label>
                {inspecaoDetalhe.clienteId ? (
                  <Link href={`/clientes/${inspecaoDetalhe.clienteId}`} className="text-blue-600 hover:underline">
                    {inspecaoDetalhe.cliente}
                  </Link>
                ) : (
                  <span>{inspecaoDetalhe.cliente || '-'}</span>
                )}
              </div>
              <div>
                <Label>Navio</Label>
                {inspecaoDetalhe.navioId ? (
                  <Link href={`/navios/${inspecaoDetalhe.navioId}`} className="text-blue-600 hover:underline">
                    {inspecaoDetalhe.navio}
                  </Link>
                ) : (
                  <span>{inspecaoDetalhe.navio || '-'}</span>
                )}
              </div>
              <div>
                <Label>Jangada</Label>
                {inspecaoDetalhe.jangadaId ? (
                  <Link href={`/jangadas/${inspecaoDetalhe.jangadaId}`} className="text-blue-600 hover:underline">
                    {inspecaoDetalhe.jangada}
                  </Link>
                ) : (
                  <span>{inspecaoDetalhe.jangada || '-'}</span>
                )}
              </div>
              <div>
                <Label>Data</Label>
                <p>{inspecaoDetalhe.data}</p>
              </div>
              <div>
                <Label>Técnico</Label>
                <p>{inspecaoDetalhe.tecnico}</p>
              </div>
              <div>
                <Label>Observações</Label>
                <p>{inspecaoDetalhe.observacoes}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setOpenDetalhe(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Agendamento */}
      <Dialog open={openAgendar} onOpenChange={setOpenAgendar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Inspeção</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cliente">Cliente</Label>
              <Select value={clienteSelecionado} onValueChange={setClienteSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {proprietarios?.map(cliente => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="jangada">Jangada</Label>
              <Select value={jangadaSelecionada} onValueChange={setJangadaSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar jangada" />
                </SelectTrigger>
                <SelectContent>
                  {jangadas?.map(jangada => (
                    <SelectItem key={jangada.id} value={jangada.id}>
                      {jangada.numeroSerie} - {jangada.marca} {jangada.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={dataAgendada}
                onChange={(e) => setDataAgendada(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tecnico">Técnico</Label>
              <Input
                id="tecnico"
                value={tecnico}
                onChange={(e) => setTecnico(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="local">Local</Label>
              <Input
                id="local"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Input
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAgendar(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              // Lógica para agendar
              toast.success("Inspeção agendada com sucesso!");
              setOpenAgendar(false);
            }}>
              Agendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}