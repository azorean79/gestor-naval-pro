import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface CreateCilindroData {
  numeroSerie: string
  tipo: string
  sistemaId?: string
  tipoCilindroId?: string
  tipoValvulaId?: string
  capacidade?: number
  dataFabricacao?: string
  dataTeste?: string
  dataProximoTeste?: string
  status?: string
  pressaoTrabalho?: number
  pressaoTeste?: number
  jangadaId?: string
}

export function useCreateCilindro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCilindroData) => {
      const response = await fetch('/api/cilindros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create cilindro')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cilindros'] })
    }
  })
}