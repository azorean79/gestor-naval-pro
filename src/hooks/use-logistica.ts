import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TransporteJangada,
  Porto,
  RotaTransporte,
  DocumentacaoTransporte,
  ILHAS_ACORES
} from '@/lib/logistica-types';

export interface UseLogisticaReturn {
  transportes: TransporteJangada[];
  portos: Porto[];
  rotas: RotaTransporte[];
  loading: boolean;
  error: string | null;

  // Transportes
  criarTransporte: (transporte: Omit<TransporteJangada, 'id' | 'status'>) => Promise<TransporteJangada>;
  atualizarTransporte: (id: string, updates: Partial<TransporteJangada>) => Promise<void>;
  excluirTransporte: (id: string) => Promise<void>;
  buscarTransporte: (id: string) => Promise<TransporteJangada | null>;
  buscarTransportesPorJangada: (jangadaId: string) => Promise<TransporteJangada[]>;
  buscarTransportesPorIlha: (ilha: string) => Promise<TransporteJangada[]>;

  // Portos
  criarPorto: (porto: Omit<Porto, 'id' | 'status'>) => Promise<Porto>;
  atualizarPorto: (id: string, updates: Partial<Porto>) => Promise<void>;
  buscarPortosPorIlha: (ilha: string) => Promise<Porto[]>;

  // Rotas
  criarRota: (rota: Omit<RotaTransporte, 'id' | 'status'>) => Promise<RotaTransporte>;
  buscarRota: (origem: string, destino: string) => Promise<RotaTransporte | null>;
  calcularCustoTransporte: (origem: string, destino: string, tipoTransporte: string) => Promise<number>;
}

