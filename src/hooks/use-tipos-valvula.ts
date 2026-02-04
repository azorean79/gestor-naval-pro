import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface TipoValvula {
  id: string
  nome: string
  ativo: boolean
  createdAt: string
  updatedAt: string
}

export function useTiposValvula() {
  return useQuery({
    queryKey: ['tipos-valvula'],
    queryFn: async () => {
      const response = await fetch('/api/tipos-valvula')
      if (!response.ok) throw new Error('Failed to fetch tipos valvula')
      return response.json()
    }
  })
}

export function useCreateTipoValvula() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { nome: string }) => {
      const response = await fetch('/api/tipos-valvula', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create tipo valvula')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-valvula'] })
    }
  })
}