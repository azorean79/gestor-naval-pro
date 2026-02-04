import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface MarcasFilters {
  search?: string
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export function useMarcasJangada(filters: MarcasFilters = {}) {
  return useQuery({
    queryKey: ['marcas-jangada', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/marcas-jangada?${params}`)
      if (!response.ok) throw new Error('Erro ao buscar marcas')
      return response.json()
    },
    staleTime: 30000,
  })
}

export function useCreateMarcaJangada() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { nome: string; descricao?: string; status?: string }) => {
      const response = await fetch('/api/marcas-jangada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Erro ao criar marca')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas-jangada'] })
    },
  })
}

export function useUpdateMarcaJangada() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<{ nome: string; descricao: string; status: string }> }) => {
      const response = await fetch(`/api/marcas-jangada/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Erro ao atualizar marca')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas-jangada'] })
    },
  })
}

export function useDeleteMarcaJangada() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/marcas-jangada/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Erro ao excluir marca')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas-jangada'] })
    },
  })
}