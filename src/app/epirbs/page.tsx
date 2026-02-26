'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Radio, Plus, Search, AlertTriangle, CheckCircle, Clock, Ship } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConhecimentoIntegrado } from '@/components/ConhecimentoIntegrado';

// Dados simulados de EPIRBs - Baseados em requisitos legais portugueses
const epirbsData = [
  {
    id: '1',
    numeroSerie: 'EPIRB-PT-2024-001',
    modelo: 'McMurdo G5',
    fabricante: 'McMurdo',
    dataInstalacao: '2023-06-15',
    dataUltimaInspecao: '2024-01-10',
    dataProximaInspecao: '2024-07-10',
    status: 'ativo',
    bateriaValidade: '2025-06-15',
    navioId: 'navio-1',
    navioNome: 'Santa Maria (Pesca)',
    tipoEmbarcacao: 'pesca',
    comprimento: 12.5,
    arqueacao: 25,
    certificacao: 'MED-Wheelmark',
    zonaNavegacao: 'Categoria A (Até 150 milhas)',
  },
  {
    id: '2',
    numeroSerie: 'EPIRB-PT-2024-002',
    modelo: 'Ocean Signal EPIRB1',
    fabricante: 'Ocean Signal',
    dataInstalacao: '2023-08-20',
    dataUltimaInspecao: '2024-02-15',
    dataProximaInspecao: '2024-08-15',
    status: 'manutencao',
    bateriaValidade: '2025-08-20',
    navioId: 'navio-2',
    navioNome: 'São Miguel (Recreio)',
    tipoEmbarcacao: 'recreio',
    comprimento: 8.5,
    arqueacao: 15,
    certificacao: 'CE-MED',
    zonaNavegacao: 'Categoria C (Até 6 milhas)',
  },
  {
    id: '3',
    numeroSerie: 'EPIRB-PT-2024-003',
    modelo: 'Jotron Tron 60S',
    fabricante: 'Jotron',
    dataInstalacao: '2023-09-10',
    dataUltimaInspecao: '2024-03-05',
    dataProximaInspecao: '2024-09-05',
    status: 'recall',
    bateriaValidade: '2025-09-10',
    navioId: 'navio-3',
    navioNome: 'Terceira (Turística)',
    tipoEmbarcacao: 'turistica',
    comprimento: 18.2,
    arqueacao: 45,
    certificacao: 'MED-SOLAS',
    zonaNavegacao: 'Categoria B (Até 60 milhas)',
  },
  {
    id: '4',
    numeroSerie: 'EPIRB-PT-2024-004',
    modelo: 'ACR GlobalFix V4',
    fabricante: 'ACR Electronics',
    dataInstalacao: '2023-11-12',
    dataUltimaInspecao: '2024-01-20',
    dataProximaInspecao: '2024-07-20',
    status: 'ativo',
    bateriaValidade: '2025-11-12',
    navioId: 'navio-4',
    navioNome: 'Graciosa (Pesca)',
    tipoEmbarcacao: 'pesca',
    comprimento: 15.8,
    arqueacao: 35,
    certificacao: 'MED-Wheelmark',
    zonaNavegacao: 'Categoria A (Até 150 milhas)',
  },
  {
    id: '5',
    numeroSerie: 'EPIRB-PT-2024-005',
    modelo: 'GME EPIRB',
    fabricante: 'GME',
    dataInstalacao: '2024-01-08',
    dataUltimaInspecao: '2024-01-08',
    dataProximaInspecao: '2024-07-08',
    status: 'ativo',
    bateriaValidade: '2026-01-08',
    navioId: 'navio-5',
    navioNome: 'Flores (Recreio)',
    tipoEmbarcacao: 'recreio',
    comprimento: 6.2,
    arqueacao: 8,
    certificacao: 'CE',
    zonaNavegacao: 'Categoria D (Até 2 milhas)',
  },
];

