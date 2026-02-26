"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Calendar, FileText, Eye, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WizardInspecao } from "@/components/ui/WizardInspecao";
import { DashboardInspecoes } from './dashboard-inspecoes';
import { QuadroInspecao } from './quadro-inspecao';
import { useInspecoes } from '@/hooks/use-gestao-inspecoes';
import { useClientes } from '@/hooks/use-clientes';
import { useNavios } from '@/hooks/use-navios';
import { useJangadas } from '@/hooks/use-jangadas';
import { formatDate } from '@/lib/formatDate';

export default function InspecoesPage() {
  const [view, setView] = useState<'dashboard' | 'nova' | 'lista'>('dashboard');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [busca, setBusca] = useState('');

  const { inspecoes, criarInspecao } = useInspecoes();
  const clientesQuery = useClientes();
  const naviosQuery = useNavios();
  const jangadasQuery = useJangadas();

  const clientes = clientesQuery.data || [];
  const navios = naviosQuery.data || [];
  const jangadas = jangadasQuery.data || [];

  // Dados para nova inspeção
  const [novaInspecao, setNovaInspecao] = useState({
    equipamentoId: '',
    equipamentoNome: '',
    clienteId: '',
    clienteNome: '',
    tipoInspecao: 'anual' as const,
    tecnico: 'João Silva',
    dataInspecao: new Date().toISOString().split('T')[0],
    checklist: [] as any[]
  });

  const equipamentos = [
    ...navios.map(n => ({ id: n.id, nome: n.nome, tipo: 'navio', clienteId: n.proprietario })),
    ...jangadas.map(j => ({ id: j.id, numeroSerie: j.numeroSerie, tipo: 'jangada', clienteId: j.proprietario }))
  ];

  const inspecoesFiltradas = inspecoes.filter(inspecao => {
    const matchBusca = inspecao.equipamentoNome.toLowerCase().includes(busca.toLowerCase()) ||
                      inspecao.clienteNome.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || inspecao.status === filtroStatus;
    const matchTipo = filtroTipo === 'todos' || inspecao.tipoInspecao === filtroTipo;

    return matchBusca && matchStatus && matchTipo;
  });

  const handleCriarInspecao = async () => {
    if (!novaInspecao.equipamentoId || !novaInspecao.clienteId) return;

    await criarInspecao({
      equipamentoId: novaInspecao.equipamentoId,
      equipamentoNome: novaInspecao.equipamentoNome,
      clienteId: novaInspecao.clienteId,
      clienteNome: novaInspecao.clienteNome,
      tipoInspecao: novaInspecao.tipoInspecao,
      tecnico: novaInspecao.tecnico,
      dataInspecao: novaInspecao.dataInspecao + 'T10:00:00Z',
      checklist: novaInspecao.checklist
    });

    setView('dashboard');
    setNovaInspecao({
      equipamentoId: '',
      equipamentoNome: '',
      clienteId: '',
      clienteNome: '',
      tipoInspecao: 'anual',
      tecnico: 'João Silva',
      dataInspecao: new Date().toISOString().split('T')[0],
      checklist: []
    });
  };

  const handleEquipamentoChange = (equipamentoId: string) => {
    const equipamento = equipamentos.find(e => e.id === equipamentoId);
    if (equipamento) {
      const cliente = clientes.find(c => c.id === equipamento.clienteId);
      setNovaInspecao(prev => ({
        ...prev,
        equipamentoId,
        equipamentoNome: equipamento.tipo === 'navio' ? (equipamento as any).nome : (equipamento as any).numeroSerie,
        clienteId: equipamento.clienteId || '',
        clienteNome: cliente?.nome || ''
      }));
    }
  };

  if (view === 'nova') {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Nova Inspeção</h1>
          <Button variant="outline" onClick={() => setView('dashboard')}>
            Voltar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados da Inspeção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Equipamento</label>
                <Select value={novaInspecao.equipamentoId} onValueChange={handleEquipamentoChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipamentos.map(equipamento => (
                      <SelectItem key={equipamento.id} value={equipamento.id}>
                        {equipamento.tipo === 'navio' 
                          ? (equipamento as { id: string; nome: string; tipo: string; clienteId: string | undefined; }).nome 
                          : (equipamento as { id: string; numeroSerie: string | undefined; tipo: string; clienteId: string; }).numeroSerie || 'N/A'
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Cliente</label>
                <Input value={novaInspecao.clienteNome} readOnly />
              </div>

              <div>
                <label className="text-sm font-medium">Tipo de Inspeção</label>
                <Select
                  value={novaInspecao.tipoInspecao}
                  onValueChange={(value: any) => setNovaInspecao(prev => ({ ...prev, tipoInspecao: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anual">Anual</SelectItem>
                    <SelectItem value="extraordinaria">Extraordinária</SelectItem>
                    <SelectItem value="inicial">Inicial</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Técnico</label>
                <Input
                  value={novaInspecao.tecnico}
                  onChange={(e) => setNovaInspecao(prev => ({ ...prev, tecnico: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Data da Inspeção</label>
                <Input
                  type="date"
                  value={novaInspecao.dataInspecao}
                  onChange={(e) => setNovaInspecao(prev => ({ ...prev, dataInspecao: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setView('dashboard')}>
                Cancelar
              </Button>
              <Button onClick={handleCriarInspecao} disabled={!novaInspecao.equipamentoId}>
                Criar Inspeção
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'lista') {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Lista de Inspeções</h1>
          <Button variant="outline" onClick={() => setView('dashboard')}>
            Voltar
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por equipamento ou cliente..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="aprovada">Aprovada</SelectItem>
                  <SelectItem value="reprovada">Reprovada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                  <SelectItem value="extraordinaria">Extraordinária</SelectItem>
                  <SelectItem value="inicial">Inicial</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Inspeções */}
        <div className="space-y-4">
          {inspecoesFiltradas.map(inspecao => (
            <Card key={inspecao.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold">{inspecao.equipamentoNome}</h3>
                        <p className="text-sm text-muted-foreground">{inspecao.clienteNome}</p>
                      </div>
                      <Badge variant={
                        inspecao.status === 'aprovada' ? 'default' :
                        inspecao.status === 'reprovada' ? 'destructive' :
                        inspecao.status === 'em_andamento' ? 'secondary' : 'outline'
                      }>
                        {inspecao.status === 'em_andamento' ? 'Em Andamento' :
                         inspecao.status === 'concluida' ? 'Concluída' :
                         inspecao.status === 'aprovada' ? 'Aprovada' : 'Reprovada'}
                      </Badge>
                      <Badge variant="outline">
                        {inspecao.tipoInspecao}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <span>Técnico: {inspecao.tecnico}</span>
                      <span className="mx-2">•</span>
                      <span>Data: {formatDate(inspecao.dataInspecao)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    {inspecao.status === 'em_andamento' && (
                      <Button size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Continuar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Gestão de Inspeções</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setView('lista')}>
            <FileText className="h-4 w-4 mr-2" />
            Ver Todas
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Nova Inspeção
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Inspeção</DialogTitle>
              </DialogHeader>
              <WizardInspecao onFinish={(data) => {
                alert("Inspeção cadastrada: " + JSON.stringify(data, null, 2));
              }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <DashboardInspecoes />
    </div>
  );
}