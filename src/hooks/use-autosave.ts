import { useCallback, useEffect, useRef, useState } from 'react'
import { useDebounce } from './use-debounce'

export interface AutoSaveOptions {
  delay?: number
  onSave?: (data: any) => Promise<void>
  onError?: (error: Error) => void
  enabled?: boolean
}

export interface AutoSaveState {
  isSaving: boolean
  lastSaved: Date | null
  error: Error | null
  hasUnsavedChanges: boolean
}

export function useAutoSave<T>(
  data: T,
  options: AutoSaveOptions = {}
) {
  const {
    delay = 1000,
    onSave,
    onError,
    enabled = true
  } = options

  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    error: null,
    hasUnsavedChanges: false
  })

  const lastSavedDataRef = useRef<T>(data)
  const debouncedData = useDebounce(data, delay)

  const save = useCallback(async (saveData: T) => {
    if (!onSave || !enabled) return

    setState(prev => ({ ...prev, isSaving: true, error: null }))

    try {
      await onSave(saveData)
      lastSavedDataRef.current = saveData
      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false
      }))
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro ao salvar')
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: err,
        hasUnsavedChanges: true
      }))
      onError?.(err)
    }
  }, [onSave, onError, enabled])

  // Auto-save quando os dados mudarem (debounced)
  useEffect(() => {
    if (!enabled || !onSave) return

    const hasChanges = JSON.stringify(debouncedData) !== JSON.stringify(lastSavedDataRef.current)

    if (hasChanges) {
      setState(prev => ({ ...prev, hasUnsavedChanges: true }))
      save(debouncedData)
    }
  }, [debouncedData, save, enabled, onSave])

  // Verificar mudanças atuais
  useEffect(() => {
    const hasChanges = JSON.stringify(data) !== JSON.stringify(lastSavedDataRef.current)
    setState(prev => ({ ...prev, hasUnsavedChanges: hasChanges }))
  }, [data])

  const manualSave = useCallback(() => {
    save(data)
  }, [save, data])

  return {
    ...state,
    save: manualSave,
    hasChanges: state.hasUnsavedChanges
  }
}