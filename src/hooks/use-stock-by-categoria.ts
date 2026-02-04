import { useQuery } from '@tanstack/react-query'

export interface StockItem {
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

export function useStockByCategoria(categoria: string) {
  return useQuery({
    queryKey: ['stock-categoria', categoria],
    queryFn: async () => {
      const response = await fetch(`/api/stock/categoria?categoria=${encodeURIComponent(categoria)}`)
      if (!response.ok) throw new Error('Failed to fetch stock by categoria')
      return response.json()
    },
    enabled: !!categoria
  })
}