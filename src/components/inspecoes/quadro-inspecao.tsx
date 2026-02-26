import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, XCircle, Camera, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDate } from '@/lib/formatDate';

export interface ItemChecklist {
  id: string;
  categoria: string;
  item: string;
  descricao: string;
  status: 'pendente' | 'aprovado' | 'reprovado' | 'nao_aplicavel';
  observacoes?: string;
  fotos?: string[];
  testes?: TesteInspecao[];
}

export interface TesteInspecao {
  id: string;
  nome: string;
  descricao: string;
  valorEsperado: string;
  valorObtido?: string;
  unidade?: string;
  status: 'pendente' | 'passou' | 'falhou';
  observacoes?: string;
}

export interface QuadroInspecaoProps {
  inspecaoId: string;
  equipamentoNome: string;
  clienteNome: string;
  tipoInspecao: 'anual' | 'extraordinaria' | 'inicial' | 'final';
  tecnico: string;
  dataInspecao: string;
  onSalvar: (checklist: ItemChecklist[]) => void;
  checklistInicial?: ItemChecklist[];
}

export function QuadroInspecao({
  inspecaoId,
  equipamentoNome,
  clienteNome,
  tipoInspecao,
  tecnico,
  dataInspecao,
  onSalvar,
  checklistInicial
}: QuadroInspecaoProps) {
  // Checklist completo baseado no tipo de equipamento e inspeção
  const [checklist, setChecklist] = useState<ItemChecklist[]>(checklistInicial || gerarChecklistPadrao(tipoInspecao, equipamentoNome));

  const progressoTotal = checklist.length;
  const progressoConcluido = checklist.filter(item => item.status !== 'pendente').length;
  const percentualProgresso = (progressoConcluido / progressoTotal) * 100;

  const handleStatusChange = (itemId: string, status: ItemChecklist['status']) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, status } : item
      )
    );
  };

  const handleObservacaoChange = (itemId: string, observacoes: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, observacoes } : item
      )
    );
  };

  const handleTesteChange = (itemId: string, testeId: string, valorObtido: string, status: TesteInspecao['status']) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === itemId
          ? {
              ...item,
              testes: item.testes?.map(teste =>
                teste.id === testeId
                  ? { ...teste, valorObtido, status }
                  : teste
              )
            }
          : item
      )
    );
  };

  const salvarInspecao = () => {
    onSalvar(checklist);
  };

  const getStatusIcon = (status: ItemChecklist['status']) => {
    switch (status) {
      case 'aprovado':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'reprovado':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'nao_aplicavel':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: ItemChecklist['status']) => {
    const variants = {
      aprovado: 'default',
      reprovado: 'destructive',
      nao_aplicavel: 'secondary',
      pendente: 'outline'
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status === 'aprovado' ? 'Aprovado' :
         status === 'reprovado' ? 'Reprovado' :
         status === 'nao_aplicavel' ? 'N/A' : 'Pendente'}
      </Badge>
    );
  };

  const categorias = [...new Set(checklist.map(item => item.categoria))];

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Inspeção */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Quadro de Inspeção</h2>
              <p className="text-sm text-muted-foreground">
                {equipamentoNome} - {clienteNome}
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {tipoInspecao === 'anual' ? 'Inspeção Anual' :
               tipoInspecao === 'extraordinaria' ? 'Inspeção Extraordinária' :
               tipoInspecao === 'inicial' ? 'Inspeção Inicial' : 'Inspeção Final'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Técnico:</span>
              <p>{tecnico}</p>
            </div>
            <div>
              <span className="font-medium">Data:</span>
              <p>{formatDate(dataInspecao)}</p>
            </div>
            <div>
              <span className="font-medium">ID Inspeção:</span>
              <p>{inspecaoId}</p>
            </div>
            <div>
              <span className="font-medium">Progresso:</span>
              <p>{progressoConcluido}/{progressoTotal} itens</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progresso da Inspeção</span>
              <span>{Math.round(percentualProgresso)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentualProgresso}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist por Categoria */}
      {categorias.map(categoria => (
        <Card key={categoria}>
          <CardHeader>
            <CardTitle className="text-lg">{categoria}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {checklist
              .filter(item => item.categoria === categoria)
              .map(item => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.item}</h4>
                      <p className="text-sm text-muted-foreground">{item.descricao}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  {/* Controles de Status */}
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={item.status === 'aprovado'}
                        onCheckedChange={() => handleStatusChange(item.id, 'aprovado')}
                      />
                      <span className="text-sm">Aprovado</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={item.status === 'reprovado'}
                        onCheckedChange={() => handleStatusChange(item.id, 'reprovado')}
                      />
                      <span className="text-sm">Reprovado</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={item.status === 'nao_aplicavel'}
                        onCheckedChange={() => handleStatusChange(item.id, 'nao_aplicavel')}
                      />
                      <span className="text-sm">N/A</span>
                    </label>
                  </div>

                  {/* Testes Técnicos */}
                  {item.testes && item.testes.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">Testes Técnicos:</h5>
                      {item.testes.map(teste => (
                        <div key={teste.id} className="bg-gray-50 p-3 rounded space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{teste.nome}</p>
                              <p className="text-xs text-muted-foreground">{teste.descricao}</p>
                              <p className="text-xs">Esperado: {teste.valorEsperado} {teste.unidade}</p>
                            </div>
                            <Badge variant={teste.status === 'passou' ? 'default' : teste.status === 'falhou' ? 'destructive' : 'outline'}>
                              {teste.status === 'passou' ? 'Passou' : teste.status === 'falhou' ? 'Falhou' : 'Pendente'}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-medium">Valor Obtido:</label>
                              <input
                                type="text"
                                className="w-full text-sm border rounded px-2 py-1"
                                value={teste.valorObtido || ''}
                                onChange={(e) => handleTesteChange(item.id, teste.id, e.target.value, teste.status)}
                                placeholder="Digite o valor"
                              />
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant={teste.status === 'passou' ? 'default' : 'outline'}
                                onClick={() => handleTesteChange(item.id, teste.id, teste.valorObtido || '', 'passou')}
                              >
                                Passou
                              </Button>
                              <Button
                                size="sm"
                                variant={teste.status === 'falhou' ? 'destructive' : 'outline'}
                                onClick={() => handleTesteChange(item.id, teste.id, teste.valorObtido || '', 'falhou')}
                              >
                                Falhou
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Observações */}
                  <div>
                    <label className="text-sm font-medium">Observações:</label>
                    <Textarea
                      value={item.observacoes || ''}
                      onChange={(e) => handleObservacaoChange(item.id, e.target.value)}
                      placeholder="Digite observações sobre este item..."
                      className="mt-1"
                    />
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Camera className="h-4 w-4 mr-1" />
                      Adicionar Foto
                    </Button>
                    <Button size="sm" variant="outline">
                      <FileText className="h-4 w-4 mr-1" />
                      Anexar Documento
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      ))}

      {/* Alertas de Segurança */}
      {checklist.some(item => item.status === 'reprovado') && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> Itens reprovados foram identificados. É necessário corrigir as não conformidades antes de liberar o equipamento.
          </AlertDescription>
        </Alert>
      )}

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={salvarInspecao} size="lg">
          Salvar Inspeção
        </Button>
      </div>
    </div>
  );
}

// Função para gerar checklist padrão baseado no tipo de inspeção e equipamento
function gerarChecklistPadrao(tipoInspecao: string, equipamentoNome: string): ItemChecklist[] {
  const isNavio = equipamentoNome.toLowerCase().includes('navio') || equipamentoNome.toLowerCase().includes('yacht') || equipamentoNome.toLowerCase().includes('cruiser');
  const isJangada = equipamentoNome.toLowerCase().includes('jangada');

  const checklistBase: ItemChecklist[] = [
    // Documentação
    {
      id: 'doc-1',
      categoria: 'Documentação',
      item: 'Certificado de Segurança',
      descricao: 'Verificar validade do certificado de segurança da embarcação',
      status: 'pendente' as const,
      testes: [
        {
          id: 'teste-doc-1',
          nome: 'Validade Certificado',
          descricao: 'Verificar se o certificado está dentro do prazo de validade',
          valorEsperado: 'Válido',
          unidade: '',
          status: 'pendente' as const
        }
      ]
    },
    {
      id: 'doc-2',
      categoria: 'Documentação',
      item: 'Licença de Navegação',
      descricao: 'Confirmar que a licença de navegação está atualizada',
      status: 'pendente' as const
    },
    {
      id: 'doc-3',
      categoria: 'Documentação',
      item: 'Seguro da Embarcação',
      descricao: 'Verificar cobertura do seguro e validade',
      status: 'pendente' as const
    }
  ];

  const checklistMotor: ItemChecklist[] = [
    // Sistema de Motor
    {
      id: 'motor-1',
      categoria: 'Sistema de Motor',
      item: 'Verificação Geral do Motor',
      descricao: 'Inspeção visual geral do motor e componentes',
      status: 'pendente' as const,
      testes: [
        {
          id: 'teste-motor-1',
          nome: 'Temperatura Óleo',
          descricao: 'Medir temperatura do óleo do motor',
          valorEsperado: '< 100',
          unidade: '°C',
          status: 'pendente' as const
        },
        {
          id: 'teste-motor-2',
          nome: 'Pressão Óleo',
          descricao: 'Verificar pressão do óleo',
          valorEsperado: '3.5 - 4.5',
          unidade: 'bar',
          status: 'pendente' as const
        },
        {
          id: 'teste-motor-3',
          nome: 'RPM Máximo',
          descricao: 'Teste de rotação máxima do motor',
          valorEsperado: '5800 - 6200',
          unidade: 'RPM',
          status: 'pendente' as const
        }
      ]
    },
    {
      id: 'motor-2',
      categoria: 'Sistema de Motor',
      item: 'Sistema de Arrefecimento',
      descricao: 'Verificar radiador, bombas e mangueiras',
      status: 'pendente' as const,
      testes: [
        {
          id: 'teste-arref-1',
          nome: 'Temperatura Água',
          descricao: 'Temperatura da água de arrefecimento',
          valorEsperado: '75 - 90',
          unidade: '°C',
          status: 'pendente' as const
        }
      ]
    },
    {
      id: 'motor-3',
      categoria: 'Sistema de Motor',
      item: 'Sistema Elétrico do Motor',
      descricao: 'Verificar bateria, alternador e fiação',
      status: 'pendente' as const,
      testes: [
        {
          id: 'teste-eletrico-1',
          nome: 'Tensão Bateria',
          descricao: 'Tensão da bateria com motor ligado',
          valorEsperado: '13.5 - 14.5',
          unidade: 'V',
          status: 'pendente' as const
        }
      ]
    }
  ];

  const checklistSeguranca: ItemChecklist[] = [
    // Equipamentos de Segurança
    {
      id: 'seg-1',
      categoria: 'Equipamentos de Segurança',
      item: 'Coletes Salva-Vidas',
      descricao: 'Verificar quantidade, estado e validade dos coletes',
      status: 'pendente' as const,
      testes: [
        {
          id: 'teste-coletes-1',
          nome: 'Quantidade Mínima',
          descricao: 'Verificar se há coletes para todos os passageiros',
          valorEsperado: isJangada ? '6' : '12+',
          unidade: 'unidades',
          status: 'pendente' as const
        }
      ]
    },
    {
      id: 'seg-2',
      categoria: 'Equipamentos de Segurança',
      item: 'Extintores',
      descricao: 'Verificar extintores de incêndio',
      status: 'pendente' as const,
      testes: [
        {
          id: 'teste-ext-1',
          nome: 'Pressão Extintor',
          descricao: 'Verificar pressão dos extintores',
          valorEsperado: 'Normal',
          unidade: '',
          status: 'pendente' as const
        }
      ]
    },
    {
      id: 'seg-3',
      categoria: 'Equipamentos de Segurança',
      item: 'Equipamentos de Sinalização',
      descricao: 'Verificar foguetes, luzes e rádio VHF',
      status: 'pendente' as const
    },
    {
      id: 'seg-4',
      categoria: 'Equipamentos de Segurança',
      item: 'Sistema de Segurança Contra Incêndio',
      descricao: 'Verificar detectores e sistema de combate a incêndio',
      status: 'pendente' as const
    }
  ];

  const checklistEstrutura: ItemChecklist[] = [
    // Estrutura e Casco
    {
      id: 'est-1',
      categoria: 'Estrutura e Casco',
      item: 'Inspeção do Casco',
      descricao: 'Verificar integridade estrutural do casco',
      status: 'pendente' as const,
      testes: [
        {
          id: 'teste-casco-1',
          nome: 'Espessura Casco',
          descricao: 'Medir espessura do casco em pontos críticos',
          valorEsperado: '> 4',
          unidade: 'mm',
          status: 'pendente' as const
        }
      ]
    },
    {
      id: 'est-2',
      categoria: 'Estrutura e Casco',
      item: 'Sistema de Lastro',
      descricao: 'Verificar tanques de lastro e válvulas',
      status: 'pendente' as const
    },
    {
      id: 'est-3',
      categoria: 'Estrutura e Casco',
      item: 'Escotilhas e Aberturas',
      descricao: 'Verificar vedação de escotilhas e aberturas',
      status: 'pendente' as const
    }
  ];

  const checklistPesca: ItemChecklist[] = isJangada ? [
    // Equipamentos de Pesca (apenas para jangadas)
    {
      id: 'pesca-1',
      categoria: 'Equipamentos de Pesca',
      item: 'Equipamento de Pesca',
      descricao: 'Verificar artes de pesca e equipamentos específicos',
      status: 'pendente' as const
    },
    {
      id: 'pesca-2',
      categoria: 'Equipamentos de Pesca',
      item: 'Sistema de Refrigeração',
      descricao: 'Verificar sistema de refrigeração para pescado',
      status: 'pendente' as const,
      testes: [
        {
          id: 'teste-refri-1',
          nome: 'Temperatura Câmara',
          descricao: 'Temperatura da câmara de refrigeração',
          valorEsperado: '0 - 4',
          unidade: '°C',
          status: 'pendente' as const
        }
      ]
    }
  ] : [];

  return [
    ...checklistBase,
    ...checklistMotor,
    ...checklistSeguranca,
    ...checklistEstrutura,
    ...checklistPesca
  ];
}