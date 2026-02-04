import { useQuery } from '@tanstack/react-query'

export function useCronogramas() {
  return useQuery({
    queryKey: ['cronogramas'],
    queryFn: async () => {
      const response = await fetch('/api/cronogramas')
      if (!response.ok) throw new Error('Erro ao buscar cronogramas')
      return response.json()
    },
    staleTime: 60000,
  })
}
