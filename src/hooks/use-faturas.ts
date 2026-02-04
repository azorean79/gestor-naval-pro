import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface FaturaFilters {
  search?: string
  status?: string
  clienteId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export function useFaturas(filters: FaturaFilters = {}) {
  return useQuery({
    queryKey: ['faturas', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)
      if (filters.clienteId) params.append('clienteId', filters.clienteId)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/faturas?${params}`)
      if (!response.ok) throw new Error('Erro ao buscar faturas')
      return response.json()
    },
    staleTime: 30000,
  })
}

export function useCreateFatura() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (faturaData: {
      numero: string
      dataEmissao: string
      dataVencimento: string
      valor: number
      status?: string
      descricao?: string
      clienteId?: string
      navioId?: string
      jangadaId?: string
    }) => {
      const response = await fetch('/api/faturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faturaData),
      })
      if (!response.ok) throw new Error('Erro ao criar fatura')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faturas'] })
    },
  })
}

export function useUpdateFatura() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<{
      numero: string
      dataEmissao: string
      dataVencimento: string
      valor: number
      status: string
      descricao: string
      clienteId: string
      navioId: string
      jangadaId: string
    }> }) => {
      const response = await fetch(`/api/faturas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Erro ao atualizar fatura')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faturas'] })
    },
  })
}

export function useDeleteFatura() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/faturas/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Erro ao excluir fatura')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faturas'] })
    },
  })
}