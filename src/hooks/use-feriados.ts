import { useQuery } from '@tanstack/react-query'

export interface Feriado {
  id: string
  nome: string
  data: string
  tipo: 'nacional' | 'regional' | 'local'
  regiao?: string
  descricao?: string
  ativo: boolean
  recorrente: boolean
}

export function useFeriados(ano?: number) {
  const currentYear = ano || new Date().getFullYear()

  return useQuery({
    queryKey: ['feriados', currentYear],
    queryFn: async (): Promise<Feriado[]> => {
      const res = await fetch(`/api/feriados?ano=${currentYear}`)
      if (!res.ok) throw new Error('Erro ao buscar feriados')
      return res.json()
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 horas
  })
}

export function useFeriadosPorTipo(tipo: 'nacional' | 'regional' | 'local', regiao?: string) {
  const currentYear = new Date().getFullYear()

  return useQuery({
    queryKey: ['feriados', currentYear, tipo, regiao],
    queryFn: async (): Promise<Feriado[]> => {
      const params = new URLSearchParams({
        ano: currentYear.toString(),
        tipo
      })
      if (regiao) params.append('regiao', regiao)

      const res = await fetch(`/api/feriados?${params}`)
      if (!res.ok) throw new Error('Erro ao buscar feriados')
      return res.json()
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 horas
  })
}