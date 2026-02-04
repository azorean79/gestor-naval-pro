import { useAutoSave } from './use-autosave'
import { useUpdateJangada } from './use-jangadas'
import { JangadaForm } from '@/lib/types'

export function useAutoSaveJangada(jangadaId: string, initialData: JangadaForm) {
  const updateJangada = useUpdateJangada()

  const { isSaving, lastSaved, error, hasUnsavedChanges, save } = useAutoSave(
    initialData,
    {
      delay: 1500, // 1.5 segundos de delay
      onSave: async (data: JangadaForm) => {
        await updateJangada.mutateAsync({
          id: jangadaId,
          data
        })
      },
      onError: (error) => {
        console.error('Erro ao salvar jangada automaticamente:', error)
      },
      enabled: !!jangadaId
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