export default function EPIRBsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEPIRB, setSelectedEPIRB] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'default';
      case 'manutencao': return 'secondary';
      case 'recall': return 'destructive';
      case 'inativo': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativo': return <CheckCircle className="h-4 w-4" />;
      case 'manutencao': return <Clock className="h-4 w-4" />;
      case 'recall': return <AlertTriangle className="h-4 w-4" />;
      default: return <Radio className="h-4 w-4" />;
    }
  };

  const filteredEPIRBs = epirbsData.filter(epirb =>
    epirb.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
    epirb.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    epirb.navioNome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: epirbsData.length,
    ativos: epirbsData.filter(e => e.status === 'ativo').length,
    manutencao: epirbsData.filter(e => e.status === 'manutencao').length,
    recall: epirbsData.filter(e => e.status === 'recall').length,
    pesca: epirbsData.filter(e => e.tipoEmbarcacao === 'pesca').length,
    recreio: epirbsData.filter(e => e.tipoEmbarcacao === 'recreio').length,
    turistica: epirbsData.filter(e => e.tipoEmbarcacao === 'turistica').length,
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Radio className="h-8 w-8" />
          Gestão de EPIRBs
        </h1>
        <p className="text-muted-foreground">
          Monitoramento e manutenção de Equipamentos de Posicionamento e Identificação de Radiofarol (EPIRB)
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total EPIRBs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Radio className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Manutenção</p>
                <p className="text-2xl font-bold text-orange-600">{stats.manutencao}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recall</p>
                <p className="text-2xl font-bold text-red-600">{stats.recall}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pesca</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pesca}</p>
              </div>
              <Ship className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recreio</p>
                <p className="text-2xl font-bold text-purple-600">{stats.recreio}</p>
              </div>
              <Radio className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Turística</p>
                <p className="text-2xl font-bold text-teal-600">{stats.turistica}</p>
              </div>
              <Ship className="h-8 w-8 text-teal-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requisitos Legais por Tipo de Embarcação */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Requisitos Legais por Tipo de Embarcação</CardTitle>
          <CardDescription>
            Obrigatoriedade de EPIRB conforme legislação portuguesa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-700">Embarcações de Pesca</h4>
              <ul className="text-sm space-y-1">
                <li>• EPIRB obrigatório para {'>'}12m (Decreto-Lei 145/2015)</li>
                <li>• Certificação MED-Wheelmark obrigatória</li>
                <li>• Inspeção anual obrigatória</li>
                <li>• Categoria A (até 150 milhas)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-purple-700">Embarcações de Recreio</h4>
              <ul className="text-sm space-y-1">
                <li>• EPIRB obrigatório para {'>'}6m (Decreto-Lei 58/2017)</li>
                <li>• Certificação CE ou MED</li>
                <li>• Categoria C ou D conforme zona</li>
                <li>• Inspeção bienal recomendada</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-teal-700">Embarcações Turísticas</h4>
              <ul className="text-sm space-y-1">
                <li>• EPIRB obrigatório (SOLAS Capítulo IV)</li>
                <li>• Certificação MED-SOLAS obrigatória</li>
                <li>• Categoria B (até 60 milhas)</li>
                <li>• Inspeção semestral obrigatória</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barra de pesquisa e ações */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar EPIRB..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo EPIRB
        </Button>
      </div>

      {/* Tabela de EPIRBs */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>EPIRBs Registrados</CardTitle>
          <CardDescription>
            Lista completa de equipamentos EPIRB no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número de Série</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Fabricante</TableHead>
                <TableHead>Embarcação</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Certificação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Próxima Inspeção</TableHead>
                <TableHead>Zona Navegação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEPIRBs.map((epirb) => (
                <TableRow
                  key={epirb.id}
                  className={selectedEPIRB === epirb.id ? 'bg-muted' : ''}
                  onClick={() => setSelectedEPIRB(selectedEPIRB === epirb.id ? null : epirb.id)}
                >
                  <TableCell className="font-medium">{epirb.numeroSerie}</TableCell>
                  <TableCell>{epirb.modelo}</TableCell>
                  <TableCell>{epirb.fabricante}</TableCell>
                  <TableCell>{epirb.navioNome}</TableCell>
                  <TableCell>
                    <Badge variant={
                      epirb.tipoEmbarcacao === 'pesca' ? 'default' :
                      epirb.tipoEmbarcacao === 'recreio' ? 'secondary' : 'outline'
                    }>
                      {epirb.tipoEmbarcacao}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{epirb.certificacao}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(epirb.status)} className="flex items-center gap-1 w-fit">
                      {getStatusIcon(epirb.status)}
                      {epirb.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{epirb.dataProximaInspecao}</TableCell>
                  <TableCell className="text-sm">{epirb.zonaNavegacao}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Componente de Conhecimento Integrado */}
      <ConhecimentoIntegrado
        modulo="epirbs"
        entidadeId={selectedEPIRB || undefined}
        entidadeTipo="epirb"
      />
    </div>
  );
}