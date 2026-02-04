import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface SistemaCilindro {
  id: string
  nome: string
  ativo: boolean
  createdAt: string
  updatedAt: string
}

export function useSistemasCilindro() {
  return useQuery({
    queryKey: ['sistemas-cilindro'],
    queryFn: async () => {
      const response = await fetch('/api/sistemas-cilindro')
      if (!response.ok) throw new Error('Failed to fetch sistemas cilindro')
      return response.json()
    }
  })
}

export function useCreateSistemaCilindro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { nome: string }) => {
      const response = await fetch('/api/sistemas-cilindro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create sistema cilindro')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistemas-cilindro'] })
    }
  })
}