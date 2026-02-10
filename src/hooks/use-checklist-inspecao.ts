"use client";

import { useState, useEffect } from "react";

interface ChecklistItem {
  id: string;
  categoria: string;
  item: string;
  descricao: string;
  obrigatorio: boolean;
  status: 'pendente' | 'aprovado' | 'reprovado' | 'nao_aplicavel';
  observacoes: string;
  fonte: 'quadro' | 'manual' | 'componentes' | 'stock' | 'testes' | 'boletins';
  componenteId?: string;
}

interface ComponenteQuadro {
  nome: string;
  validade: string | null;
  tipo?: string;
  quantidade?: number;
}

interface ComponenteStock {
  id: string;
  nome: string;
  tipo: string;
  quantidade: number;
  validade?: string;
  numeroSerie?: string;
  estado: 'novo' | 'usado' | 'danificado';
  dataInstalacao?: string;
}

interface TesteFuncional {
  tipo: string;
  nome: string;
  descricao: string;
  frequencia: string;
  obrigatorio: boolean;
  aplicavelPara: string[];
}

interface BoletimServico {
  numero: string;
  titulo: string;
  versao: string;
  aplicavelPara: string[];
  tarefas: string[];
  dataEmbodiment: string;
  obrigatorio: boolean;
}

interface EspecificacaoManual {
  sistemaInsuflacao?: {
    sistemas: string[];
    pressaoTrabalho: {
      psi: number;
      bar: number;
    };
  };
  material?: {
    tecido: string;
    adesivoFabrico: string;
  };
  manutencao?: {
    periodoMeses: number;
    conformidade: string;
  };
  capacidades?: {
    throwOver: number[];
    davitLaunch: number[];
  };
}

