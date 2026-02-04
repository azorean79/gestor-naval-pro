import { useQuery } from '@tanstack/react-query';
import { DashboardStats } from '@/lib/types';

// Mock data for dashboard statistics
const dadosCruzadosOffline: DashboardStats = {
  jangadas: {
    total: 3,
    ativas: 2,
    manutencao: 1,
    expirando: 1,
  },
  navios: {
    total: 3,
    ativas: 2,
    manutencao: 1,
    expirando: 0,
  },
  clientes: {
    total: 3,
    ativos: 3,
    novosMes: 2,
  },
  stock: {
    valorTotal: 150000,
    itensBaixo: 2,
    itensEsgotados: 1,
  },
  cilindros: {
    total: 5,
    expirando: 1,
    defeituosos: 0,
  },
  agenda: {
    hoje: 2,
    semana: 8,
    mes: 15,
  },
};

export function useDadosCruzados() {
  return useQuery({
    queryKey: ['dados-cruzados'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/dashboard/resumo')
        if (!response.ok) throw new Error('Erro ao carregar resumo')
        const data = await response.json()
        return data.dashboardStats as DashboardStats
      } catch (error) {
        // Fallback offline
        return dadosCruzadosOffline
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}