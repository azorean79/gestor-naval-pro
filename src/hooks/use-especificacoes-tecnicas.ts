import { useQuery } from '@tanstack/react-query'

export function useEspecificacoesTecnicas({ limit = 9999 } = {}) {
  return useQuery({
    queryKey: ['especificacoes-tecnicas', limit],
    queryFn: async () => {
      const res = await fetch(`/api/especificacoes-tecnicas?limit=${limit}`)
      if (!res.ok) throw new Error('Erro ao buscar especificações técnicas')
      return res.json()
    }
  })
}
