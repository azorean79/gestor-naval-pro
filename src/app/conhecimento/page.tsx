'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, BookOpen, FileText, Gavel, Radio, Ship, TrendingUp } from 'lucide-react';

// Simulação de dados - em produção, isso viria dos hooks
const conhecimentosEPIRB = [
  {
    id: '1',
    titulo: 'Equipamentos de Segurança Obrigatórios para Embarcações de Recreio',
    categoria: 'seguranca',
    aplicavelA: ['Embarcações de Recreio', 'EPIRBs'],
    resumo: 'Relação completa dos equipamentos de segurança obrigatórios conforme Decreto-Lei n.º 58/2017.',
    documentoFonte: 'Decreto-Lei n.º 58/2017',
  },
  {
    id: '2',
    titulo: 'Requisitos para EPIRBs em Embarcações de Pesca',
    categoria: 'equipamentos',
    aplicavelA: ['Embarcações de Pesca', 'EPIRBs'],
    resumo: 'Normas específicas para instalação e manutenção de EPIRBs em embarcações de pesca.',
    documentoFonte: 'Portaria n.º 145-A/2015',
  },
  {
    id: '3',
    titulo: 'Sistema de Identificação Automática (AIS) e EPIRBs',
    categoria: 'tecnologia',
    aplicavelA: ['Embarcações de Pesca', 'EPIRBs', 'AIS'],
    resumo: 'Integração entre sistemas AIS e EPIRBs para navegação segura.',
    documentoFonte: 'Regulamento (UE) 2017/306',
  },
];

const boletinsEPIRB = [
  {
    id: '1',
    numero: 'BS-2024-005',
    titulo: 'Recall de EPIRBs Modelo XYZ-2000 - Problema de Bateria',
    tipo: 'urgente',
    prioridade: 'critica',
    aplicavelA: ['EPIRBs', 'Embarcações de Recreio'],
    dataValidade: '2024-04-30',
  },
  {
    id: '2',
    numero: 'BS-2024-008',
    titulo: 'Atualização de Firmware EPIRB - Correção de GPS',
    tipo: 'preventivo',
    prioridade: 'alta',
    aplicavelA: ['EPIRBs', 'Todas as Embarcações'],
    dataValidade: '2024-06-15',
  },
  {
    id: '3',
    numero: 'BS-2024-011',
    titulo: 'Verificação de Certificação EPIRB para Embarcações de Pesca',
    tipo: 'informativo',
    prioridade: 'normal',
    aplicavelA: ['EPIRBs', 'Embarcações de Pesca'],
    dataValidade: '2024-12-31',
  },
];

const legislacaoEPIRB = [
  {
    id: '1',
    titulo: 'Regime Jurídico da Navegação de Recreio',
    numero: 'Decreto-Lei n.º 58/2017',
    categoria: 'navegacao',
    status: 'vigente',
    aplicavelA: ['Embarcações de Recreio', 'EPIRBs'],
    resumo: 'Estabelece o regime jurídico aplicável à navegação de recreio em águas portuguesas.'
  },
  {
    id: '2',
    titulo: 'Regulamento de Segurança da Navegação Marítima',
    numero: 'Decreto-Lei n.º 145/2015',
    categoria: 'seguranca',
    status: 'vigente',
    aplicavelA: ['Embarcações de Pesca', 'EPIRBs'],
    resumo: 'Regulamento que define as normas de segurança para a navegação marítima comercial.'
  },
  {
    id: '3',
    titulo: 'Convenção Internacional para a Salvaguarda da Vida Humana no Mar (SOLAS)',
    numero: 'Capítulo IV',
    categoria: 'internacional',
    status: 'vigente',
    aplicavelA: ['Todas as Embarcações', 'EPIRBs'],
    resumo: 'Convenção internacional que estabelece normas mínimas para a segurança da navegação.'
  },
];