// Hook principal para logística
export function useLogistica(): UseLogisticaReturn {
  const queryClient = useQueryClient();

  // Query para transportes
  const { data: transportes = [], isLoading: loadingTransportes } = useQuery({
    queryKey: ['transportes'],
    queryFn: async (): Promise<TransporteJangada[]> => {
      const response = await fetch('/api/logistica/transportes');
      if (!response.ok) throw new Error('Erro ao buscar transportes');
      return response.json();
    }
  });

  // Query para portos
  const { data: portos = [], isLoading: loadingPortos } = useQuery({
    queryKey: ['portos'],
    queryFn: async (): Promise<Porto[]> => {
      const response = await fetch('/api/logistica/portos');
      if (!response.ok) throw new Error('Erro ao buscar portos');
      return response.json();
    }
  });

  // Query para rotas
  const { data: rotas = [], isLoading: loadingRotas } = useQuery({
    queryKey: ['rotas-transporte'],
    queryFn: async (): Promise<RotaTransporte[]> => {
      const response = await fetch('/api/logistica/rotas');
      if (!response.ok) throw new Error('Erro ao buscar rotas');
      return response.json();
    }
  });

  const loading = loadingTransportes || loadingPortos || loadingRotas;

  // Mutations para transportes
  const criarTransporteMutation = useMutation({
    mutationFn: async (novoTransporte: Omit<TransporteJangada, 'id' | 'status'>): Promise<TransporteJangada> => {
      const response = await fetch('/api/logistica/transportes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoTransporte)
      });
      if (!response.ok) throw new Error('Erro ao criar transporte');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportes'] });
    }
  });

  const atualizarTransporteMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TransporteJangada> }): Promise<void> => {
      const response = await fetch(`/api/logistica/transportes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Erro ao atualizar transporte');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportes'] });
    }
  });

  const excluirTransporteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/logistica/transportes/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao excluir transporte');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportes'] });
    }
  });

  // Mutations para portos
  const criarPortoMutation = useMutation({
    mutationFn: async (novoPorto: Omit<Porto, 'id' | 'status'>): Promise<Porto> => {
      const response = await fetch('/api/logistica/portos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoPorto)
      });
      if (!response.ok) throw new Error('Erro ao criar porto');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portos'] });
    }
  });

  const atualizarPortoMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Porto> }): Promise<void> => {
      const response = await fetch(`/api/logistica/portos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Erro ao atualizar porto');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portos'] });
    }
  });

  // Mutations para rotas
  const criarRotaMutation = useMutation({
    mutationFn: async (novaRota: Omit<RotaTransporte, 'id' | 'status'>): Promise<RotaTransporte> => {
      const response = await fetch('/api/logistica/rotas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaRota)
      });
      if (!response.ok) throw new Error('Erro ao criar rota');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotas-transporte'] });
    }
  });

  // Funções auxiliares
  const criarTransporte = async (transporte: Omit<TransporteJangada, 'id' | 'status'>): Promise<TransporteJangada> => {
    return criarTransporteMutation.mutateAsync(transporte);
  };

  const atualizarTransporte = async (id: string, updates: Partial<TransporteJangada>): Promise<void> => {
    await atualizarTransporteMutation.mutateAsync({ id, updates });
  };

  const excluirTransporte = async (id: string): Promise<void> => {
    await excluirTransporteMutation.mutateAsync(id);
  };

  const buscarTransporte = async (id: string): Promise<TransporteJangada | null> => {
    try {
      const response = await fetch(`/api/logistica/transportes/${id}`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Erro ao buscar transporte:', error);
      return null;
    }
  };

  const buscarTransportesPorJangada = async (jangadaId: string): Promise<TransporteJangada[]> => {
    try {
      const response = await fetch(`/api/logistica/transportes?jangadaId=${jangadaId}`);
      if (!response.ok) throw new Error('Erro ao buscar transportes da jangada');
      return response.json();
    } catch (error) {
      console.error('Erro ao buscar transportes da jangada:', error);
      return [];
    }
  };

  const buscarTransportesPorIlha = async (ilha: string): Promise<TransporteJangada[]> => {
    try {
      const response = await fetch(`/api/logistica/transportes?origemIlha=${ilha}&destinoIlha=${ilha}`);
      if (!response.ok) throw new Error('Erro ao buscar transportes da ilha');
      return response.json();
    } catch (error) {
      console.error('Erro ao buscar transportes da ilha:', error);
      return [];
    }
  };

  const criarPorto = async (porto: Omit<Porto, 'id' | 'status'>): Promise<Porto> => {
    return criarPortoMutation.mutateAsync(porto);
  };

  const atualizarPorto = async (id: string, updates: Partial<Porto>): Promise<void> => {
    await atualizarPortoMutation.mutateAsync({ id, updates });
  };

  const buscarPortosPorIlha = async (ilha: string): Promise<Porto[]> => {
    try {
      const response = await fetch(`/api/logistica/portos?ilha=${ilha}`);
      if (!response.ok) throw new Error('Erro ao buscar portos da ilha');
      return response.json();
    } catch (error) {
      console.error('Erro ao buscar portos da ilha:', error);
      return [];
    }
  };

  const criarRota = async (rota: Omit<RotaTransporte, 'id' | 'status'>): Promise<RotaTransporte> => {
    return criarRotaMutation.mutateAsync(rota);
  };

  const buscarRota = async (origem: string, destino: string): Promise<RotaTransporte | null> => {
    try {
      const rota = rotas.find(r => r.origemIlha === origem && r.destinoIlha === destino);
      return rota || null;
    } catch (error) {
      console.error('Erro ao buscar rota:', error);
      return null;
    }
  };

  const calcularCustoTransporte = async (origem: string, destino: string, tipoTransporte: string): Promise<number> => {
    try {
      const rota = await buscarRota(origem, destino);
      if (!rota) return 0;

      // Cálculo baseado no tipo de transporte
      const multiplicadores = {
        'barco_transporte': 1.5,
        'ferry': 1.2,
        'reboque': 2.0,
        'proprio': 1.0
      };

      const multiplicador = multiplicadores[tipoTransporte as keyof typeof multiplicadores] || 1.0;
      return rota.custoBase * multiplicador;
    } catch (error) {
      console.error('Erro ao calcular custo:', error);
      return 0;
    }
  };

  return {
    transportes,
    portos,
    rotas,
    loading,
    error: null,

    criarTransporte,
    atualizarTransporte,
    excluirTransporte,
    buscarTransporte,
    buscarTransportesPorJangada,
    buscarTransportesPorIlha,

    criarPorto,
    atualizarPorto,
    buscarPortosPorIlha,

    criarRota,
    buscarRota,
    calcularCustoTransporte
  };
}