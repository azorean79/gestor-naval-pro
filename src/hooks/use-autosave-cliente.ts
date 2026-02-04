import { useAutoSave } from './use-autosave'
import { useUpdateCliente } from './use-clientes'
import { ClienteForm } from '@/lib/types'

export function useAutoSaveCliente(clienteId: string, initialData: ClienteForm) {
  const updateCliente = useUpdateCliente()

  const { isSaving, lastSaved, error, hasUnsavedChanges, save } = useAutoSave(
    initialData,
    {
      delay: 1500, // 1.5 segundos de delay
      onSave: async (data: ClienteForm) => {
        await updateCliente.mutateAsync({
          id: clienteId,
          data
        })
      },
      onError: (error) => {
        console.error('Erro ao salvar cliente automaticamente:', error)
      },
      enabled: !!clienteId
    }
  )

  return {
    isSaving,
    lastSaved,
    error,
    hasUnsavedChanges,
    save
  }
}