const conhecimentosImportacao = [
  {
    id: '3',
    titulo: 'Processo de Importação de Equipamentos Marítimos',
    categoria: 'aduaneiro',
    aplicavelA: ['Importações', 'Equipamentos Marítimos'],
    resumo: 'Guia completo para importação de equipamentos marítimos conforme Código Aduaneiro.',
    documentoFonte: 'Regulamento (UE) n.º 952/2013',
  },
  {
    id: '4',
    titulo: 'Certificações Necessárias para Equipamentos de Segurança',
    categoria: 'certificacao',
    aplicavelA: ['Importações', 'Equipamentos de Segurança'],
    resumo: 'Certificações obrigatórias (MED, Wheelmark) para equipamentos importados.',
    documentoFonte: 'Diretiva 2014/90/UE',
  },
  {
    id: '5',
    titulo: 'Requisitos para Importação de EPIRBs',
    categoria: 'regulamentacao',
    aplicavelA: ['Importações', 'EPIRBs'],
    resumo: 'Documentação específica necessária para importação de equipamentos EPIRB.',
    documentoFonte: 'DGRM - Circ. 01/2024',
  },
];

const boletinsImportacao = [
  {
    id: '3',
    numero: 'BS-2024-012',
    titulo: 'Novos Requisitos Aduaneiros para Equipamentos Marítimos',
    tipo: 'informativo',
    prioridade: 'normal',
    aplicavelA: ['Importações', 'Equipamentos Marítimos'],
    dataValidade: '2024-12-31',
  },
  {
    id: '4',
    numero: 'BS-2024-015',
    titulo: 'Alterações na Certificação de Equipamentos de Segurança',
    tipo: 'preventivo',
    prioridade: 'alta',
    aplicavelA: ['Importações', 'Certificações'],
    dataValidade: '2024-08-30',
  },
];

const legislacaoImportacao = [
  {
    id: '3',
    titulo: 'Código Aduaneiro Comunitário',
    numero: 'Regulamento (UE) n.º 952/2013',
    categoria: 'aduaneiro',
    status: 'vigente',
    aplicavelA: ['Importações', 'Comércio'],
    resumo: 'Regulamento que estabelece o código aduaneiro da União Europeia.'
  },
  {
    id: '4',
    titulo: 'Regulamento sobre Equipamentos Marítimos',
    numero: 'Regulamento (UE) 2016/1025',
    categoria: 'certificacao',
    status: 'vigente',
    aplicavelA: ['Importações', 'Equipamentos Marítimos'],
    resumo: 'Regulamento que define os procedimentos para a avaliação da conformidade dos equipamentos marítimos.'
  },
];

const conhecimentosIA = [
  {
    id: '5',
    titulo: 'Interpretação de Resultados de Análise Preditiva em Embarcações',
    categoria: 'tecnologia',
    aplicavelA: ['Análise IA', 'Manutenção Preditiva', 'Embarcações'],
    resumo: 'Como interpretar e agir com base nos resultados das análises de IA em contexto marítimo.',
    documentoFonte: 'DGRM-AI-001',
  },
  {
    id: '6',
    titulo: 'Limitações Éticas da IA em Inspeções Marítimas',
    categoria: 'etica',
    aplicavelA: ['Análise IA', 'Inspeções', 'Embarcações'],
    resumo: 'Considerações éticas e limitações do uso de IA em inspeções de embarcações.',
    documentoFonte: 'EMA-IA-SEC-001',
  },
  {
    id: '7',
    titulo: 'IA para Prevenção de Acidentes em Embarcações de Pesca',
    categoria: 'seguranca',
    aplicavelA: ['Análise IA', 'Embarcações de Pesca', 'Prevenção'],
    resumo: 'Aplicação de IA para identificação de riscos em embarcações de pesca.',
    documentoFonte: 'Portaria n.º 123/2024',
  },
];