export function useChecklistInspecao(jangadaId?: string) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jangadaId) {
      gerarChecklist(jangadaId);
    }
  }, [jangadaId]);

  const gerarChecklist = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      // Buscar dados da jangada
      const jangadaResponse = await fetch(`/api/jangadas/${id}`);
      if (!jangadaResponse.ok) throw new Error('Erro ao carregar jangada');

      const jangada = await jangadaResponse.json();

      // Buscar componentes do quadro de inspeção
      const componentesQuadro = await buscarComponentesQuadro(jangada.numeroSerie);

      // Buscar especificações do manual
      const especificacoesManual = await buscarEspecificacoesManual(jangada.marca, jangada.modelo);

      // Buscar componentes do stock da jangada
      const componentesStock = await buscarComponentesStock(id);

      // Buscar testes funcionais aplicáveis
      const testesFuncionais = await buscarTestesFuncionais(jangada.marca, jangada.modelo, jangada.tipoLancamento);

      // Buscar boletins de serviço aplicáveis
      const boletinsServico = await buscarBoletinsServico(jangada.marca, jangada.modelo);

      // Gerar checklist combinada
      const checklistGerada = await gerarChecklistCombinada(
        jangada,
        componentesQuadro,
        especificacoesManual,
        componentesStock,
        testesFuncionais,
        boletinsServico
      );

      setChecklist(checklistGerada);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const buscarComponentesQuadro = async (numeroSerie: string): Promise<ComponenteQuadro[]> => {
    try {
      // Buscar no arquivo quadro-detalhado-extract.json
      const response = await fetch('/quadro-detalhado-extract.json');
      if (!response.ok) return [];

      const quadros = await response.json();
      const quadroJangada = quadros.find((q: any) =>
        q.arquivo.includes(numeroSerie) || q.numeroSerie === numeroSerie
      );

      return quadroJangada?.componentes || [];
    } catch {
      return [];
    }
  };

  const buscarComponentesStock = async (jangadaId: string): Promise<ComponenteStock[]> => {
    try {
      const response = await fetch(`/api/jangadas/${jangadaId}/componentes`);
      if (!response.ok) return [];

      const data = await response.json();
      return data.componentes || [];
    } catch {
      return [];
    }
  };

  const buscarTestesFuncionais = async (marca: string, modelo: string, tipoLancamento: string): Promise<TesteFuncional[]> => {
    try {
      // Testes funcionais baseados nas especificações técnicas encontradas
      const testesBase: TesteFuncional[] = [
        {
          tipo: 'pressao',
          nome: 'Teste de Pressão de Trabalho',
          descricao: 'Verificar pressão de trabalho do sistema de insuflação conforme especificações do fabricante',
          frequencia: 'A cada serviço',
          obrigatorio: true,
          aplicavelPara: ['todas']
        },
        {
          tipo: 'vazamento',
          nome: 'Teste de Vazamento',
          descricao: 'Realizar teste de vazamento após pressurização para verificar integridade das câmaras',
          frequencia: 'A cada serviço',
          obrigatorio: true,
          aplicavelPara: ['todas']
        },
        {
          tipo: 'carga',
          nome: 'Teste de Carga (Davit Launch)',
          descricao: 'Aplicar carga de 1,1xG por 2 anos para jangadas davit-launch conforme especificações',
          frequencia: 'A cada 2 anos',
          obrigatorio: tipoLancamento === 'davit-launch',
          aplicavelPara: ['davit-launch']
        },
        {
          tipo: 'inflacao',
          nome: 'Teste de Inflação',
          descricao: 'Verificar tempo e pressão de inflação completa da jangada',
          frequencia: 'A cada serviço',
          obrigatorio: true,
          aplicavelPara: ['todas']
        },
        {
          tipo: 'funcional',
          nome: 'Teste Funcional Geral',
          descricao: 'Verificar funcionamento de válvulas, acessórios e equipamentos de segurança',
          frequencia: 'A cada serviço',
          obrigatorio: true,
          aplicavelPara: ['todas']
        },
        {
          tipo: 'valvulas',
          nome: 'Teste das Válvulas de Alívio de Pressão',
          descricao: 'Verificar funcionamento das válvulas de alívio de pressão',
          frequencia: 'A cada serviço',
          obrigatorio: true,
          aplicavelPara: ['todas']
        }
      ];

      // Filtrar testes aplicáveis baseado no tipo de lançamento
      return testesBase.filter(teste =>
        teste.aplicavelPara.includes('todas') ||
        teste.aplicavelPara.includes(tipoLancamento)
      );
    } catch {
      return [];
    }
  };

  const buscarEspecificacoesManual = async (marca: string, modelo: string): Promise<EspecificacaoManual | null> => {
    try {
      // Importar especificações do arquivo jangada-options
      const { ESPECIFICACOES_POR_MARCA_MODELO } = await import('@/lib/jangada-options');
      
      const key = Object.keys(ESPECIFICACOES_POR_MARCA_MODELO)
        .find(k => ESPECIFICACOES_POR_MARCA_MODELO[k].marca === marca &&
                   ESPECIFICACOES_POR_MARCA_MODELO[k].modelo === modelo);
      
      if (!key) return null;
      
      const specs = ESPECIFICACOES_POR_MARCA_MODELO[key];
      
      // Converter para o formato esperado
      return {
        sistemaInsuflacao: {
          sistemas: [specs.sistemaInsuflacao],
          pressaoTrabalho: { psi: 300, bar: 20.7 } // Valores padrão baseados em especificações típicas
        },
        material: {
          tecido: 'PVC/Nylon reforçado', // Valor padrão
          adesivoFabrico: 'Adesivo industrial' // Valor padrão
        },
        manutencao: {
          periodoMeses: 12,
          conformidade: 'SOLAS 74/96'
        },
        capacidades: {
          throwOver: specs.capacidades.map(c => c.pessoas),
          davitLaunch: specs.capacidades.map(c => c.pessoas)
        }
      };
    } catch {
      return null;
    }
  };

  const buscarBoletinsServico = async (marca: string, modelo: string): Promise<BoletimServico[]> => {
    try {
      // Boletins de serviço baseados nos dados encontrados
      const boletinsBase: BoletimServico[] = [
        {
          numero: '12/24',
          titulo: 'Consolidação de números de peças',
          versao: '1',
          aplicavelPara: ['Survitec', 'RFD', 'DSB', 'Eurovinil'],
          tarefas: [
            'Substituir anti-séssicos pelos novos números de peça',
            'Substituir kits de primeiros socorros pelos novos números',
            'Substituir luzes e baterias pelos novos números'
          ],
          dataEmbodiment: 'A cada serviço',
          obrigatorio: true
        },
        {
          numero: '23/24',
          titulo: 'Introdução de mudanças no casco Mk IV',
          versao: '1',
          aplicavelPara: ['Survitec Mk IV'],
          tarefas: [
            'Verificar costura soldada do casco',
            'Verificar fixação atualizada dos bolsos de água',
            'Verificar materiais atualizados de tecido e fitas',
            'Verificar ponto de fixação atualizado da linha de ativação da luz'
          ],
          dataEmbodiment: 'Imediato para novas jangadas',
          obrigatorio: modelo.includes('Mk IV')
        },
        {
          numero: '43/21',
          titulo: 'Otimização de serviço (gasket seal, pyrotechnics valises, canopy zips)',
          versao: '3',
          aplicavelPara: ['Survitec Mk IV'],
          tarefas: [
            'Substituir gasket seal',
            'Usar novas pyrotechnics valises',
            'Usar nova bellows valise',
            'Substituir zip pullers de metal por resina'
          ],
          dataEmbodiment: 'A cada serviço',
          obrigatorio: modelo.includes('Mk IV')
        },
        {
          numero: '46/21',
          titulo: 'Introdução de folhas de etiquetas múltiplas',
          versao: '2',
          aplicavelPara: ['Survitec', 'DSB', 'RFD'],
          tarefas: [
            'Remover etiquetas antigas do container',
            'Aplicar novas folhas de etiquetas múltiplas',
            'Verificar posicionamento correto das etiquetas'
          ],
          dataEmbodiment: 'A cada serviço',
          obrigatorio: true
        }
      ];

      // Filtrar boletins aplicáveis baseado na marca e modelo
      return boletinsBase.filter(boletim =>
        boletim.aplicavelPara.some(marcaAplicavel =>
          marca.toLowerCase().includes(marcaAplicavel.toLowerCase()) ||
          modelo.toLowerCase().includes(marcaAplicavel.toLowerCase())
        ) || boletim.aplicavelPara.includes(marca)
      );
    } catch {
      return [];
    }
  };

  const gerarChecklistCombinada = async (
    jangada: any,
    componentesQuadro: ComponenteQuadro[],
    especificacoesManual: EspecificacaoManual | null,
    componentesStock: ComponenteStock[],
    testesFuncionais: TesteFuncional[],
    boletinsServico: BoletimServico[]
  ): Promise<ChecklistItem[]> => {
    const checklist: ChecklistItem[] = [];

    let itemId = 1;

    // 1. ITENS BASEADOS NO QUADRO DE INSPEÇÃO
    if (componentesQuadro.length > 0) {
      checklist.push({
        id: itemId.toString(),
        categoria: 'Componentes do Quadro',
        item: 'Verificação geral dos componentes',
        descricao: `Verificar todos os ${componentesQuadro.length} componentes listados no quadro de inspeção`,
        obrigatorio: true,
        status: 'pendente',
        observacoes: '',
        fonte: 'quadro'
      });
      itemId++;

      // Itens específicos para cada componente
      componentesQuadro.forEach((componente, index) => {
        checklist.push({
          id: itemId.toString(),
          categoria: 'Componentes do Quadro',
          item: componente.nome,
          descricao: `Verificar estado, validade${componente.validade ? ` (válido até ${componente.validade})` : ''} e funcionamento do ${componente.nome.toLowerCase()}`,
          obrigatorio: true,
          status: 'pendente',
          observacoes: '',
          fonte: 'quadro',
          componenteId: componente.nome
        });
        itemId++;
      });
    }

    // 1.5. ITENS BASEADOS NOS COMPONENTES DO STOCK
    if (componentesStock.length > 0) {
      checklist.push({
        id: itemId.toString(),
        categoria: 'Componentes do Stock',
        item: 'Verificação geral dos componentes instalados',
        descricao: `Verificar todos os ${componentesStock.length} componentes atualmente instalados na jangada`,
        obrigatorio: true,
        status: 'pendente',
        observacoes: '',
        fonte: 'stock'
      });
      itemId++;

      // Itens específicos para cada componente do stock
      componentesStock.forEach((componente) => {
        const validadeInfo = componente.validade ? ` (válido até ${componente.validade})` : '';
        const instalacaoInfo = componente.dataInstalacao ? ` - Instalado em ${new Date(componente.dataInstalacao).toLocaleDateString('pt-PT')}` : '';
        const serieInfo = componente.numeroSerie ? ` - Nº Série: ${componente.numeroSerie}` : '';

        checklist.push({
          id: itemId.toString(),
          categoria: 'Componentes do Stock',
          item: `${componente.nome} (${componente.estado})`,
          descricao: `Verificar estado, funcionamento e integridade do ${componente.nome.toLowerCase()} (Tipo: ${componente.tipo}, Qtd: ${componente.quantidade})${validadeInfo}${instalacaoInfo}${serieInfo}`,
          obrigatorio: componente.estado !== 'danificado', // Componentes danificados podem ser opcionais
          status: 'pendente',
          observacoes: '',
          fonte: 'stock',
          componenteId: componente.id
        });
        itemId++;
      });
    }

    // 2. ITENS DE TESTES FUNCIONAIS
    if (testesFuncionais.length > 0) {
      checklist.push({
        id: itemId.toString(),
        categoria: 'Testes Funcionais',
        item: 'Verificação geral dos testes funcionais',
        descricao: `Realizar todos os ${testesFuncionais.length} testes funcionais obrigatórios`,
        obrigatorio: true,
        status: 'pendente',
        observacoes: '',
        fonte: 'testes'
      });
      itemId++;

      // Itens específicos para cada teste funcional
      testesFuncionais.forEach((teste) => {
        checklist.push({
          id: itemId.toString(),
          categoria: 'Testes Funcionais',
          item: teste.nome,
          descricao: `${teste.descricao}. Frequência: ${teste.frequencia}`,
          obrigatorio: teste.obrigatorio,
          status: 'pendente',
          observacoes: '',
          fonte: 'testes'
        });
        itemId++;
      });
    }

    // 3. ITENS DE BOLETINS DE SERVIÇO
    if (boletinsServico.length > 0) {
      checklist.push({
        id: itemId.toString(),
        categoria: 'Boletins de Serviço',
        item: 'Verificação geral dos boletins aplicáveis',
        descricao: `Aplicar todos os ${boletinsServico.length} boletins de serviço obrigatórios`,
        obrigatorio: true,
        status: 'pendente',
        observacoes: '',
        fonte: 'boletins'
      });
      itemId++;

      // Itens específicos para cada boletim de serviço
      boletinsServico.forEach((boletim) => {
        const tarefasTexto = boletim.tarefas.join('; ');
        checklist.push({
          id: itemId.toString(),
          categoria: 'Boletins de Serviço',
          item: `SB ${boletim.numero} - ${boletim.titulo}`,
          descricao: `Aplicar Boletim de Serviço ${boletim.numero} v.${boletim.versao}: ${tarefasTexto}. ${boletim.dataEmbodiment}`,
          obrigatorio: boletim.obrigatorio,
          status: 'pendente',
          observacoes: '',
          fonte: 'boletins'
        });
        itemId++;
      });
    }

    // 4. ITENS BASEADOS NO MANUAL DA MARCA/MODELO
    if (especificacoesManual) {
      // Sistema de insuflação
      if (especificacoesManual.sistemaInsuflacao) {
        checklist.push({
          id: itemId.toString(),
          categoria: 'Sistema de Insuflação',
          item: 'Verificação do sistema de insuflação',
          descricao: `Verificar sistema(s): ${especificacoesManual.sistemaInsuflacao.sistemas.join(', ')}. Pressão de trabalho: ${especificacoesManual.sistemaInsuflacao.pressaoTrabalho.psi} PSI`,
          obrigatorio: true,
          status: 'pendente',
          observacoes: '',
          fonte: 'manual'
        });
        itemId++;
      }

      // Material e estrutura
      if (especificacoesManual.material) {
        checklist.push({
          id: itemId.toString(),
          categoria: 'Estrutura e Material',
          item: 'Verificação do material da jangada',
          descricao: `Verificar tecido (${especificacoesManual.material.tecido}) e adesivos (${especificacoesManual.material.adesivoFabrico})`,
          obrigatorio: true,
          status: 'pendente',
          observacoes: '',
          fonte: 'manual'
        });
        itemId++;
      }

      // Manutenção periódica
      if (especificacoesManual.manutencao) {
        checklist.push({
          id: itemId.toString(),
          categoria: 'Manutenção',
          item: 'Verificação do período de manutenção',
          descricao: `Verificar se a manutenção foi realizada nos últimos ${especificacoesManual.manutencao.periodoMeses} meses. Conformidade: ${especificacoesManual.manutencao.conformidade}`,
          obrigatorio: true,
          status: 'pendente',
          observacoes: '',
          fonte: 'manual'
        });
        itemId++;
      }

      // Capacidades específicas
      if (especificacoesManual.capacidades) {
        checklist.push({
          id: itemId.toString(),
          categoria: 'Capacidades',
          item: 'Verificação das capacidades',
          descricao: `Verificar capacidades: Throw-over ${especificacoesManual.capacidades.throwOver.join(', ')} pessoas, Davit-launch ${especificacoesManual.capacidades.davitLaunch.join(', ')} pessoas`,
          obrigatorio: true,
          status: 'pendente',
          observacoes: '',
          fonte: 'manual'
        });
        itemId++;
      }
    }

    // 3. ITENS GERAIS DE INSPEÇÃO (sempre incluídos)
    const itensGerais = [
      {
        categoria: 'Estrutura Externa',
        item: 'Estado geral do casco',
        descricao: 'Verificar rachaduras, deformações ou corrosão',
        obrigatorio: true
      },
      {
        categoria: 'Estrutura Externa',
        item: 'Sistema de flutuação',
        descricao: 'Verificar câmaras de ar e vedações',
        obrigatorio: true
      },
      {
        categoria: 'Estrutura Externa',
        item: 'Pintura e revestimento',
        descricao: 'Verificar estado da pintura protetora',
        obrigatorio: true
      },
      {
        categoria: 'Estrutura Externa',
        item: 'Acessórios externos',
        descricao: 'Verificar ganchos, argolas e fixações',
        obrigatorio: true
      },
      {
        categoria: 'Equipamentos de Segurança',
        item: 'Coletes salva-vidas',
        descricao: 'Verificar quantidade, estado e validade',
        obrigatorio: true
      },
      {
        categoria: 'Equipamentos de Segurança',
        item: 'Rações de emergência',
        descricao: 'Verificar validade e quantidade',
        obrigatorio: true
      },
      {
        categoria: 'Equipamentos de Segurança',
        item: 'Kit primeiros socorros',
        descricao: 'Verificar conteúdo e validade',
        obrigatorio: true
      },
      {
        categoria: 'Equipamentos de Segurança',
        item: 'Aparelho EPIRB',
        descricao: 'Verificar funcionamento e bateria',
        obrigatorio: true
      },
      {
        categoria: 'Sistemas Elétricos',
        item: 'Bateria e carregador',
        descricao: 'Verificar tensão e capacidade',
        obrigatorio: true
      },
      {
        categoria: 'Sistemas Elétricos',
        item: 'Sistema de iluminação',
        descricao: 'Verificar funcionamento de todas as luzes',
        obrigatorio: true
      },
      {
        categoria: 'Sistemas Elétricos',
        item: 'Radio VHF',
        descricao: 'Verificar funcionamento e frequência',
        obrigatorio: true
      },
      {
        categoria: 'Documentação',
        item: 'Certificado de inspeção',
        descricao: 'Verificar validade do último certificado',
        obrigatorio: true
      },
      {
        categoria: 'Documentação',
        item: 'Manual de instruções',
        descricao: 'Verificar presença e estado',
        obrigatorio: true
      },
      {
        categoria: 'Documentação',
        item: 'Registro de manutenção',
        descricao: 'Verificar histórico de reparos',
        obrigatorio: false
      }
    ];

    itensGerais.forEach(itemGeral => {
      checklist.push({
        id: itemId.toString(),
        categoria: itemGeral.categoria,
        item: itemGeral.item,
        descricao: itemGeral.descricao,
        obrigatorio: itemGeral.obrigatorio,
        status: 'pendente',
        observacoes: '',
        fonte: 'componentes'
      });
      itemId++;
    });

    return checklist;
  };

  const updateChecklistItem = (id: string, field: keyof ChecklistItem, value: any) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const getProgress = () => {
    const total = checklist.length;
    const completed = checklist.filter(item => item.status !== 'pendente').length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getResultadoGeral = () => {
    const reprovados = checklist.filter(item => item.status === 'reprovado' && item.obrigatorio).length;
    const pendentes = checklist.filter(item => item.status === 'pendente' && item.obrigatorio).length;

    if (pendentes > 0) return 'pendente';
    if (reprovados > 0) return 'reprovado';
    return 'aprovado';
  };

  const getEstatisticasPorFonte = () => {
    const porFonte = {
      quadro: { total: 0, aprovados: 0, reprovados: 0, pendentes: 0 },
      manual: { total: 0, aprovados: 0, reprovados: 0, pendentes: 0 },
      componentes: { total: 0, aprovados: 0, reprovados: 0, pendentes: 0 },
      stock: { total: 0, aprovados: 0, reprovados: 0, pendentes: 0 },
      testes: { total: 0, aprovados: 0, reprovados: 0, pendentes: 0 },
      boletins: { total: 0, aprovados: 0, reprovados: 0, pendentes: 0 }
    };

    checklist.forEach(item => {
      porFonte[item.fonte].total++;
      switch (item.status) {
        case 'aprovado':
          porFonte[item.fonte].aprovados++;
          break;
        case 'reprovado':
          porFonte[item.fonte].reprovados++;
          break;
        case 'pendente':
          porFonte[item.fonte].pendentes++;
          break;
      }
    });

    return porFonte;
  };

  return {
    checklist,
    loading,
    error,
    updateChecklistItem,
    getProgress,
    getResultadoGeral,
    getEstatisticasPorFonte,
    regenerarChecklist: () => jangadaId && gerarChecklist(jangadaId)
  };
}