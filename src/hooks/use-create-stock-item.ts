import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface CreateStockItemData {
  nome: string
  categoria: string
  descricao?: string
  quantidade?: number
  quantidadeMinima?: number
  precoUnitario?: number
  precoCompra?: number
  precoVenda?: number
  fornecedor?: string
  localizacao?: string
  referenciaOrey?: string
  referenciaFabricante?: string
  lote?: string
  validade?: string
  imagem?: string
}

export function useCreateStockItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateStockItemData) => {
      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create stock item')
      return response.json()
    },
    onSuccess: (result, variables) => {
      // Invalidate queries for the specific categoria
      queryClient.invalidateQueries({ queryKey: ['stock-categoria', variables.categoria] })
    }
  })
}