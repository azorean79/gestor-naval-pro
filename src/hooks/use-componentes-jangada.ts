import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface ComponenteJangada {
  id: string
  nome: string
  descricao?: string
  categoria: string
  quantidade: number
  quantidadeMinima: number
  precoUnitario?: number
  fornecedor?: string
  localizacao?: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface ComponentesFilters {
  search?: string
  categoria?: string
  status?: string
  fornecedor?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export function useComponentesJangada(filters: ComponentesFilters = {}) {
  return useQuery({
    queryKey: ['componentes-jangada', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.categoria) params.append('categoria', filters.categoria)
      if (filters.status) params.append('status', filters.status)
      if (filters.fornecedor) params.append('fornecedor', filters.fornecedor)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/componentes-jangada?${params}`)
      if (!response.ok) throw new Error('Erro ao buscar componentes')
      return response.json()
    },
    staleTime: 30000,
  })
}

export function useCreateComponenteJangada() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      nome: string
      categoria: string
      descricao?: string
      quantidade?: number
      quantidadeMinima?: number
      precoUnitario?: number
      fornecedor?: string
      localizacao?: string
      status?: string
    }) => {
      const response = await fetch('/api/componentes-jangada', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Erro ao criar componente')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['componentes-jangada'] })
    }
  })
}

export function useUpdateComponenteJangada() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<{
      nome: string
      categoria: string
      descricao: string
      quantidade: number
      quantidadeMinima: number
      precoUnitario: number
      fornecedor: string
      localizacao: string
      status: string
    }> }) => {
      const response = await fetch(`/api/componentes-jangada/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Erro ao atualizar componente')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['componentes-jangada'] })
    },
  })
}

export function useDeleteComponenteJangada() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/componentes-jangada/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Erro ao excluir componente')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['componentes-jangada'] })
    },
  })
}