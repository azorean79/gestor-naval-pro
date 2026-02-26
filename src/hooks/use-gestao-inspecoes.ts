import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Inspecao {
  id: string;
  equipamentoId: string;
  equipamentoNome: string;
  clienteId: string;
  clienteNome: string;
  tipoInspecao: 'anual' | 'extraordinaria' | 'inicial' | 'final';
  tecnico: string;
  dataInspecao: string;
  status: 'em_andamento' | 'concluida' | 'aprovada' | 'reprovada';
  checklist: ItemChecklist[];
  observacoesGerais?: string;
  dataConclusao?: string;
  equipamento?: any;
  cliente?: any;
}

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

export interface UseInspecoesReturn {
  inspecoes: Inspecao[];
  loading: boolean;
  error: string | null;
  criarInspecao: (inspecao: Omit<Inspecao, 'id' | 'status'>) => Promise<Inspecao>;
  atualizarInspecao: (id: string, updates: Partial<Inspecao>) => Promise<void>;
  excluirInspecao: (id: string) => Promise<void>;
  buscarInspecao: (id: string) => Promise<Inspecao | null>;
  buscarInspecoesPorEquipamento: (equipamentoId: string) => Promise<Inspecao[]>;
  buscarInspecoesPorCliente: (clienteId: string) => Promise<Inspecao[]>;
  finalizarInspecao: (id: string, checklist: ItemChecklist[]) => Promise<void>;
}

// Hook principal para inspeções
export function useInspecoes(): UseInspecoesReturn {
  const queryClient = useQueryClient();

  // Query para buscar todas as inspeções
  const { data: inspecoes = [], isLoading: loading, error } = useQuery({
    queryKey: ['inspecoes'],
    queryFn: async (): Promise<Inspecao[]> => {
      const response = await fetch('/api/inspecoes');
      if (!response.ok) throw new Error('Erro ao buscar inspeções');
      return response.json();
    }
  });

  // Mutation para criar inspeção
  const criarInspecaoMutation = useMutation({
    mutationFn: async (novaInspecao: Omit<Inspecao, 'id' | 'status'>): Promise<Inspecao> => {
      const response = await fetch('/api/inspecoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaInspecao)
      });
      if (!response.ok) throw new Error('Erro ao criar inspeção');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspecoes'] });
    }
  });

  // Mutation para atualizar inspeção
  const atualizarInspecaoMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Inspecao> }): Promise<Inspecao> => {
      const response = await fetch('/api/inspecoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
      if (!response.ok) throw new Error('Erro ao atualizar inspeção');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspecoes'] });
    }
  });

  // Mutation para excluir inspeção
  const excluirInspecaoMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/inspecoes/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao excluir inspeção');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspecoes'] });
    }
  });

  const criarInspecao = async (inspecao: Omit<Inspecao, 'id' | 'status'>): Promise<Inspecao> => {
    return criarInspecaoMutation.mutateAsync(inspecao);
  };

  const atualizarInspecao = async (id: string, updates: Partial<Inspecao>): Promise<void> => {
    await atualizarInspecaoMutation.mutateAsync({ id, updates });
  };

  const excluirInspecao = async (id: string): Promise<void> => {
    await excluirInspecaoMutation.mutateAsync(id);
  };

  const buscarInspecao = async (id: string): Promise<Inspecao | null> => {
    try {
      const response = await fetch(`/api/inspecoes/${id}`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Erro ao buscar inspeção:', error);
      return null;
    }
  };

  const buscarInspecoesPorEquipamento = async (equipamentoId: string): Promise<Inspecao[]> => {
    try {
      const response = await fetch(`/api/inspecoes?equipamentoId=${equipamentoId}`);
      if (!response.ok) throw new Error('Erro ao buscar inspeções do equipamento');
      return response.json();
    } catch (error) {
      console.error('Erro ao buscar inspeções do equipamento:', error);
      return [];
    }
  };

  const buscarInspecoesPorCliente = async (clienteId: string): Promise<Inspecao[]> => {
    try {
      const response = await fetch(`/api/inspecoes?clienteId=${clienteId}`);
      if (!response.ok) throw new Error('Erro ao buscar inspeções do cliente');
      return response.json();
    } catch (error) {
      console.error('Erro ao buscar inspeções do cliente:', error);
      return [];
    }
  };

  const finalizarInspecao = async (id: string, checklist: ItemChecklist[]): Promise<void> => {
    // Determinar status baseado no checklist
    const temReprovados = checklist.some(item => item.status === 'reprovado');
    const todosAprovados = checklist.every(item =>
      item.status === 'aprovado' || item.status === 'nao_aplicavel'
    );

    let statusFinal: Inspecao['status'];
    if (temReprovados) {
      statusFinal = 'reprovada';
    } else if (todosAprovados) {
      statusFinal = 'aprovada';
    } else {
      statusFinal = 'concluida';
    }

    await atualizarInspecao(id, {
      checklist,
      status: statusFinal,
      dataConclusao: new Date().toISOString()
    });
  };

  return {
    inspecoes,
    loading,
    error: error?.message || null,
    criarInspecao,
    atualizarInspecao,
    excluirInspecao,
    buscarInspecao,
    buscarInspecoesPorEquipamento,
    buscarInspecoesPorCliente,
    finalizarInspecao
  };
}

