import { useQuery } from '@tanstack/react-query'

export interface InspecaoFilters {
  navioId?: string
  jangadaId?: string
  cilindroId?: string
  status?: string
  limit?: number
  skip?: number
}

export function useInspecoes(filters: InspecaoFilters = {}) {
  return useQuery({
    queryKey: ['inspecoes', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.navioId) params.append('navioId', filters.navioId)
      if (filters.jangadaId) params.append('jangadaId', filters.jangadaId)
      if (filters.cilindroId) params.append('cilindroId', filters.cilindroId)
      if (filters.status) params.append('status', filters.status)
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.skip) params.append('skip', filters.skip.toString())

      const response = await fetch(`/api/inspecoes?${params}`)
      if (!response.ok) throw new Error('Erro ao buscar inspeções')
      return response.json()
    },
    staleTime: 30000,
  })
}

export function useInspecoesStats() {
  return useQuery({
    queryKey: ['inspecoes-stats'],
    queryFn: async () => {
      const response = await fetch('/api/inspecoes/stats')
      if (!response.ok) throw new Error('Erro ao buscar estatísticas de inspeção')
      return response.json()
    },
    staleTime: 30000,
  })
}

export function useTendenciasInspecao(meses = 12) {
  return useQuery({
    queryKey: ['inspecoes-tendencias', meses],
    queryFn: async () => {
      const response = await fetch(`/api/inspecoes/tendencias?meses=${meses}`)
      if (!response.ok) throw new Error('Erro ao buscar tendências de inspeção')
      return response.json()
    },
    staleTime: 60000,
  })
}
