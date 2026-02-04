import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface TipoCilindro {
  id: string
  nome: string
  ativo: boolean
  createdAt: string
  updatedAt: string
}

export function useTiposCilindro() {
  return useQuery({
    queryKey: ['tipos-cilindro'],
    queryFn: async () => {
      const response = await fetch('/api/tipos-cilindro')
      if (!response.ok) throw new Error('Failed to fetch tipos cilindro')
      return response.json()
    }
  })
}

export function useCreateTipoCilindro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { nome: string }) => {
      const response = await fetch('/api/tipos-cilindro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create tipo cilindro')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-cilindro'] })
    }
  })
}