// Hook específico para estatísticas de inspeções
export function useEstatisticasInspecoes() {
  const { inspecoes } = useInspecoes();

  const estatisticas = {
    total: inspecoes.length,
    emAndamento: inspecoes.filter(i => i.status === 'em_andamento').length,
    concluidas: inspecoes.filter(i => i.status === 'concluida').length,
    aprovadas: inspecoes.filter(i => i.status === 'aprovada').length,
    reprovadas: inspecoes.filter(i => i.status === 'reprovada').length,
    taxaAprovacao: inspecoes.length > 0
      ? (inspecoes.filter(i => i.status === 'aprovada').length / inspecoes.length) * 100
      : 0,
    porTipo: {
      anual: inspecoes.filter(i => i.tipoInspecao === 'anual').length,
      extraordinaria: inspecoes.filter(i => i.tipoInspecao === 'extraordinaria').length,
      inicial: inspecoes.filter(i => i.tipoInspecao === 'inicial').length,
      final: inspecoes.filter(i => i.tipoInspecao === 'final').length
    },
    proximasInspecoes: inspecoes
      .filter(i => i.status === 'em_andamento')
      .sort((a, b) => new Date(a.dataInspecao).getTime() - new Date(b.dataInspecao).getTime())
      .slice(0, 5)
  };

  return estatisticas;
}

// Hook para validação de checklist
export function useValidacaoChecklist() {
  const validarChecklist = (checklist: ItemChecklist[]): {
    valido: boolean;
    erros: string[];
    avisos: string[];
  } => {
    const erros: string[] = [];
    const avisos: string[] = [];

    // Verificar se todos os itens foram avaliados
    const itensPendentes = checklist.filter(item => item.status === 'pendente');
    if (itensPendentes.length > 0) {
      erros.push(`${itensPendentes.length} itens ainda estão pendentes de avaliação`);
    }

    // Verificar testes técnicos
    checklist.forEach(item => {
      if (item.testes) {
        item.testes.forEach(teste => {
          if (teste.status === 'pendente') {
            avisos.push(`Teste "${teste.nome}" do item "${item.item}" não foi executado`);
          }
        });
      }
    });

    // Verificar itens reprovados sem observações
    const reprovadosSemObs = checklist.filter(
      item => item.status === 'reprovado' && (!item.observacoes || item.observacoes.trim() === '')
    );
    if (reprovadosSemObs.length > 0) {
      erros.push(`${reprovadosSemObs.length} itens reprovados não possuem observações`);
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos
    };
  };

  return { validarChecklist };
}