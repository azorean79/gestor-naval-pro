'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, BookOpen, ExternalLink, Gavel, Info } from 'lucide-react';

interface VinculacaoEntidade {
  entidadeTipo: string;
  entidadeId: string;
  relevancia: 'alta' | 'media' | 'baixa';
}

interface BaseConhecimento {
  id: string;
  titulo: string;
  categoria: string;
  aplicavelA: string[];
  resumo: string;
  documentoFonte: string;
  vinculacoes?: VinculacaoEntidade[];
}

interface BoletimServico {
  id: string;
  numero: string;
  titulo: string;
  tipo: 'urgente' | 'preventivo' | 'corretivo' | 'informativo';
  prioridade: 'critica' | 'alta' | 'normal' | 'baixa';
  aplicavelA: string[];
  dataValidade: string;
  vinculacoes?: VinculacaoEntidade[];
}

interface Legislacao {
  id: string;
  titulo: string;
  numero: string;
  categoria: string;
  status: 'vigente' | 'revogada' | 'em_revisao';
  aplicavelA: string[];
  vinculacoes?: VinculacaoEntidade[];
}

interface ConhecimentoIntegradoProps {
  modulo: 'epirbs' | 'importacoes' | 'analise-ia';
  entidadeId?: string;
  entidadeTipo?: string;
}

