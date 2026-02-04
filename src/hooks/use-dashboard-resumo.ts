import { useQuery } from '@tanstack/react-query'

export interface DashboardResumoData {
  dashboardStats: {
    jangadas: { total: number; ativas: number; manutencao: number; expirando: number }
    navios: { total: number; ativas: number; manutencao: number; expirando: number }
    clientes: { total: number; ativos: number; novosMes: number }
    stock: { valorTotal: number; itensBaixo: number; itensEsgotados: number }
    cilindros: { total: number; expirando: number; defeituosos: number }
    agenda: { hoje: number; semana: number; mes: number }
  }
  kpis: {
    totalJangadas: number
    cilindrosBomEstado: number
    alertasStock: number
    inspecoesVencidas: number
    cronogramasVencidos: number
  }
  resumoExecutivo: {
    totalInspecoes: number
    aprovadas: number
    reprovadas: number
    comCondicoes: number
    taxaAprovacao: number
    custoTotalInspecoes: number
  }
  atualizadoEm: string
}

export function useDashboardResumo() {
  return useQuery<DashboardResumoData>({
    queryKey: ['dashboard-resumo'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/resumo')
      if (!response.ok) throw new Error('Erro ao carregar resumo do dashboard')
      return response.json()
    },
    refetchInterval: 60000,
    staleTime: 30000,
  })
}
