import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface ObraFilters {
  search?: string
  status?: string
  clienteId?: string
  responsavel?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export function useObras(filters: ObraFilters = {}) {
  return useQuery({
    queryKey: ['obras', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)
      if (filters.clienteId) params.append('clienteId', filters.clienteId)
      if (filters.responsavel) params.append('responsavel', filters.responsavel)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/obras?${params}`)
      if (!response.ok) throw new Error('Erro ao buscar obras')
      return response.json()
    },
    staleTime: 30000,
  })
}

export function useCreateObra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (obraData: {
      titulo: string
      descricao?: string
      status?: string
      dataInicio?: string
      dataFim?: string
      orcamento?: number
      clienteId?: string
      responsavel?: string
      navioId?: string
      jangadaId?: string
    }) => {
      const response = await fetch('/api/obras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(obraData),
      })
      if (!response.ok) throw new Error('Erro ao criar obra')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] })
    },
  })
}

export function useUpdateObra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, obraData }: {
      id: string
      obraData: {
        titulo?: string
        descricao?: string
        status?: string
        dataInicio?: string
        dataFim?: string
        orcamento?: number
        clienteId?: string
        responsavel?: string
      }
    }) => {
      const response = await fetch(`/api/obras/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(obraData),
      })
      if (!response.ok) throw new Error('Erro ao atualizar obra')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] })
    },
  })
}

export function useDeleteObra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/obras/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Erro ao excluir obra')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obras'] })
    },
  })
}