export function ConhecimentoIntegrado({ modulo, entidadeId, entidadeTipo }: ConhecimentoIntegradoProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Dados simulados - em produção, isso viria dos hooks
  const getDadosPorModulo = (modulo: string) => {
    switch (modulo) {
      case 'epirbs':
        return {
          conhecimentos: [
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
              documentoFonte: 'Decreto-Lei n.º 145/2015',
            },
            {
              id: '3',
              titulo: 'Sistema de Identificação Automática (AIS) e EPIRBs',
              categoria: 'tecnologia',
              aplicavelA: ['Embarcações de Pesca', 'EPIRBs', 'AIS'],
              resumo: 'Integração entre sistemas AIS e EPIRBs para navegação segura.',
              documentoFonte: 'Regulamento (UE) 2017/306',
            },
          ],
          boletins: [
            {
              id: '1',
              numero: 'BS-2024-005',
              titulo: 'Recall de EPIRBs Modelo McMurdo G5 - Problema de Bateria',
              tipo: 'urgente',
              prioridade: 'critica',
              aplicavelA: ['EPIRBs', 'Embarcações de Pesca'],
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
              titulo: 'Verificação de Certificação MED para EPIRBs',
              tipo: 'informativo',
              prioridade: 'normal',
              aplicavelA: ['EPIRBs', 'Certificações'],
              dataValidade: '2024-12-31',
            },
          ],
          legislacao: [
            {
              id: '1',
              titulo: 'Regime Jurídico da Navegação de Recreio',
              numero: 'Decreto-Lei n.º 58/2017',
              categoria: 'navegacao',
              status: 'vigente',
              aplicavelA: ['Embarcações de Recreio', 'EPIRBs'],
            },
            {
              id: '2',
              titulo: 'Regulamento de Segurança da Navegação Marítima',
              numero: 'Decreto-Lei n.º 145/2015',
              categoria: 'seguranca',
              status: 'vigente',
              aplicavelA: ['Embarcações de Pesca', 'EPIRBs'],
            },
            {
              id: '3',
              titulo: 'Convenção Internacional para a Salvaguarda da Vida Humana no Mar (SOLAS)',
              numero: 'Capítulo IV',
              categoria: 'internacional',
              status: 'vigente',
              aplicavelA: ['Embarcações Turísticas', 'EPIRBs'],
            },
          ],
        };
      case 'importacoes':
        return {
          conhecimentos: [
            {
              id: '1',
              titulo: 'Procedimentos de Importação de Equipamentos Marítimos',
              categoria: 'importacao',
              aplicavelA: ['Importações', 'Equipamentos Marítimos'],
              resumo: 'Guia completo para importação de equipamentos de segurança e navegação.',
              documentoFonte: 'DGRM-IMP-001',
            },
            {
              id: '2',
              titulo: 'Certificações Internacionais para Equipamentos de Segurança',
              categoria: 'certificacao',
              aplicavelA: ['Importações', 'Certificações', 'EPIRBs'],
              resumo: 'Requisitos de certificação MED, Wheelmark e CE para equipamentos importados.',
              documentoFonte: 'Regulamento (UE) 2016/425',
            },
            {
              id: '3',
              titulo: 'Controles Aduaneiros para Equipamentos Marítimos',
              categoria: 'aduana',
              aplicavelA: ['Importações', 'Equipamentos Marítimos'],
              resumo: 'Procedimentos aduaneiros específicos para equipamentos de navegação e segurança.',
              documentoFonte: 'Código Aduaneiro da União',
            },
          ],
          boletins: [
            {
              id: '1',
              numero: 'BS-2024-012',
              titulo: 'Mudanças em Requisitos de Certificação para EPIRBs Importados',
              tipo: 'informativo',
              prioridade: 'alta',
              aplicavelA: ['Importações', 'EPIRBs', 'Certificações'],
              dataValidade: '2024-08-31',
            },
            {
              id: '2',
              numero: 'BS-2024-015',
              titulo: 'Novos Procedimentos Aduaneiros para Equipamentos Marítimos',
              tipo: 'preventivo',
              prioridade: 'normal',
              aplicavelA: ['Importações', 'Equipamentos Marítimos'],
              dataValidade: '2024-12-31',
            },
          ],
          legislacao: [
            {
              id: '1',
              titulo: 'Regulamento de Equipamentos de Segurança Marítima',
              numero: 'Decreto-Lei n.º 145/2015',
              categoria: 'equipamentos',
              status: 'vigente',
              aplicavelA: ['Importações', 'Equipamentos Marítimos'],
            },
            {
              id: '2',
              titulo: 'Regulamento (UE) 2016/425 sobre Equipamentos de Proteção Individual',
              numero: 'Regulamento (UE) 2016/425',
              categoria: 'certificacao',
              status: 'vigente',
              aplicavelA: ['Importações', 'Certificações'],
            },
            {
              id: '3',
              titulo: 'Código Aduaneiro da União',
              numero: 'Regulamento (UE) n.º 952/2013',
              categoria: 'aduana',
              status: 'vigente',
              aplicavelA: ['Importações', 'Procedimentos Aduaneiros'],
            },
          ],
        };
      case 'analise-ia':
        return {
          conhecimentos: [
            {
              id: '1',
              titulo: 'Manutenção Preditiva em Embarcações de Pesca',
              categoria: 'manutencao',
              aplicavelA: ['Análise IA', 'Embarcações de Pesca', 'Manutenção Preditiva'],
              resumo: 'Aplicação de IA para previsão de falhas em motores e equipamentos de pesca.',
              documentoFonte: 'EMA-AI-001',
            },
            {
              id: '2',
              titulo: 'Análise de Riscos em Navegação de Recreio',
              categoria: 'seguranca',
              aplicavelA: ['Análise IA', 'Embarcações de Recreio', 'Avaliação de Riscos'],
              resumo: 'Utilização de IA para análise de padrões de navegação e identificação de riscos.',
              documentoFonte: 'DGRM-AI-002',
            },
            {
              id: '3',
              titulo: 'Otimização de Rotas para Embarcações Turísticas',
              categoria: 'operacional',
              aplicavelA: ['Análise IA', 'Embarcações Turísticas', 'Planejamento de Rotas'],
              resumo: 'IA aplicada à otimização de rotas considerando condições meteorológicas e tráfego.',
              documentoFonte: 'EMA-AI-003',
            },
            {
              id: '4',
              titulo: 'Detecção de Anomalias em Equipamentos de Segurança',
              categoria: 'monitoramento',
              aplicavelA: ['Análise IA', 'EPIRBs', 'Equipamentos de Segurança'],
              resumo: 'Monitoramento contínuo de EPIRBs e outros equipamentos críticos.',
              documentoFonte: 'DGRM-AI-004',
            },
            {
              id: '5',
              titulo: 'Previsão de Manutenção Baseada em Dados Históricos',
              categoria: 'preditiva',
              aplicavelA: ['Análise IA', 'Manutenção', 'Dados Operacionais'],
              resumo: 'Análise de dados históricos para previsão de necessidades de manutenção.',
              documentoFonte: 'EMA-AI-005',
            },
          ],
          boletins: [
            {
              id: '1',
              numero: 'BS-2024-016',
              titulo: 'Novo Algoritmo de Detecção de Falhas em Motores',
              tipo: 'informativo',
              prioridade: 'alta',
              aplicavelA: ['Análise IA', 'Motores', 'Manutenção Preditiva'],
              dataValidade: '2024-09-30',
            },
            {
              id: '2',
              numero: 'BS-2024-017',
              titulo: 'Atualização do Sistema de IA para Previsão Meteorológica',
              tipo: 'preventivo',
              prioridade: 'normal',
              aplicavelA: ['Análise IA', 'Meteorologia', 'Planejamento'],
              dataValidade: '2024-10-15',
            },
            {
              id: '3',
              numero: 'BS-2024-018',
              titulo: 'Melhorias na Detecção de Anomalias em EPIRBs',
              tipo: 'urgente',
              prioridade: 'critica',
              aplicavelA: ['Análise IA', 'EPIRBs', 'Segurança'],
              dataValidade: '2024-07-31',
            },
          ],
          legislacao: [
            {
              id: '1',
              titulo: 'Regulamento Geral sobre a Proteção de Dados (RGPD)',
              numero: 'Regulamento (UE) 2016/679',
              categoria: 'dados',
              status: 'vigente',
              aplicavelA: ['Análise IA', 'Dados Pessoais', 'Privacidade'],
            },
            {
              id: '2',
              titulo: 'Regulamento de Segurança da Navegação Marítima',
              numero: 'Decreto-Lei n.º 145/2015',
              categoria: 'seguranca',
              status: 'vigente',
              aplicavelA: ['Análise IA', 'Segurança Marítima'],
            },
            {
              id: '3',
              titulo: 'Regime Jurídico da Navegação de Recreio',
              numero: 'Decreto-Lei n.º 58/2017',
              categoria: 'navegacao',
              status: 'vigente',
              aplicavelA: ['Análise IA', 'Embarcações de Recreio'],
            },
            {
              id: '4',
              titulo: 'Diretiva sobre Responsabilidade Civil por Danos Causados por IA',
              numero: 'Proposta COM(2022) 496',
              categoria: 'responsabilidade',
              status: 'proposta',
              aplicavelA: ['Análise IA', 'Responsabilidade Civil'],
            },
          ],
        };
      default:
        return { conhecimentos: [], boletins: [], legislacao: [] };
    }
  };

  const dados = getDadosPorModulo(modulo);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vigente': return 'default';
      case 'revogada': return 'destructive';
      case 'em_revisao': return 'secondary';
      default: return 'outline';
    }
  };

  const openDialog = (item: any, type: string) => {
    setSelectedItem({ ...item, type });
    setShowDialog(true);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'conhecimento': return <BookOpen className="h-4 w-4" />;
      case 'boletim': return <AlertTriangle className="h-4 w-4" />;
      case 'legislacao': return <Gavel className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getTitle = (type: string) => {
    switch (type) {
      case 'conhecimento': return 'Base de Conhecimento';
      case 'boletim': return 'Boletim de Serviço';
      case 'legislacao': return 'Legislação';
      default: return 'Informação';
    }
  };

  // Filtrar itens relevantes para a entidade atual
  const filtrarItensRelevantes = (itens: any[]) => {
    if (!entidadeTipo || !entidadeId) return itens;
    return itens.filter(item =>
      item.vinculacoes?.some((v: VinculacaoEntidade) =>
        v.entidadeTipo === entidadeTipo && v.entidadeId === entidadeId
      )
    );
  };

  const conhecimentosRelevantes = filtrarItensRelevantes(dados.conhecimentos);
  const boletinsRelevantes = filtrarItensRelevantes(dados.boletins);
  const legislacaoRelevante = filtrarItensRelevantes(dados.legislacao);

  const totalItens = conhecimentosRelevantes.length + boletinsRelevantes.length + legislacaoRelevante.length;
  const itensCriticos = [...boletinsRelevantes].filter(b => b.prioridade === 'critica' || b.tipo === 'urgente').length;

  return (
    <div className="space-y-4">
      {/* Resumo do conhecimento disponível */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Conhecimento Aplicável
            {itensCriticos > 0 && (
              <Badge variant="destructive" className="ml-2">
                {itensCriticos} item(ns) crítico(s)
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {totalItens} item(ns) de conhecimento aplicáveis a este módulo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-600">{conhecimentosRelevantes.length}</div>
              <div className="text-sm text-muted-foreground">Documentos Técnicos</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-orange-600">{boletinsRelevantes.length}</div>
              <div className="text-sm text-muted-foreground">Boletins de Serviço</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">{legislacaoRelevante.length}</div>
              <div className="text-sm text-muted-foreground">Legislação</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de itens críticos/urgentes */}
      {itensCriticos > 0 && (
        <Card className="border-destructive">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Atenção Requerida
            </CardTitle>
            <CardDescription>
              Boletins críticos que requerem ação imediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {boletinsRelevantes
                .filter(b => b.prioridade === 'critica' || b.tipo === 'urgente')
                .map((boletim) => (
                  <div key={boletim.id} className="flex items-center justify-between p-3 border rounded-lg bg-destructive/5">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <div>
                        <div className="font-medium">{boletim.titulo}</div>
                        <div className="text-sm text-muted-foreground">Nº {boletim.numero}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getTipoColor(boletim.tipo)}>{boletim.tipo}</Badge>
                      <Badge variant={getPrioridadeColor(boletim.prioridade)}>{boletim.prioridade}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(boletim, 'boletim')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista completa de conhecimento */}
      <div className="grid gap-4">
        {/* Conhecimentos */}
        {conhecimentosRelevantes.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Documentação Técnica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {conhecimentosRelevantes.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium">{item.titulo}</div>
                        <div className="text-sm text-muted-foreground">{item.resumo}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getCategoriaColor(item.categoria)}>{item.categoria}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(item, 'conhecimento')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Boletins */}
        {boletinsRelevantes.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Boletins de Serviço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {boletinsRelevantes.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <div>
                        <div className="font-medium">{item.titulo}</div>
                        <div className="text-sm text-muted-foreground">Nº {item.numero} • Válido até: {item.dataValidade}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getTipoColor(item.tipo)}>{item.tipo}</Badge>
                      <Badge variant={getPrioridadeColor(item.prioridade)}>{item.prioridade}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(item, 'boletim')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legislação */}
        {legislacaoRelevante.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Legislação Aplicável
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {legislacaoRelevante.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Gavel className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="font-medium">{item.titulo}</div>
                        <div className="text-sm text-muted-foreground">{item.numero}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getCategoriaColor(item.categoria)}>{item.categoria}</Badge>
                      <Badge variant={getStatusColor(item.status)}>{item.status}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(item, 'legislacao')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog para detalhes */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedItem && getIcon(selectedItem.type)}
              {selectedItem && getTitle(selectedItem.type)}
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.titulo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedItem && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {selectedItem.numero && (
                    <div>
                      <label className="text-sm font-medium">Número</label>
                      <p className="text-sm text-muted-foreground">{selectedItem.numero}</p>
                    </div>
                  )}
                  {selectedItem.dataValidade && (
                    <div>
                      <label className="text-sm font-medium">Validade</label>
                      <p className="text-sm text-muted-foreground">{selectedItem.dataValidade}</p>
                    </div>
                  )}
                  {selectedItem.status && (
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <p className="text-sm text-muted-foreground">{selectedItem.status}</p>
                    </div>
                  )}
                  {selectedItem.documentoFonte && (
                    <div>
                      <label className="text-sm font-medium">Fonte</label>
                      <p className="text-sm text-muted-foreground">{selectedItem.documentoFonte}</p>
                    </div>
                  )}
                </div>

                {selectedItem.resumo && (
                  <div>
                    <label className="text-sm font-medium">Resumo</label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedItem.resumo}</p>
                  </div>
                )}

                {selectedItem.aplicavelA && (
                  <div>
                    <label className="text-sm font-medium">Aplicável a</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedItem.aplicavelA.map((item: string, index: number) => (
                        <Badge key={index} variant="outline">{item}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {selectedItem.categoria && (
                    <Badge variant={getCategoriaColor(selectedItem.categoria)}>
                      {selectedItem.categoria}
                    </Badge>
                  )}
                  {selectedItem.tipo && (
                    <Badge variant={getTipoColor(selectedItem.tipo)}>
                      {selectedItem.tipo}
                    </Badge>
                  )}
                  {selectedItem.prioridade && (
                    <Badge variant={getPrioridadeColor(selectedItem.prioridade)}>
                      {selectedItem.prioridade}
                    </Badge>
                  )}
                  {selectedItem.status && (
                    <Badge variant={getStatusColor(selectedItem.status)}>
                      {selectedItem.status}
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}