const boletinsIA = [
  {
    id: '4',
    numero: 'BS-2024-015',
    titulo: 'Atualização do Modelo de IA para Detecção de Anomalias',
    tipo: 'informativo',
    prioridade: 'normal',
    aplicavelA: ['Análise IA', 'Detecção'],
    dataValidade: '2024-08-30',
  },
  {
    id: '5',
    numero: 'BS-2024-018',
    titulo: 'Novos Protocolos de IA para Embarcações de Recreio',
    tipo: 'preventivo',
    prioridade: 'alta',
    aplicavelA: ['Análise IA', 'Embarcações de Recreio'],
    dataValidade: '2024-10-15',
  },
];

const legislacaoIA = [
  {
    id: '4',
    titulo: 'Regulamento Geral sobre a Proteção de Dados (RGPD)',
    numero: 'Regulamento (UE) 2016/679',
    categoria: 'dados',
    status: 'vigente',
    aplicavelA: ['Análise IA', 'Dados Pessoais'],
    resumo: 'Regulamento que estabelece regras relativas à proteção das pessoas singulares no que diz respeito ao tratamento de dados pessoais.'
  },
  {
    id: '5',
    titulo: 'Regulamento sobre Inteligência Artificial',
    numero: 'Regulamento (UE) 2024/1689',
    categoria: 'tecnologia',
    status: 'vigente',
    aplicavelA: ['Análise IA', 'IA'],
    resumo: 'Regulamento que estabelece regras harmonizadas sobre inteligência artificial.'
  },
  {
    id: '6',
    titulo: 'Normas para Uso de IA em Transportes Marítimos',
    numero: 'Diretiva (UE) 2023/1234',
    categoria: 'transporte',
    status: 'vigente',
    aplicavelA: ['Análise IA', 'Transportes Marítimos'],
    resumo: 'Diretiva que define normas para o uso de IA em sistemas de transporte marítimo.'
  },
];

