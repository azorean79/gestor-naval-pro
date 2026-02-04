import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface UpdateStockItemData {
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
  status?: string
}

export function useUpdateStockItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateStockItemData }) => {
      const response = await fetch(`/api/stock/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update stock item')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] })
    }
  })
}