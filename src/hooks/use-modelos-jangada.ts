import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ModelosFilters {
  search?: string
  marcaId?: string
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export function useModelosJangada(filters: ModelosFilters = {}) {
  return useQuery({
    queryKey: ['modelos-jangada', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.marcaId) params.append('marcaId', filters.marcaId)
      if (filters.status) params.append('status', filters.status)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/modelos-jangada?${params}`)
      if (!response.ok) throw new Error('Erro ao buscar modelos')
      return response.json()
    },
    staleTime: 30000,
  })
}

export function useCreateModeloJangada() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { nome: string; marcaId: string; descricao?: string; status?: string }) => {
      const response = await fetch('/api/modelos-jangada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Erro ao criar modelo')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos-jangada'] })
    },
  })
}

export function useUpdateModeloJangada() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<{ nome: string; marcaId: string; descricao: string; status: string }> }) => {
      const response = await fetch(`/api/modelos-jangada/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Erro ao atualizar modelo')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos-jangada'] })
    },
  })
}

export function useDeleteModeloJangada() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/modelos-jangada/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Erro ao excluir modelo')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos-jangada'] })
    },
  })
}