function Page() {
  const [activeTab, setActiveTab] = useState('epirbs');

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'critica': return 'destructive';
      case 'alta': return 'destructive';
      case 'normal': return 'secondary';
      case 'baixa': return 'outline';
      default: return 'outline';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'urgente': return 'destructive';
      case 'preventivo': return 'default';
      case 'corretivo': return 'secondary';
      case 'informativo': return 'outline';
      default: return 'outline';
    }
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'seguranca': return 'destructive';
      case 'equipamentos': return 'default';
      case 'regulamentacao': return 'secondary';
      case 'manutencao': return 'outline';
      case 'procedimentos': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Base de Conhecimento Integrada</h1>
        <p className="text-muted-foreground">
          Aplicação prática de base de conhecimento, boletins de serviço e legislação aos módulos do sistema
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="epirbs" className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            EPIRBs
          </TabsTrigger>
          <TabsTrigger value="importacoes" className="flex items-center gap-2">
            <Ship className="h-4 w-4" />
            Importações
          </TabsTrigger>
          <TabsTrigger value="ia" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Análise IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="epirbs" className="space-y-6">
          <div className="grid gap-6">
            {/* Base de Conhecimento - EPIRBs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Base de Conhecimento - EPIRBs
                </CardTitle>
                <CardDescription>
                  Documentação técnica e procedimentos relacionados a EPIRBs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {conhecimentosEPIRB.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{item.titulo}</h4>
                        <Badge variant={getCategoriaColor(item.categoria)}>
                          {item.categoria}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.resumo}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Fonte: {item.documentoFonte}</span>
                        <span>•</span>
                        <span>Aplicável a: {item.aplicavelA.join(', ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Boletins de Serviço - EPIRBs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Boletins de Serviço - EPIRBs
                </CardTitle>
                <CardDescription>
                  Comunicados oficiais sobre EPIRBs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {boletinsEPIRB.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{item.titulo}</h4>
                          <p className="text-sm text-muted-foreground">Nº {item.numero}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={getTipoColor(item.tipo)}>{item.tipo}</Badge>
                          <Badge variant={getPrioridadeColor(item.prioridade)}>{item.prioridade}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Válido até: {item.dataValidade}</span>
                        <span>•</span>
                        <span>Aplicável a: {item.aplicavelA.join(', ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Legislação - EPIRBs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Legislação Aplicável - EPIRBs
                </CardTitle>
                <CardDescription>
                  Normas e regulamentos relacionados a EPIRBs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {legislacaoEPIRB.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{item.titulo}</h4>
                          <p className="text-sm text-muted-foreground">{item.numero}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={getCategoriaColor(item.categoria)}>{item.categoria}</Badge>
                          <Badge variant="outline">{item.status}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.resumo}</p>
                      <div className="text-xs text-muted-foreground">
                        Aplicável a: {item.aplicavelA.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="importacoes" className="space-y-6">
          <div className="grid gap-6">
            {/* Base de Conhecimento - Importações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Base de Conhecimento - Importações
                </CardTitle>
                <CardDescription>
                  Procedimentos e regulamentos para importação de equipamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {conhecimentosImportacao.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{item.titulo}</h4>
                        <Badge variant={getCategoriaColor(item.categoria)}>
                          {item.categoria}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.resumo}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Fonte: {item.documentoFonte}</span>
                        <span>•</span>
                        <span>Aplicável a: {item.aplicavelA.join(', ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Boletins de Serviço - Importações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Boletins de Serviço - Importações
                </CardTitle>
                <CardDescription>
                  Atualizações sobre processos de importação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {boletinsImportacao.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{item.titulo}</h4>
                          <p className="text-sm text-muted-foreground">Nº {item.numero}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={getTipoColor(item.tipo)}>{item.tipo}</Badge>
                          <Badge variant={getPrioridadeColor(item.prioridade)}>{item.prioridade}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Válido até: {item.dataValidade}</span>
                        <span>•</span>
                        <span>Aplicável a: {item.aplicavelA.join(', ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Legislação - Importações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Legislação Aplicável - Importações
                </CardTitle>
                <CardDescription>
                  Normas aduaneiras e comerciais para importações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {legislacaoImportacao.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{item.titulo}</h4>
                          <p className="text-sm text-muted-foreground">{item.numero}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={getCategoriaColor(item.categoria)}>{item.categoria}</Badge>
                          <Badge variant="outline">{item.status}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.resumo}</p>
                      <div className="text-xs text-muted-foreground">
                        Aplicável a: {item.aplicavelA.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ia" className="space-y-6">
          <div className="grid gap-6">
            {/* Base de Conhecimento - Análise IA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Base de Conhecimento - Análise IA
                </CardTitle>
                <CardDescription>
                  Diretrizes para uso e interpretação de análises de IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {conhecimentosIA.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{item.titulo}</h4>
                        <Badge variant={getCategoriaColor(item.categoria)}>
                          {item.categoria}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.resumo}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Fonte: {item.documentoFonte}</span>
                        <span>•</span>
                        <span>Aplicável a: {item.aplicavelA.join(', ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Boletins de Serviço - Análise IA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Boletins de Serviço - Análise IA
                </CardTitle>
                <CardDescription>
                  Atualizações sobre modelos e algoritmos de IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {boletinsIA.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{item.titulo}</h4>
                          <p className="text-sm text-muted-foreground">Nº {item.numero}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={getTipoColor(item.tipo)}>{item.tipo}</Badge>
                          <Badge variant={getPrioridadeColor(item.prioridade)}>{item.prioridade}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Válido até: {item.dataValidade}</span>
                        <span>•</span>
                        <span>Aplicável a: {item.aplicavelA.join(', ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Legislação - Análise IA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Legislação Aplicável - Análise IA
                </CardTitle>
                <CardDescription>
                  Normas sobre proteção de dados e uso de IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {legislacaoIA.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{item.titulo}</h4>
                          <p className="text-sm text-muted-foreground">{item.numero}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={getCategoriaColor(item.categoria)}>{item.categoria}</Badge>
                          <Badge variant="outline">{item.status}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.resumo}</p>
                      <div className="text-xs text-muted-foreground">
                        Aplicável a: {item.aplicavelA.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ConhecimentoPage() {
  return <Page />;
}