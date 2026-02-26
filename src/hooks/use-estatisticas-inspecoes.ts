import { useQuery } from '@tanstack/react-query';

export interface EstatisticasInspecoes {
  totalInspecoes: number;
  inspecoesEmAndamento: number;
  inspecoesConcluidas: number;
  inspecoesAprovadas: number;
  inspecoesReprovadas: number;
  taxaAprovacao: number;
  inspecoesPorTipo: {
    anual: number;
    extraordinaria: number;
    inicial: number;
    final: number;
  };
  inspecoesPorMes: Array<{
    mes: string;
    total: number;
    aprovadas: number;
    reprovadas: number;
  }>;
  proximasInspecoes: Array<{
    id: string;
    equipamentoNome: string;
    clienteNome: string;
    dataInspecao: string;
    tipoInspecao: string;
    diasRestantes: number;
  }>;
  alertas: Array<{
    tipo: 'atraso' | 'proxima' | 'reprovada';
    mensagem: string;
    inspecaoId?: string;
  }>;
}

export function useEstatisticasInspecoes(): {
  estatisticas: EstatisticasInspecoes | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const { data: estatisticas, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['estatisticas-inspecoes'],
    queryFn: async (): Promise<EstatisticasInspecoes> => {
      const response = await fetch('/api/inspecoes/estatisticas');
      if (!response.ok) throw new Error('Erro ao buscar estatísticas das inspeções');
      return response.json();
    }
  });

  return {
    estatisticas: estatisticas || null,
    loading,
    error: error?.message || null,
    refetch
  };
}